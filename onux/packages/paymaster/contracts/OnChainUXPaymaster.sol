// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IPaymaster.sol";
import "./libraries/PaymasterLib.sol";

/// @title CinaConnectPaymaster
/// @notice Production ERC-4337 Paymaster with multi-mode gas sponsorship
/// @dev Supports Fixed, Percentage, FreeTier, and Whitelist sponsorship modes.
///      Compatible with EntryPoint v0.7.
///      Features: emergency pause, time windows, global budget tracking.
contract CinaConnectPaymaster is IPaymaster, Ownable2Step, Pausable {
    /// @notice The EntryPoint contract this paymaster works with
    IEntryPoint public immutable entryPoint;

    /// @notice Sponsorship mode types
    enum SponsorMode {
        Fixed,          // Fixed gas sponsorship per UserOp
        Percentage,     // Percentage of gas cost sponsored
        FreeTier,       // Free tier: N free ops per user per day
        Whitelist       // Whitelist: full sponsorship for whitelisted users
    }

    /// @notice Sponsorship configuration for a user
    struct SponsorConfig {
        SponsorMode mode;
        uint256 maxAmountPerOp;       // Maximum sponsorship per op
        uint256 dailyLimitPerUser;    // Daily limit per user
        uint256 totalDailyBudget;     // Total daily budget
    }

    // === Storage ===

    /// @notice Per-user sponsorship configurations
    mapping(address => SponsorConfig) public sponsors;

    /// @notice Daily spending per sender (keyed by day + sender)
    mapping(uint256 => mapping(address => uint256)) public dailySpent;

    /// @notice Number of free operations used per user per day
    mapping(uint256 => mapping(address => uint256)) public userDailyOps;

    /// @notice Whitelisted users (full sponsorship)
    mapping(address => bool) public whitelistedUsers;

    /// @notice Whitelisted target contracts (only sponsor calls to these)
    mapping(address => bool) public whitelistedTargets;

    /// @notice Whether target contract filtering is enabled
    bool public targetFilterEnabled;

    /// @notice Sponsorship time window: 0 = always active
    uint48 public windowStart;
    uint48 public windowEnd;

    /// @notice Global daily budget (across all users), 0 = unlimited
    uint256 public globalDailyBudget;

    /// @notice Global daily spending
    mapping(uint256 => uint256) public globalDailySpent;

    // === Errors ===

    error NotEntryPoint();
    error NoSponsorConfig();
    error DailyBudgetExceeded();
    error FreeTierExceeded(uint256 used, uint256 limit);
    error NotWhitelisted();
    error TargetNotWhitelisted();
    error InvalidMaxAmount();
    error OutsideTimeWindow();
    error GlobalBudgetExceeded();

    // === Events ===

    event UserOperationSponsored(address indexed user, uint256 gasCost);
    event SponsorConfigSet(address indexed user, SponsorMode mode, uint256 maxAmount);
    event UserWhitelisted(address indexed user, bool status);
    event TargetWhitelisted(address indexed target, bool status);
    event TargetFilterEnabled(bool enabled);
    event Deposited(address indexed paymaster, uint256 amount);
    event Withdrawn(address indexed paymaster, address indexed to, uint256 amount);
    event TimeWindowSet(uint48 start, uint48 end);
    event GlobalBudgetSet(uint256 budget);
    event EmergencyShutdown();

    /// @notice Modifier to ensure only EntryPoint can call
    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert NotEntryPoint();
        _;
    }

    /// @param _entryPoint The EntryPoint v0.7 contract address
    constructor(address _entryPoint) Ownable(msg.sender) {
        entryPoint = IEntryPoint(_entryPoint);
    }

    // === Emergency Shutdown ===

    /// @notice Emergency pause — halts all sponsorship
    function pause() external onlyOwner {
        _pause();
        emit EmergencyShutdown();
    }

    /// @notice Resume sponsorship after emergency pause
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Whether the paymaster is currently accepting ops
    function isActive() external view returns (bool) {
        return !paused() && _isWithinTimeWindow();
    }

    // === IPaymaster Implementation ===

    /// @notice Validate whether to sponsor this UserOp (called by EntryPoint)
    /// @dev Returns (0, context) for approval, or non-zero validationData for rejection
    function validatePaymasterUserOp(
        bytes32 userOpHash,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas
    ) external view override onlyEntryPoint whenNotPaused returns (uint256 validationData, bytes memory context) {
        // Check time window
        if (!_isWithinTimeWindow()) revert OutsideTimeWindow();

        address sender = _extractSender(userOpHash);

        // Check target whitelist filter
        if (targetFilterEnabled && !whitelistedTargets[sender]) {
            revert TargetNotWhitelisted();
        }

        // Check whitelist mode first
        if (whitelistedUsers[sender]) {
            uint256 estimatedCost = maxFeePerGas * 21_000;
            // Check global budget
            if (globalDailyBudget > 0) {
                uint256 day = PaymasterLib.currentDay();
                if (PaymasterLib.safeAdd(globalDailySpent[day], estimatedCost) > globalDailyBudget) {
                    revert GlobalBudgetExceeded();
                }
            }
            return (0, abi.encode(sender, estimatedCost));
        }

        SponsorConfig memory config = sponsors[sender];
        if (uint8(config.mode) == 0 && !whitelistedUsers[sender]) {
            revert NoSponsorConfig();
        }

        uint256 day = PaymasterLib.currentDay();

        if (config.mode == SponsorMode.FreeTier) {
            uint256 opsUsed = userDailyOps[day][sender];
            if (opsUsed >= config.dailyLimitPerUser) {
                revert FreeTierExceeded(opsUsed, config.dailyLimitPerUser);
            }
            return (0, abi.encode(sender, config.maxAmountPerOp));
        }

        // Estimate cost
        uint256 estimatedCost = maxFeePerGas * 21_000;

        if (config.mode == SponsorMode.Percentage) {
            uint256 sponsored = (estimatedCost * config.maxAmountPerOp) / 10_000;
            // Cap at maxAmountPerOp if it's set as an absolute cap
            if (sponsored > config.maxAmountPerOp && config.maxAmountPerOp > 0 && config.maxAmountPerOp < 10_000) {
                sponsored = config.maxAmountPerOp;
            }

            // Check global budget
            if (globalDailyBudget > 0 && PaymasterLib.safeAdd(globalDailySpent[day], sponsored) > globalDailyBudget) {
                revert GlobalBudgetExceeded();
            }

            return (0, abi.encode(sender, sponsored));
        }

        // Fixed mode
        if (config.maxAmountPerOp == 0) revert InvalidMaxAmount();
        uint256 toSponsor = estimatedCost > config.maxAmountPerOp
            ? config.maxAmountPerOp
            : estimatedCost;

        // Check per-user daily budget
        if (PaymasterLib.safeAdd(dailySpent[day][sender], toSponsor) > config.totalDailyBudget) {
            revert DailyBudgetExceeded();
        }

        // Check global budget
        if (globalDailyBudget > 0 && PaymasterLib.safeAdd(globalDailySpent[day], toSponsor) > globalDailyBudget) {
            revert GlobalBudgetExceeded();
        }

        return (0, abi.encode(sender, toSponsor));
    }

    /// @notice Post-operation callback (called by EntryPoint after UserOp execution)
    function postOp(
        uint8 mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external override onlyEntryPoint {
        // Don't record spending if the op reverted
        if (mode == 1 || mode == 2) return;

        (address sender, ) = abi.decode(context, (address, uint256));

        uint256 day = PaymasterLib.currentDay();

        // Track spending
        dailySpent[day][sender] += actualGasCost;
        if (globalDailyBudget > 0) {
            globalDailySpent[day] += actualGasCost;
        }

        // Track free tier usage
        SponsorConfig memory config = sponsors[sender];
        if (config.mode == SponsorMode.FreeTier) {
            userDailyOps[day][sender]++;
        }

        emit UserOperationSponsored(sender, actualGasCost);
    }

    // === IPaymaster Extension ===

    /// @notice Mark a UserOp as sponsored (for off-chain verification)
    function sponsorUserOp(bytes32 userOpHash, uint256 maxCost) external onlyOwner {
        emit UserOperationSponsored(msg.sender, maxCost);
    }

    /// @notice Check if a UserOp is sponsored
    function isSponsored(bytes32 userOpHash) external view returns (bool) {
        address sender = _extractSender(userOpHash);
        return whitelistedUsers[sender] || uint8(sponsors[sender].mode) != 0;
    }

    // === Management Functions ===

    /// @notice Set sponsorship configuration for a user
    function setSponsorConfig(
        address user,
        SponsorMode mode,
        uint256 maxAmountPerOp,
        uint256 dailyLimitPerUser,
        uint256 totalDailyBudget
    ) external onlyOwner {
        sponsors[user] = SponsorConfig({
            mode: mode,
            maxAmountPerOp: maxAmountPerOp,
            dailyLimitPerUser: dailyLimitPerUser,
            totalDailyBudget: totalDailyBudget
        });
        emit SponsorConfigSet(user, mode, maxAmountPerOp);
    }

    /// @notice Add or remove a user from the whitelist
    function setWhitelistedUser(address user, bool status) external onlyOwner {
        whitelistedUsers[user] = status;
        emit UserWhitelisted(user, status);
    }

    /// @notice Add or remove a target contract from the whitelist
    function setWhitelistedTarget(address target, bool status) external onlyOwner {
        whitelistedTargets[target] = status;
        emit TargetWhitelisted(target, status);
    }

    /// @notice Enable or disable target contract filtering
    function setTargetFilter(bool enabled) external onlyOwner {
        targetFilterEnabled = enabled;
        emit TargetFilterEnabled(enabled);
    }

    /// @notice Set the sponsorship time window (0 = no restriction)
    /// @param start Start timestamp (0 = no start restriction)
    /// @param end End timestamp (0 = no end restriction)
    function setTimeWindow(uint48 start, uint48 end) external onlyOwner {
        require(end == 0 || end > start, "invalid time window");
        windowStart = start;
        windowEnd = end;
        emit TimeWindowSet(start, end);
    }

    /// @notice Set the global daily budget (0 = unlimited)
    /// @param budget Maximum daily spending across all users
    function setGlobalDailyBudget(uint256 budget) external onlyOwner {
        globalDailyBudget = budget;
        emit GlobalBudgetSet(budget);
    }

    /// @notice Reset global daily spending counter for today
    function resetGlobalDailySpent() external onlyOwner {
        uint256 day = PaymasterLib.currentDay();
        globalDailySpent[day] = 0;
    }

    // === Funding Functions ===

    /// @notice Deposit funds into the EntryPoint for gas sponsorship
    function deposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit Deposited(address(this), msg.value);
    }

    /// @notice Withdraw funds from the EntryPoint
    function withdrawTo(address payable withdrawAddress, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(withdrawAddress, amount);
        emit Withdrawn(address(this), withdrawAddress, amount);
    }

    /// @notice Directly withdraw from this contract's ETH balance
    function withdraw(address payable withdrawAddress, uint256 amount) external onlyOwner {
        (bool success, ) = withdrawAddress.call{value: amount}("");
        require(success, "Withdrawal failed");
        emit Withdrawn(address(this), withdrawAddress, amount);
    }

    /// @notice Receive ETH directly
    receive() external payable {}

    // === Internal ===

    /// @notice Check if current time is within the sponsorship window.
    function _isWithinTimeWindow() internal view returns (bool) {
        uint48 now_ = uint48(block.timestamp);
        if (windowStart > 0 && now_ < windowStart) return false;
        if (windowEnd > 0 && now_ > windowEnd) return false;
        return true;
    }

    /// @notice Extract the sender address from a UserOp hash (placeholder).
    function _extractSender(bytes32 userOpHash) internal pure returns (address) {
        return address(uint160(uint256(userOpHash)));
    }
}
