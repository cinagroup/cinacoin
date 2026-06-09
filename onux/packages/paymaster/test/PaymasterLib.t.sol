// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../contracts/libraries/PaymasterLib.sol";

/// @title PaymasterLibTest
/// @notice Comprehensive tests for the PaymasterLib library
contract PaymasterLibTest is Test {
    uint256 public constant ONE_DAY = 1 days;

    // ==================== Validation Data Packing ====================

    function test_PackValidationDataRoundtrip() public pure {
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

    function test_PackValidationDataWithZeroTimes() public pure {
        address aggregator = address(0x456);
        uint256 packed = PaymasterLib.packValidationData(aggregator, 0, 0);
        (uint48 after, uint48 until, address agg) =
            PaymasterLib.parseValidationData(packed);

        assertEq(after, 0);
        assertEq(until, 0);
        assertEq(agg, aggregator);
    }

    function test_PackValidationDataMaxValues() public pure {
        address aggregator = address(type(uint160).max);
        uint48 validUntil = type(uint48).max;
        uint48 validAfter = type(uint48).max;

        uint256 packed = PaymasterLib.packValidationData(aggregator, validUntil, validAfter);
        (uint48 after, uint48 until, address agg) =
            PaymasterLib.parseValidationData(packed);

        assertEq(after, validAfter);
        assertEq(until, validUntil);
        assertEq(agg, aggregator);
    }

    function test_PackValidationDataLayout() public pure {
        // validAfter: bits 0-47
        // validUntil: bits 48-95
        // aggregator: bits 96-255
        address aggregator = address(0xABC);
        uint256 packed = PaymasterLib.packValidationData(aggregator, 200, 100);

        assertEq(uint256(aggregator) << 96, packed & (type(uint256).max << 96));
        assertEq(200 << 48, packed & (0xFFFFFFFFFFFF << 48));
        assertEq(100, packed & 0xFFFFFFFFFFFF);
    }

    // ==================== Gas Cost Estimation ====================

    function test_EstimateGasCost() public pure {
        uint256 cost = PaymasterLib.estimateGasCost(21_000, 30e9);
        assertEq(cost, 630000000000000); // 0.00063 ETH
    }

    function test_EstimateGasCostZero() public pure {
        uint256 cost = PaymasterLib.estimateGasCost(0, 30e9);
        assertEq(cost, 0);
    }

    function test_EstimateGasCostZeroPrice() public pure {
        uint256 cost = PaymasterLib.estimateGasCost(21_000, 0);
        assertEq(cost, 0);
    }

    function test_EstimateGasCostHighGasPrice() public pure {
        uint256 cost = PaymasterLib.estimateGasCost(1_000_000, 100e9);
        assertEq(cost, 100e15); // 0.1 ETH
    }

    function test_EstimateGasCostEntryPoint() public pure {
        // Typical EP validation: 200k gas at 50 gwei
        uint256 cost = PaymasterLib.estimateGasCost(200_000, 50e9);
        assertEq(cost, 10_000_000_000_000_000); // 0.01 ETH
    }

    // ==================== Time Range Validation ====================

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

    function test_IsValidTimeRangeExactBoundary() public {
        uint48 currentTime = uint48(block.timestamp);
        assertTrue(PaymasterLib.isValidTimeRange(currentTime, currentTime));
    }

    function test_IsValidTimeRangeWideWindow() public {
        uint48 currentTime = uint48(block.timestamp);
        assertTrue(PaymasterLib.isValidTimeRange(0, type(uint48).max));
    }

    function test_IsValidTimeRangeZeroValidAfter() public {
        uint48 currentTime = uint48(block.timestamp);
        // validAfter = 0 means "always valid from start"
        assertTrue(PaymasterLib.isValidTimeRange(0, currentTime + 100));
    }

    function test_IsValidTimeRangeZeroValidUntil() public {
        uint48 currentTime = uint48(block.timestamp);
        // validUntil = 0 means "no expiry"
        assertTrue(PaymasterLib.isValidTimeRange(currentTime - 100, 0));
    }

    // ==================== Safe Arithmetic ====================

    function test_SafeAddNormal() public pure {
        assertEq(PaymasterLib.safeAdd(100, 200), 300);
    }

    function test_SafeAddZero() public pure {
        assertEq(PaymasterLib.safeAdd(0, 100), 100);
        assertEq(PaymasterLib.safeAdd(100, 0), 100);
    }

    function test_SafeAddOverflow() public {
        vm.expectRevert();
        PaymasterLib.safeAdd(type(uint256).max, 1);
    }

    function test_SafeAddLargeValues() public pure {
        assertEq(PaymasterLib.safeAdd(type(uint256).max / 2, type(uint256).max / 2), type(uint256).max - 1);
    }

    // ==================== Current Day ====================

    function test_CurrentDay() public {
        uint256 day = PaymasterLib.currentDay();
        assertEq(day, block.timestamp / ONE_DAY);
    }

    function test_CurrentDayConsistency() public {
        uint256 day1 = PaymasterLib.currentDay();
        uint256 day2 = PaymasterLib.currentDay();
        assertEq(day1, day2);
    }

    function test_CurrentDayAfterWarp() public {
        uint256 dayBefore = PaymasterLib.currentDay();
        vm.warp(block.timestamp + ONE_DAY);
        uint256 dayAfter = PaymasterLib.currentDay();
        assertEq(dayAfter, dayBefore + 1);
    }
}
