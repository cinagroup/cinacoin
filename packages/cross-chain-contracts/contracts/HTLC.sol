// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HTLC
 * @notice Hashed TimeLock Contract for cross-chain atomic swaps.
 *         Supports both ERC-20 tokens and native ETH.
 *
 * @dev Workflow:
 *   1. Alice calls `create()` to lock funds with a hashlock & timelock.
 *   2. Bob learns the preimage secret and calls `claim()`.
 *   3. If timelock expires without a claim, Alice calls `refund()`.
 */
contract HTLC is ReentrancyGuard, Ownable {

    using SafeERC20 for IERC20;

    // ── Structs ──────────────────────────────────────────────────────────
    struct Lock {
        address sender;       // party who locked funds
        address recipient;    // party who can claim with secret
        address token;        // ERC-20 address (address(0) = native ETH)
        uint256 amount;       // locked amount
        bytes32 hashlock;     // keccak256(secret)
        uint256 timelock;     // unix timestamp when refund becomes possible
        bool claimed;         // has been claimed?
    }

    // ── State ────────────────────────────────────────────────────────────
    uint256 public lockCount;
    mapping(uint256 => Lock) public locks;
    // Track exposed secrets to prevent reuse across chains
    mapping(bytes32 => bool) public revealedSecrets;

    // ── Events ───────────────────────────────────────────────────────────
    event Locked(
        uint256 lockId,
        address sender,
        address recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    );

    event Claimed(uint256 lockId, bytes32 secret, address claimant);

    event Refunded(uint256 lockId, address refunder);

    // ── Errors ───────────────────────────────────────────────────────────
    error ZeroAmount();
    error ZeroRecipient();
    error ZeroHashlock();
    error TimelockNotExpired();
    error AlreadyClaimed();
    error AlreadyRefunded();
    error InvalidSecret();
    error InsufficientFunds();
    error TransferFailed();
    error TokenTransferFailed();
    error LockDoesNotExist();
    error SecretAlreadyRevealed();
    error Unauthorized();

    // ── Constructor ──────────────────────────────────────────────────────
    constructor() Ownable(msg.sender) {
        lockCount = 0;
    }

    // ── Core Functions ───────────────────────────────────────────────────

    /**
     * @notice Create a new HTLC lock.
     * @param recipient Address that can claim funds with the secret.
     * @param hashlock  keccak256(secret) — the hash of the preimage.
     * @param timelock  Unix timestamp after which a refund is allowed.
     * @param token     ERC-20 token address (address(0) for native ETH).
     * @param amount    Amount to lock.
     * @return lockId   Unique identifier for this lock.
     */
    function create(
        address recipient,
        bytes32 hashlock,
        uint256 timelock,
        address token,
        uint256 amount
    ) external payable nonReentrant returns (uint256 lockId) {
        if (recipient == address(0)) revert ZeroRecipient();
        if (hashlock == bytes32(0)) revert ZeroHashlock();
        if (amount == 0) revert ZeroAmount();
        if (timelock <= block.timestamp) revert InsufficientFunds();

        lockId = lockCount;

        if (token == address(0)) {
            // Native ETH lock
            if (msg.value != amount) revert InsufficientFunds();
        } else {
            if (msg.value != 0) revert InsufficientFunds();
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        locks[lockId] = Lock({
            sender: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            hashlock: hashlock,
            timelock: timelock,
            claimed: false
        });

        lockCount++;

        emit Locked(
            lockId,
            msg.sender,
            recipient,
            token,
            amount,
            hashlock,
            timelock
        );
    }

    /**
     * @notice Claim locked funds by revealing the preimage secret.
     * @param lockId The ID of the lock to claim.
     * @param secret The preimage such that keccak256(secret) == hashlock.
     */
    function claim(uint256 lockId, bytes32 secret)
        external
        nonReentrant
    {
        Lock storage lock = locks[lockId];

        if (lock.recipient == address(0)) revert LockDoesNotExist();
        if (lock.claimed) revert AlreadyClaimed();
        if (keccak256(abi.encodePacked(secret)) != lock.hashlock) revert InvalidSecret();
        if (revealedSecrets[lock.hashlock]) revert SecretAlreadyRevealed();

        lock.claimed = true;
        revealedSecrets[lock.hashlock] = true;

        _transferFunds(lock.token, msg.sender, lock.amount);

        emit Claimed(lockId, secret, msg.sender);
    }

    /**
     * @notice Refund locked funds after the timelock has expired.
     *         Only the original sender can refund.
     * @param lockId The ID of the lock to refund.
     */
    function refund(uint256 lockId) external nonReentrant {
        Lock storage lock = locks[lockId];

        if (lock.sender == address(0)) revert LockDoesNotExist();
        if (lock.claimed) revert AlreadyClaimed();
        if (msg.sender != lock.sender) revert Unauthorized();
        if (block.timestamp < lock.timelock) revert TimelockNotExpired();

        lock.claimed = true; // Mark as resolved to prevent double-refund

        _transferFunds(lock.token, lock.sender, lock.amount);

        emit Refunded(lockId, lock.sender);
    }

    // ── Internal Helpers ─────────────────────────────────────────────────

    function _transferFunds(
        address token,
        address to,
        uint256 amount
    ) internal {
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            bool ok = IERC20(token).transfer(to, amount);
            if (!ok) revert TokenTransferFailed();
        }
    }

    // ── View Functions ───────────────────────────────────────────────────

    /**
     * @notice Get lock details by ID.
     */
    function getLock(uint256 lockId)
        external
        view
        returns (
            address sender,
            address recipient,
            address token,
            uint256 amount,
            bytes32 hashlock,
            uint256 timelock,
            bool claimed
        )
    {
        Lock storage lock = locks[lockId];
        return (
            lock.sender,
            lock.recipient,
            lock.token,
            lock.amount,
            lock.hashlock,
            lock.timelock,
            lock.claimed
        );
    }

    /**
     * @notice Check if a hashlock has been revealed (secret exposed).
     */
    function isSecretRevealed(bytes32 hashlock) external view returns (bool) {
        return revealedSecrets[hashlock];
    }

    /**
     * @notice Calculate remaining time until refund is possible.
     */
    function getRefundTimeLeft(uint256 lockId) external view returns (int256) {
        Lock storage lock = locks[lockId];
        if (lock.sender == address(0)) revert LockDoesNotExist();
        return int256(lock.timelock) - int256(block.timestamp);
    }

    /**
     * @notice Withdraw stuck native ETH (emergency, only owner).
     *         Safety valve for recovering funds sent outside the normal HTLC flow.
     *         Only the contract owner can call this function.
     */
    function emergencyWithdraw() external onlyOwner {
        if (address(this).balance > 0) {
            (bool success, ) = msg.sender.call{value: address(this).balance}("");
            if (!success) revert TransferFailed();
        }
    }

    // ── Receive ETH ──────────────────────────────────────────────────────
    receive() external payable {}
}
