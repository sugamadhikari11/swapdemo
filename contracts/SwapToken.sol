// SPDX-License-Identifier: GPPL-2.0-or-later

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract SingleSwapToken {
    ISwapRouter public constant swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    // Swap event
    event SwapCompleted(address indexed user, uint amountIn, uint amountOut);

    // Swap exact input (single token)
    function swapExactInputSingle(address token1, address token2, uint amountIn) external returns(uint amountOut) {
        require(token1 != address(0) && token2 != address(0), "Invalid token address");
        require(amountIn > 0, "Amount in should be greater than 0");

        // Check user balance
        uint userBalance = IERC20(token1).balanceOf(msg.sender);
        require(userBalance >= amountIn, "Insufficient token balance");

        // Transfer tokens from the user to this contract
        TransferHelper.safeTransferFrom(token1, msg.sender, address(this), amountIn);

        // Approve swapRouter to spend the tokens
        TransferHelper.safeApprove(token1, address(swapRouter), amountIn);

        // Prepare parameters for Uniswap's swapExactInputSingle function
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: token1,
            tokenOut: token2,
            fee: 3000, // 0.3% fee tier
            recipient: msg.sender,
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: 0, // You can modify this to set slippage tolerance
            sqrtPriceLimitX96: 0
        });

        // Call the Uniswap contract to execute the swap
        amountOut = swapRouter.exactInputSingle(params);

        // Emit event on successful swap
        emit SwapCompleted(msg.sender, amountIn, amountOut);
    }

    // Swap exact output (single token)
    function swapExactOutputSingle(address token1, address token2, uint amountOut, uint amountInMaximum) external returns(uint amountIn) {
        require(token1 != address(0) && token2 != address(0), "Invalid token address");
        require(amountOut > 0, "Amount out should be greater than 0");

        // Check user balance
        uint userBalance = IERC20(token1).balanceOf(msg.sender);
        require(userBalance >= amountInMaximum, "Insufficient token balance");

        // Transfer tokens from the user to this contract
        TransferHelper.safeTransferFrom(token1, msg.sender, address(this), amountInMaximum);

        // Approve swapRouter to spend the tokens
        TransferHelper.safeApprove(token1, address(swapRouter), amountInMaximum);

        // Prepare parameters for Uniswap's swapExactOutputSingle function
        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({
            tokenIn: token1,
            tokenOut: token2,
            fee: 3000, // 0.3% fee tier
            recipient: msg.sender,
            deadline: block.timestamp,
            amountOut: amountOut,
            amountInMaximum: amountInMaximum,
            sqrtPriceLimitX96: 0
        });

        // Call the Uniswap contract to execute the swap
        amountIn = swapRouter.exactOutputSingle(params);

        // Return any leftover tokens if the transaction was less than maximum input
        if (amountIn < amountInMaximum) {
            TransferHelper.safeApprove(token1, address(swapRouter), 0);
            TransferHelper.safeTransfer(token1, msg.sender, amountInMaximum - amountIn);
        }

        // Emit event on successful swap
        emit SwapCompleted(msg.sender, amountIn, amountOut);
    }

    // Optional: Handle receiving ETH if needed (if ETH is being wrapped to WETH or vice versa)
    receive() external payable {
        // Handle incoming ETH (if you want to wrap or manage ETH)
    }
}
