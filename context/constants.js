import booToken from "./BooToken.json";
import lifeToken from "./LifeToken.json";
import singleSwapToken from './SingleSwapToken.json';
import swapMultiHop from './SwapMultiHop.json';
import IWETH from './IWETH.json'

// BOO deployed to 0x4728aF32823cf144586DaB95632156cC81BB0203
// Life deployed to 0x37d0eD258f37a966f33b75b5AE7486917a0ae614
// SingleSwapToken deployed to 0x294c69bD8415219b41B68a2f065DeABB950dd489
// SwapMultiHop deployed to 0x48288D0e3079A03f6EC1846554CFc58C2696Aaee

//BOO Token
export const BooTokenAddress = "0x4728aF32823cf144586DaB95632156cC81BB0203";
export const BooTokenABI = booToken.abi;

//Life Token
export const LifeTokenAddress = "0x37d0eD258f37a966f33b75b5AE7486917a0ae614";
export const LifeTokenABI = lifeToken.abi;

//Single Swap Token
export const SingleSwapTokenAddress = "0x294c69bD8415219b41B68a2f065DeABB950dd489";
export const SingleSwapTokenABI = singleSwapToken.abi;

//Multi Swap Token
export const SwapMultiHopAddress = "0x48288D0e3079A03f6EC1846554CFc58C2696Aaee";
export const SwapMultiHopABI = swapMultiHop.abi;

//IWETH
export const IWETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const IWETHABI = IWETH.abi;