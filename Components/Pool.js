
import React, { useContext, useState } from "react";
import { SwapTokenContext } from "../context/SwapContext";
import PoolAdd from "./poolComponents/PoolAdd";
import PoolConnect from "./poolComponents/PoolConnect";
import styles from "../styles/Pool.module.css";

const Pool = () => {
    const context = useContext(SwapTokenContext);
    if (!context) {
        throw new Error('Pool must be used within SwapTokenProvider');
    }
    
    const { account, createLiquidityAndPool, tokenData, getAllLiquidity } = context;
    const [closePool, setClosePool] = useState(false);

    return (
        <div className={styles.pool}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        Liquidity Pools
                    </h1>
                    <p className={styles.subtitle}>
                        Add liquidity to earn fees on trades
                    </p>
                </div>
                
                {closePool ? (
                    <PoolAdd 
                        account={account} 
                        setClosePool={setClosePool} 
                        tokenData={tokenData}
                        createLiquidityAndPool={createLiquidityAndPool}
                    />
                ) : ( 
                    <PoolConnect 
                        setClosePool={setClosePool} 
                        getAllLiquidity={getAllLiquidity} 
                        account={account}
                    />
                )}
            </div>
        </div>
    );
};

export default Pool;

