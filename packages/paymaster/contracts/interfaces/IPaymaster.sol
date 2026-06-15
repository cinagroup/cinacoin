// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title PackedUserOperation
/// @notice ERC-4337 v0.7 PackedUserOperation structure
struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    bytes32 accountGasLimits;
    uint256 preVerificationGas;
    bytes32 gasFees;
    bytes paymasterAndData;
    bytes signature;
}

/// @title IPaymaster
/// @notice Interface for CinaConnect Paymaster contracts
/// @dev Compatible with ERC-4337 EntryPoint v0.7
interface IPaymaster {
    /// @notice Post-operation callback from EntryPoint
    /// @param mode The mode of the callback (success or revert)
    /// @param context The context bytes from validatePaymasterUserOp
    /// @param actualGasCost The actual gas cost incurred
    /// @param actualUserOpFeePerGas The actual gas price paid
    function postOp(
        uint8 mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external;

    /// @notice Validate whether this paymaster will sponsor a UserOp
    /// @dev ERC-4337 v0.7 interface: receives full PackedUserOperation for sender extraction
    /// @param userOp The full PackedUserOperation structure
    /// @param userOpHash Hash of the UserOp
    /// @param maxCost Maximum cost the EntryPoint will charge
    /// @return validationData Validation data (0 for success, packed per v0.7 spec)
    /// @return context Context bytes to pass to postOp
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (uint256 validationData, bytes memory context);

    /// @notice Sponsor a specific UserOp
    /// @param userOpHash Hash of the UserOp
    /// @param maxCost Maximum cost to sponsor
    function sponsorUserOp(bytes32 userOpHash, uint256 maxCost) external;

    /// @notice Check if a UserOp is sponsored
    /// @param userOpHash Hash of the UserOp
    /// @return Whether the UserOp is sponsored
    function isSponsored(bytes32 userOpHash) external view returns (bool);

    /// @notice Deposit funds into the EntryPoint for gas sponsorship
    function deposit() external payable;

    /// @notice Withdraw funds from the EntryPoint
    /// @param withdrawAddress Address to withdraw to
    /// @param amount Amount to withdraw
    function withdrawTo(address payable withdrawAddress, uint256 amount) external;
}
