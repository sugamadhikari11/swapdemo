import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Lock, Clock, Award, AlertCircle, DollarSign } from 'lucide-react';
import styles from '../styles/Stake.module.css';
import { ethers } from 'ethers'; 

const Stake = () => {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [stakeAmount, setStakeAmount] = useState('');
  const [customLockPeriod, setCustomLockPeriod] = useState('');
  const [useCustomLock, setUseCustomLock] = useState(false);
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [userStakingInfo, setUserStakingInfo] = useState({
    totalStaked: '0',
    activeStakes: 0,
    rewards: '0',
    nextUnlockTime: 0
  });
  const [poolStats, setPoolStats] = useState({
    totalStaked: '0',
    totalStakers: 0,
    rewardRate: '0',
    lockPeriod: 0,
    minStakeAmount: '0'
  });
  const [userStakes, setUserStakes] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Contract address - you'll need to update this with your deployed contract address
  const CONTRACT_ADDRESS = '0x72cdd30c3989D7f87bA563b0DA6ECcdd79fcdA9F'; // Replace with your contract address
  
  // Contract ABI - simplified for key functions
   const CONTRACT_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [],
      "name": "ContractPaused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [],
      "name": "ContractUnpaused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "EmergencyWithdraw",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "oldPeriod",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newPeriod",
          "type": "uint256"
        }
      ],
      "name": "LockPeriodUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "oldAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newAmount",
          "type": "uint256"
        }
      ],
      "name": "MinStakeAmountUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Paused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "oldRate",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newRate",
          "type": "uint256"
        }
      ],
      "name": "RewardRateUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "RewardsClaimed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "RewardsDeposited",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "Staked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Unpaused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "Unstaked",
      "type": "event"
    },
    {
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "inputs": [],
      "name": "MAX_REWARD_RATE",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "SECONDS_PER_YEAR",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256"
        }
      ],
      "name": "calculateEstimatedRewards",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "claimRewards",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "depositRewards",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "emergencyWithdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCurrentAPY",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getPoolStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalStaked",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalStakers",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "rewardRate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lockPeriod",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minStakeAmount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUnstakeableAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "unstakeable",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserStakes",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "amounts",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "timestamps",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "unlockTimes",
          "type": "uint256[]"
        },
        {
          "internalType": "bool[]",
          "name": "actives",
          "type": "bool[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserStakingInfo",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalStaked",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "activeStakes",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "rewards",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "nextUnlockTime",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "paused",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "pendingRewards",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "poolStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalStaked",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalStakers",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "rewardRate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lockPeriod",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minStakeAmount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "stake",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "customLockPeriod",
          "type": "uint256"
        }
      ],
      "name": "stakeWithLockPeriod",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "totalUserStaked",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "unstake",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unstakeAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "newLockPeriod",
          "type": "uint256"
        }
      ],
      "name": "updateLockPeriod",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "newMin",
          "type": "uint256"
        }
      ],
      "name": "updateMinStakeAmount",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "newRate",
          "type": "uint256"
        }
      ],
      "name": "updateRewardRate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "userStakes",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastRewardClaim",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lockPeriod",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "userStakesInfo",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "amounts",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "timestamps",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "unlockTimes",
          "type": "uint256[]"
        },
        {
          "internalType": "bool[]",
          "name": "actives",
          "type": "bool[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ]

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);
        // Pass the explicit network config here
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            { name: "hardhat", chainId: 31337 } // <-- Add this
        );
        await loadUserData(accounts[0], provider); 
        setError('');
      } catch (err) {
        setError('Failed to connect wallet: ' + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setError('MetaMask not detected. Please install MetaMask.');
    }
  };

  // Load user data
  const loadUserData = async (userAccount) => {
    if (!window.ethereum || !userAccount) return;
    
    try {
       // Use existing provider if passed, otherwise create a new one with network config
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            { name: "hardhat", chainId: 31337 } // <-- Add this
        );
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Get user balance
      const balance = await provider.getBalance(userAccount);
      setBalance(ethers.utils.formatEther(balance));
      
      // Get user staking info
      const stakingInfo = await contract.getUserStakingInfo(userAccount);
      setUserStakingInfo({
        totalStaked: ethers.utils.formatEther(stakingInfo[0]),
        activeStakes: stakingInfo[1].toString(),
        rewards: ethers.utils.formatEther(stakingInfo[2]),
        nextUnlockTime: stakingInfo[3].toNumber()
      });
      
      // Get pool stats
      const poolData = await contract.getPoolStats();
      setPoolStats({
        totalStaked: ethers.utils.formatEther(poolData[0]),
        totalStakers: poolData[1].toString(),
        rewardRate: poolData[2].toString(),
        lockPeriod: poolData[3].toNumber(),
        minStakeAmount: ethers.utils.formatEther(poolData[4])
      });
      
      // Get user stakes
      const stakes = await contract.getUserStakes(userAccount);
      const formattedStakes = stakes[0].map((amount, index) => ({
        amount: ethers.utils.formatEther(amount),
        timestamp: stakes[1][index].toNumber(),
        unlockTime: stakes[2][index].toNumber(),
        isActive: stakes[3][index]
      }));
      setUserStakes(formattedStakes);
      
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    }
  };

  // Stake function
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }
    
    try {
      setLoading(true);
       // Use existing provider if passed, otherwise create a new one with network config
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            { name: "hardhat", chainId: 31337 } // <-- Add this
        );
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const amount = ethers.utils.parseEther(stakeAmount);
      
      let tx;
      if (useCustomLock && customLockPeriod) {
        const lockSeconds = parseInt(customLockPeriod) * 24 * 60 * 60; // Convert days to seconds
        tx = await contract.stakeWithLockPeriod(lockSeconds, { value: amount });
      } else {
        tx = await contract.stake({ value: amount });
      }
      
      await tx.wait();
      setStakeAmount('');
      setCustomLockPeriod('');
      await loadUserData(account);
      setError('');
    } catch (err) {
      setError('Staking failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Unstake function
  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      setError('Please enter a valid unstake amount');
      return;
    }
    
    try {
      setLoading(true);
       // Use existing provider if passed, otherwise create a new one with network config
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            { name: "hardhat", chainId: 31337 } // <-- Add this
        );
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const amount = ethers.utils.parseEther(unstakeAmount);
      const tx = await contract.unstake(amount);
      await tx.wait();
      
      setUnstakeAmount('');
      await loadUserData(account);
      setError('');
    } catch (err) {
      setError('Unstaking failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Claim rewards
  const handleClaimRewards = async () => {
    try {
      setLoading(true);
       // Use existing provider if passed, otherwise create a new one with network config
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            { name: "hardhat", chainId: 31337 } // <-- Add this
        );
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.claimRewards();
      await tx.wait();
      
      await loadUserData(account);
      setError('');
    } catch (err) {
      setError('Claiming rewards failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    if (timestamp === 0) return 'No stakes';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Calculate APY
  const calculateAPY = () => {
    if (poolStats.rewardRate === '0') return '0';
    const rate = parseFloat(poolStats.rewardRate);
    const secondsPerYear = 365 * 24 * 60 * 60;
    return ((rate * secondsPerYear * 100) / 1e18).toFixed(2);
  };

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Sepolia Staking Pool</h1>
          <p className={styles.subtitle}>Stake your ETH and earn rewards</p>
        </div>

        {/* Connect Wallet */}
        {!isConnected ? (
          <div className={styles.connectWalletCard}>
            <Wallet className={styles.walletIcon} />
            <h2 className={styles.connectTitle}>Connect Your Wallet</h2>
            <button
              onClick={connectWallet}
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          </div>
        ) : (
          <div className={styles.mainContent}>
            {/* Account Info */}
            <div className={styles.accountCard}>
              <div className={styles.accountInfo}>
                <div>
                  <p className={styles.label}>Connected Account</p>
                  <p className={styles.address}>{account}</p>
                </div>
                <div className={styles.balanceInfo}>
                  <p className={styles.label}>ETH Balance</p>
                  <p className={styles.balance}>{parseFloat(balance).toFixed(4)} ETH</p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className={styles.errorCard}>
                <AlertCircle className={styles.errorIcon} />
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            {/* Pool Stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statContent}>
                  <TrendingUp className={`${styles.statIcon} ${styles.iconGreen}`} />
                  <div>
                    <p className={styles.statLabel}>Current APY</p>
                    <p className={styles.statValue}>{calculateAPY()}%</p>
                  </div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statContent}>
                  <DollarSign className={`${styles.statIcon} ${styles.iconBlue}`} />
                  <div>
                    <p className={styles.statLabel}>Total Staked</p>
                    <p className={styles.statValue}>{parseFloat(poolStats.totalStaked).toFixed(2)} ETH</p>
                  </div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statContent}>
                  <Lock className={`${styles.statIcon} ${styles.iconPurple}`} />
                  <div>
                    <p className={styles.statLabel}>Lock Period</p>
                    <p className={styles.statValue}>{Math.floor(poolStats.lockPeriod / 86400)} Days</p>
                  </div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statContent}>
                  <Award className={`${styles.statIcon} ${styles.iconOrange}`} />
                  <div>
                    <p className={styles.statLabel}>Total Stakers</p>
                    <p className={styles.statValue}>{poolStats.totalStakers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Stats */}
            <div className={styles.userStatsGrid}>
              <div className={styles.userStatCard}>
                <h3 className={styles.userStatTitle}>Your Staked Amount</h3>
                <p className={`${styles.userStatValue} ${styles.valueBlue}`}>
                  {parseFloat(userStakingInfo.totalStaked).toFixed(4)} ETH
                </p>
              </div>
              <div className={styles.userStatCard}>
                <h3 className={styles.userStatTitle}>Pending Rewards</h3>
                <p className={`${styles.userStatValue} ${styles.valueGreen}`}>
                  {parseFloat(userStakingInfo.rewards).toFixed(6)} ETH
                </p>
              </div>
              <div className={styles.userStatCard}>
                <h3 className={styles.userStatTitle}>Active Stakes</h3>
                <p className={`${styles.userStatValue} ${styles.valuePurple}`}>
                  {userStakingInfo.activeStakes}
                </p>
              </div>
            </div>

            {/* Staking Interface */}
            <div className={styles.interfaceGrid}>
              {/* Stake */}
              <div className={styles.interfaceCard}>
                <h3 className={styles.interfaceTitle}>Stake ETH</h3>
                <div className={styles.formGroup}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Amount (ETH)</label>
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className={styles.input}
                      placeholder="0.01"
                      min="0.01"
                      step="0.01"
                    />
                    <p className={styles.inputHelper}>Min: {poolStats.minStakeAmount} ETH</p>
                  </div>
                  
                  <div className={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="customLock"
                      checked={useCustomLock}
                      onChange={(e) => setUseCustomLock(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <label htmlFor="customLock" className={styles.checkboxLabel}>
                      Use custom lock period
                    </label>
                  </div>
                  
                  {useCustomLock && (
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Lock Period (Days)</label>
                      <input
                        type="number"
                        value={customLockPeriod}
                        onChange={(e) => setCustomLockPeriod(e.target.value)}
                        className={styles.input}
                        placeholder="14"
                        min="14"
                        max="365"
                      />
                    </div>
                  )}
                  
                  <button
                    onClick={handleStake}
                    disabled={loading || !stakeAmount}
                    className={`${styles.button} ${styles.buttonStake} ${styles.buttonFull}`}
                  >
                    {loading ? 'Staking...' : 'Stake ETH'}
                  </button>
                </div>
              </div>

              {/* Unstake */}
              <div className={styles.interfaceCard}>
                <h3 className={styles.interfaceTitle}>Unstake ETH</h3>
                <div className={styles.formGroup}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Amount (ETH)</label>
                    <input
                      type="number"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      className={styles.input}
                      placeholder="0.0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className={styles.buttonGroup}>
                    <button
                      onClick={handleUnstake}
                      disabled={loading || !unstakeAmount}
                      className={`${styles.button} ${styles.buttonUnstake} ${styles.buttonFull}`}
                    >
                      {loading ? 'Unstaking...' : 'Unstake ETH'}
                    </button>
                    
                    <button
                      onClick={handleClaimRewards}
                      disabled={loading || parseFloat(userStakingInfo.rewards) === 0}
                      className={`${styles.button} ${styles.buttonClaim} ${styles.buttonFull}`}
                    >
                      {loading ? 'Claiming...' : 'Claim Rewards'}
                    </button>
                  </div>

                  {userStakingInfo.nextUnlockTime > 0 && (
                    <div className={styles.unlockTime}>
                      <Clock className={styles.clockIcon} />
                      Next unlock: {formatTime(userStakingInfo.nextUnlockTime)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Stakes Table */}
            {userStakes.length > 0 && (
              <div className={styles.tableCard}>
                <h3 className={styles.tableTitle}>Your Stakes</h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr className={styles.tableHeader}>
                        <th className={styles.tableCell}>Amount</th>
                        <th className={styles.tableCell}>Staked Date</th>
                        <th className={styles.tableCell}>Unlock Date</th>
                        <th className={styles.tableCell}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userStakes.map((stake, index) => (
                        <tr key={index} className={styles.tableRow}>
                          <td className={styles.tableCell}>{parseFloat(stake.amount).toFixed(4)} ETH</td>
                          <td className={styles.tableCell}>{formatTime(stake.timestamp)}</td>
                          <td className={styles.tableCell}>{formatTime(stake.unlockTime)}</td>
                          <td className={styles.tableCell}>
                            <span className={`${styles.badge} ${
                              stake.isActive 
                                ? (Date.now() / 1000 >= stake.unlockTime ? styles.badgeUnlocked : styles.badgeLocked)
                                : styles.badgeInactive
                            }`}>
                              {!stake.isActive ? 'Inactive' : (Date.now() / 1000 >= stake.unlockTime ? 'Unlocked' : 'Locked')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stake;