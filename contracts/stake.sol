// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;


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
        uint256 lockPeriodId;  // New field to track which lock period option was used
        bool isActive;
    }

    struct PoolStats {
        uint256 totalStaked;
        uint256 totalStakers;
        uint256 baseRewardRate;       // base wei per ETH per second
        uint256 lockPeriod;           // deprecated, kept for compatibility
        uint256 minStakeAmount;
    }

    // New struct for lock period options
    struct LockPeriodOption {
        uint256 duration;        // in seconds
        uint256 rewardMultiplier; // multiplier in basis points (10000 = 100%)
        string name;             // display name for frontend
        bool isActive;           // whether this option is available
    }

    mapping(address => Stake[]) public userStakes;
    mapping(address => uint256) public totalUserStaked;
    mapping(address => uint256) public pendingRewards;
    mapping(uint256 => LockPeriodOption) public lockPeriodOptions;

    PoolStats public poolStats;
    uint256 public nextLockPeriodId;

    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public constant MAX_REWARD_RATE = 31709792000; // ~100% APY
    uint256 public constant BASIS_POINTS = 10000; // 100%

    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp, uint256 lockPeriodId);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event LockPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event MinStakeAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RewardsDeposited(uint256 amount);
    event ContractPaused();
    event ContractUnpaused();
    event LockPeriodOptionAdded(uint256 indexed lockPeriodId, uint256 duration, uint256 multiplier, string name);
    event LockPeriodOptionUpdated(uint256 indexed lockPeriodId, uint256 duration, uint256 multiplier, string name);
    event LockPeriodOptionToggled(uint256 indexed lockPeriodId, bool isActive);

   constructor() {
        poolStats = PoolStats({
            totalStaked: 0,
            totalStakers: 0,
            baseRewardRate: 3963605431, // ~12.5% APY base rate
            lockPeriod: 7 days, // deprecated but kept for compatibility
            minStakeAmount: 0.01 ether
        });

        // Initialize lock period options for your specific requirements
        _addLockPeriodOption(7 days, 10000, "7 Days");      // 100% base rate = 12.5% APY
        _addLockPeriodOption(30 days, 12000, "30 Days");    // 120% base rate = 15% APY
        _addLockPeriodOption(60 days, 14000, "60 Days");    // 140% base rate = 17.5% APY
        _addLockPeriodOption(120 days, 16000, "120 Days");  // 160% base rate = 20% APY
    }

    receive() external payable {}
    fallback() external payable {}

    // Internal function to add lock period options
    function _addLockPeriodOption(uint256 duration, uint256 multiplier, string memory name) internal {
        lockPeriodOptions[nextLockPeriodId] = LockPeriodOption({
            duration: duration,
            rewardMultiplier: multiplier,
            name: name,
            isActive: true
        });
        emit LockPeriodOptionAdded(nextLockPeriodId, duration, multiplier, name);
        nextLockPeriodId++;
    }

    // Staking Functions

    function stake() external payable whenNotPaused nonReentrant {
        require(msg.value >= poolStats.minStakeAmount, "Stake below minimum");
        _updatePendingRewards(msg.sender);

        // Use the first available lock period option (shortest duration)
        uint256 defaultLockPeriodId = 0;
        require(lockPeriodOptions[defaultLockPeriodId].isActive, "Default lock period not available");
        
        _stake(msg.sender, msg.value, defaultLockPeriodId);
    }

    function stakeWithLockPeriod(uint256 lockPeriodId) external payable whenNotPaused nonReentrant {
        require(msg.value >= poolStats.minStakeAmount, "Stake below minimum");
        require(lockPeriodOptions[lockPeriodId].isActive, "Lock period not available");
        require(lockPeriodOptions[lockPeriodId].duration > 0, "Invalid lock period");

        _updatePendingRewards(msg.sender);
        _stake(msg.sender, msg.value, lockPeriodId);
    }

    function stakeWithCustomLockPeriod(uint256 customLockPeriod) external payable whenNotPaused nonReentrant {
        require(msg.value >= poolStats.minStakeAmount, "Stake below minimum");
        require(customLockPeriod >= 1 minutes && customLockPeriod <= 365 days, "Invalid lock period");

        _updatePendingRewards(msg.sender);
        
        // For custom lock periods, use base reward rate (no multiplier)
        _stakeCustom(msg.sender, msg.value, customLockPeriod);
    }

    function _stake(address user, uint256 amount, uint256 lockPeriodId) internal {
        LockPeriodOption memory option = lockPeriodOptions[lockPeriodId];
        
        userStakes[user].push(Stake({
            amount: amount,
            timestamp: block.timestamp,
            lastRewardClaim: block.timestamp,
            lockPeriod: option.duration,
            lockPeriodId: lockPeriodId,
            isActive: true
        }));

        if (totalUserStaked[user] == 0) {
            poolStats.totalStakers++;
        }

        totalUserStaked[user] += amount;
        poolStats.totalStaked += amount;

        emit Staked(user, amount, block.timestamp, lockPeriodId);
    }

    function _stakeCustom(address user, uint256 amount, uint256 customLockPeriod) internal {
        userStakes[user].push(Stake({
            amount: amount,
            timestamp: block.timestamp,
            lastRewardClaim: block.timestamp,
            lockPeriod: customLockPeriod,
            lockPeriodId: type(uint256).max, // Special ID for custom lock periods
            isActive: true
        }));

        if (totalUserStaked[user] == 0) {
            poolStats.totalStakers++;
        }

        totalUserStaked[user] += amount;
        poolStats.totalStaked += amount;

        emit Staked(user, amount, block.timestamp, type(uint256).max);
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
                uint256 effectiveRate = _getEffectiveRewardRate(stakes[i].lockPeriodId);
                uint256 stakeReward = (stakes[i].amount * effectiveRate * duration) / 1e18;
                reward += stakeReward;
                stakes[i].lastRewardClaim = block.timestamp;
            }
        }

        pendingRewards[user] += reward;
    }

    function _getEffectiveRewardRate(uint256 lockPeriodId) internal view returns (uint256) {
        if (lockPeriodId == type(uint256).max) {
            // Custom lock period uses base rate
            return poolStats.baseRewardRate;
        }
        
        LockPeriodOption memory option = lockPeriodOptions[lockPeriodId];
        return (poolStats.baseRewardRate * option.rewardMultiplier) / BASIS_POINTS;
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
                uint256 effectiveRate = _getEffectiveRewardRate(stakes[i].lockPeriodId);
                rewards += (stakes[i].amount * effectiveRate * duration) / 1e18;
                
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
        uint256[] memory lockPeriodIds,
        bool[] memory actives
    ) {
        Stake[] memory stakes = userStakes[user];
        uint256 len = stakes.length;

        amounts = new uint256[](len);
        timestamps = new uint256[](len);
        unlockTimes = new uint256[](len);
        lockPeriodIds = new uint256[](len);
        actives = new bool[](len);

        for (uint256 i = 0; i < len; i++) {
            amounts[i] = stakes[i].amount;
            timestamps[i] = stakes[i].timestamp;
            unlockTimes[i] = stakes[i].timestamp + stakes[i].lockPeriod;
            lockPeriodIds[i] = stakes[i].lockPeriodId;
            actives[i] = stakes[i].isActive;
        }
    }

    function getCurrentAPY(uint256 lockPeriodId) external view returns (uint256) {
        uint256 effectiveRate = _getEffectiveRewardRate(lockPeriodId);
        return (effectiveRate * SECONDS_PER_YEAR * 100) / 1e18;
    }

    function calculateEstimatedRewards(uint256 amount, uint256 duration, uint256 lockPeriodId) external view returns (uint256) {
        uint256 effectiveRate = _getEffectiveRewardRate(lockPeriodId);
        return (amount * effectiveRate * duration) / 1e18;
    }

    function getPoolStats() external view returns (
        uint256 totalStaked,
        uint256 totalStakers,
        uint256 baseRewardRate,
        uint256 lockPeriod,
        uint256 minStakeAmount
    ) {
        return (
            poolStats.totalStaked,
            poolStats.totalStakers,
            poolStats.baseRewardRate,
            poolStats.lockPeriod,
            poolStats.minStakeAmount
        );
    }

    // New view functions for lock period options
    function getLockPeriodOption(uint256 lockPeriodId) external view returns (
        uint256 duration,
        uint256 rewardMultiplier,
        string memory name,
        bool isActive
    ) {
        LockPeriodOption memory option = lockPeriodOptions[lockPeriodId];
        return (option.duration, option.rewardMultiplier, option.name, option.isActive);
    }

    function getAllLockPeriodOptions() external view returns (
        uint256[] memory ids,
        uint256[] memory durations,
        uint256[] memory multipliers,
        string[] memory names,
        bool[] memory actives
    ) {
        uint256 count = 0;
        
        // Count active options
        for (uint256 i = 0; i < nextLockPeriodId; i++) {
            if (lockPeriodOptions[i].duration > 0) {
                count++;
            }
        }
        
        ids = new uint256[](count);
        durations = new uint256[](count);
        multipliers = new uint256[](count);
        names = new string[](count);
        actives = new bool[](count);
        
        uint256 index = 0;
        for (uint256 i = 0; i < nextLockPeriodId; i++) {
            if (lockPeriodOptions[i].duration > 0) {
                ids[index] = i;
                durations[index] = lockPeriodOptions[i].duration;
                multipliers[index] = lockPeriodOptions[i].rewardMultiplier;
                names[index] = lockPeriodOptions[i].name;
                actives[index] = lockPeriodOptions[i].isActive;
                index++;
            }
        }
    }

    function getActiveLockPeriodOptions() external view returns (
        uint256[] memory ids,
        uint256[] memory durations,
        uint256[] memory multipliers,
        string[] memory names,
        uint256[] memory apys
    ) {
        uint256 count = 0;
        
        // Count active options
        for (uint256 i = 0; i < nextLockPeriodId; i++) {
            if (lockPeriodOptions[i].isActive && lockPeriodOptions[i].duration > 0) {
                count++;
            }
        }
        
        ids = new uint256[](count);
        durations = new uint256[](count);
        multipliers = new uint256[](count);
        names = new string[](count);
        apys = new uint256[](count);
        
        uint256 index = 0;
        for (uint256 i = 0; i < nextLockPeriodId; i++) {
            if (lockPeriodOptions[i].isActive && lockPeriodOptions[i].duration > 0) {
                ids[index] = i;
                durations[index] = lockPeriodOptions[i].duration;
                multipliers[index] = lockPeriodOptions[i].rewardMultiplier;
                names[index] = lockPeriodOptions[i].name;
                
                // Calculate APY
                uint256 effectiveRate = _getEffectiveRewardRate(i);
                apys[index] = (effectiveRate * SECONDS_PER_YEAR * 100) / 1e18;
                
                index++;
            }
        }
    }

    // Admin Functions

    function updateBaseRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= MAX_REWARD_RATE, "Exceeds max rate");
        uint256 oldRate = poolStats.baseRewardRate;
        poolStats.baseRewardRate = newRate;
        emit RewardRateUpdated(oldRate, newRate);
    }

    function addLockPeriodOption(uint256 duration, uint256 rewardMultiplier, string memory name) external onlyOwner {
        require(duration > 0, "Duration must be positive");
        require(rewardMultiplier > 0, "Multiplier must be positive");
        
        lockPeriodOptions[nextLockPeriodId] = LockPeriodOption({
            duration: duration,
            rewardMultiplier: rewardMultiplier,
            name: name,
            isActive: true
        });
        
        emit LockPeriodOptionAdded(nextLockPeriodId, duration, rewardMultiplier, name);
        nextLockPeriodId++;
    }

    function updateLockPeriodOption(uint256 lockPeriodId, uint256 duration, uint256 rewardMultiplier, string memory name) external onlyOwner {
        require(lockPeriodOptions[lockPeriodId].duration > 0, "Lock period option does not exist");
        require(duration > 0, "Duration must be positive");
        require(rewardMultiplier > 0, "Multiplier must be positive");
        
        lockPeriodOptions[lockPeriodId].duration = duration;
        lockPeriodOptions[lockPeriodId].rewardMultiplier = rewardMultiplier;
        lockPeriodOptions[lockPeriodId].name = name;
        
        emit LockPeriodOptionUpdated(lockPeriodId, duration, rewardMultiplier, name);
    }

    function toggleLockPeriodOption(uint256 lockPeriodId, bool isActive) external onlyOwner {
        require(lockPeriodOptions[lockPeriodId].duration > 0, "Lock period option does not exist");
        
        lockPeriodOptions[lockPeriodId].isActive = isActive;
        emit LockPeriodOptionToggled(lockPeriodId, isActive);
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