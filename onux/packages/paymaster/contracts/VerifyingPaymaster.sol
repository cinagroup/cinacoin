// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./libraries/PaymasterLib.sol";

/// @title VerifyingPaymaster
/// @notice Signature-based paymaster for off-chain authorization.
/// @dev A trusted signer approves UserOps off-chain. The bundler verifies
///      the signature on-chain before sponsoring gas. This enables flexible
///      approval logic without on-chain state changes.
///
///      paymasterAndData layout:
///        paymaster address (20) | validUntil (32) | validAfter (32) | signature (65)
contract VerifyingPaymaster is EIP712, IPaymaster {
    using ECDSA for bytes32;

    // === Structs ===

    /// @notice EIP-712 typed data for off-chain signing.
    struct UserOpPaymasterData {
        bytes32 userOpHash;
        uint256 validUntil;
        uint256 validAfter;
        uint256 maxGasCost;
    }

    // === Constants ===

    /// @notice EIP-712 typehash for UserOpPaymasterData.
    bytes32 public constant PAYMASTER_DATA_TYPEHASH = keccak256(
        "UserOpPaymasterData(bytes32 userOpHash,uint256 validUntil,uint256 validAfter,uint256 maxGasCost)"
    );

    /// @notice Signature length (v + r + s).
    uint256 internal constant SIGNATURE_LENGTH = 65;

    // === State ===

    IEntryPoint public immutable entryPoint;

    /// @notice The trusted signer address (off-chain approval authority).
    address public trustedSigner;

    /// @notice Per-userOp hash to prevent replay attacks.
    mapping(bytes32 => bool) public usedSignatures;

    /// @notice Gas budget cap per single UserOp (wei-equivalent, 0 = uncapped).
    uint256 public gasBudgetCap;

    /// @notice Total amount sponsored (wei). Resets when owner calls resetBudget.
    uint256 public totalSponsored;

    // === Errors ===

    error NotEntryPoint();
    error InvalidSignature();
    error SignatureUsed();
    error OutsideValidityPeriod();
    error GasBudgetExceeded();

    // === Events ===

    event TrustedSignerChanged(address indexed oldSigner, address indexed newSigner);
    event UserOperationSponsored(address indexed sender, uint256 gasCost);
    event GasBudgetCapChanged(uint256 oldCap, uint256 newCap);
    event BudgetReset(uint256 resetAmount);

    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert NotEntryPoint();
        _;
    }

    modifier onlyTrustedSigner() {
        if (msg.sender != trustedSigner) revert("Not trusted signer");
        _;
    }

    /// @param _entryPoint       The EntryPoint v0.7 contract address.
    /// @param _trustedSigner    The initial trusted signer address.
    /// @param _gasBudgetCap     Maximum gas cost per UserOp (0 = uncapped).
    constructor(
        address _entryPoint,
        address _trustedSigner,
        uint256 _gasBudgetCap
    ) EIP712("CinaConnect VerifyingPaymaster", "1") {
        entryPoint = IEntryPoint(_entryPoint);
        trustedSigner = _trustedSigner;
        gasBudgetCap = _gasBudgetCap;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IPaymaster Implementation
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Validate a UserOp using the signature from paymasterData.
    /// @dev paymasterAndData must encode: validUntil (32) | validAfter (32) | signature (65)
    /// @param userOpHash         Hash of the UserOp.
    /// @param maxFeePerGas       Maximum fee per gas.
    /// @param maxPriorityFeePerGas Maximum priority fee per gas.
    /// @return validationData    0 for success, or packed validation data.
    /// @return context           Context for postOp (abi.encode(userOpHash, estimatedCost)).
    function validatePaymasterUserOp(
        bytes32 userOpHash,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas
    )
        external
        view
        override
        onlyEntryPoint
        returns (uint256 validationData, bytes memory context)
    {
        // Extract validUntil, validAfter, and signature from the calldata
        // The signature is appended after the standard paymaster fields.
        (uint256 validUntil, uint256 validAfter, bytes calldata signature) = _extractPaymasterContext();

        // ── Check validity period ────────────────────────────────────────
        if (validUntil != 0 && block.timestamp > validUntil) {
            return (
                _packValidationData(true, validUntil, validAfter),
                bytes("")
            );
        }
        if (validAfter != 0 && block.timestamp < validAfter) {
            return (
                _packValidationData(true, validUntil, validAfter),
                bytes("")
            );
        }

        // ── Check replay ─────────────────────────────────────────────────
        if (usedSignatures[userOpHash]) {
            revert SignatureUsed();
        }

        // ── Check gas budget cap ─────────────────────────────────────────
        uint256 estimatedCost = maxFeePerGas * 21_000; // base gas estimate
        if (gasBudgetCap > 0 && estimatedCost > gasBudgetCap) {
            revert GasBudgetExceeded();
        }

        // ── Verify EIP-712 signature ─────────────────────────────────────
        bytes32 digest = _hashPaymasterData(userOpHash, validUntil, validAfter, estimatedCost);

        address signer = digest.recover(signature);
        if (signer != trustedSigner) {
            revert InvalidSignature();
        }

        // ── Success: return validation data and context for postOp ───────
        return (0, abi.encode(userOpHash, estimatedCost));
    }

    /// @notice Post-operation callback.
    /// @param mode                PostOpMode (0 = normal, 1 = reverted, 2 = out-of-gas).
    /// @param context             Context from validatePaymasterUserOp.
    /// @param actualGasCost       Actual gas cost in wei.
    /// @param actualUserOpFeePerGas Actual gas price.
    function postOp(
        uint8 mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /* actualUserOpFeePerGas */
    ) external override onlyEntryPoint {
        // Only track sponsorship on successful execution
        if (mode == 0) {
            (bytes32 userOpHash, ) = abi.decode(context, (bytes32, uint256));
            usedSignatures[userOpHash] = true;
            totalSponsored += actualGasCost;
            emit UserOperationSponsored(msg.sender, actualGasCost);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Management
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Change the trusted signer.
    /// @param newSigner New signer address.
    function setTrustedSigner(address newSigner) external onlyTrustedSigner {
        if (newSigner == address(0)) revert("Invalid address");
        emit TrustedSignerChanged(trustedSigner, newSigner);
        trustedSigner = newSigner;
    }

    /// @notice Set the gas budget cap per UserOp.
    /// @param newCap New cap in wei (0 = uncapped).
    function setGasBudgetCap(uint256 newCap) external onlyTrustedSigner {
        emit GasBudgetCapChanged(gasBudgetCap, newCap);
        gasBudgetCap = newCap;
    }

    /// @notice Reset the total sponsored counter.
    function resetBudget() external onlyTrustedSigner {
        emit BudgetReset(totalSponsored);
        totalSponsored = 0;
    }

    /// @notice Deposit funds into the EntryPoint.
    function deposit() external payable {
        entryPoint.depositTo{ value: msg.value }(address(this));
    }

    /// @notice Withdraw funds from the EntryPoint.
    /// @param withdrawAddress Address to withdraw to.
    /// @param amount          Amount to withdraw.
    function withdrawTo(address payable withdrawAddress, uint256 amount) external onlyTrustedSigner {
        entryPoint.withdrawTo(withdrawAddress, amount);
    }

    /// @notice Query the EntryPoint balance of this paymaster.
    function getDeposit() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    receive() external payable {}

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Extract validUntil, validAfter, and signature from calldata.
    /// @dev Reads from the calldata after the paymaster address (bytes 20..).
    ///      Layout: validUntil[32] | validAfter[32] | signature[65]
    function _extractPaymasterContext()
        internal
        pure
        returns (uint256 validUntil, uint256 validAfter, bytes calldata signature)
    {
        // Skip the paymaster address (first 20 bytes of paymasterAndData)
        bytes calldata pmData = msg.data;

        // The paymasterAndData starts after:
        // - selector (4 bytes) + userOp fields — we read from the pm-specific section
        // In practice, the signature is passed as extra data after the entry point
        // validates the call. We parse it from the trailing bytes of calldata.
        //
        // For the actual implementation, the bundler appends signature to paymasterAndData:
        //   paymasterAndData = abi.encodePacked(address(pm), validUntil, validAfter, signature)
        //
        // We read from the end of the calldata: last 65 bytes = signature,
        // preceding 32 bytes = validAfter, preceding 32 bytes = validUntil.

        uint256 len = pmData.length;
        require(len >= 20 + 32 + 32 + SIGNATURE_LENGTH, "paymasterAndData too short");

        validUntil = uint256(bytes32(pmData[len - 32 - 32 - SIGNATURE_LENGTH : len - 32 - SIGNATURE_LENGTH]));
        validAfter = uint256(bytes32(pmData[len - 32 - SIGNATURE_LENGTH : len - SIGNATURE_LENGTH]));
        signature = pmData[len - SIGNATURE_LENGTH : len];
    }

    /// @notice Hash the PaymasterData for EIP-712 signing.
    /// @param userOpHash   The UserOp hash.
    /// @param validUntil   Validity end timestamp.
    /// @param validAfter   Validity start timestamp.
    /// @param maxGasCost   Maximum gas cost the signer authorizes.
    /// @return The EIP-712 typed hash.
    function _hashPaymasterData(
        bytes32 userOpHash,
        uint256 validUntil,
        uint256 validAfter,
        uint256 maxGasCost
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    PAYMASTER_DATA_TYPEHASH,
                    userOpHash,
                    validUntil,
                    validAfter,
                    maxGasCost
                )
            )
        );
    }

    /// @notice Pack validation data per ERC-4337 spec.
    /// @param failed       Whether validation failed.
    /// @param validUntil   Valid-unil timestamp.
    /// @param validAfter   Valid-after timestamp.
    /// @return Packed uint256.
    function _packValidationData(
        bool failed,
        uint256 validUntil,
        uint256 validAfter
    ) internal pure returns (uint256) {
        return uint256(uint160(validAfter)) | (failed ? 1 : 0) | (uint256(validUntil) << 160);
    }
}
