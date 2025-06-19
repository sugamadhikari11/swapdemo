import React, { useState } from 'react';
import { Plus, ArrowLeft, ChevronDown } from 'lucide-react';
import styles from '../../styles/PoolAdd.module.css';

const PoolAdd = ({ account, setClosePool, tokenData, createLiquidityAndPool }) => {
  // Token Selection States
  const [tokenA, setTokenA] = useState(null);
  const [tokenB, setTokenB] = useState(null);
  
  // Amount States
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  
  // Dropdown States
  const [showTokenADropdown, setShowTokenADropdown] = useState(false);
  const [showTokenBDropdown, setShowTokenBDropdown] = useState(false);
  const [showFeeDropdown, setShowFeeDropdown] = useState(false);
  
  // Pool Configuration States
  const [selectedFee, setSelectedFee] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  
  // Transaction Settings
  const [slippage, setSlippage] = useState(25);
  const [deadline, setDeadline] = useState(10);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);

  // Token Selection Handlers
  const handleTokenASelect = (token) => {
    setTokenA(token);
    setShowTokenADropdown(false);
  };

  const handleTokenBSelect = (token) => {
    setTokenB(token);
    setShowTokenBDropdown(false);
  };

  // Fee Configuration
  const feePairs = [
    { fee: '0.05%', info: 'Best for stable pairs', number: '0% Select', feeSystem: 500},
    { fee: '0.3%', info: 'Best for most pairs', number: '0% Select', feeSystem: 3000},
    { fee: '1%', info: 'Best for exotic pairs', number: '0% Select', feeSystem: 10000},
  ];

  // Price Range Handlers
  const adjustMinPrice = (direction) => {
    if (direction === '+') {
      setMinPrice(prev => prev + 1);
    } else if (direction === '-' && minPrice > 0) {
      setMinPrice(prev => prev - 1);
    }
  };

  const adjustMaxPrice = (direction) => {
    if (direction === '+') {
      setMaxPrice(prev => prev + 1);
    } else if (direction === '-' && maxPrice > 0) {
      setMaxPrice(prev => prev - 1);
    }
  };
  // Main Add Liquidity Function
  const handleAddLiquidity = async () => {
    // Validation
    if (!amountA || !amountB || !tokenA || !tokenB || !selectedFee) {
      alert('Please fill in all required fields');
      return;
    }

    // console.log(tokenA, tokenB, amountA, amountB, selectedFee, slippage, deadline, minPrice, maxPrice);
    console.log(selectedFee)
    
    setIsLoading(true);
    try {
      await createLiquidityAndPool({
        tokenAddress0: tokenA.tokenAddress,
        tokenAddress1: tokenB.tokenAddress,
        fee: selectedFee,
        tokenPrice1: minPrice,
        tokenPrice2: maxPrice,
        slippage: slippage,
        deadline: deadline,
        tokenAmountOne: amountA,
        tokenAmountTwo: amountB,
      });
      
      // // Reset form after successful submission
      // resetForm();
      
    } catch (error) {
      console.error("Error adding liquidity:", error);
      alert('Error adding liquidity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Form Helper
  const resetForm = () => {
    setAmountA('');
    setAmountB('');
    setTokenA(null);
    setTokenB(null);
    setSelectedFee('');
    setMinPrice(0);
    setMaxPrice(0);
  };

  // Token Selector Component
  const TokenSelector = ({ selectedToken, onSelect, isOpen, setIsOpen, label, tokenData }) => {
    return (
      <div className={styles.tokenSelector}>
        <label className={styles.tokenLabel}>{label}</label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={styles.tokenButton}
        >
          <div className={styles.tokenButtonContent}>
            {selectedToken ? (
              <div className={styles.selectedTokenDisplay}>
                {selectedToken.image && (
                  <img 
                    src={selectedToken.image} 
                    alt={selectedToken.symbol} 
                    className={styles.tokenImage}
                  />
                )}
                <span>{selectedToken.symbol}</span>
              </div>
            ) : (
              'Select Token'
            )}
          </div>
          <ChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronIconRotated : ''}`} />
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            {tokenData && tokenData.length > 0 ? (
              tokenData.map((token, index) => (
                <div
                  key={`${token.symbol}-${index}`}
                  className={styles.dropdownItem}
                  onClick={() => onSelect(token)}
                >
                  <div className={styles.tokenOption}>
                    {token.image && (
                      <img 
                        src={token.image} 
                        alt={token.symbol} 
                        className={styles.tokenImageSmall}
                      />
                    )}
                    <div>
                      <div className={styles.tokenName}>{token.name}</div>
                    </div>
                    <div className={styles.tokenBalance}>
                      {token.balance || token.tokenBalance || '0.00'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.dropdownItemDisabled}>No tokens available</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            onClick={() => setClosePool(false)}
            className={styles.backButton}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Pools</span>
          </button>
          <h2 className={styles.headerTitle}>Add Liquidity</h2>
          <div className={styles.spacer}></div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Account Status */}
        {account && (
          <div className={styles.accountStatus}>
            <div className={styles.statusDot}></div>
            <span className={styles.statusText}>
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </div>
        )}

        {/* Token Selectors */}
        <div className={styles.tokenSelectors}>
          <TokenSelector
            selectedToken={tokenA}
            onSelect={handleTokenASelect}
            isOpen={showTokenADropdown}
            setIsOpen={setShowTokenADropdown}
            label="First Token"
            tokenData={tokenData}
          />

          <TokenSelector
            selectedToken={tokenB}
            onSelect={handleTokenBSelect}
            isOpen={showTokenBDropdown}
            setIsOpen={setShowTokenBDropdown}
            label="Second Token"
            tokenData={tokenData}
          />
        </div>

        {/* Fee Selection */}
        <div className={styles.feeSection}>
          <label className={styles.feeLabel}>Select Fee Tier</label>
          <button
            onClick={() => setShowFeeDropdown(!showFeeDropdown)}
            className={styles.feeButton}
          >
            <span>{selectedFee || 'Choose fee tier'}</span>
            <ChevronDown className={`${styles.chevronIcon} ${showFeeDropdown ? styles.chevronIconRotated : ''}`} />
          </button>
          
          {showFeeDropdown && (
            <div className={styles.feeDropdown}>
              {feePairs.map((pair, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedFee(pair.feeSystem);
                    setShowFeeDropdown(false);
                  }}
                  className={`${styles.feeDropdownItem} ${selectedFee === pair.fee ? styles.feeDropdownItemActive : ''}`}
                >
                  <div className={styles.feeItemContent}>
                    <div className={styles.feePercentage}>{pair.fee}</div>
                    <div className={styles.feeInfo}>{pair.info}</div>
                    <div className={styles.feeNumber}>{pair.number}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className={styles.priceRange}>
          <h3 className={styles.priceRangeTitle}>Set Price Range</h3>
          
          <div className={styles.priceControls}>
            <div className={styles.priceGroup}>
              <label className={styles.priceLabel}>Min Price</label>
              <div className={styles.priceInputContainer}>
                <button 
                  onClick={() => adjustMinPrice('-')}
                  className={styles.priceButton}
                  disabled={minPrice <= 0}
                >
                  -
                </button>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
                  className={styles.priceInput}
                  min="0"
                  step="0.01"
                />
                <button 
                  onClick={() => adjustMinPrice('+')}
                  className={styles.priceButton}
                >
                  +
                </button>
              </div>
              <span className={styles.priceUnit}>
                {tokenB?.symbol || 'Token B'} per {tokenA?.symbol || 'Token A'}
              </span>
            </div>

            <div className={styles.priceGroup}>
              <label className={styles.priceLabel}>Max Price</label>
              <div className={styles.priceInputContainer}>
                <button 
                  onClick={() => adjustMaxPrice('-')}
                  className={styles.priceButton}
                  disabled={maxPrice <= 0}
                >
                  -
                </button>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(0, Number(e.target.value)))}
                  className={styles.priceInput}
                  min="0"
                  step="0.01"
                />
                <button 
                  onClick={() => adjustMaxPrice('+')}
                  className={styles.priceButton}
                >
                  +
                </button>
              </div>
              <span className={styles.priceUnit}>
                {tokenB?.symbol || 'Token B'} per {tokenA?.symbol || 'Token A'}
              </span>
            </div>
          </div>
        </div>

        {/* Amount Inputs */}
        <div className={styles.amountInputs}>
          {/* Token A Amount */}
          <div className={styles.amountGroup}>
            <label className={styles.amountLabel}>
              {tokenA?.symbol || 'Token A'} Amount
            </label>
            <div className={styles.amountInputContainer}>
              <input
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder="0.0"
                className={styles.amountInput}
                min="0"
                step="0.000001"
              />
              <div className={styles.tokenSymbol}>
                <span>{tokenA?.symbol || ''}</span>
              </div>
            </div>
            {tokenA && (
              <div className={styles.tokenBalance}>
                Balance: {tokenA.balance || tokenA.tokenBalance || '0.00'} {tokenA.symbol}
              </div>
            )}
          </div>

          {/* Plus Icon */}
          <div className={styles.plusIcon}>
            <div className={styles.plusIconContainer}>
              <Plus className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Token B Amount */}
          <div className={styles.amountGroup}>
            <label className={styles.amountLabel}>
              {tokenB?.symbol || 'Token B'} Amount
            </label>
            <div className={styles.amountInputContainer}>
              <input
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder="0.0"
                className={styles.amountInput}
                min="0"
                step="0.000001"
              />
              <div className={styles.tokenSymbol}>
                <span>{tokenB?.symbol || ''}</span>
              </div>
            </div>
            {tokenB && (
              <div className={styles.tokenBalance}>
                Balance: {tokenB.balance || tokenB.tokenBalance || '0.00'} {tokenB.symbol}
              </div>
            )}
          </div>
        </div>

        {/* Pool Share Preview */}
        {amountA && amountB && tokenA && tokenB && (
          <div className={styles.poolShare}>
            <h3 className={styles.poolShareTitle}>Pool Share</h3>
            <div className={styles.poolShareItems}>
              <div className={styles.poolShareItem}>
                <span>{tokenA.symbol} deposited:</span>
                <span className={styles.poolShareValue}>{amountA}</span>
              </div>
              <div className={styles.poolShareItem}>
                <span>{tokenB.symbol} deposited:</span>
                <span className={styles.poolShareValue}>{amountB}</span>
              </div>
              <div className={`${styles.poolShareItem} ${styles.poolShareTotal}`}>
                <span>Share of pool:</span>
                <span className={styles.poolShareValue}>~0.01%</span>
              </div>
            </div>
          </div>
        )}

        {/* Add Liquidity Button */}
        <button
          onClick={handleAddLiquidity}
          disabled={!amountA || !amountB || !tokenA || !tokenB || !selectedFee || isLoading}
          className={`${styles.addButton} ${
            !amountA || !amountB || !tokenA || !tokenB || !selectedFee || isLoading
              ? styles.addButtonDisabled
              : styles.addButtonEnabled
          }`}
        >
          {isLoading ? (
            <div className={styles.loadingContent}>
              <div className={styles.loadingSpinner}></div>
              <span>Adding Liquidity...</span>
            </div>
          ) : (
            'Add Liquidity'
          )}
        </button>
      </div>
    </div>
  );
};

export default PoolAdd;