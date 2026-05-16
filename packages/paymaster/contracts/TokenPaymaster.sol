// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./libraries/PaymasterLib.sol";

/// @title TokenPaymaster
/// @notice Paymaster that allows users to pay gas fees in ERC-20 tokens
/// @dev The paymaster sponsors gas on-chain, then charges the user in ERC-20 tokens
///      via a post-operation transfer. Supports a price oracle for token-to-ETH conversion.
///      Features: emergency pause, time windows, per-token rate limiting, withdraw.
contract TokenPaymaster is Ownable2Step, Pausable {
    using SafeERC20 for IERC20;

    IEntryPoint public immutable entryPoint;

    /// @notice Token price configuration
    struct TokenPrice {
        uint192 priceNumerator;   // Token price in ETH * 1e18
        uint64  priceDenominator; // Denominator (typically 1e18)
        uint64  marginBps;        // Fee margin in basis points (e.g., 500 = 5%)
    }

    /// @notice Per-user configuration
    struct UserConfig {
        bool enabled;
        uint256 dailySpendLimit;  // Daily spending limit in ETH wei
    }

    // === Storage ===

    /// @notice Supported tokens and their prices
    mapping(IERC20 => TokenPrice) public tokenPrices;

    /// @notice Per-user configuration
    mapping(address => UserConfig) public userConfigs;

    /// @notice Daily spending tracker (day => user => spent)
    mapping(uint256 => mapping(address => uint256)) public dailySpent;

    /// @notice Whether the paymaster is accepting new UserOps
    bool public active = true;

    /// @notice Minimum token balance to accept (prevents dust attacks)
    uint256 public minTokenAmount = 1e6;

    /// @notice Sponsorship time window: 0 = always active
    uint48 public windowStart;
    uint48 public windowEnd;

    /// @notice Global daily budget (0 = unlimited)
    uint256 public globalDailyBudget;
    mapping(uint256 => uint256) public globalDailySpent;

    /// @notice Per-token daily withdrawal limit (prevents draining)
    mapping(IERC20 => uint256) public tokenDailyWithdrawLimit;
    mapping(IERC20 => mapping(uint256 => uint256)) public tokenDailyWithdrawn;

    // === Errors ===

    error NotEntryPoint();
    error TokenNotSupported();
    error UserNotConfigured();
    error PaymasterInactive();
    error DailyLimitExceeded();
    error InsufficientTokenAmount();
    error TokenTransferFailed();
    error OutsideTimeWindow();
    error GlobalBudgetExceeded();
    error WithdrawLimitExceeded();

    // === Events ===

    event TokenPriceSet(IERC20 token, uint192 numerator, uint64 denominator, uint64 marginBps);
    event UserConfigSet(address user, bool enabled, uint256 dailyLimit);
    event GasPaidWithToken(address user, IERC20 token, uint256 gasCostETH, uint256 tokenCharged);
    event Deposited(uint256 amount);
    event Withdrawn(address to, uint256 amount);
    event TimeWindowSet(uint48 start, uint48 end);
    event GlobalBudgetSet(uint256 budget);
    event TokenWithdrawn(IERC20 token, address to, uint256 amount);
    event EmergencyShutdown();

    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert NotEntryPoint();
        _;
    }

    /// @param _entryPoint The EntryPoint v0.7 contract address
    constructor(address _entryPoint) Ownable(msg.sender) {
        entryPoint = IEntryPoint(_entryPoint);
    }

    // === Emergency Shutdown ===

    /// @notice Emergency pause — halts all operations
    function pause() external onlyOwner {
        _pause();
        emit EmergencyShutdown();
    }

    /// @notice Resume operations
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Whether the paymaster is currently operational
    function isActive() external view returns (bool) {
        return active && !paused() && _isWithinTimeWindow();
    }

    // === IPaymaster-compatible Functions ===

    /// @notice Validate a UserOp for token-based gas payment
    function validatePaymasterUserOp(
        bytes32 userOpHash,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas
    ) external view returns (uint256 validationData, bytes memory context) {
        if (!active) revert PaymasterInactive();
        if (paused()) revert PaymasterInactive();
        if (!_isWithinTimeWindow()) revert OutsideTimeWindow();

        address sender = address(uint160(uint256(userOpHash)));

        UserConfig memory config = userConfigs[sender];
        if (!config.enabled) revert UserNotConfigured();

        uint256 estimatedCost = maxFeePerGas * 21_000;
        uint256 day = PaymasterLib.currentDay();

        if (config.dailySpendLimit > 0) {
            if (PaymasterLib.safeAdd(dailySpent[day][sender], estimatedCost) > config.dailySpendLimit) {
                revert DailyLimitExceeded();
            }
        }

        // Check global budget
        if (globalDailyBudget > 0) {
            if (PaymasterLib.safeAdd(globalDailySpent[day], estimatedCost) > globalDailyBudget) {
                revert GlobalBudgetExceeded();
            }
        }

        // Context: sender + token address + estimated cost
        return (0, abi.encode(sender, address(0), estimatedCost));
    }

    /// @notice Post-operation: charge the user in tokens
    function postOp(
        uint8 mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external onlyEntryPoint {
        if (mode == 1 || mode == 2) return;

        (address sender, address tokenAddress, ) = abi.decode(context, (address, address, uint256));

        if (tokenAddress == address(0)) {
            // No token charging needed, but still track spending
            uint256 day = PaymasterLib.currentDay();
            dailySpent[day][sender] += actualGasCost;
            return;
        }

        IERC20 token = IERC20(tokenAddress);
        TokenPrice memory price = tokenPrices[token];

        if (price.priceDenominator == 0) {
            uint256 day = PaymasterLib.currentDay();
            dailySpent[day][sender] += actualGasCost;
            return;
        }

        // Calculate token amount: actualGasCost * (numerator / denominator) * (1 + margin)
        uint256 tokenAmount = (actualGasCost * price.priceNumerator) / price.priceDenominator;
        uint256 margin = (tokenAmount * price.marginBps) / 10_000;
        tokenAmount += margin;

        if (tokenAmount < minTokenAmount) revert InsufficientTokenAmount();

        // Transfer tokens from sender to paymaster
        bool success = token.transferFrom(sender, address(this), tokenAmount);
        if (!success) revert TokenTransferFailed();

        uint256 day = PaymasterLib.currentDay();
        dailySpent[day][sender] += actualGasCost;
        if (globalDailyBudget > 0) {
            globalDailySpent[day] += actualGasCost;
        }

        emit GasPaidWithToken(sender, token, actualGasCost, tokenAmount);
    }

    // === Extensions ===

    function sponsorUserOp(bytes32 userOpHash, uint256 maxCost) external onlyOwner {
        // Reserved for off-chain sponsorship
    }

    function isSponsored(bytes32 userOpHash) external view returns (bool) {
        address sender = address(uint160(uint256(userOpHash)));
        return userConfigs[sender].enabled;
    }

    // === Management ===

    /// @notice Set the price of an ERC-20 token relative to ETH
    function setTokenPrice(
        IERC20 token,
        uint192 numerator,
        uint64 denominator,
        uint64 marginBps
    ) external onlyOwner {
        require(denominator > 0, "Invalid denominator");
        require(marginBps <= 10_000, "Margin too high");
        tokenPrices[token] = TokenPrice(numerator, denominator, marginBps);
        emit TokenPriceSet(token, numerator, denominator, marginBps);
    }

    /// @notice Enable or disable token-based gas payment for a user
    function setUserConfig(address user, bool enabled, uint256 dailyLimit) external onlyOwner {
        userConfigs[user] = UserConfig(enabled, dailyLimit);
        emit UserConfigSet(user, enabled, dailyLimit);
    }

    /// @notice Set the paymaster active/inactive status
    function setActive(bool _active) external onlyOwner {
        active = _active;
    }

    /// @notice Set minimum token amount
    function setMinTokenAmount(uint256 amount) external onlyOwner {
        minTokenAmount = amount;
    }

    /// @notice Set the sponsorship time window (0 = no restriction)
    function setTimeWindow(uint48 start, uint48 end) external onlyOwner {
        require(end == 0 || end > start, "invalid time window");
        windowStart = start;
        windowEnd = end;
        emit TimeWindowSet(start, end);
    }

    /// @notice Set the global daily budget (0 = unlimited)
    function setGlobalDailyBudget(uint256 budget) external onlyOwner {
        globalDailyBudget = budget;
        emit GlobalBudgetSet(budget);
    }

    /// @notice Set per-token daily withdraw limit (0 = unlimited)
    function setTokenDailyWithdrawLimit(IERC20 token, uint256 limit) external onlyOwner {
        tokenDailyWithdrawLimit[token] = limit;
    }

    // === Funding ===

    /// @notice Deposit ETH into the EntryPoint
    function deposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit Deposited(msg.value);
    }

    /// @notice Withdraw ETH from the EntryPoint
    function withdrawTo(address payable withdrawAddress, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(withdrawAddress, amount);
        emit Withdrawn(withdrawAddress, amount);
    }

    /// @notice Withdraw ERC-20 tokens from this contract (with daily limit)
    function withdrawToken(IERC20 token, address to, uint256 amount) external onlyOwner {
        uint256 dailyLimit = tokenDailyWithdrawLimit[token];
        if (dailyLimit > 0) {
            uint256 day = PaymasterLib.currentDay();
            require(PaymasterLib.safeAdd(tokenDailyWithdrawn[token][day], amount) <= dailyLimit, "withdraw limit");
            tokenDailyWithdrawn[token][day] += amount;
        }
        token.safeTransfer(to, amount);
        emit TokenWithdrawn(token, to, amount);
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
