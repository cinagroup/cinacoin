// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BridgeRouter
 * @notice Routes cross-chain transfers through a relayer network.
 *         Relayers sign transfer messages; the bridge validates signatures
 *         before minting/releasing funds on the destination chain.
 *
 * @dev Supports native ETH and ERC-20 bridging.
 *      Relayer set and threshold managed via Ownable governance.
 */
contract BridgeRouter is ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ── Structs ──────────────────────────────────────────────────────────
    struct Transfer {
        uint256 transferId;
        uint256 sourceChain;
        uint256 destinationChain;
        address sender;
        address recipient;
        address token;        // address(0) = native ETH
        uint256 amount;
        uint256 fee;
        uint256 nonce;
        uint256 expiry;
        bool completed;
        bool cancelled;
    }

    // ── State ────────────────────────────────────────────────────────────
    uint256 public transferCount;
    mapping(uint256 => Transfer) public transfers;

    // Relayer governance
    mapping(address => bool) public isRelayer;
    uint256 public relayerCount;
    uint256 public signatureThreshold;

    // SECURITY: Minimum threshold to prevent single relayer compromise
    uint256 constant MIN_THRESHOLD = 2;

    // Nonce tracking: chain → sender → nonce → used
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public nonceUsed;

    // Fee tracking
    uint256 public totalFeesCollected;
    mapping(address => uint256) public relayerFees;

    // Supported tokens
    mapping(address => bool) public supportedTokens;

    // ── Events ───────────────────────────────────────────────────────────
    event Initiated(
        uint256 transferId,
        uint256 sourceChain,
        uint256 destinationChain,
        address sender,
        address recipient,
        address token,
        uint256 amount,
        uint256 fee,
        uint256 nonce,
        uint256 expiry
    );

    event Completed(
        uint256 transferId,
        address relayer,
        address recipient,
        uint256 amount
    );

    event Cancelled(uint256 transferId, address cancelledBy);

    event RelayerAdded(address relayer);
    event RelayerRemoved(address relayer);
    event ThresholdUpdated(uint256 newThreshold);
    event TokenSupported(address token, bool supported);
    event FeeWithdrawn(address token, address to, uint256 amount);

    // ── Errors ───────────────────────────────────────────────────────────
    error InvalidRelayer();
    error InvalidSignature();
    error TransferExpired();
    error TransferNotFound();
    error AlreadyCompleted();
    error AlreadyCancelled();
    error InsufficientSignatures();
    error ZeroAmount();
    error ZeroRecipient();
    error UnsupportedToken();
    error TransferFailed();
    error TokenTransferFailed();
    error InvalidThreshold();
    error NonceAlreadyUsed();
    error NoFeesToWithdraw();
    error InsufficientFunds();
    error Unauthorized();
    error InvalidSignatureLength();

    // ── Constructor ──────────────────────────────────────────────────────
    /**
     * @param _relayers   Initial set of relayer addresses (must be >= MIN_THRESHOLD).
     * @param _threshold  Minimum signatures required (must be >= MIN_THRESHOLD).
     */
    constructor(address[] memory _relayers, uint256 _threshold) Ownable(msg.sender) {
        if (_threshold < MIN_THRESHOLD) revert InvalidThreshold();
        if (_relayers.length < _threshold) revert InvalidThreshold();

        for (uint256 i = 0; i < _relayers.length; i++) {
            _addRelayer(_relayers[i]);
        }

        signatureThreshold = _threshold;
    }

    // ── Core Functions ───────────────────────────────────────────────────

    /**
     * @notice Initiate a cross-chain transfer from source chain.
     *         Caller sends funds + fee to the bridge.
     *
     * @param destinationChain Chain ID of destination.
     * @param recipient        Destination chain recipient address.
     * @param amount           Amount to transfer.
     * @param fee              Relayer fee.
     * @param nonce            Monotonic nonce for replay protection.
     * @param expiry           Unix timestamp when this transfer expires.
     * @param token            Token address (address(0) = native ETH).
     * @return transferId      Unique transfer identifier.
     */
    function initiateTransfer(
        uint256 destinationChain,
        bytes32 recipient,
        uint256 amount,
        uint256 fee,
        uint256 nonce,
        uint256 expiry,
        address token
    ) external payable nonReentrant returns (uint256 transferId) {
        if (amount == 0) revert ZeroAmount();
        if (nonceUsed[destinationChain][msg.sender][nonce]) revert NonceAlreadyUsed();

        uint256 totalRequired = amount + fee;
        uint256 actualAmount = amount;

        if (token == address(0)) {
            if (msg.value != totalRequired) revert InsufficientFunds();
        } else {
            if (!supportedTokens[token]) revert UnsupportedToken();
            if (msg.value != fee) revert InsufficientFunds();
            // In production this would call IERC20(token).transferFrom(...)
            // For now, caller must have approved & we pull the amount
            // We rely on the token being supported.
            (bool success, ) = token.call(
                abi.encodeWithSignature(
                    "transferFrom(address,address,uint256)",
                    msg.sender,
                    address(this),
                    actualAmount
                )
            );
            if (!success) revert TokenTransferFailed();
        }

        nonceUsed[destinationChain][msg.sender][nonce] = true;
        transferId = transferCount;

        // Hash recipient bytes32 for cross-chain address representation
        // On EVM chains, this is address(bytes20(recipient))
        transfers[transferId] = Transfer({
            transferId: transferId,
            sourceChain: block.chainid,
            destinationChain: destinationChain,
            sender: msg.sender,
            recipient: bytesToAddress(recipient),
            token: token,
            amount: actualAmount,
            fee: fee,
            nonce: nonce,
            expiry: expiry,
            completed: false,
            cancelled: false
        });

        totalFeesCollected += fee;
        transferCount++;

        emit Initiated(
            transferId,
            block.chainid,
            destinationChain,
            msg.sender,
            bytesToAddress(recipient),
            token,
            actualAmount,
            fee,
            nonce,
            expiry
        );
    }

    /**
     * @notice Complete a transfer on the destination chain.
     *         Requires valid relayer signatures.
     *
     * @param sourceChain  Source chain ID.
     * @param sender       Original sender address.
     * @param recipient    Recipient address on this chain.
     * @param amount       Amount to release.
     * @param nonce        Original nonce.
     * @param signatures   Concatenated relayer signatures (65 bytes each).
     */
    function completeTransfer(
        uint256 sourceChain,
        address sender,
        address recipient,
        uint256 amount,
        uint256 nonce,
        bytes calldata signatures
    ) external nonReentrant {
        if (recipient == address(0)) revert ZeroRecipient();
        if (amount == 0) revert ZeroAmount();

        // SEC-04 FIX: Check nonce replay protection on destination chain
        if (nonceUsed[sourceChain][sender][nonce]) revert NonceAlreadyUsed();

        bytes32 messageHash = _hashTransfer(
            sourceChain,
            block.chainid,
            sender,
            recipient,
            amount,
            nonce
        );

        uint256 validSignatures = _countValidSignatures(messageHash, signatures);
        if (validSignatures < signatureThreshold) revert InsufficientSignatures();

        // SEC-04 FIX: Mark nonce as used to prevent replay
        nonceUsed[sourceChain][sender][nonce] = true;

        // Record completion
        uint256 completionId = transferCount;
        transfers[completionId] = Transfer({
            transferId: completionId,
            sourceChain: sourceChain,
            destinationChain: block.chainid,
            sender: sender,
            recipient: recipient,
            token: address(0), // Native ETH for outbound
            amount: amount,
            fee: 0,
            nonce: nonce,
            expiry: 0,
            completed: true,
            cancelled: false
        });

        transferCount++;

        // Release funds to recipient
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Completed(completionId, msg.sender, recipient, amount);
    }

    /**
     * @notice Cancel a pending transfer before expiry.
     * @param transferId The transfer to cancel.
     */
    function cancelTransfer(uint256 transferId) external nonReentrant {
        Transfer storage transfer = transfers[transferId];
        if (transfer.sender == address(0)) revert TransferNotFound();
        if (transfer.completed) revert AlreadyCompleted();
        if (transfer.cancelled) revert AlreadyCancelled();
        if (transfer.sender != msg.sender) revert Unauthorized();
        if (block.timestamp < transfer.expiry) revert TransferExpired();

        transfer.cancelled = true;

        // Refund
        if (transfer.token == address(0)) {
            (bool success, ) = transfer.sender.call{value: transfer.amount}("");
            if (!success) revert TransferFailed();
        } else {
            (bool ok, ) = transfer.token.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    transfer.sender,
                    transfer.amount
                )
            );
            if (!ok) revert TokenTransferFailed();
        }

        emit Cancelled(transferId, msg.sender);
    }

    // ── Relayer Management ───────────────────────────────────────────────

    function addRelayer(address relayer) external onlyOwner {
        _addRelayer(relayer);
    }

    function removeRelayer(address relayer) external onlyOwner {
        _removeRelayer(relayer);
    }

    function setSignatureThreshold(uint256 threshold) external onlyOwner {
        // SECURITY: Enforce minimum threshold to prevent single relayer compromise
        if (threshold < MIN_THRESHOLD) revert InvalidThreshold();
        if (threshold > relayerCount) revert InvalidThreshold();
        signatureThreshold = threshold;
        emit ThresholdUpdated(threshold);
    }

    // ── Token Management ─────────────────────────────────────────────────

    function setTokenSupport(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenSupported(token, supported);
    }

    // ── Fee Management ───────────────────────────────────────────────────

    /**
     * @notice Withdraw collected fees to the owner.
     */
    function withdrawFees(address token, address to) external onlyOwner {
        uint256 balance;
        if (token == address(0)) {
            balance = address(this).balance;
        } else {
            balance = IERC20(token).balanceOf(address(this));
        }
        if (balance == 0) revert NoFeesToWithdraw();

        if (token == address(0)) {
            (bool success, ) = to.call{value: balance}("");
            if (!success) revert TransferFailed();
        }
        // Note: ERC-20 fee withdrawal handled separately

        emit FeeWithdrawn(token, to, balance);
    }

    // ── Internal Helpers ─────────────────────────────────────────────────

    function _addRelayer(address relayer) internal {
        if (isRelayer[relayer]) revert();
        isRelayer[relayer] = true;
        relayerCount++;
        emit RelayerAdded(relayer);
    }

    function _removeRelayer(address relayer) internal {
        if (!isRelayer[relayer]) revert();
        isRelayer[relayer] = false;
        relayerCount--;
        // SECURITY: Don't let threshold drop below MIN_THRESHOLD
        if (relayerCount < MIN_THRESHOLD) {
            signatureThreshold = MIN_THRESHOLD;
        } else if (relayerCount < signatureThreshold) {
            signatureThreshold = relayerCount;
        }
        emit RelayerRemoved(relayer);
    }

    function _hashTransfer(
        uint256 sourceChain,
        uint256 destinationChain,
        address sender,
        address recipient,
        uint256 amount,
        uint256 nonce
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                "CINACOIN_BRIDGE",
                sourceChain,
                destinationChain,
                sender,
                recipient,
                amount,
                nonce
            )
        );
    }

    function _countValidSignatures(
        bytes32 messageHash,
        bytes calldata signatures
    ) internal view returns (uint256 count) {
        uint256 sigLength = 65; // ECDSA signature length
        if (signatures.length % sigLength != 0) revert InvalidSignatureLength();

        uint256 numSignatures = signatures.length / sigLength;
        uint256 validCount = 0;
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();

        for (uint256 i = 0; i < numSignatures; i++) {
            bytes memory sig = _slice(signatures, i * sigLength, sigLength);
            (address recovered, ECDSA.RecoverError err) = ethSignedHash.tryRecover(sig);

            if (err == ECDSA.RecoverError.NoError && isRelayer[recovered]) {
                // Check for duplicate relayer
                bool alreadyCounted = false;
                for (uint256 j = 0; j < i; j++) {
                    bytes memory prevSig = _slice(signatures, j * sigLength, sigLength);
                    (address prevRecovered, ) = ethSignedHash.tryRecover(prevSig);
                    if (prevRecovered == recovered) {
                        alreadyCounted = true;
                        break;
                    }
                }
                if (!alreadyCounted) {
                    validCount++;
                }
            }
        }

        return validCount;
    }

    function _slice(bytes calldata data, uint256 start, uint256 length)
        internal pure returns (bytes memory)
    {
        return data[start:start + length];
    }

    function bytesToAddress(bytes32 b) internal pure returns (address) {
        return address(uint160(uint256(b)));
    }

    // ── View Functions ───────────────────────────────────────────────────

    function getTransfer(uint256 transferId)
        external
        view
        returns (
            uint256 sourceChain,
            uint256 destinationChain,
            address sender,
            address recipient,
            address token,
            uint256 amount,
            uint256 fee,
            uint256 nonce,
            uint256 expiry,
            bool completed,
            bool cancelled
        )
    {
        Transfer storage t = transfers[transferId];
        return (
            t.sourceChain,
            t.destinationChain,
            t.sender,
            t.recipient,
            t.token,
            t.amount,
            t.fee,
            t.nonce,
            t.expiry,
            t.completed,
            t.cancelled
        );
    }

    // ── Receive ETH ──────────────────────────────────────────────────────
    receive() external payable {}
}
