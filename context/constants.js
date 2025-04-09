import booToken from "./BooToken.json";
import lifeToken from "./LifeToken.json";
import singleSwapToken from './SingleSwapToken.json';
import swapMultiHop from './SwapMultiHop.json';
import IWETH from './IWETH.json'
// BOO deployed to 0x98F74b7C96497070ba5052E02832EF9892962e62
// Life deployed to 0x831C6C334f8DDeE62246a5c81B82c8e18008b38f
// SingleSwapToken deployed to 0xF47e3B0A1952A81F1afc41172762CB7CE8700133
// SwapMultiHop deployed to 0xC63db9682Ff11707CADbD72bf1A0354a7feF143B

//BOO Token
export const BooTokenAddress = "0x98F74b7C96497070ba5052E02832EF9892962e62";
export const BooTokenABI = booToken.abi;

//Life Token
export const LifeTokenAddress = "0x831C6C334f8DDeE62246a5c81B82c8e18008b38f";
export const LifeTokenABI = lifeToken.abi;

//Single Swap Token
export const SingleSwapTokenAddress = "0xF47e3B0A1952A81F1afc41172762CB7CE8700133";
export const SingleSwapTokenABI = singleSwapToken.abi;

//Multi Swap Token
export const SwapMultiHopAddress = "0xC63db9682Ff11707CADbD72bf1A0354a7feF143B";
export const SwapMultiHopABI = swapMultiHop.abi;

//IWETH
export const IWETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const IWETHABI = IWETH.abi;