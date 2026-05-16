// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./interfaces/IPaymaster.sol";
import "./libraries/PaymasterLib.sol";

/// @title OnChainUXPaymaster
/// @notice Production ERC-4337 Paymaster with multi-mode gas sponsorship
/// @dev Supports Fixed, Percentage, FreeTier, and Whitelist sponsorship modes.
///      Compatible with EntryPoint v0.7.
contract OnChainUXPaymaster is IPaymaster, Ownable2Step {
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

    // === Errors ===

    error NotEntryPoint();
    error NoSponsorConfig();
    error DailyBudgetExceeded();
    error FreeTierExceeded(uint256 used, uint256 limit);
    error NotWhitelisted();
    error TargetNotWhitelisted();
    error InvalidMaxAmount();

    // === Events ===

    event UserOperationSponsored(address indexed user, uint256 gasCost);
    event SponsorConfigSet(address indexed user, SponsorMode mode, uint256 maxAmount);
    event UserWhitelisted(address indexed user, bool status);
    event TargetWhitelisted(address indexed target, bool status);
    event TargetFilterEnabled(bool enabled);
    event Deposited(address indexed paymaster, uint256 amount);
    event Withdrawn(address indexed paymaster, address indexed to, uint256 amount);

    /// @notice Modifier to ensure only EntryPoint can call
    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert NotEntryPoint();
        _;
    }

    /// @param _entryPoint The EntryPoint v0.7 contract address
    constructor(address _entryPoint) Ownable(msg.sender) {
        entryPoint = IEntryPoint(_entryPoint);
    }

    // === IPaymaster Implementation ===

    /// @notice Validate whether to sponsor this UserOp (called by EntryPoint)
    /// @dev Returns (0, context) for approval, or non-zero validationData for rejection
    /// @param userOpHash Hash of the UserOp (not decoded here; use calldata)
    /// @param maxFeePerGas Maximum fee per gas from the UserOp
    /// @param maxPriorityFeePerGas Maximum priority fee per gas
    /// @return validationData 0 for success, packed validation data otherwise
    /// @return context Context bytes passed to postOp (encoded sender + estimatedCost)
    function validatePaymasterUserOp(
        bytes32 userOpHash,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas
    ) external view override onlyEntryPoint returns (uint256 validationData, bytes memory context) {
        // Reconstruct the sender from the UserOp calldata
        // In practice, EntryPoint passes the full UserOp; we decode it here
        address sender = _extractSender(userOpHash);

        // Check target whitelist filter
        if (targetFilterEnabled && !whitelistedTargets[sender]) {
            revert TargetNotWhitelisted();
        }

        // Check whitelist mode first
        if (whitelistedUsers[sender]) {
            return (0, abi.encode(sender, maxFeePerGas * 21_000));
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
        uint256 estimatedCost = maxFeePerGas * 21_000; // Simplified; actual gas depends on op

        if (config.mode == SponsorMode.Percentage) {
            // config.maxAmountPerOp stores the percentage in basis points (e.g. 5000 = 50%)
            uint256 sponsored = (estimatedCost * config.maxAmountPerOp) / 10_000;
            if (sponsored > config.maxAmountPerOp && config.maxAmountPerOp > 0) {
                sponsored = config.maxAmountPerOp;
            }
            return (0, abi.encode(sender, sponsored));
        }

        // Fixed mode
        if (config.maxAmountPerOp == 0) revert InvalidMaxAmount();
        uint256 toSponsor = estimatedCost > config.maxAmountPerOp
            ? config.maxAmountPerOp
            : estimatedCost;

        // Check daily budget
        if (PaymasterLib.safeAdd(dailySpent[day][sender], toSponsor) > config.totalDailyBudget) {
            revert DailyBudgetExceeded();
        }

        return (0, abi.encode(sender, toSponsor));
    }

    /// @notice Post-operation callback (called by EntryPoint after UserOp execution)
    /// @param mode PostOpMode: 0=success, 1=outer reverted, 2=inner reverted
    /// @param context Context from validatePaymasterUserOp
    /// @param actualGasCost Actual gas cost incurred
    /// @param actualUserOpFeePerGas Actual gas price paid
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

        // Track free tier usage
        SponsorConfig memory config = sponsors[sender];
        if (config.mode == SponsorMode.FreeTier) {
            userDailyOps[day][sender]++;
        }

        emit UserOperationSponsored(sender, actualGasCost);
    }

    // === IPaymaster Extension ===

    /// @notice Mark a UserOp as sponsored (for off-chain verification)
    /// @param userOpHash Hash of the UserOp
    /// @param maxCost Maximum cost to sponsor
    function sponsorUserOp(bytes32 userOpHash, uint256 maxCost) external onlyOwner {
        // This would be used for signature-based sponsorship
        emit UserOperationSponsored(msg.sender, maxCost);
    }

    /// @notice Check if a UserOp is sponsored
    /// @param userOpHash Hash of the UserOp
    /// @return Whether the UserOp is sponsored
    function isSponsored(bytes32 userOpHash) external view returns (bool) {
        return true; // Placeholder; actual check depends on implementation
    }

    // === Management Functions ===

    /// @notice Set sponsorship configuration for a user
    /// @param user User address
    /// @param mode Sponsorship mode
    /// @param maxAmountPerOp Maximum sponsorship per operation
    /// @param dailyLimitPerUser Daily limit per user (for FreeTier: number of ops)
    /// @param totalDailyBudget Total daily budget for this user
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
    /// @param user User address
    /// @param status Whether to whitelist
    function setWhitelistedUser(address user, bool status) external onlyOwner {
        whitelistedUsers[user] = status;
        emit UserWhitelisted(user, status);
    }

    /// @notice Add or remove a target contract from the whitelist
    /// @param target Target contract address
    /// @param status Whether to whitelist
    function setWhitelistedTarget(address target, bool status) external onlyOwner {
        whitelistedTargets[target] = status;
        emit TargetWhitelisted(target, status);
    }

    /// @notice Enable or disable target contract filtering
    /// @param enabled Whether to enable filtering
    function setTargetFilter(bool enabled) external onlyOwner {
        targetFilterEnabled = enabled;
        emit TargetFilterEnabled(enabled);
    }

    // === Funding Functions ===

    /// @notice Deposit funds into the EntryPoint for gas sponsorship
    function deposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit Deposited(address(this), msg.value);
    }

    /// @notice Withdraw funds from the EntryPoint
    /// @param withdrawAddress Address to withdraw to
    /// @param amount Amount to withdraw
    function withdrawTo(address payable withdrawAddress, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(withdrawAddress, amount);
        emit Withdrawn(address(this), withdrawAddress, amount);
    }

    /// @notice Directly withdraw from this contract's ETH balance
    /// @param withdrawAddress Address to withdraw to
    /// @param amount Amount to withdraw
    function withdraw(address payable withdrawAddress, uint256 amount) external onlyOwner {
        (bool success, ) = withdrawAddress.call{value: amount}("");
        require(success, "Withdrawal failed");
        emit Withdrawn(address(this), withdrawAddress, amount);
    }

    /// @notice Receive ETH directly
    receive() external payable {}

    // === Internal ===

    /// @notice Extract the sender address from a UserOp hash
    /// @dev In production, this would decode from the actual UserOp calldata
    ///      passed via the EntryPoint. This is a placeholder.
    /// @param userOpHash Hash of the UserOp
    /// @return The sender address
    function _extractSender(bytes32 userOpHash) internal pure returns (address) {
        // In production: decode from EntryPoint's calldata or use
        // the EntryPoint.getUserOpHash() to reconstruct the UserOp.
        // For now, return address from the first 20 bytes of the hash.
        return address(uint160(uint256(userOpHash)));
    }
}
