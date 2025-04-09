import React, {useState, useEffect} from 'react';
import { ethers, BigNumber } from 'ethers';
import Web3Modal from 'web3modal';

//Internal Import 
import{
    checkIfWalletConnected,
    connectWallet,
    connectingWithBooToken,
    connectingWithLifeToken,
    connectingWithSingleSwapToken,
    connectingWithIWTHToken,
    connectingWithDAIToken
} from "../Utils/appFeature";

import { IWETHABI } from './constants';
import ERC20 from './ERC20.json';

export const SwapTokenContext = React.createContext();
export const SwapTokenContextProvider = ({children}) => {

    //useState
    const [account, setAccount] = useState('');
    const [ether, setEther] = useState("");
    const [networkConnect, setNetworkConnect] = useState('');
    const [weth9, setWeth9] = useState("");
    const [dai, setDai] = useState("");

    const [tokenData, setTokenData] = useState([]);
    const addToken = [
        "0x081F08945fd17C5470f7bCee23FB57aB1099428E",
        "0x831C6C334f8DDeE62246a5c81B82c8e18008b38f",
     ];
    //FETCH DATA
    const fetchingData = async()=>{
        try{
            //GET USER ACCOUNT
            const userAccount = await checkIfWalletConnected();
            setAccount(userAccount);
           
            //CREATE PROVIDER
            const web3modal = new Web3Modal();
            const connection = await web3modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);
           
            //CHECK BALANCE
            const balance = await provider.getBalance(userAccount);
            const convertBal = BigNumber.from(balance).toString();
            const ethValue = ethers.utils.formatEther(convertBal)
            setEther(ethValue)

            //GET NETWORK
            const network = await provider.getNetwork();
            setNetworkConnect(network.name);

            //ALL TOKEN BALANCE AND DATA
            addToken.map(async(el, i)=>{
                //Getting contract
                const contract = new ethers.Contract(el, ERC20, provider);
                //Getting the balance of the Token
                const userBalance = await contract.balanceOf(userAccount);
                const tokenLeft = BigNumber.from(userBalance).toString();
                const convertTokenBal = ethers.utils.formatEther(tokenLeft);
                
                //Get name and symbol
                const symbol = await contract.symbol();
                const name = await contract.name();
                tokenData.push({
                    name: name,
                    symbol: symbol,
                    tokenBalance: convertTokenBal,
                });
            });

            //Weth Balance
            const wethContract = await connectingWithIWTHToken()
            const wethBal = await wethContract.balanceOf(userAccount);
            const wethToken = BigNumber.from(wethBal).toString();
            const convertwethTokenBal = ethers.utils.formatEther(wethToken);
            setWeth9(convertwethTokenBal);

             //Dai Balance
             const daiContract = await connectingWithDAIToken()
             const daiBal = await daiContract.balanceOf(userAccount);
             const daiToken = BigNumber.from(daiBal).toString();
             const convertdaiTokenBal = ethers.utils.formatEther(daiToken);
             setDai(convertdaiTokenBal);

        }catch(error){
            console.log(error);
        }
    };
    useEffect(()=>{
        fetchingData()
    },[]);
    return<SwapTokenContext.Provider value={{account, weth9, dai, networkConnect,ether}}>
        {children}
    </SwapTokenContext.Provider>

}