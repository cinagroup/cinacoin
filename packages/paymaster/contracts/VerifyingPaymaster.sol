// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./interfaces/IPaymaster.sol";
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
///
///      AA-01 FIX: Updated to ERC-4337 v0.7 interface (PackedUserOperation parameter)
///      GAS-01 FIX: Uses maxCost from EntryPoint instead of hardcoded 21,000
///      SEC-03 FIX: Signature replay marking in validatePaymasterUserOp (not postOp)
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

    address public immutable entryPoint;

    /// @notice The trusted signer address (off-chain approval authority).
    address public trustedSigner;

    /// @notice Per-userOp hash to prevent replay attacks.
    mapping(bytes32 => bool) public usedSignatures;

    /// @notice Gas budget cap per single UserOp (wei-equivalent, 0 = uncapped).
    uint256 public gasBudgetCap;

    /// @notice Total amount sponsored (wei). Resets when owner calls resetBudget.
    uint256 public totalSponsored;

    /// @notice Default gas limit for UserOp estimation (replaces fixed 21,000).
    /// @dev Typical UserOp gas is 100k-300k. Default: 200,000.
    uint256 public defaultUserOpGasLimit = 200_000;

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
    event DefaultGasLimitChanged(uint256 oldLimit, uint256 newLimit);

    modifier onlyEntryPoint() {
        if (msg.sender != entryPoint) revert NotEntryPoint();
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
        entryPoint = _entryPoint;
        trustedSigner = _trustedSigner;
        gasBudgetCap = _gasBudgetCap;
    }

    /// @notice Set the default UserOp gas limit for cost estimation.
    /// @param newLimit New gas limit (typical range: 100,000 - 300,000).
    function setDefaultUserOpGasLimit(uint256 newLimit) external onlyTrustedSigner {
        require(newLimit >= 50_000, "Gas limit too low");
        emit DefaultGasLimitChanged(defaultUserOpGasLimit, newLimit);
        defaultUserOpGasLimit = newLimit;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IPaymaster Implementation (ERC-4337 v0.7)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Validate a UserOp using the signature from paymasterAndData.
    /// @dev AA-01 FIX: Updated to v0.7 interface — receives full PackedUserOperation.
    ///      paymasterAndData layout: paymaster(20) | validUntil(32) | validAfter(32) | signature(65)
    ///      GAS-01 FIX: Uses maxCost from EntryPoint (based on actual gas estimation)
    ///      instead of hardcoded 21,000 base gas.
    ///      SEC-03 FIX: Marks signature as used immediately in this function.
    /// @param userOp             The full PackedUserOperation (v0.7).
    /// @param userOpHash         Hash of the UserOp.
    /// @param maxCost            Maximum cost the EntryPoint will charge.
    /// @return validationData    0 for success, or packed validation data (v0.7 format).
    /// @return context           Context for postOp (abi.encode(userOpHash, maxCost)).
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    )
        external
        override
        onlyEntryPoint
        returns (uint256 validationData, bytes memory context)
    {
        // ── Extract paymasterAndData fields ──────────────────────────────────
        // AA-02 FIX: Parse from userOp.paymasterAndData directly, not msg.data
        (uint256 validUntil, uint256 validAfter, bytes memory signature) = _extractPaymasterData(userOp.paymasterAndData);

        // ── Check validity period ────────────────────────────────────────────
        if (validUntil != 0 && block.timestamp > validUntil) {
            return (
                _packValidationDataV07(true, validUntil, validAfter),
                bytes("")
            );
        }
        if (validAfter != 0 && block.timestamp < validAfter) {
            return (
                _packValidationDataV07(true, validUntil, validAfter),
                bytes("")
            );
        }

        // ── Check replay ─────────────────────────────────────────────────────
        if (usedSignatures[userOpHash]) {
            revert SignatureUsed();
        }

        // ── Check maxCost against gas budget cap ─────────────────────────────
        // GAS-01 FIX: Use maxCost from EntryPoint (based on actual gas estimation)
        // maxCost = (preVerificationGas + callGasLimit + verificationGasLimit) * maxFeePerGas
        // This replaces the old hardcoded: maxFeePerGas * 21_000
        if (gasBudgetCap > 0 && maxCost > gasBudgetCap) {
            revert GasBudgetExceeded();
        }

        // ── Verify EIP-712 signature ─────────────────────────────────────────
        bytes32 digest = _hashPaymasterData(userOpHash, validUntil, validAfter, maxCost);

        address signer = digest.recover(signature);
        if (signer != trustedSigner) {
            revert InvalidSignature();
        }

        // ── SEC-03 FIX: Mark signature as used immediately to prevent replay ──
        // Previously marked in postOp, allowing same signature in multiple UserOps
        // within the same bundle. Now marked here (function is no longer view).
        usedSignatures[userOpHash] = true;

        // ── Success: return validation data and context for postOp ───────────
        return (0, abi.encode(userOpHash, maxCost));
    }

    /// @notice Post-operation callback.
    /// @param mode                PostOpMode (0 = normal, 1 = op reverted, 2 = postOp reverted).
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
        // SEC-03 FIX: Signature replay marking moved to validatePaymasterUserOp
        if (mode == 0) {
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
        // Low-level call to EntryPoint depositTo
        (bool success, ) = entryPoint.call{value: msg.value}(
            abi.encodeWithSignature("depositTo(address)", address(this))
        );
        require(success, "Deposit failed");
    }

    /// @notice Withdraw funds from the EntryPoint.
    /// @param withdrawAddress Address to withdraw to.
    /// @param amount          Amount to withdraw.
    function withdrawTo(address payable withdrawAddress, uint256 amount) external onlyTrustedSigner {
        (bool success, ) = entryPoint.call(
            abi.encodeWithSignature("withdrawTo(address,uint256)", withdrawAddress, amount)
        );
        require(success, "Withdrawal failed");
    }

    /// @notice Query the EntryPoint balance of this paymaster.
    function getDeposit() external view returns (uint256) {
        (bool success, bytes memory data) = entryPoint.staticcall(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );
        require(success && data.length >= 32, "GetDeposit failed");
        return abi.decode(data, (uint256));
    }

    receive() external payable {}

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Extract validUntil, validAfter, and signature from paymasterAndData.
    /// @dev AA-02 FIX: Parse from userOp.paymasterAndData directly instead of msg.data.
    ///      Layout: paymaster(20) | validUntil(32) | validAfter(32) | signature(65)
    /// @param paymasterAndData The paymasterAndData bytes from the UserOperation.
    function _extractPaymasterData(bytes calldata paymasterAndData)
        internal
        pure
        returns (uint256 validUntil, uint256 validAfter, bytes memory signature)
    {
        // Minimum length: paymaster(20) + validUntil(32) + validAfter(32) + signature(65) = 149
        require(paymasterAndData.length >= 20 + 32 + 32 + SIGNATURE_LENGTH, "paymasterAndData too short");

        // Skip paymaster address (first 20 bytes)
        uint256 offset = 20;

        validUntil = uint256(bytes32(paymasterAndData[offset:offset + 32]));
        offset += 32;

        validAfter = uint256(bytes32(paymasterAndData[offset:offset + 32]));
        offset += 32;

        signature = paymasterAndData[offset:offset + SIGNATURE_LENGTH];
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

    /// @notice Pack validation data per ERC-4337 v0.7 spec.
    /// @dev AA-01 FIX: v0.7 format: sigFailed(1) | validUntil(48) | validAfter(48) | aggregator(160)
    ///      Aggregator in high bits, not validAfter in low bits.
    /// @param failed       Whether validation failed (sigFailed bit).
    /// @param validUntil   Valid-until timestamp (48 bits).
    /// @param validAfter   Valid-after timestamp (48 bits).
    /// @return Packed uint256.
    function _packValidationDataV07(
        bool failed,
        uint256 validUntil,
        uint256 validAfter
    ) internal pure returns (uint256) {
        // v0.7 layout: sigFailed(1 bit) | validUntil(48 bits) | validAfter(48 bits) | aggregator(160 bits)
        // aggregator = address(0) for no aggregator
        return (failed ? 1 : 0) | (validUntil << 192) | (validAfter << 144);
    }
}
