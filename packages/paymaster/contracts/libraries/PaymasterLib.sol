// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title PaymasterLib
/// @notice Shared library functions for OnChainUX Paymaster contracts
library PaymasterLib {
    /// @notice Decode a timestamp + address packed into validationData
    /// @dev Per EIP-4337, validationData is packed as:
    ///      aggregator (20 bits) | validUntil (48 bits) | validAfter (48 bits)
    /// @param validationData The packed validation data
    /// @return validAfter The timestamp after which the validation is valid
    /// @return validUntil The timestamp until which the validation is valid
    /// @return aggregator The aggregator address (0 for no aggregator)
    function parseValidationData(
        uint256 validationData
    ) internal pure returns (uint48 validAfter, uint48 validUntil, address aggregator) {
        // Address occupies the upper 20 bytes
        aggregator = address(uint160(validationData >> 160));
        // ValidUntil: 48 bits in the middle
        validUntil = uint48((validationData >> 48) & type(uint48).max);
        // ValidAfter: lower 48 bits
        validAfter = uint48(validationData & type(uint48).max);
    }

    /// @notice Pack validation data per EIP-4337
    /// @param aggregator Aggregator address (address(0) for no aggregator)
    /// @param validUntil Timestamp until which this is valid (0 = unlimited)
    /// @param validAfter Timestamp after which this becomes valid (0 = immediately)
    /// @return The packed validation data
    function packValidationData(
        address aggregator,
        uint48 validUntil,
        uint48 validAfter
    ) internal pure returns (uint256) {
        return uint256(uint160(aggregator)) << 160 | uint256(validUntil) << 48 | uint256(validAfter);
    }

    /// @notice Calculate the estimated gas cost for a UserOp
    /// @param gasLimit Total gas limit
    /// @param maxFeePerGas Maximum fee per gas
    /// @return The estimated cost
    function estimateGasCost(uint256 gasLimit, uint256 maxFeePerGas) internal pure returns (uint256) {
        return gasLimit * maxFeePerGas;
    }

    /// @notice Check if a timestamp is within the valid range
    /// @param validAfter Start of validity window
    /// @param validUntil End of validity window (0 = unlimited)
    /// @return Whether the current timestamp is within range
    function isValidTimeRange(uint48 validAfter, uint48 validUntil) internal view returns (bool) {
        uint48 currentTime = uint48(block.timestamp);
        if (validAfter > 0 && currentTime < validAfter) return false;
        if (validUntil > 0 && currentTime > validUntil) return false;
        return true;
    }

    /// @notice Safely add two amounts with overflow check
    /// @param a First value
    /// @param b Second value
    /// @return The sum, reverts on overflow
    function safeAdd(uint256 a, uint256 b) internal pure returns (uint256) {
        unchecked {
            uint256 c = a + b;
            require(c >= a, "Overflow");
            return c;
        }
    }

    /// @notice Compute current day number (for daily limit tracking)
    /// @return The current day number since Unix epoch
    function currentDay() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }
}
