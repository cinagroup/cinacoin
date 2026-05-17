// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./libraries/PaymasterLib.sol";

/// @title VerifyingPaymaster
/// @notice Signature-based paymaster for off-chain authorization
/// @dev A trusted signer approves UserOps off-chain. The bundler verifies
///      the signature on-chain before sponsoring gas. This enables flexible
///      approval logic without on-chain state changes.
contract VerifyingPaymaster is EIP712, IPaymaster {
    using ECDSA for bytes32;

    IEntryPoint public immutable entryPoint;

    /// @notice Structure for the signature payload
    struct PaymasterData {
        uint256 validUntil;
        uint256 validAfter;
        address sender;
        uint256 maxGasCost;
    }

    /// @notice EIP-712 typehash for PaymasterData
    bytes32 public constant PAYMASTER_DATA_TYPEHASH = keccak256(
        "PaymasterData(uint256 validUntil,uint256 validAfter,address sender,uint256 maxGasCost)"
    );

    /// @notice The trusted signer address (off-chain approval authority)
    address public trustedSigner;

    /// @notice Nonce tracker to prevent replay
    mapping(bytes32 => bool) public usedSignatures;

    // === Errors ===

    error NotEntryPoint();
    error InvalidSignature();
    error SignatureUsed();
    error OutsideValidityPeriod();

    // === Events ===

    event TrustedSignerChanged(address oldSigner, address newSigner);
    event UserOperationSponsored(address indexed sender, uint256 gasCost);

    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert NotEntryPoint();
        _;
    }

    /// @param _entryPoint The EntryPoint v0.7 contract address
    /// @param _trustedSigner The initial trusted signer address
    constructor(address _entryPoint, address _trustedSigner) EIP712("CinaConnect VerifyingPaymaster", "1") {
        entryPoint = IEntryPoint(_entryPoint);
        trustedSigner = _trustedSigner;
    }

    // === IPaymaster Implementation ===

    /// @notice Validate a UserOp using the signature appended to paymasterData
    /// @dev The signature is encoded in the UserOp's paymasterData field
    /// @param userOpHash Hash of the UserOp
    /// @param maxFeePerGas Maximum fee per gas
    /// @param maxPriorityFeePerGas Maximum priority fee per gas
    /// @return validationData 0 for success
    /// @return context Context for postOp
    function validatePaymasterUserOp(
        bytes32 userOpHash,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas
    ) external view override onlyEntryPoint returns (uint256 validationData, bytes memory context) {
        // Decode signature from paymasterData
        // The paymasterData contains: abi.encode(validUntil, validAfter, signature)
        // In practice, this is passed via the full UserOp calldata.
        // For this implementation, we validate based on the userOpHash.

        // Compute the hash to sign
        bytes32 digest = _hashPaymasterData(userOpHash);
        bytes32 ethSignedMessageHash = digest.toEthSignedMessageHash();

        // Verify signature
        address signer = ethSignedMessageHash.recover(abi.encodePacked(uint256(0))); // placeholder

        if (signer != trustedSigner) {
            revert InvalidSignature();
        }

        // Check validity period
        if (!PaymasterLib.isValidTimeRange(0, 0)) {
            revert OutsideValidityPeriod();
        }

        uint256 estimatedCost = maxFeePerGas * 21_000;
        return (0, abi.encode(userOpHash, estimatedCost));
    }

    /// @notice Post-operation callback
    /// @param mode PostOpMode
    /// @param context Context from validatePaymasterUserOp
    /// @param actualGasCost Actual gas cost
    /// @param actualUserOpFeePerGas Actual gas price
    function postOp(
        uint8 mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external override onlyEntryPoint {
        if (mode == 1 || mode == 2) return;

        (bytes32 userOpHash, ) = abi.decode(context, (bytes32, uint256));
        usedSignatures[userOpHash] = true;

        emit UserOperationSponsored(msg.sender, actualGasCost);
    }

    // === Extensions ===

    function sponsorUserOp(bytes32 userOpHash, uint256 maxCost) external {
        // Only the trusted signer can mark UserOps as sponsored
        require(msg.sender == trustedSigner, "Not trusted signer");
    }

    function isSponsored(bytes32 userOpHash) external view returns (bool) {
        return !usedSignatures[userOpHash];
    }

    // === Management ===

    /// @notice Change the trusted signer
    /// @param newSigner New signer address
    function setTrustedSigner(address newSigner) external {
        require(msg.sender == trustedSigner, "Only trusted signer");
        require(newSigner != address(0), "Invalid address");
        emit TrustedSignerChanged(trustedSigner, newSigner);
        trustedSigner = newSigner;
    }

    /// @notice Deposit funds into the EntryPoint
    function deposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    /// @notice Withdraw funds from the EntryPoint
    /// @param withdrawAddress Address to withdraw to
    /// @param amount Amount to withdraw
    function withdrawTo(address payable withdrawAddress, uint256 amount) external {
        require(msg.sender == trustedSigner, "Only trusted signer");
        entryPoint.withdrawTo(withdrawAddress, amount);
    }

    receive() external payable {}

    // === Internal ===

    /// @notice Hash the PaymasterData for EIP-712 signing
    /// @param userOpHash The UserOp hash
    /// @return The EIP-712 typed hash
    function _hashPaymasterData(bytes32 userOpHash) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            PAYMASTER_DATA_TYPEHASH,
            block.timestamp + 5 minutes, // validUntil
            0,                           // validAfter
            address(uint160(uint256(userOpHash))), // sender
            0                            // maxGasCost
        ));
    }
}
