import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp } from 'lucide-react';
import styles from '../../styles/PoolConnect.module.css';
import { BigNumber } from "ethers";
import { utils } from "ethers";


const PoolConnect = ({ setClosePool, getAllLiquidity, account }) => {
  const [liquidityPools, setLiquidityPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!getAllLiquidity) return;
    console.log(getAllLiquidity);

    const liquidityArray = Array.isArray(getAllLiquidity)
      ? getAllLiquidity
      : [getAllLiquidity];

    const formattedPools = liquidityArray.map((pool) => {
      if (!pool.poolExample || !pool.poolExample.token0 || !pool.poolExample.token1) {
        return null;
      }

      return {
        token0: pool.poolExample.token0.symbol,
        token1: pool.poolExample.token1.symbol,
        fee: pool.fee,
        liquidity: pool.liquidity,
        tick: pool.tick, // current tick
        maxLiquidityPerTick: pool.maxLiquidityPerTick,
        sqrtPriceX96: pool.sqrtPriceX96,
        tickSpacing: pool.tickSpacing,
        apr: pool.apr ?? "N/A",  // Add fallback if apr missing
        raw: pool,
      };
    }).filter(Boolean);

    setLiquidityPools(formattedPools);
  }, [getAllLiquidity]);

  // Filter pools based on search term
  const filteredPools = liquidityPools.filter(pool =>
    `${pool.token0}/${pool.token1}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Component to display one pool card
  const PoolCard = ({ pool }) => (
    <div className={styles.poolCard}>
      <div className={styles.poolCardHeader}>
        <div className={styles.tokenPair}>
          <div className={styles.tokenIcons}>
            <div className={`${styles.tokenIcon} ${styles.tokenIconFirst}`}>
              {pool.token0.charAt(0)}
            </div>
            <div className={`${styles.tokenIcon} ${styles.tokenIconSecond}`}>
              {pool.token1.charAt(0)}
            </div>
          </div>
          <div className={styles.pairInfo}>
            <h3>{pool.token0}/{pool.token1}</h3>
            <p>Liquidity Pool</p>
          </div>
        </div>
        <div className={styles.aprInfo}>
          <div className={styles.aprValue}>
            <TrendingUp className="w-4 h-4" />
            <span>{pool.apr}</span>
          </div>
          <p className={styles.aprLabel}>APR</p>
        </div>
      </div>

    <div className={styles.poolStats}>
    {/* Total Liquidity (human-readable) */}
    <div className={styles.poolStatItem}>
      <p className={styles.poolStatLabel}>Total Liquidity</p>
      <p
        className={styles.poolStatValue}
        title={pool.liquidity?.toString() ?? "N/A"}
      >
        {pool.liquidity
          ? `${parseFloat(utils.formatUnits(pool.liquidity, 18)).toFixed(4)} ETH`
          : "N/A"}
      </p>
    </div>

    {/* Pool Fee */}
    <div className={styles.poolStatItem}>
      <p className={styles.poolStatLabel}>Fee</p>
      <p className={styles.poolStatValue}>{pool.fee} basis points</p>
    </div>

    {/* Current Tick */}
    <div className={styles.poolStatItem}>
      <p className={styles.poolStatLabel}>Current Tick</p>
      <p className={styles.poolStatValue}>{pool.tick ?? 0}</p>
    </div>

    {/* Max Liquidity Per Tick */}
    <div className={styles.poolStatItem}>
      <p className={styles.poolStatLabel}>Max Liquidity/Tick</p>
      <p
        className={styles.poolStatValue}
        title={
          BigNumber.isBigNumber(pool.maxLiquidityPerTick)
            ? pool.maxLiquidityPerTick.toString()
            : "N/A"
        }
      >
        {BigNumber.isBigNumber(pool.maxLiquidityPerTick)
          ? pool.maxLiquidityPerTick.toString().slice(0, 6) + "..."
          : "N/A"}
      </p>
    </div>

    {/* Optional: Display Price (if sqrtPriceX96 available) */}
    {pool.sqrtPriceX96 && (
      <div className={styles.poolStatItem}>
        <p className={styles.poolStatLabel}>Current Price</p>
        <p className={styles.poolStatValue}>
          {getReadablePrice(pool.sqrtPriceX96)}
        </p>
      </div>
    )}
  </div>


      <button className={styles.addLiquidityButton}>Add Liquidity</button>
    </div>
  );

  const getReadablePrice = (sqrtPriceX96) => {
  const sqrtPrice = BigNumber.from(sqrtPriceX96._hex);
  const price = sqrtPrice.mul(sqrtPrice).div(BigNumber.from(2).pow(96 * 2));
  return utils.formatUnits(price, 18).slice(0, 10);
};


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.headerTitle}>Liquidity Pools</h2>
          <button
            onClick={() => setClosePool(true)}
            className={styles.createButton}
          >
            <Plus className="w-4 h-4" />
            <span>Create Pool</span>
          </button>
        </div>

        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search pools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.content}>
        {account ? (
          <div className={`${styles.accountStatus} ${styles.accountConnected}`}>
            <div className={`${styles.statusDot} ${styles.statusDotGreen}`}></div>
            <span className={`${styles.statusText} ${styles.statusTextGreen}`}>Connected: {account}</span>
          </div>
        ) : (
          <div className={`${styles.accountStatus} ${styles.accountDisconnected}`}>
            <div className={`${styles.statusDot} ${styles.statusDotYellow}`}></div>
            <span className={`${styles.statusText} ${styles.statusTextYellow}`}>Connect your wallet to view your positions</span>
          </div>
        )}

        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statCardPink}`}>
            <h3 className={styles.statValue}>24</h3>
            <p className={styles.statLabel}>Active Pools</p>
          </div>
          <div className={`${styles.statCard} ${styles.statCardBlue}`}>
            <h3 className={styles.statValue}>$2.4M</h3>
            <p className={styles.statLabel}>Total Liquidity</p>
          </div>
          <div className={`${styles.statCard} ${styles.statCardGreen}`}>
            <h3 className={styles.statValue}>8.5%</h3>
            <p className={styles.statLabel}>Avg APR</p>
          </div>
        </div>

        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingContent}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Loading pools...</p>
            </div>
          </div>
        )}

        {!loading && (
          <div>
            <h3 className={styles.poolsHeader}>
              Available Pools ({filteredPools.length})
            </h3>

            {filteredPools.length > 0 ? (
              <div className={styles.poolsGrid}>
                {filteredPools.map((pool, index) => (
                  <PoolCard key={index} pool={pool} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className={styles.emptyTitle}>No pools found</h3>
                <p className={styles.emptyDescription}>
                  {searchTerm ? 'Try adjusting your search terms' : 'No liquidity pools available'}
                </p>
                <button
                  onClick={() => setClosePool(true)}
                  className={styles.createFirstPoolButton}
                >
                  Create First Pool
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PoolConnect;
