// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../contracts/CinaConnectPaymaster.sol";
import "../contracts/VerifyingPaymaster.sol";
import "../contracts/TokenPaymaster.sol";
import "../contracts/libraries/PaymasterLib.sol";

/// @title PaymasterTest
/// @notice Comprehensive test suite for CinaConnect paymaster contracts
contract PaymasterTest is Test {
    CinaConnectPaymaster public paymaster;
    VerifyingPaymaster public verifyingPaymaster;
    TokenPaymaster public tokenPaymaster;

    address public entryPoint = makeAddr("entryPoint");
    address public owner;
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public trustedSigner = makeAddr("trustedSigner");

    uint256 public constant ONE_DAY = 1 days;

    function setUp() public {
        owner = address(this);

        paymaster = new CinaConnectPaymaster(entryPoint);
        verifyingPaymaster = new VerifyingPaymaster(entryPoint, trustedSigner);
        tokenPaymaster = new TokenPaymaster(entryPoint);
    }

    // ==================== CinaConnectPaymaster Tests ====================

    function test_ConstructorSetsEntryPoint() public view {
        assertEq(address(paymaster.entryPoint()), entryPoint);
    }

    function test_OwnerIsDeployer() public view {
        assertEq(paymaster.owner(), owner);
    }

    function test_SetSponsorConfig() public {
        paymaster.setSponsorConfig(
            user1,
            CinaConnectPaymaster.SponsorMode.FreeTier,
            1e16,   // maxAmountPerOp
            10,     // dailyLimitPerUser
            1e18    // totalDailyBudget
        );

        (CinaConnectPaymaster.SponsorMode mode, uint256 maxAmount, uint256 dailyLimit, uint256 totalBudget) =
            paymaster.sponsors(user1);

        assertEq(uint8(mode), uint8(CinaConnectPaymaster.SponsorMode.FreeTier));
        assertEq(maxAmount, 1e16);
        assertEq(dailyLimit, 10);
        assertEq(totalBudget, 1e18);
    }

    function test_SetWhitelistedUser() public {
        assertFalse(paymaster.whitelistedUsers(user1));

        paymaster.setWhitelistedUser(user1, true);
        assertTrue(paymaster.whitelistedUsers(user1));

        paymaster.setWhitelistedUser(user1, false);
        assertFalse(paymaster.whitelistedUsers(user1));
    }

    function test_SetWhitelistedTarget() public {
        address target = makeAddr("targetContract");
        assertFalse(paymaster.whitelistedTargets(target));

        paymaster.setWhitelistedTarget(target, true);
        assertTrue(paymaster.whitelistedTargets(target));
    }

    function test_TargetFilterToggle() public {
        assertFalse(paymaster.targetFilterEnabled());
        paymaster.setTargetFilter(true);
        assertTrue(paymaster.targetFilterEnabled());
    }

    function test_OnlyOwnerCanSetConfig() public {
        vm.prank(user1);
        vm.expectRevert(); // OwnableUnauthorizedAccount
        paymaster.setSponsorConfig(
            user1,
            CinaConnectPaymaster.SponsorMode.Fixed,
            1e16,
            10,
            1e18
        );
    }

    function test_DepositAndWithdraw() public {
        // Simulate deposit
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("depositTo(address)")),
                address(paymaster)
            ),
            abi.encode(true)
        );

        paymaster.deposit{value: 1 ether}();

        // Simulate withdraw
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("withdrawTo(address,uint256)")),
                user1,
                0.5 ether
            ),
            abi.encode(true)
        );

        paymaster.withdrawTo(payable(user1), 0.5 ether);
    }

    function test_ReceiveETH() public {
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        (bool success, ) = address(paymaster).call{value: 0.1 ether}("");
        assertTrue(success);
        assertEq(address(paymaster).balance, 0.1 ether);
    }

    function test_FreeTierTracking() public {
        paymaster.setSponsorConfig(
            user1,
            CinaConnectPaymaster.SponsorMode.FreeTier,
            0,
            5,     // 5 free ops per day
            0
        );

        uint256 day0 = block.timestamp / ONE_DAY;
        assertEq(paymaster.userDailyOps(day0, user1), 0);
    }

    // ==================== Emergency Shutdown / Pausable Tests ====================

    function test_PauseAndUnpause() public {
        assertTrue(paymaster.isActive());

        paymaster.pause();
        assertFalse(paymaster.isActive());
        assertTrue(paymaster.paused());

        paymaster.unpause();
        assertTrue(paymaster.isActive());
        assertFalse(paymaster.paused());
    }

    function test_OnlyOwnerCanPause() public {
        vm.prank(user1);
        vm.expectRevert();
        paymaster.pause();
    }

    function test_OnlyOwnerCanUnpause() public {
        paymaster.pause();
        vm.prank(user1);
        vm.expectRevert();
        paymaster.unpause();
    }

    function test_EmergencyShutdownEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CinaConnectPaymaster.EmergencyShutdown();
        paymaster.pause();
    }

    // ==================== Time Window Tests ====================

    function test_SetTimeWindow() public {
        uint48 start = uint48(block.timestamp);
        uint48 end = uint48(block.timestamp + 24 hours);

        vm.expectEmit(true, true, true, true);
        emit CinaConnectPaymaster.TimeWindowSet(start, end);
        paymaster.setTimeWindow(start, end);

        assertEq(paymaster.windowStart(), start);
        assertEq(paymaster.windowEnd(), end);
    }

    function test_TimeWindowInvalid() public {
        uint48 start = uint48(block.timestamp + 100);
        uint48 end = uint48(block.timestamp);
        vm.expectRevert("invalid time window");
        paymaster.setTimeWindow(start, end);
    }

    function test_IsWithinTimeWindowAlwaysActive() public view {
        // Default: no window set, should always be active
        assertTrue(paymaster.isActive());
    }

    function test_IsActiveWithFutureStart() public {
        uint48 futureStart = uint48(block.timestamp + 1 hours);
        paymaster.setTimeWindow(futureStart, 0);

        // Should be inactive because we haven't reached start yet
        assertFalse(paymaster.isActive());

        // Fast forward
        vm.warp(futureStart + 1);
        assertTrue(paymaster.isActive());
    }

    function test_IsActiveWithExpiredEnd() public {
        uint48 pastEnd = uint48(block.timestamp - 1);
        paymaster.setTimeWindow(0, pastEnd);

        assertFalse(paymaster.isActive());
    }

    // ==================== Global Budget Tests ====================

    function test_SetGlobalDailyBudget() public {
        vm.expectEmit(true, true, true, true);
        emit CinaConnectPaymaster.GlobalBudgetSet(10 ether);
        paymaster.setGlobalDailyBudget(10 ether);

        assertEq(paymaster.globalDailyBudget(), 10 ether);
    }

    function test_ResetGlobalDailySpent() public {
        paymaster.setGlobalDailyBudget(10 ether);
        // Manually set some spending by warping and calling internal
        // In a real test, this would happen via actual UserOps
        paymaster.resetGlobalDailySpent();
    }

    // ==================== VerifyingPaymaster Tests ====================

    function test_VerifyingPaymasterConstructor() public view {
        assertEq(address(verifyingPaymaster.entryPoint()), entryPoint);
        assertEq(verifyingPaymaster.trustedSigner(), trustedSigner);
    }

    function test_ChangeTrustedSigner() public {
        address newSigner = makeAddr("newSigner");

        vm.prank(trustedSigner);
        verifyingPaymaster.setTrustedSigner(newSigner);

        assertEq(verifyingPaymaster.trustedSigner(), newSigner);
    }

    function test_OnlyTrustedSignerCanChangeSigner() public {
        vm.prank(user1);
        vm.expectRevert();
        verifyingPaymaster.setTrustedSigner(makeAddr("attacker"));
    }

    function test_VerifyingPaymasterDeposit() public {
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("depositTo(address)")),
                address(verifyingPaymaster)
            ),
            abi.encode(true)
        );

        vm.deal(trustedSigner, 1 ether);
        vm.prank(trustedSigner);
        verifyingPaymaster.deposit{value: 0.5 ether}();
    }

    // ==================== TokenPaymaster Tests ====================

    function test_TokenPaymasterConstructor() public view {
        assertEq(address(tokenPaymaster.entryPoint()), entryPoint);
        assertEq(tokenPaymaster.owner(), owner);
        assertTrue(tokenPaymaster.active());
    }

    function test_SetTokenPrice() public {
        address mockToken = makeAddr("mockToken");

        tokenPaymaster.setTokenPrice(
            IERC20(mockToken),
            5e17,   // 0.5 ETH per token
            1e18,   // denominator
            500     // 5% margin
        );

        (uint192 numerator, uint64 denominator, uint64 marginBps) =
            tokenPaymaster.tokenPrices(IERC20(mockToken));

        assertEq(numerator, 5e17);
        assertEq(denominator, 1e18);
        assertEq(marginBps, 500);
    }

    function test_SetUserConfig() public {
        tokenPaymaster.setUserConfig(user1, true, 1e17);

        (bool enabled, uint256 dailyLimit) = tokenPaymaster.userConfigs(user1);
        assertTrue(enabled);
        assertEq(dailyLimit, 1e17);
    }

    function test_ToggleActive() public {
        assertTrue(tokenPaymaster.active());
        tokenPaymaster.setActive(false);
        assertFalse(tokenPaymaster.active());
    }

    function test_TokenPaymasterPause() public {
        assertTrue(tokenPaymaster.isActive());
        tokenPaymaster.pause();
        assertFalse(tokenPaymaster.isActive());
    }

    function test_TokenPaymasterTimeWindow() public {
        uint48 futureStart = uint48(block.timestamp + 1 hours);
        tokenPaymaster.setTimeWindow(futureStart, 0);
        assertFalse(tokenPaymaster.isActive());
    }

    function test_TokenPaymasterGlobalBudget() public {
        vm.expectEmit(true, true, true, true);
        emit TokenPaymaster.GlobalBudgetSet(5 ether);
        tokenPaymaster.setGlobalDailyBudget(5 ether);
        assertEq(tokenPaymaster.globalDailyBudget(), 5 ether);
    }

    function test_TokenWithdrawLimit() public {
        address mockToken = makeAddr("mockToken");
        tokenPaymaster.setTokenDailyWithdrawLimit(IERC20(mockToken), 1 ether);
        assertEq(tokenPaymaster.tokenDailyWithdrawLimit(IERC20(mockToken)), 1 ether);
    }

    function test_OnlyOwnerCanManage() public {
        vm.prank(user1);
        vm.expectRevert();
        tokenPaymaster.setTokenPrice(IERC20(makeAddr("t")), 1e18, 1e18, 100);

        vm.prank(user1);
        vm.expectRevert();
        tokenPaymaster.setUserConfig(user1, true, 0);
    }

    function test_TokenPaymasterEmergencyShutdownEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit TokenPaymaster.EmergencyShutdown();
        tokenPaymaster.pause();
    }

    // ==================== PaymasterLib Tests ====================

    function test_ParseValidationData() public pure {
        address aggregator = address(0x123);
        uint48 validUntil = 1700000000;
        uint48 validAfter = 1699990000;

        uint256 packed = PaymasterLib.packValidationData(aggregator, validUntil, validAfter);
        (uint48 parsedAfter, uint48 parsedUntil, address parsedAggregator) =
            PaymasterLib.parseValidationData(packed);

        assertEq(parsedAfter, validAfter);
        assertEq(parsedUntil, validUntil);
        assertEq(parsedAggregator, aggregator);
    }

    function test_PackValidationDataZeroAggregator() public pure {
        uint256 packed = PaymasterLib.packValidationData(address(0), 0, 0);
        assertEq(packed, 0);
    }

    function test_EstimateGasCost() public pure {
        uint256 cost = PaymasterLib.estimateGasCost(21_000, 30e9); // 21000 gas @ 30 gwei
        assertEq(cost, 630000000000000); // 0.00063 ETH
    }

    function test_IsValidTimeRangeWithinRange() public {
        uint48 currentTime = uint48(block.timestamp);
        assertTrue(PaymasterLib.isValidTimeRange(currentTime - 100, currentTime + 100));
    }

    function test_IsValidTimeRangeBeforeWindow() public {
        uint48 currentTime = uint48(block.timestamp);
        assertFalse(PaymasterLib.isValidTimeRange(currentTime + 100, currentTime + 200));
    }

    function test_IsValidTimeRangeAfterWindow() public {
        uint48 currentTime = uint48(block.timestamp);
        assertFalse(PaymasterLib.isValidTimeRange(currentTime - 200, currentTime - 100));
    }

    function test_SafeAddNormal() public pure {
        assertEq(PaymasterLib.safeAdd(100, 200), 300);
    }

    function test_SafeAddOverflow() public {
        vm.expectRevert();
        PaymasterLib.safeAdd(type(uint256).max, 1);
    }

    function test_CurrentDay() public {
        uint256 day = PaymasterLib.currentDay();
        assertEq(day, block.timestamp / ONE_DAY);
    }

    // ==================== Integration Tests ====================

    function test_IsSponsoredWhitelistedUser() public {
        paymaster.setWhitelistedUser(user1, true);
        bytes32 fakeHash = bytes32(uint256(uint160(user1)));
        assertTrue(paymaster.isSponsored(fakeHash));
    }

    function test_IsSponsoredConfiguredUser() public {
        paymaster.setSponsorConfig(
            user1,
            CinaConnectPaymaster.SponsorMode.Fixed,
            1e16,
            10,
            1e18
        );
        bytes32 fakeHash = bytes32(uint256(uint160(user1)));
        assertTrue(paymaster.isSponsored(fakeHash));
    }

    function test_IsSponsoredNonUser() public {
        bytes32 fakeHash = bytes32(uint256(uint160(user2)));
        assertFalse(paymaster.isSponsored(fakeHash));
    }

    function test_VerifyingPaymasterIsSponsored() public {
        bytes32 userOpHash = keccak256("test");
        assertFalse(verifyingPaymaster.isSponsored(userOpHash));
    }

    function test_TokenPaymasterIsActiveCombined() public {
        assertTrue(tokenPaymaster.isActive());
        tokenPaymaster.setActive(false);
        assertFalse(tokenPaymaster.isActive());
    }

    // ==================== Expanded: Budget Enforcement ====================

    function test_GlobalDailyBudgetEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CinaConnectPaymaster.GlobalBudgetSet(25 ether);
        paymaster.setGlobalDailyBudget(25 ether);
    }

    function test_ZeroGlobalBudgetMeansUnlimited() public {
        paymaster.setGlobalDailyBudget(0);
        assertEq(paymaster.globalDailyBudget(), 0);
    }

    function test_ResetDailySpentAfterOwnerCall() public {
        paymaster.resetGlobalDailySpent();
        assertEq(paymaster.globalDailySpent(PaymasterLib.currentDay()), 0);
    }

    // ==================== Expanded: Time Window ====================

    function test_TimeWindowEmitsEvent() public {
        uint48 start = uint48(block.timestamp);
        uint48 end = uint48(block.timestamp + 24 hours);
        vm.expectEmit(true, true, true, true);
        emit CinaConnectPaymaster.TimeWindowSet(start, end);
        paymaster.setTimeWindow(start, end);
    }

    function test_TimeWindowClearing() public {
        paymaster.setTimeWindow(uint48(block.timestamp + 1 hours), 0);
        paymaster.setTimeWindow(0, 0);
        assertTrue(paymaster.isActive());
    }

    function test_IsActiveDuringTimeWindow() public {
        uint48 now = uint48(block.timestamp);
        paymaster.setTimeWindow(now - 1 hours, now + 1 hours);
        assertTrue(paymaster.isActive());
    }

    // ==================== Expanded: Target Filter ====================

    function test_SetTargetFilterEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CinaConnectPaymaster.TargetFilterEnabled(true);
        paymaster.setTargetFilter(true);
    }

    function test_WhitelistUserEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CinaConnectPaymaster.UserWhitelisted(user1, true);
        paymaster.setWhitelistedUser(user1, true);
    }

    function test_WhitelistTargetEmitsEvent() public {
        address target = makeAddr("target");
        vm.expectEmit(true, true, true, true);
        emit CinaConnectPaymaster.TargetWhitelisted(target, true);
        paymaster.setWhitelistedTarget(target, true);
    }

    // ==================== Expanded: Config Validation ====================

    function test_SponsorConfigEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CinaConnectPaymaster.SponsorConfigSet(
            user1,
            CinaConnectPaymaster.SponsorMode.FreeTier,
            1e16
        );
        paymaster.setSponsorConfig(
            user1,
            CinaConnectPaymaster.SponsorMode.FreeTier,
            1e16,
            10,
            1e18
        );
    }

    // ==================== Expanded: Pausable Security ====================

    function test_PausedBlocksOperations() public {
        paymaster.setWhitelistedUser(user1, true);
        paymaster.pause();
        bytes32 fakeHash = bytes32(uint256(uint160(user1)));
        // After pause, sponsorship should be blocked
        assertFalse(paymaster.isSponsored(fakeHash));
    }

    // ==================== Expanded: Edge Cases ====================

    function test_MultipleUsersWithDifferentModes() public {
        paymaster.setSponsorConfig(user1, CinaConnectPaymaster.SponsorMode.FreeTier, 0, 5, 0);
        paymaster.setSponsorConfig(user2, CinaConnectPaymaster.SponsorMode.Fixed, 1e16, 10, 1e18);

        (CinaConnectPaymaster.SponsorMode mode1,,, ) = paymaster.sponsors(user1);
        (CinaConnectPaymaster.SponsorMode mode2,,, ) = paymaster.sponsors(user2);

        assertEq(uint8(mode1), uint8(CinaConnectPaymaster.SponsorMode.FreeTier));
        assertEq(uint8(mode2), uint8(CinaConnectPaymaster.SponsorMode.Fixed));
    }

    // ==================== Expanded: Deposit Events ====================

    function test_DepositEmitsEvent() public {
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("depositTo(address)")),
                address(paymaster)
            ),
            abi.encode(true)
        );

        vm.expectEmit(true, true, true, true);
        emit CinaConnectPaymaster.Deposited(address(paymaster), 1 ether);
        paymaster.deposit{value: 1 ether}();
    }

    function test_WithdrawEmitsEvent() public {
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("depositTo(address)")),
                address(paymaster)
            ),
            abi.encode(true)
        );
        paymaster.deposit{value: 1 ether}();

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
        emit CinaConnectPaymaster.Withdrawn(address(paymaster), user1, 0.5 ether);
        paymaster.withdrawTo(payable(user1), 0.5 ether);
    }

    // ==================== Expanded: Only Owner Security ====================

    function test_OnlyOwnerCanSetWhitelist() public {
        vm.prank(user1);
        vm.expectRevert();
        paymaster.setWhitelistedUser(user1, true);
    }

    function test_OnlyOwnerCanSetTargetFilter() public {
        vm.prank(user1);
        vm.expectRevert();
        paymaster.setTargetFilter(true);
    }

    function test_OnlyOwnerCanSetTimeWindow() public {
        vm.prank(user1);
        vm.expectRevert();
        paymaster.setTimeWindow(uint48(block.timestamp), 0);
    }

    function test_OnlyOwnerCanSetGlobalBudget() public {
        vm.prank(user1);
        vm.expectRevert();
        paymaster.setGlobalDailyBudget(1 ether);
    }

    function test_OnlyOwnerCanWithdraw() public {
        vm.prank(user1);
        vm.mockCall(
            entryPoint,
            abi.encodeWithSelector(
                bytes4(keccak256("withdrawTo(address,uint256)")),
                user1,
                0.5 ether
            ),
            abi.encode(true)
        );
        vm.expectRevert();
        paymaster.withdrawTo(payable(user1), 0.5 ether);
    }

    // ==================== Expanded: Free Tier Limits ====================

    function test_FreeTierConfig() public {
        paymaster.setSponsorConfig(
            user1,
            CinaConnectPaymaster.SponsorMode.FreeTier,
            0,    // no max per op
            3,    // 3 free ops per day
            0     // no total budget
        );

        uint256 today = block.timestamp / 1 days;
        assertEq(paymaster.userDailyOps(today, user1), 0);
    }

    // ==================== Expanded: Percentage Mode ====================

    function test_PercentageModeConfig() public {
        paymaster.setSponsorConfig(
            user1,
            CinaConnectPaymaster.SponsorMode.Percentage,
            5e15,   // 0.005 ETH max
            100,
            1e18
        );

        (CinaConnectPaymaster.SponsorMode mode, uint256 maxAmount,,) =
            paymaster.sponsors(user1);

        assertEq(uint8(mode), uint8(CinaConnectPaymaster.SponsorMode.Percentage));
        assertEq(maxAmount, 5e15);
    }

    // ==================== Expanded: Contract Receive ====================

    function test_ReceiveViaFallback() public {
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        (bool success,) = address(paymaster).call{value: 0.05 ether}("");
        assertTrue(success);
        assertEq(address(paymaster).balance, 0.05 ether);
    }

    function test_ContractBalanceAfterMultipleDeposits() public {
        vm.deal(user1, 2 ether);
        vm.prank(user1);
        (bool s1,) = address(paymaster).call{value: 0.3 ether}("");
        assertTrue(s1);

        vm.prank(user1);
        (bool s2,) = address(paymaster).call{value: 0.7 ether}("");
        assertTrue(s2);

        assertEq(address(paymaster).balance, 1 ether);
    }
}
