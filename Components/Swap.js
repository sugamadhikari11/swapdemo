// components/Swap.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "../styles/Swap.module.css";

const Swap = () => {
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [conversionRates, setConversionRates] = useState({});
  const [selectedCurrency, setSelectedCurrency] = useState("usd");

  // Fetch live ETH conversion rates from CoinGecko for multiple currencies
  useEffect(() => {
    const fetchConversionRates = async () => {
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,eur,gbp"
        );
        // The response data is expected in the format:
        // { ethereum: { usd: <price>, eur: <price>, gbp: <price> } }
        setConversionRates(response.data.ethereum);
      } catch (error) {
        console.error("Error fetching conversion rates:", error);
      }
    };

    fetchConversionRates();
  }, []);

  // Auto-calculate the output amount whenever inputAmount or selectedCurrency changes
  useEffect(() => {
    if (conversionRates[selectedCurrency] && inputAmount) {
      const result = parseFloat(inputAmount) * conversionRates[selectedCurrency];
      setOutputAmount(result.toFixed(2)); // Round to 2 decimal places
    } else {
      setOutputAmount("");
    }
  }, [inputAmount, selectedCurrency, conversionRates]);

  return (
    <div className={styles.swapContainer}>
      <h2 className={styles.header}>Swap ETH to Currency</h2>
      <div className={styles.swapSection}>
        <div className={styles.swapInput}>
          <label>ETH Amount:</label>
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="Enter ETH amount"
          />
        </div>
        <div className={styles.swapInput}>
          <label>Select Currency:</label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
          >
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="gbp">GBP</option>
          </select>
        </div>
        <div className={styles.swapOutput}>
          <label>{selectedCurrency.toUpperCase()} Amount:</label>
          <input
            type="number"
            value={outputAmount}
            readOnly
            placeholder="Calculated amount"
          />
        </div>
      </div>
      <p className={styles.footer}>
        {conversionRates[selectedCurrency]
          ? `Current ETH Price: ${conversionRates[selectedCurrency]} ${selectedCurrency.toUpperCase()}`
          : "Fetching conversion rates..."}
      </p>
    </div>
  );
};

export default Swap;
