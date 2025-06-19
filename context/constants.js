import booToken from "./BooToken.json";
import lifeToken from "./LifeToken.json";
import singleSwapToken from './SingleSwapToken.json';
import swapMultiHop from './SwapMultiHop.json';
import IWETH from './IWETH.json';
import userStorageData  from './UserStorageData.json';

//BOO Token
export const BooTokenAddress = "0x4728aF32823cf144586DaB95632156cC81BB0203";
export const BooTokenABI = booToken.abi;

//Life Token
export const LifeTokenAddress = "0x37d0eD258f37a966f33b75b5AE7486917a0ae614";
export const LifeTokenABI = lifeToken.abi;

//Single Swap Token
export const SingleSwapTokenAddress = "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB";
export const SingleSwapTokenABI = singleSwapToken.abi;

//Multi Swap Token
export const SwapMultiHopAddress = "0x9E545E3C0baAB3E08CdfD552C960A1050f373042";
export const SwapMultiHopABI = swapMultiHop.abi;

//IWETH
export const IWETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const IWETHABI = IWETH.abi;

//User storage data
export const userStorageDataAddress = "0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9";
export const userStorageDataABI = userStorageData.abi;
