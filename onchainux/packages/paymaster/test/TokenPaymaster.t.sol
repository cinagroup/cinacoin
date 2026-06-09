// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../contracts/TokenPaymaster.sol";
import "../contracts/libraries/PaymasterLib.sol";

/// Mock ERC20 token for testing
contract MockToken {
    mapping(address => uint256) public balanceOf;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        return true;
    }
}

/// @title TokenPaymasterTest
/// @notice Comprehensive tests for TokenPaymaster
contract TokenPaymasterTest is Test {
    TokenPaymaster public tokenPaymaster;
    MockToken public mockToken;
    address public entryPoint = makeAddr("entryPoint");
    address public owner;
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    uint256 public constant ONE_DAY = 1 days;

    function setUp() public {
        owner = address(this);
        tokenPaymaster = new TokenPaymaster(entryPoint);
        mockToken = new MockToken();
    }

    // ==================== Constructor Tests ====================

    function test_ConstructorSetsEntryPoint() public view {
        assertEq(address(tokenPaymaster.entryPoint()), entryPoint);
    }

    function test_ConstructorSetsOwner() public view {
        assertEq(tokenPaymaster.owner(), owner);
    }

    function test_ConstructorActiveByDefault() public view {
        assertTrue(tokenPaymaster.active());
    }

    // ==================== Token Price Tests ====================

    function test_SetTokenPrice() public {
        tokenPaymaster.setTokenPrice(
            IERC20(address(mockToken)),
            5e17,   // 0.5 ETH per token
            1e18,   // denominator
            500     // 5% margin
        );

        (uint192 numerator, uint64 denominator, uint64 marginBps) =
            tokenPaymaster.tokenPrices(IERC20(address(mockToken)));

        assertEq(numerator, 5e17);
        assertEq(denominator, 1e18);
        assertEq(marginBps, 500);
    }

    function test_SetTokenPriceEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit TokenPaymaster.TokenPriceSet(
            IERC20(address(mockToken)),
            1e18,
            1e18,
            1000
        );
        tokenPaymaster.setTokenPrice(
            IERC20(address(mockToken)),
            1e18,
            1e18,
            1000
        );
    }

    function test_SetTokenPriceRejectsZeroDenominator() public {
        vm.expectRevert("Invalid denominator");
        tokenPaymaster.setTokenPrice(
            IERC20(address(mockToken)),
            1e18,
            0,
            100
        );
    }

    function test_SetTokenPriceRejectsExcessiveMargin() public {
        vm.expectRevert("Margin too high");
        tokenPaymaster.setTokenPrice(
            IERC20(address(mockToken)),
            1e18,
            1e18,
            10001
        );
    }

    function test_OnlyOwnerCanSetTokenPrice() public {
        vm.prank(user1);
        vm.expectRevert();
        tokenPaymaster.setTokenPrice(
            IERC20(address(mockToken)),
            1e18,
            1e18,
            100
        );
    }

    function test_SetTokenPriceForMultipleTokens() public {
        MockToken mockToken2 = new MockToken();

        tokenPaymaster.setTokenPrice(IERC20(address(mockToken)), 5e17, 1e18, 500);
        tokenPaymaster.setTokenPrice(IERC20(address(mockToken2)), 1e18, 1e18, 1000);

        (uint192 n1,,) = tokenPaymaster.tokenPrices(IERC20(address(mockToken)));
        (uint192 n2,,) = tokenPaymaster.tokenPrices(IERC20(address(mockToken2)));

        assertEq(n1, 5e17);
        assertEq(n2, 1e18);
    }

    // ==================== User Config Tests ====================

    function test_SetUserConfig() public {
        tokenPaymaster.setUserConfig(user1, true, 1e17);

        (bool enabled, uint256 dailyLimit) = tokenPaymaster.userConfigs(user1);
        assertTrue(enabled);
        assertEq(dailyLimit, 1e17);
    }

    function test_SetUserConfigEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit TokenPaymaster.UserConfigSet(user1, true, 1e17);
        tokenPaymaster.setUserConfig(user1, true, 1e17);
    }

    function test_UserDisabledByDefault() public view {
        (bool enabled,) = tokenPaymaster.userConfigs(user1);
        assertFalse(enabled);
    }

    function test_SetUserConfigDisable() public {
        tokenPaymaster.setUserConfig(user1, true, 1e17);
        tokenPaymaster.setUserConfig(user1, false, 0);

        (bool enabled,) = tokenPaymaster.userConfigs(user1);
        assertFalse(enabled);
    }

    function test_OnlyOwnerCanSetUserConfig() public {
        vm.prank(user1);
        vm.expectRevert();
        tokenPaymaster.setUserConfig(user1, true, 0);
    }

    // ==================== Active Status Tests ====================

    function test_ToggleActive() public {
        assertTrue(tokenPaymaster.active());
        tokenPaymaster.setActive(false);
        assertFalse(tokenPaymaster.active());
    }

    function test_IsActiveWhenPaused() public {
        assertTrue(tokenPaymaster.isActive());
        tokenPaymaster.pause();
        assertFalse(tokenPaymaster.isActive());
    }

    function test_IsActiveWithFutureStart() public {
        uint48 futureStart = uint48(block.timestamp + 1 hours);
        tokenPaymaster.setTimeWindow(futureStart, 0);
        assertFalse(tokenPaymaster.isActive());
    }

    function test_IsActiveWithinTimeWindow() public {
        uint48 start = uint48(block.timestamp - 1 hours);
        uint48 end = uint48(block.timestamp + 1 hours);
        tokenPaymaster.setTimeWindow(start, end);
        assertTrue(tokenPaymaster.isActive());
    }

    // ==================== Time Window Tests ====================

    function test_SetTimeWindow() public {
        uint48 start = uint48(block.timestamp);
        uint48 end = uint48(block.timestamp + 24 hours);

        vm.expectEmit(true, true, true, true);
        emit TokenPaymaster.TimeWindowSet(start, end);
        tokenPaymaster.setTimeWindow(start, end);

        assertEq(tokenPaymaster.windowStart(), start);
        assertEq(tokenPaymaster.windowEnd(), end);
    }

    function test_TimeWindowInvalid() public {
        uint48 start = uint48(block.timestamp + 100);
        uint48 end = uint48(block.timestamp);
        vm.expectRevert("invalid time window");
        tokenPaymaster.setTimeWindow(start, end);
    }

    // ==================== Global Budget Tests ====================

    function test_SetGlobalDailyBudget() public {
        vm.expectEmit(true, true, true, true);
        emit TokenPaymaster.GlobalBudgetSet(10 ether);
        tokenPaymaster.setGlobalDailyBudget(10 ether);
        assertEq(tokenPaymaster.globalDailyBudget(), 10 ether);
    }

    function test_GlobalBudgetZeroMeansUnlimited() public {
        tokenPaymaster.setGlobalDailyBudget(0);
        assertEq(tokenPaymaster.globalDailyBudget(), 0);
    }

    // ==================== Token Withdraw Limit Tests ====================

    function test_SetTokenDailyWithdrawLimit() public {
        tokenPaymaster.setTokenDailyWithdrawLimit(IERC20(address(mockToken)), 1 ether);
        assertEq(tokenPaymaster.tokenDailyWithdrawLimit(IERC20(address(mockToken))), 1 ether);
    }

    // ==================== Pause / Emergency Tests ====================

    function test_PauseAndUnpause() public {
        assertTrue(tokenPaymaster.isActive());
        tokenPaymaster.pause();
        assertFalse(tokenPaymaster.isActive());
        assertTrue(tokenPaymaster.paused());

        tokenPaymaster.unpause();
        assertTrue(tokenPaymaster.isActive());
        assertFalse(tokenPaymaster.paused());
    }

    function test_OnlyOwnerCanPause() public {
        vm.prank(user1);
        vm.expectRevert();
        tokenPaymaster.pause();
    }

    function test_OnlyOwnerCanUnpause() public {
        tokenPaymaster.pause();
        vm.prank(user1);
        vm.expectRevert();
        tokenPaymaster.unpause();
    }

    function test_EmergencyShutdownEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit TokenPaymaster.EmergencyShutdown();
        tokenPaymaster.pause();
    }

    // ==================== Deposit / Withdraw ====================

    function test_DepositEmitsEvent() public {
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("depositTo(address)")),
                address(tokenPaymaster)
            ),
            abi.encode(true)
        );

        vm.expectEmit(true, true, true, true);
        emit TokenPaymaster.Deposited(1 ether);
        tokenPaymaster.deposit{value: 1 ether}();
    }

    function test_WithdrawEmitsEvent() public {
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("depositTo(address)")),
                address(tokenPaymaster)
            ),
            abi.encode(true)
        );
        tokenPaymaster.deposit{value: 1 ether}();

        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("withdrawTo(address,uint256)")),
                user1,
                0.5 ether
            ),
            abi.encode(true)
        );

        vm.expectEmit(true, true, true, true);
        emit TokenPaymaster.Withdrawn(user1, 0.5 ether);
        tokenPaymaster.withdrawTo(payable(user1), 0.5 ether);
    }

    function test_OnlyOwnerCanWithdraw() public {
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("withdrawTo(address,uint256)")),
                user1,
                0.5 ether
            ),
            abi.encode(true)
        );
        vm.prank(user1);
        vm.expectRevert();
        tokenPaymaster.withdrawTo(payable(user1), 0.5 ether);
    }

    // ==================== Receive ====================

    function test_CanReceiveETH() public {
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        (bool success,) = address(tokenPaymaster).call{value: 0.1 ether}("");
        assertTrue(success);
        assertEq(address(tokenPaymaster).balance, 0.1 ether);
    }

    // ==================== IsSponsored ====================

    function test_IsSponsoredReturnsTrueForConfiguredUser() public {
        tokenPaymaster.setUserConfig(user1, true, 1e17);
        bytes32 hash = bytes32(uint256(uint160(user1)));
        assertTrue(tokenPaymaster.isSponsored(hash));
    }

    function test_IsSponsoredReturnsFalseForUnconfiguredUser() public {
        bytes32 hash = bytes32(uint256(uint160(user2)));
        assertFalse(tokenPaymaster.isSponsored(hash));
    }

    // ==================== MinTokenAmount ====================

    function test_SetMinTokenAmount() public {
        assertEq(tokenPaymaster.minTokenAmount(), 1e6);
        tokenPaymaster.setMinTokenAmount(1e8);
        assertEq(tokenPaymaster.minTokenAmount(), 1e8);
    }

    function test_OnlyOwnerCanSetMinTokenAmount() public {
        vm.prank(user1);
        vm.expectRevert();
        tokenPaymaster.setMinTokenAmount(1e8);
    }
}
