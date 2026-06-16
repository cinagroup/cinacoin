// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MultiSig
 * @notice Multi-signature wallet for relayer governance.
 *         Proposals require threshold approvals before execution.
 *         Supports time-locked execution after approval.
 *
 * @dev Each signer gets one vote. Proposals are identified by ID.
 *      Once approved, execution can only happen after timeDelay passes.
 */
contract MultiSig {
    // ── Structs ──────────────────────────────────────────────────────────
    struct Proposal {
        address target;       // Contract to call
        uint256 value;        // ETH to send
        bytes data;           // Function call data
        uint256 proposedAt;   // Timestamp when proposed
        uint256 executedAt;   // Timestamp when executed (0 if not)
        uint256 approvalCount;// Number of approvals
        bool executed;        // Has been executed?
        bool cancelled;       // Has been cancelled?
    }

    // ── State ────────────────────────────────────────────────────────────
    address[] public signers;
    mapping(address => bool) public isSigner;
    uint256 public signerCount;

    uint256 public threshold;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasApproved;
    mapping(uint256 => mapping(address => bool)) public hasRevoked;

    // Time lock: minimum delay before execution after approval
    uint256 public timeDelay = 86400; // 24 hours default

    uint256 public totalExecuted;

    // ── Events ───────────────────────────────────────────────────────────
    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        address target,
        uint256 value,
        bytes data
    );

    event ProposalApproved(uint256 proposalId, address signer);
    event ProposalRevoked(uint256 proposalId, address signer);
    event ProposalExecuted(uint256 proposalId, address executor);
    event ProposalCancelled(uint256 proposalId, address canceller);

    event ThresholdUpdated(uint256 newThreshold);
    event SignerAdded(address signer);
    event SignerRemoved(address signer);
    event TimeDelayUpdated(uint256 newDelay);

    // ── Errors ───────────────────────────────────────────────────────────
    error NotSigner();
    error AlreadySigned();
    error AlreadyRevoked();
    error InvalidThreshold();
    error InvalidTarget();
    error ProposalAlreadyExecuted();
    error ProposalNotApproved();
    error ProposalCancelled();
    error TimeLockNotExpired();
    error NoSignersLeft();
    error CallerNotSigner();
    error OnlySelf(); // Only callable by the contract itself via proposal

    // ── Modifiers ────────────────────────────────────────────────────────
    
    /**
     * @dev Restricts function access to the contract itself (via proposal execution).
     *      Governance functions must go through propose→approve→execute flow.
     */
    modifier onlySelf() {
        if (msg.sender != address(this)) revert OnlySelf();
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────
    /**
     * @param _signers   Initial set of signer addresses.
     * @param _threshold Minimum approvals required for execution.
     */
    constructor(address[] memory _signers, uint256 _threshold) {
        if (_signers.length < _threshold) revert InvalidThreshold();
        if (_threshold == 0) revert InvalidThreshold();

        for (uint256 i = 0; i < _signers.length; i++) {
            if (_signers[i] == address(0)) revert InvalidTarget();
            if (isSigner[_signers[i]]) revert(); // Duplicate

            isSigner[_signers[i]] = true;
            signers.push(_signers[i]);
            signerCount++;
        }

        threshold = _threshold;
    }

    // ── Core Functions ───────────────────────────────────────────────────

    /**
     * @notice Propose a new action for multi-sig approval.
     * @param target Address of the contract to call.
     * @param value  Amount of ETH to send with the call.
     * @param data   Encoded function call data.
     * @return proposalId ID of the newly created proposal.
     */
    function propose(
        address target,
        uint256 value,
        bytes calldata data
    ) external returns (uint256 proposalId) {
        if (!isSigner[msg.sender]) revert NotSigner();
        if (target == address(0)) revert InvalidTarget();

        proposalId = proposalCount;

        proposals[proposalId] = Proposal({
            target: target,
            value: value,
            data: data,
            proposedAt: block.timestamp,
            executedAt: 0,
            approvalCount: 0,
            executed: false,
            cancelled: false
        });

        // Proposer auto-approves their own proposal
        hasApproved[proposalId][msg.sender] = true;
        proposals[proposalId].approvalCount = 1;

        proposalCount++;

        emit ProposalCreated(proposalId, msg.sender, target, value, data);
        emit ProposalApproved(proposalId, msg.sender);
    }

    /**
     * @notice Approve an existing proposal.
     * @param proposalId The ID of the proposal to approve.
     */
    function approve(uint256 proposalId) external {
        if (!isSigner[msg.sender]) revert NotSigner();

        Proposal storage proposal = proposals[proposalId];
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (proposal.cancelled) revert ProposalCancelled();
        if (hasApproved[proposalId][msg.sender]) revert AlreadySigned();
        if (hasRevoked[proposalId][msg.sender]) {
            hasRevoked[proposalId][msg.sender] = false;
        }

        hasApproved[proposalId][msg.sender] = true;
        proposal.approvalCount++;

        emit ProposalApproved(proposalId, msg.sender);
    }

    /**
     * @notice Revoke a previous approval.
     * @param proposalId The ID of the proposal to revoke approval for.
     */
    function revoke(uint256 proposalId) external {
        if (!isSigner[msg.sender]) revert NotSigner();

        Proposal storage proposal = proposals[proposalId];
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (proposal.cancelled) revert ProposalCancelled();
        if (!hasApproved[proposalId][msg.sender]) revert();
        if (hasRevoked[proposalId][msg.sender]) revert AlreadyRevoked();

        hasApproved[proposalId][msg.sender] = false;
        hasRevoked[proposalId][msg.sender] = true;
        proposal.approvalCount--;

        emit ProposalRevoked(proposalId, msg.sender);
    }

    /**
     * @notice Execute an approved proposal.
     *         Can only execute if:
     *         - Threshold is met
     *         - timeDelay has passed since creation
     *         - Not already executed
     * @param proposalId The ID of the proposal to execute.
     */
    function execute(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (proposal.cancelled) revert ProposalCancelled();
        if (proposal.approvalCount < threshold) revert ProposalNotApproved();

        // Check time delay
        if (block.timestamp < proposal.proposedAt + timeDelay) revert TimeLockNotExpired();

        proposal.executed = true;
        proposal.executedAt = block.timestamp;

        (bool success, ) = proposal.target.call{value: proposal.value}(proposal.data);
        if (!success) {
            // Revert execution but keep proposal marked as attempted
            proposal.executed = false;
            proposal.executedAt = 0;
            revert("Execution failed");
        }

        totalExecuted++;

        emit ProposalExecuted(proposalId, msg.sender);
    }

    /**
     * @notice Cancel a pending proposal.
     *         Any signer can cancel.
     * @param proposalId The ID of the proposal to cancel.
     */
    function cancelProposal(uint256 proposalId) external {
        if (!isSigner[msg.sender]) revert CallerNotSigner();

        Proposal storage proposal = proposals[proposalId];
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (proposal.cancelled) revert ProposalCancelled();

        proposal.cancelled = true;

        emit ProposalCancelled(proposalId, msg.sender);
    }

    // ── Governance Functions ─────────────────────────────────────────────

    /**
     * @notice Add a new signer. SECURITY: Must be called via proposal (onlySelf).
     * @param signer Address to add as signer.
     */
    function addSigner(address signer) external onlySelf {
        if (isSigner[signer]) revert();
        if (signer == address(0)) revert InvalidTarget();

        isSigner[signer] = true;
        signers.push(signer);
        signerCount++;

        emit SignerAdded(signer);
    }

    /**
     * @notice Remove a signer. SECURITY: Must be called via proposal (onlySelf).
     * @param signer Address to remove.
     */
    function removeSigner(address signer) external onlySelf {
        if (!isSigner[signer]) revert();
        if (signerCount - 1 < threshold) revert NoSignersLeft();

        isSigner[signer] = false;
        signerCount--;

        // Clean up from array
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }

        emit SignerRemoved(signer);
    }

    /**
     * @notice Update the approval threshold. SECURITY: Must be called via proposal (onlySelf).
     * @param newThreshold New minimum approvals required.
     */
    function updateThreshold(uint256 newThreshold) external onlySelf {
        if (newThreshold == 0 || newThreshold > signerCount) revert InvalidThreshold();

        threshold = newThreshold;
        emit ThresholdUpdated(newThreshold);
    }

    /**
     * @notice Update the time lock delay. SECURITY: Must be called via proposal (onlySelf).
     * @param newDelay New delay in seconds before execution.
     */
    function updateTimeDelay(uint256 newDelay) external onlySelf {
        timeDelay = newDelay;
        emit TimeDelayUpdated(newDelay);
    }

    // ── View Functions ───────────────────────────────────────────────────

    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address target,
            uint256 value,
            bytes memory data,
            uint256 proposedAt,
            uint256 executedAt,
            uint256 approvalCount,
            bool executed,
            bool cancelled
        )
    {
        Proposal storage p = proposals[proposalId];
        return (
            p.target,
            p.value,
            p.data,
            p.proposedAt,
            p.executedAt,
            p.approvalCount,
            p.executed,
            p.cancelled
        );
    }

    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    /**
     * @notice Check if a signer has approved a proposal.
     */
    function getApprovalStatus(uint256 proposalId, address signer)
        external
        view
        returns (bool approved, bool revoked)
    {
        return (hasApproved[proposalId][signer], hasRevoked[proposalId][signer]);
    }

    // ── Receive ETH ──────────────────────────────────────────────────────
    receive() external payable {}
}
