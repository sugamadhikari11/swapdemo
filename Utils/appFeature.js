import { ethers } from "ethers";
import Web3Modal from 'web3modal';

import {
    BooTokenAddress, 
    BooTokenABI,
    LifeTokenAddress,
    LifeTokenABI,
    SingleSwapTokenAddress,
    SingleSwapTokenABI,
    SwapMultiHopAddress,
    SwapMultiHopABI,
    IWETHAddress,
    IWETHABI
}from '../context/constants';


//Check if the wallet is connected

export const checkIfWalletConnected = async()=>{
    try{
        if(!window.ethereum) return console.log("Install MetaMask")
        const accounts = await window.ethereum.request({
            method: 'eth_accounts',
        });
        const firstAccount = accounts[0];
        return firstAccount;
    }catch (error){
        console.log(error);
    }
}

//Connect Wallet
export const connectWallet = async()=>{
    try{
        if(!window.ethereum) return console.log("Install MetaMask")
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
        });
        const firstAccount = accounts[0];
        return firstAccount;
    }catch (error){
        console.log(error);
    }
}

//---------------FETCHING CONTRACT-------------------//

//BOO TOKEN FECTHING
export const fetchBooContract =  (signerOrProvider) => new ethers.Contract(
    BooTokenAddress, BooTokenABI, signerOrProvider);

//Connecting with BOO Token contract
export const connectingWithBooToken = async ()=>{
    try{
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchBooContract(signer)
        return contract
    }catch(error){
        console.log(error)
    }
}

//LIFE TOKEN FECTHING
export const fetchLifeContract =  (signerOrProvider) => new ethers.Contract(
    LifeTokenAddress, LifeTokenABI, signerOrProvider);

//Connecting with LIFE Token contract
export const connectingWithLifeToken = async ()=>{
    try{
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchLifeContract(signer)
        return contract
    }catch(error){
        console.log(error)
    }
}

//SINGLE SWAP TOKEN FECTHING
export const fetchSingleSwapContract =  (signerOrProvider) => new ethers.Contract(
    SingleSwapTokenAddress, SingleSwapTokenABI, signerOrProvider);

//Connecting with SINGLE SWAP Token contract
export const connectingWithSingleSwapToken = async ()=>{
    try{
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchSingleSwapContract(signer)
        return contract;
    }catch(error){
        console.log(error)
    }
}


//IWTH TOKEN FECTHING
export const fetchIWTHContract =  (signerOrProvider) => new ethers.Contract(
    IWETHAddress, IWETHABI, signerOrProvider);

//Connecting with IWTH Token contract
export const connectingWithIWTHToken = async ()=>{
    try{
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchIWTHContract(signer)
        return contract;
    }catch(error){
        console.log(error)
    }
}

//DAI FECTHING
const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
export const fetchDAIContract =  (signerOrProvider) => new ethers.Contract(
    DAIAddress, IWETHABI, signerOrProvider);

//Connecting with DAI contract
export const connectingWithDAIToken = async ()=>{
    try{
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchDAIContract(signer)
        return contract;
    }catch(error){
        console.log(error)
    }
}

