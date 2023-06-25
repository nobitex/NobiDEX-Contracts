pragma solidity ^0.8.10;

contract Governance {
    struct Proposal {
        uint256 id;
        bytes32 description;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public voted;
    uint256 public proposalCount;
    uint256 threshold;

    event ProposalCreated(uint256 indexed id, bytes32 description);
    event Voted(uint256 indexed id, address indexed voter, bool inSupport);
    event ProposalExecuted(uint256 indexed id);

    constructor(uint256 _threshold) {
        threshold = _threshold;
    }

    // Create a new proposal
    function createProposal(bytes32 description) external returns (uint256) {
        uint256 proposalId = proposalCount++;

        proposals[proposalId] = Proposal(proposalId, description, 0, 0, false);
        emit ProposalCreated(proposalId, description);

        return proposalId;
    }

    // Vote on a proposal
    function vote(uint256 proposalId, bool inSupport) external {
        require(proposalId < proposalCount, "ERROR: Invalid proposal ID");
        require(
            !proposals[proposalId].executed,
            "ERROR: Proposal has already been executed"
        );
        require(
            !voted[proposalId][msg.sender],
            "ERROR: Already voted on this proposal"
        );

        Proposal memory proposal = proposals[proposalId];

        if (inSupport) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }

        voted[proposalId][msg.sender] = true;

        emit Voted(proposalId, msg.sender, inSupport);
    }

    // Execute a proposal
    function executeProposal(uint256 proposalId) external {
        require(proposalId < proposalCount, "ERROR: Invalid proposal ID");
        require(
            !proposals[proposalId].executed,
            "ERROR: Proposal has already been executed"
        );
        require(
            proposals[proposalId].forVotes == threshold,
            "ERROR: not approved."
        );

        Proposal memory proposal = proposals[proposalId];

        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }
}
