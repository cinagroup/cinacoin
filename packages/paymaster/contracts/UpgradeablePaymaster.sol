// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IPaymaster.sol";
import "./libraries/PaymasterLib.sol";

/// @title UpgradeablePaymaster
/// @notice Upgradeable version of the CinaConnect Paymaster using UUPS pattern
/// @dev Deploy the implementation, then create a proxy pointing to it.
///      The proxy holds all state; the implementation is replaceable.
contract UpgradeablePaymaster is
    IPaymaster,
    Initializable,
    UUPSUpgradeable,
    Ownable2Step,
    Pausable
{
    /// @notice The EntryPoint contract this paymaster works with
    IEntryPoint public entryPoint;

    /// @notice Sponsorship mode types
    enum SponsorMode {
        Fixed,
        Percentage,
        FreeTier,
        Whitelist
    }

    /// @notice Sponsorship configuration for a user
    struct SponsorConfig {
        SponsorMode mode;
        uint256 maxAmountPerOp;
        uint256 dailyLimitPerUser;
        uint256 totalDailyBudget;
    }

    // === Storage ===

    mapping(address => SponsorConfig) public sponsors;
    mapping(uint256 => mapping(address => uint256)) public dailySpent;
    mapping(uint256 => mapping(address => uint256)) public userDailyOps;
    mapping(address => bool) public whitelistedUsers;
    mapping(address => bool) public whitelistedTargets;
    bool public targetFilterEnabled;
    uint48 public windowStart;
    uint48 public windowEnd;
    uint256 public globalDailyBudget;
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

    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert NotEntryPoint();
        _;
    }

    /// @notice Initializer (replaces constructor for upgradeable contracts)
    /// @param _entryPoint The EntryPoint v0.7 contract address
    /// @param _owner The initial owner
    function initialize(address _entryPoint, address _owner) external initializer {
        entryPoint = IEntryPoint(_entryPoint);
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
    }

    // === UUPS: Authorize upgrades ===

    /// @notice Only the owner can authorize an upgrade
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // === Emergency Shutdown ===

    function pause() external onlyOwner {
        _pause();
        emit EmergencyShutdown();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function isActive() external view returns (bool) {
        return !paused() && _isWithinTimeWindow();
    }

    // === IPaymaster Implementation ===

    function validatePaymasterUserOp(
        bytes32 userOpHash,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas
    ) external view override onlyEntryPoint whenNotPaused returns (uint256 validationData, bytes memory context) {
        if (!_isWithinTimeWindow()) revert OutsideTimeWindow();

        address sender = address(uint160(uint256(userOpHash)));

        if (targetFilterEnabled && !whitelistedTargets[sender]) {
            revert TargetNotWhitelisted();
        }

        if (whitelistedUsers[sender]) {
            uint256 estimatedCost = maxFeePerGas * 21_000;
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

        uint256 estimatedCost = maxFeePerGas * 21_000;

        if (config.mode == SponsorMode.Percentage) {
            uint256 sponsored = (estimatedCost * config.maxAmountPerOp) / 10_000;
            if (sponsored > config.maxAmountPerOp && config.maxAmountPerOp > 0 && config.maxAmountPerOp < 10_000) {
                sponsored = config.maxAmountPerOp;
            }
            if (globalDailyBudget > 0 && PaymasterLib.safeAdd(globalDailySpent[day], sponsored) > globalDailyBudget) {
                revert GlobalBudgetExceeded();
            }
            return (0, abi.encode(sender, sponsored));
        }

        if (config.maxAmountPerOp == 0) revert InvalidMaxAmount();
        uint256 toSponsor = estimatedCost > config.maxAmountPerOp
            ? config.maxAmountPerOp
            : estimatedCost;

        if (PaymasterLib.safeAdd(dailySpent[day][sender], toSponsor) > config.totalDailyBudget) {
            revert DailyBudgetExceeded();
        }
        if (globalDailyBudget > 0 && PaymasterLib.safeAdd(globalDailySpent[day], toSponsor) > globalDailyBudget) {
            revert GlobalBudgetExceeded();
        }

        return (0, abi.encode(sender, toSponsor));
    }

    function postOp(
        uint8 mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external override onlyEntryPoint {
        if (mode == 1 || mode == 2) return;

        (address sender, ) = abi.decode(context, (address, uint256));
        uint256 day = PaymasterLib.currentDay();

        dailySpent[day][sender] += actualGasCost;
        if (globalDailyBudget > 0) {
            globalDailySpent[day] += actualGasCost;
        }

        SponsorConfig memory config = sponsors[sender];
        if (config.mode == SponsorMode.FreeTier) {
            userDailyOps[day][sender]++;
        }

        emit UserOperationSponsored(sender, actualGasCost);
    }

    // === IPaymaster Extension ===

    function sponsorUserOp(bytes32 userOpHash, uint256 maxCost) external onlyOwner {
        emit UserOperationSponsored(msg.sender, maxCost);
    }

    function isSponsored(bytes32 userOpHash) external view returns (bool) {
        address sender = address(uint160(uint256(userOpHash)));
        return whitelistedUsers[sender] || uint8(sponsors[sender].mode) != 0;
    }

    // === Management ===

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

    function setWhitelistedUser(address user, bool status) external onlyOwner {
        whitelistedUsers[user] = status;
        emit UserWhitelisted(user, status);
    }

    function setWhitelistedTarget(address target, bool status) external onlyOwner {
        whitelistedTargets[target] = status;
        emit TargetWhitelisted(target, status);
    }

    function setTargetFilter(bool enabled) external onlyOwner {
        targetFilterEnabled = enabled;
        emit TargetFilterEnabled(enabled);
    }

    function setTimeWindow(uint48 start, uint48 end) external onlyOwner {
        require(end == 0 || end > start, "invalid time window");
        windowStart = start;
        windowEnd = end;
        emit TimeWindowSet(start, end);
    }

    function setGlobalDailyBudget(uint256 budget) external onlyOwner {
        globalDailyBudget = budget;
        emit GlobalBudgetSet(budget);
    }

    function resetGlobalDailySpent() external onlyOwner {
        uint256 day = PaymasterLib.currentDay();
        globalDailySpent[day] = 0;
    }

    // === Funding ===

    function deposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit Deposited(address(this), msg.value);
    }

    function withdrawTo(address payable withdrawAddress, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(withdrawAddress, amount);
        emit Withdrawn(address(this), withdrawAddress, amount);
    }

    function withdraw(address payable withdrawAddress, uint256 amount) external onlyOwner {
        (bool success, ) = withdrawAddress.call{value: amount}("");
        require(success, "Withdrawal failed");
        emit Withdrawn(address(this), withdrawAddress, amount);
    }

    receive() external payable {}

    // === Internal ===

    function _isWithinTimeWindow() internal view returns (bool) {
        uint48 now_ = uint48(block.timestamp);
        if (windowStart > 0 && now_ < windowStart) return false;
        if (windowEnd > 0 && now_ > windowEnd) return false;
        return true;
    }
}
