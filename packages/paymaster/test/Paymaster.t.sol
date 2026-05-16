// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../contracts/OnChainUXPaymaster.sol";
import "../contracts/VerifyingPaymaster.sol";
import "../contracts/TokenPaymaster.sol";
import "../contracts/libraries/PaymasterLib.sol";

/// @title PaymasterTest
/// @notice Comprehensive test suite for OnChainUX paymaster contracts
contract PaymasterTest is Test {
    OnChainUXPaymaster public paymaster;
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

        paymaster = new OnChainUXPaymaster(entryPoint);
        verifyingPaymaster = new VerifyingPaymaster(entryPoint, trustedSigner);
        tokenPaymaster = new TokenPaymaster(entryPoint);
    }

    // ==================== OnChainUXPaymaster Tests ====================

    function test_ConstructorSetsEntryPoint() public view {
        assertEq(address(paymaster.entryPoint()), entryPoint);
    }

    function test_OwnerIsDeployer() public view {
        assertEq(paymaster.owner(), owner);
    }

    function test_SetSponsorConfig() public {
        paymaster.setSponsorConfig(
            user1,
            OnChainUXPaymaster.SponsorMode.FreeTier,
            1e16,   // maxAmountPerOp
            10,     // dailyLimitPerUser
            1e18    // totalDailyBudget
        );

        (OnChainUXPaymaster.SponsorMode mode, uint256 maxAmount, uint256 dailyLimit, uint256 totalBudget) =
            paymaster.sponsors(user1);

        assertEq(uint8(mode), uint8(OnChainUXPaymaster.SponsorMode.FreeTier));
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
            OnChainUXPaymaster.SponsorMode.Fixed,
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
            OnChainUXPaymaster.SponsorMode.FreeTier,
            0,
            5,     // 5 free ops per day
            0
        );

        // Day 0, user has 0 ops used
        uint256 day0 = block.timestamp / ONE_DAY;
        assertEq(paymaster.userDailyOps(day0, user1), 0);
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

    function test_OnlyOwnerCanManage() public {
        vm.prank(user1);
        vm.expectRevert();
        tokenPaymaster.setTokenPrice(IERC20(makeAddr("t")), 1e18, 1e18, 100);

        vm.prank(user1);
        vm.expectRevert();
        tokenPaymaster.setUserConfig(user1, true, 0);
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
}
