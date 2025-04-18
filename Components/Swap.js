import React, { useContext, useEffect, useState } from "react";
import { SwapTokenContext } from "../context/SwapContext";
import styles from "../styles/Swap.module.css";

const Swap = () => {
  const [openToken, setOpenToken] = useState(null); // From Token
  const [openTokensTwo, setOpenTokensTwo] = useState(null); // To Token
  const [tokenSwapOutput, setTokenSwapOutput] = useState(0);
  const [poolMessage, setPoolMessage] = useState("");
  const [search, setSearch] = useState(false);
  const [swapAmount, setSwapAmount] = useState(0);

  const {
    connectWallet,
    account,
    dai,
    ether,
    tokenData,
    getPrice,
    swapUpdatePrice,
    singleSwapToken,
  } = useContext(SwapTokenContext);

  // Fetch output token value based on user input
  const callOutPut = async (value) => {
    if (!value || isNaN(value)) {
      setTokenSwapOutput(0);
      setPoolMessage('');
      return;
    }

    try {
      const yourAccount = account || "0x97f991971a37D4Ca58064e6a98FC563F03A71E5c";
      const deadline = 10;
      const slippageAmount = 25;

      // Call to get the swap data
      const data = await swapUpdatePrice(value, slippageAmount, deadline, yourAccount);
      console.log(data); // Debugging output
      setTokenSwapOutput(data[1]);
      setSearch(false);

      // Pool info
      const poolAddress = "0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8";
      const poolData = await getPrice(value, poolAddress);
      const message = `${value} ${poolData[2]} = ${poolData[0]} ${poolData[1]}`;
      setPoolMessage(message);
    } catch (error) {
      console.error("Swap price fetch failed:", error.message);
      setTokenSwapOutput(0);
      setPoolMessage("Invalid swap input or unable to fetch data.");
    }
  };

  // Handle swap token inputs
  const handleSwapAmountChange = (e) => {
    const value = e.target.value;
    setSwapAmount(value);

    if (value && !isNaN(value)) {
      setSearch(true);
      callOutPut(value);
    } else {
      setTokenSwapOutput(0);
      setPoolMessage('');
    }
  };

  // Handle selecting the 'From Token'
  const handleFromTokenChange = (e) => {
    const selected = tokenData.find(t => t.symbol === e.target.value);
    setOpenToken(selected);
  };

  // Handle selecting the 'To Token'
  const handleToTokenChange = (e) => {
    const selected = tokenData.find(t => t.symbol === e.target.value);
    setOpenTokensTwo(selected);
  };

  return (
    <div className={styles.swapContainer}>
      <h2 className={styles.header}>Uniswap Clone</h2>

      <div className={styles.balanceInfo}>
        <p><strong>Wallet:</strong> {account ? account : "Not Connected"}</p>
        <p><strong>ETH:</strong> {ether}</p>
        <p><strong>DAI:</strong> {dai}</p>
      </div>

      <div className={styles.swapSection}>
        {/* Amount input */}
        <div className={styles.swapInput}>
          <label>Amount:</label>
          <input
            type="number"
            placeholder="0"
            value={swapAmount}
            onChange={handleSwapAmountChange}
          />
        </div>

        {/* From Token */}
<div className={styles.swapInput}>
  <label>From Token:</label>
  <select onChange={handleFromTokenChange}>
    <option value="">Select Token</option>
    {tokenData.length > 0 ? (
      tokenData.map((token, index) => (
        <option key={`${token.symbol}-${index}`} value={token.symbol}>
          {token.symbol}
        </option>
      ))
    ) : (
      <option disabled>No tokens available</option> // If no tokens available, show this message
    )}
  </select>
  {openToken && (
    <small>Balance: {openToken.tokenBalance?.slice(0, 7)}</small>
  )}
</div>

{/* To Token */}
<div className={styles.swapInput}>
  <label>To Token:</label>
  <select
    onChange={handleToTokenChange}
    disabled={!openToken} // Disable until "From Token" is selected
  >
    <option value="">Select Token</option>
    {tokenData.length > 0 ? (
      tokenData
        .filter((token) => token.symbol !== openToken?.symbol) // Exclude selected "From Token"
        .map((token, index) => (
          <option key={`${token.symbol}-${index}`} value={token.symbol}>
            {token.symbol}
          </option>
        ))
    ) : (
      <option disabled>No tokens available</option> // If no tokens available, show this message
    )}
  </select>
  {openTokensTwo && (
    <small>Balance: {openTokensTwo.tokenBalance?.slice(0, 7)}</small>
  )}
</div>


        {/* Estimated Output */}
        <div className={styles.swapOutput}>
          <label>Estimated Output:</label>
          <p>{tokenSwapOutput}</p>
        </div>

        {/* Pool Info Message */}
        {poolMessage && (
          <p className={styles.poolMessage}>{poolMessage}</p>
        )}
      </div>

      {/* Swap or Connect Wallet */}
      {account ? (
        <button
          className={styles.swapButton}
          onClick={() => {
            // Validation before swap
            if (!openToken || !openTokensTwo) {
              alert("Please select both tokens.");
              return;
            }
            if (swapAmount <= 0) {
              alert("Swap amount must be greater than 0.");
              return;
            }

            console.log('Selected From Token:', openToken);
            console.log('Selected To Token:', openTokensTwo);
            singleSwapToken({
              token1: openToken,
              token2: openTokensTwo,
              swapAmount,
            });
          }}
        >
          Swap Now
        </button>
      ) : (
        <button className={styles.swapButton} onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default Swap;
