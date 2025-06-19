// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SepoliaStaking
 * @dev A staking contract with customizable lock periods and reward claiming.
 */
contract SepoliaStaking is ReentrancyGuard, Ownable, Pausable {
    
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lastRewardClaim;
        uint256 lockPeriod;
        bool isActive;
    }

    struct PoolStats {
        uint256 totalStaked;
        uint256 totalStakers;
        uint256 rewardRate;       // wei per ETH per second
        uint256 lockPeriod;
        uint256 minStakeAmount;
    }

    mapping(address => Stake[]) public userStakes;
    mapping(address => uint256) public totalUserStaked;
    mapping(address => uint256) public pendingRewards;

    PoolStats public poolStats;

    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public constant MAX_REWARD_RATE = 31709792000000; // ~100% APY

    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event LockPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event MinStakeAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RewardsDeposited(uint256 amount);
    event ContractPaused();
    event ContractUnpaused();

    constructor() {
        poolStats = PoolStats({
            totalStaked: 0,
            totalStakers: 0,
            rewardRate: 3963610000000, // ~12.5% APY
            lockPeriod: 1 minutes,
            minStakeAmount: 0.01 ether
        });
    }

    receive() external payable {}
    fallback() external payable {}

    // Staking Functions

    function stake() external payable whenNotPaused nonReentrant {
        require(msg.value >= poolStats.minStakeAmount, "Stake below minimum");
        _updatePendingRewards(msg.sender);

        _stake(msg.sender, msg.value, poolStats.lockPeriod);
    }

    function stakeWithLockPeriod(uint256 customLockPeriod) external payable whenNotPaused nonReentrant {
        require(msg.value >= poolStats.minStakeAmount, "Stake below minimum");
        require(customLockPeriod >= poolStats.lockPeriod && customLockPeriod <= 365 days, "Invalid lock period");

        _updatePendingRewards(msg.sender);
        _stake(msg.sender, msg.value, customLockPeriod);
    }

    function _stake(address user, uint256 amount, uint256 lockPeriod) internal {
        userStakes[user].push(Stake({
            amount: amount,
            timestamp: block.timestamp,
            lastRewardClaim: block.timestamp,
            lockPeriod: lockPeriod,
            isActive: true
        }));

        if (totalUserStaked[user] == 0) {
            poolStats.totalStakers++;
        }

        totalUserStaked[user] += amount;
        poolStats.totalStaked += amount;

        emit Staked(user, amount, block.timestamp);
    }

    function unstake(uint256 amount) external whenNotPaused nonReentrant {
        _unstake(msg.sender, amount);
    }

    function unstakeAll() external whenNotPaused nonReentrant {
        uint256 available = getUnstakeableAmount(msg.sender);
        require(available > 0, "Nothing unlocked");
        _unstake(msg.sender, available);
    }

    function _unstake(address user, uint256 amount) internal {
        require(amount > 0 && totalUserStaked[user] >= amount, "Invalid amount");
        _updatePendingRewards(user);

        uint256 remaining = amount;
        Stake[] storage stakes = userStakes[user];

        for (uint256 i = 0; i < stakes.length && remaining > 0; i++) {
            if (!stakes[i].isActive) continue;

            if (block.timestamp < stakes[i].timestamp + stakes[i].lockPeriod) continue;

            uint256 stakeAmount = stakes[i].amount;

            if (stakeAmount <= remaining) {
                remaining -= stakeAmount;
                stakes[i].amount = 0;
                stakes[i].isActive = false;
            } else {
                stakes[i].amount -= remaining;
                remaining = 0;
            }
        }

        require(remaining == 0, "Not enough unlocked");

        totalUserStaked[user] -= amount;
        poolStats.totalStaked -= amount;

        if (totalUserStaked[user] == 0) {
            poolStats.totalStakers--;
        }

        (bool sent, ) = payable(user).call{value: amount}("");
        require(sent, "Unstake transfer failed");

        emit Unstaked(user, amount, block.timestamp);
    }

    function claimRewards() external whenNotPaused nonReentrant {
        _updatePendingRewards(msg.sender);

        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No rewards");

        pendingRewards[msg.sender] = 0;

        Stake[] storage stakes = userStakes[msg.sender];
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].isActive) {
                stakes[i].lastRewardClaim = block.timestamp;
            }
        }

        require(address(this).balance >= reward, "Insufficient contract balance");
        (bool sent, ) = payable(msg.sender).call{value: reward}("");
        require(sent, "Reward transfer failed");

        emit RewardsClaimed(msg.sender, reward, block.timestamp);
    }

    function _updatePendingRewards(address user) internal {
        Stake[] storage stakes = userStakes[user];
        uint256 reward;

        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].isActive) {
                uint256 duration = block.timestamp - stakes[i].lastRewardClaim;
                uint256 stakeReward = (stakes[i].amount * poolStats.rewardRate * duration) / 1e18;
                reward += stakeReward;
                stakes[i].lastRewardClaim = block.timestamp;
            }
        }

        pendingRewards[user] += reward;
    }

    // View Functions

    function getUnstakeableAmount(address user) public view returns (uint256 unstakeable) {
        Stake[] memory stakes = userStakes[user];
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].isActive && block.timestamp >= stakes[i].timestamp + stakes[i].lockPeriod) {
                unstakeable += stakes[i].amount;
            }
        }
    }

    function getUserStakingInfo(address user) external view returns (
        uint256 totalStaked,
        uint256 activeStakes,
        uint256 rewards,
        uint256 nextUnlockTime
    ) {
        Stake[] memory stakes = userStakes[user];
        rewards = pendingRewards[user];
        nextUnlockTime = type(uint256).max;
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].isActive) {
                activeStakes++;
                uint256 duration = block.timestamp - stakes[i].lastRewardClaim;
                rewards += (stakes[i].amount * poolStats.rewardRate * duration) / 1e18;
                uint256 unlock = stakes[i].timestamp + stakes[i].lockPeriod;
                if (unlock < nextUnlockTime) {
                    nextUnlockTime = unlock;
                }
            }
        }
        totalStaked = totalUserStaked[user];
        if (nextUnlockTime == type(uint256).max) {
            nextUnlockTime = 0;
        }
        return (totalStaked, activeStakes, rewards, nextUnlockTime);
    }

    function getUserStakes(address user) external view returns (
        uint256[] memory amounts,
        uint256[] memory timestamps,
        uint256[] memory unlockTimes,
        bool[] memory actives
    ) {
        Stake[] memory stakes = userStakes[user];
        uint256 len = stakes.length;

        amounts = new uint256[](len);
        timestamps = new uint256[](len);
        unlockTimes = new uint256[](len);
        actives = new bool[](len);

        for (uint256 i = 0; i < len; i++) {
            amounts[i] = stakes[i].amount;
            timestamps[i] = stakes[i].timestamp;
            unlockTimes[i] = stakes[i].timestamp + stakes[i].lockPeriod;
            actives[i] = stakes[i].isActive;
        }
    }

    function userStakesInfo(address user) external view returns (
        uint256[] memory amounts,
        uint256[] memory timestamps,
        uint256[] memory unlockTimes,
        bool[] memory actives
    ) {
        Stake[] memory stakes = userStakes[user];
        uint256 len = stakes.length;
        amounts = new uint256[](len);
        timestamps = new uint256[](len);
        unlockTimes = new uint256[](len);
        actives = new bool[](len);
        for (uint256 i = 0; i < len; i++) {
            amounts[i] = stakes[i].amount;
            timestamps[i] = stakes[i].timestamp;
            unlockTimes[i] = stakes[i].timestamp + stakes[i].lockPeriod;
            actives[i] = stakes[i].isActive;
        }
    }

    function getCurrentAPY() external view returns (uint256) {
        return (poolStats.rewardRate * SECONDS_PER_YEAR * 100) / 1e18;
    }

    function calculateEstimatedRewards(uint256 amount, uint256 duration) external view returns (uint256) {
        return (amount * poolStats.rewardRate * duration) / 1e18;
    }

    function getPoolStats() external view returns (
        uint256 totalStaked,
        uint256 totalStakers,
        uint256 rewardRate,
        uint256 lockPeriod,
        uint256 minStakeAmount
    ) {
        return (
            poolStats.totalStaked,
            poolStats.totalStakers,
            poolStats.rewardRate,
            poolStats.lockPeriod,
            poolStats.minStakeAmount
        );
    }

    // Admin Functions

    function updateRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= MAX_REWARD_RATE, "Exceeds max rate");
        uint256 oldRate = poolStats.rewardRate;
        poolStats.rewardRate = newRate;
        emit RewardRateUpdated(oldRate, newRate);
    }

    function updateLockPeriod(uint256 newLockPeriod) external onlyOwner {
        uint256 old = poolStats.lockPeriod;
        poolStats.lockPeriod = newLockPeriod;
        emit LockPeriodUpdated(old, newLockPeriod);
    }

    function updateMinStakeAmount(uint256 newMin) external onlyOwner {
        uint256 old = poolStats.minStakeAmount;
        poolStats.minStakeAmount = newMin;
        emit MinStakeAmountUpdated(old, newMin);
    }

    function depositRewards() external payable onlyOwner {
        require(msg.value > 0, "Zero deposit");
        emit RewardsDeposited(msg.value);
    }

    function pause() external onlyOwner {
        _pause();
        emit ContractPaused();
    }

    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused();
    }

    function emergencyWithdraw() external whenPaused nonReentrant {
        uint256 amount = totalUserStaked[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        totalUserStaked[msg.sender] = 0;
        poolStats.totalStaked -= amount;
        poolStats.totalStakers--;

        Stake[] storage stakes = userStakes[msg.sender];
        for (uint256 i = 0; i < stakes.length; i++) {
            stakes[i].isActive = false;
        }

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdraw failed");

        emit EmergencyWithdraw(msg.sender, amount);
    }
}