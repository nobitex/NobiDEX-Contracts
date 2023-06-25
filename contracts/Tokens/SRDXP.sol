// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract stdxp {
    // Struct to represent a stake
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lastRewardTimestamp;
        uint256 totalRewards;
        bool isActive;
    }

    // Variables
    address public owner;
    mapping(address => Stake) public stakes;
    mapping(address => uint256) public rewards;
    uint256 public totalStaked;
    uint256 public totalRewards;

    // Events
    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event RewardsCalculated(address indexed account, uint256 rewards);
    event RewardsClaimed(address indexed account, uint256 rewards);

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    // Functions
    function stake(uint256 amount) external {
        //add a increase staked assets function
        require(amount > 0, "Amount must be greater than zero.");
        require(
            !stakes[msg.sender].isActive,
            "You already have an active stake."
        );

        stakes[msg.sender] = Stake(
            amount,
            block.timestamp,
            block.timestamp,
            0,
            true
        );
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake() external {
        require(stakes[msg.sender].isActive, "ERROR: 0You don't have an active stake.");

        Stake memory _stake = stakes[msg.sender];
        uint256 reward = calculateReward(msg.sender);

        if (reward > 0) {
            rewards[msg.sender] += reward;
            _stake.totalRewards += reward;
            totalRewards += reward;

            emit RewardsCalculated(msg.sender, reward);
        }

        totalStaked -= _stake.amount;
        _stake.isActive = false;

        emit Unstaked(msg.sender, _stake.amount);
    }

    function calculateReward(address account) public view returns (uint256) {
        Stake memory _stake = stakes[account];
        require(_stake.isActive, "ERROR: INVALID INPUT.");
        //REWARD CALCULATION
        uint reward = 0;
        return reward;
    }

    function claimRewards() external {
        require(rewards[msg.sender] > 0, "ERROR: No rewards available to claim.");

        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        // transfer reward tokens
        emit RewardsClaimed(msg.sender, reward);
    }

    function calculateRewardForTime(
        uint256 time
    ) public view returns (uint256) {
        // reward calculations
        uint rewardPerSecond = 0;
        return rewardPerSecond * time;
    }

    // Owner functions for governance and voting
    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address.");
        owner = newOwner;
    }

}
