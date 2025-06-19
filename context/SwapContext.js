import React, { useState, useEffect } from 'react';
import { ethers, BigNumber } from 'ethers';
import Web3Modal from 'web3modal';
import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { getPrice } from "../Utils/fetchingPrice";
import { swapUpdatePrice } from "../Utils/swapUpdatePrice";
import { addLiquidityExternal } from '../Utils/addLiquidity';
import { getLiquidityData } from '../Utils/checkLiquidity';
import {connectingWithPoolContract} from "../Utils/deployPool";

// Internal Import
import {
    checkIfWalletConnected,
    connectWallet,
    connectingWithBooToken,
    connectingWithLifeToken,
    connectingWithSingleSwapToken,
    connectingWithIWTHToken,
    connectingWithDAIToken,
    connectingWithUserStorgaeContract,
    connectingWithMultiSwapToken
} from "../Utils/appFeature";

import { IWETHABI } from './constants';
import ERC20 from './ERC20.json';

export const SwapTokenContext = React.createContext();
export const SwapTokenContextProvider = ({ children }) => {

    // useState hooks
    const [account, setAccount] = useState('');
    const [ether, setEther] = useState("");
    const [networkConnect, setNetworkConnect] = useState('');
    const [weth9, setWeth9] = useState("");
    const [dai, setDai] = useState("");
    const [tokenData, setTokenData] = useState([]);
    const [poolAddress, setPoolAddress] = useState("");

    const [getAllLiquidity, setGetAllLiquidity] = useState([]);

    // Token addresses
    const addToken = [
        // '0x8DcE8FB00f04A7EE9fEB498cEf86f410de83CA89',
        // '0x92a100E3DF76B121Ac849A973aFEA63DC3e96682',
        // '0x6EDA4e0525C8c9803a5b8D2f16654ac1795818c5'
        '0x67d269191c92Caf3cD7723F116c85e6E9bf55933',
        '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E',
        '0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690',

        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
        "0x4278C5d322aB92F1D876Dd7Bd9b44d1748b88af2",
        "0x0D92d35D311E54aB8EEA0394d7E773Fc5144491a",
        "0x24EcC5E6EaA700368B8FAC259d3fBD045f695A08",
    ];

    // Fetch data
    const fetchingData = async () => {
        try {
            // Get user account
            const userAccount = await checkIfWalletConnected();
            setAccount(userAccount);

            // Create provider
            const web3modal = new Web3Modal();
            const connection = await web3modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);

            // Check balance
            const balance = await provider.getBalance(userAccount);
            const convertBal = BigNumber.from(balance).toString();
            const ethValue = ethers.utils.formatEther(convertBal);
            setEther(ethValue);

            // Get network
            const network = await provider.getNetwork();
            setNetworkConnect(network.name);

            // Fetch token balances
            addToken.map(async (el, i) => {
                try {
                  const contract = new ethers.Contract(el, ERC20, provider);
                  const userBalance = await contract.balanceOf(userAccount);
                  const tokenLeft = BigNumber.from(userBalance).toString();
                  const convertTokenBal = ethers.utils.formatEther(tokenLeft);
              
                  const symbol = await contract.symbol();
                  const name = await contract.name();
              
                  setTokenData(prev => [
                    ...prev,
                    {
                      name,
                      symbol,
                      tokenBalance: convertTokenBal,
                      tokenAddress: el,
                    },
                  ]);
                } catch (err) {
                  console.warn(`❌ Failed to load token at ${el}:`, err.message);
                }
              });

            //GET LIQUIDITY
            const userStorageData = await connectingWithUserStorgaeContract();
            const userLiquidity = await userStorageData.getAllTransactions();
            console.log(userLiquidity);
            
            const liquidityArray = [];  // temp array to collect data

            for (const el of userLiquidity) {
                const liquidityData = await getLiquidityData(
                    el.poolAddress,
                    el.tokenAddress0,
                    el.tokenAddress1
                );
                liquidityArray.push(liquidityData);
            }

            setGetAllLiquidity(liquidityArray);

                    

            // WETH and DAI balances
            const wethContract = await connectingWithIWTHToken();
            const wethBal = await wethContract.balanceOf(userAccount);
            const wethToken = BigNumber.from(wethBal).toString();
            const convertwethTokenBal = ethers.utils.formatEther(wethToken);
            setWeth9(convertwethTokenBal);

            const daiContract = await connectingWithDAIToken();
            const daiBal = await daiContract.balanceOf(userAccount);
            const daiToken = BigNumber.from(daiBal).toString();
            const convertdaiTokenBal = ethers.utils.formatEther(daiToken);
            setDai(convertdaiTokenBal);

        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchingData();
    }, []);

    //CREATE AND ADD LIQUIDITY
    const createLiquidityAndPool = async({
        tokenAddress0, 
        tokenAddress1, 
        fee,
        tokenPrice1, 
        tokenPrice2, 
        slippage, 
        deadline, 
        tokenAmountOne, 
        tokenAmountTwo,
    }) => {
        try{
            console.log(  
                tokenAddress0, 
                tokenAddress1, 
                fee,
                tokenPrice1, 
                tokenPrice2, 
                slippage, 
                deadline, 
                tokenAmountOne, 
                tokenAmountTwo,
            );
            // CREATE POOL
            const createPool = await connectingWithPoolContract(
                tokenAddress0,
                tokenAddress1,
                fee,
                tokenPrice1,
                tokenPrice2,
                {
                    gasLimit: 500000,
                }
            );
            const poolAddress = createPool;
            console.log(poolAddress);
            setPoolAddress(poolAddress);

            //CREATE LIQUIDITY
            const info = await addLiquidityExternal(
                tokenAddress0, 
                tokenAddress1, 
                poolAddress, 
                fee, 
                tokenAmountOne,
                tokenAmountTwo,
                {
                    gasLimit: 500000,
                }
            );
            console.log(info);

            //ADD DATA
            const userStorageData = await connectingWithUserStorgaeContract();
            const userLiquidity  = await userStorageData.addToBlockchain(
                poolAddress,
                tokenAddress0,
                tokenAddress1
            );

            
        }catch(error){
            console.log(error);
        } 
    }; 

    // Single Swap Token Function
    const singleSwapToken = async ({ token1, token2, swapAmount }) => {
        try {
          const singleSwapToken = await connectingWithSingleSwapToken();
          const weth = await connectingWithIWTHToken();
          const dai = await connectingWithDAIToken();
      
          const web3modal = new Web3Modal();
          const connection = await web3modal.connect();
          const provider = new ethers.providers.Web3Provider(connection);
          const signer = provider.getSigner();
      
          const amountIn = ethers.utils.parseUnits(swapAmount.toString(), 18);
      
          // Deposit ETH → WETH
          await weth.connect(signer).deposit({ value: amountIn });
      
          // Approve WETH for the swap contract
          await weth.connect(signer).approve(singleSwapToken.address, amountIn);
      
          // Swap WETH → token2 (e.g., DAI)
          const tx = await singleSwapToken.swapExactInputSingle(
            token1.tokenAddress,
            token2.tokenAddress,
            amountIn,
            { gasLimit: 300000 }
          );
          await tx.wait();
          await fetchingData(); // ✅ Call to re-fetch all balances
          // Refresh DAI balance
          const daiBalance = await dai.balanceOf(await signer.getAddress());
          setDai(ethers.utils.formatEther(daiBalance));
          console.log("Updated DAI Balance:", ethers.utils.formatEther(daiBalance));
      
        } catch (error) {
          console.error("Swap error:", error);
        }
      };
      

    const multiSwapToken = async({token1, token2, swapAmount}) =>{
        try {
            const multiSwapToken = await connectingWithMultiSwapToken();
        }
        catch (error) {
            console.error("Swap error:", error);
        }
    }
    
    return (
        <SwapTokenContext.Provider value={{
            singleSwapToken,
            connectWallet,
            getPrice,
            swapUpdatePrice,
            getAllLiquidity,
            createLiquidityAndPool,
            account,
            weth9,
            dai,
            networkConnect,
            ether,
            tokenData,
        }}>
            {children}
        </SwapTokenContext.Provider>
    );
};
