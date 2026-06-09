// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

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
    /// @param userOpHash Hash of the UserOp
    /// @param maxFeePerGas Maximum fee per gas
    /// @param maxPriorityFeePerGas Maximum priority fee per gas
    /// @return validationData Validation data (0 for success)
    /// @return context Context bytes to pass to postOp
    function validatePaymasterUserOp(
        bytes32 userOpHash,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas
    ) external view returns (uint256 validationData, bytes memory context);

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
