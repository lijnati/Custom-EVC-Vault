import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, VAULT_ABI, TOKEN_ABI, EVC_ABI } from './contracts';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [contracts, setContracts] = useState({});
  const [vaultData, setVaultData] = useState({
    userDeposit: '0',
    userBorrow: '0',
    tokenBalance: '0',
    tokenAllowance: '0',
    health: '0',
    totalDeposits: '0',
    totalBorrows: '0'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAccount(accounts[0]);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask!');
        return;
      }

      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setBalance(ethers.formatEther(balance));

      // Initialize contracts
      const vaultContract = new ethers.Contract(CONTRACTS.VAULT, VAULT_ABI, signer);
      const tokenContract = new ethers.Contract(CONTRACTS.TOKEN, TOKEN_ABI, signer);
      const evcContract = new ethers.Contract(CONTRACTS.EVC, EVC_ABI, signer);

      setContracts({
        vault: vaultContract,
        token: tokenContract,
        evc: evcContract
      });

      setError('');
      await loadVaultData(vaultContract, tokenContract, address);
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAccount('');
    setBalance('0');
    setContracts({});
    setVaultData({
      userDeposit: '0',
      userBorrow: '0', 
      tokenBalance: '0',
      tokenAllowance: '0',
      health: '0',
      totalDeposits: '0',
      totalBorrows: '0'
    });
  };

  const loadVaultData = async (vaultContract, tokenContract, userAddress) => {
    try {
      const [
        userDeposit,
        userBorrow,
        tokenBalance,
        tokenAllowance,
        health,
        totalDeposits,
        totalBorrows
      ] = await Promise.all([
        vaultContract.balances(userAddress),
        vaultContract.borrowBalances(userAddress),
        tokenContract.balanceOf(userAddress),
        tokenContract.allowance(userAddress, CONTRACTS.VAULT),
        vaultContract.getAccountHealth(userAddress),
        vaultContract.totalDeposits(),
        vaultContract.totalBorrows()
      ]);

      setVaultData({
        userDeposit: ethers.formatEther(userDeposit),
        userBorrow: ethers.formatEther(userBorrow),
        tokenBalance: ethers.formatEther(tokenBalance),
        tokenAllowance: ethers.formatEther(tokenAllowance),
        health: health.toString(),
        totalDeposits: ethers.formatEther(totalDeposits),
        totalBorrows: ethers.formatEther(totalBorrows)
      });
    } catch (err) {
      console.error('Failed to load vault data:', err);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !contracts.vault || !contracts.token) return;
    
    try {
      setLoading(true);
      setError('');
      
      const amount = ethers.parseEther(depositAmount);
      
      // Check and approve if needed
      if (parseFloat(vaultData.tokenAllowance) < parseFloat(depositAmount)) {
        setSuccess('Approving tokens...');
        const approveTx = await contracts.token.approve(CONTRACTS.VAULT, amount);
        await approveTx.wait();
      }
      
      setSuccess('Depositing...');
      const tx = await contracts.vault.deposit(amount);
      await tx.wait();
      
      setSuccess('Deposit successful!');
      setDepositAmount('');
      await loadVaultData(contracts.vault, contracts.token, account);
    } catch (err) {
      setError('Deposit failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !contracts.vault) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('Withdrawing...');
      
      const amount = ethers.parseEther(withdrawAmount);
      const tx = await contracts.vault.withdraw(amount);
      await tx.wait();
      
      setSuccess('Withdrawal successful!');
      setWithdrawAmount('');
      await loadVaultData(contracts.vault, contracts.token, account);
    } catch (err) {
      setError('Withdrawal failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!borrowAmount || !contracts.vault || !contracts.evc) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Enable vault as controller if not already enabled
      const isEnabled = await contracts.evc.isControllerEnabled(account, CONTRACTS.VAULT);
      if (!isEnabled) {
        setSuccess('Enabling vault as controller...');
        const enableTx = await contracts.evc.enableController(account, CONTRACTS.VAULT);
        await enableTx.wait();
      }
      
      setSuccess('Borrowing...');
      const amount = ethers.parseEther(borrowAmount);
      const tx = await contracts.vault.borrow(amount);
      await tx.wait();
      
      setSuccess('Borrow successful!');
      setBorrowAmount('');
      await loadVaultData(contracts.vault, contracts.token, account);
    } catch (err) {
      setError('Borrow failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    if (!repayAmount || !contracts.vault || !contracts.token) return;
    
    try {
      setLoading(true);
      setError('');
      
      const amount = ethers.parseEther(repayAmount);
      
      // Check and approve if needed
      if (parseFloat(vaultData.tokenAllowance) < parseFloat(repayAmount)) {
        setSuccess('Approving tokens...');
        const approveTx = await contracts.token.approve(CONTRACTS.VAULT, amount);
        await approveTx.wait();
      }
      
      setSuccess('Repaying...');
      const tx = await contracts.vault.repay(amount);
      await tx.wait();
      
      setSuccess('Repayment successful!');
      setRepayAmount('');
      await loadVaultData(contracts.vault, contracts.token, account);
    } catch (err) {
      setError('Repayment failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (health) => {
    if (health === '0' || health === '115792089237316195423570985008687907853269984665640564039457584007913129639935') {
      return { status: 'healthy', text: 'No Debt' };
    }
    const healthRatio = parseFloat(health) / 10000;
    if (healthRatio >= 1.5) return { status: 'healthy', text: `${healthRatio.toFixed(2)}x` };
    if (healthRatio >= 1.1) return { status: 'warning', text: `${healthRatio.toFixed(2)}x` };
    return { status: 'danger', text: `${healthRatio.toFixed(2)}x` };
  };

  const healthStatus = getHealthStatus(vaultData.health);

  return (
    <div className="container">
      <div className="header">
        <h1>EVC Custom Vault</h1>
        <p>Deposit, borrow, and manage your collateralized positions</p>
      </div>

      <div className="wallet-section">
        {!account ? (
          <div style={{ textAlign: 'center' }}>
            <button 
              className="connect-button" 
              onClick={connectWallet}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div className="wallet-info">
            <div>
              <div className="address">{account.slice(0, 6)}...{account.slice(-4)}</div>
              <div className="balance">{parseFloat(balance).toFixed(4)} ETH</div>
            </div>
            <button className="connect-button" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {account && (
        <>
          <div className="vault-card">
            <h3>Vault Overview</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{parseFloat(vaultData.userDeposit).toFixed(4)}</div>
                <div className="stat-label">Your Deposit</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{parseFloat(vaultData.userBorrow).toFixed(4)}</div>
                <div className="stat-label">Your Debt</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{parseFloat(vaultData.tokenBalance).toFixed(4)}</div>
                <div className="stat-label">Token Balance</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{parseFloat(vaultData.totalDeposits).toFixed(2)}</div>
                <div className="stat-label">Total Deposits</div>
              </div>
            </div>
            
            <div className={`health-indicator health-${healthStatus.status}`}>
              Health Factor: {healthStatus.text}
            </div>
          </div>

          <div className="vault-grid">
            <div className="vault-card">
              <h3>Deposit Collateral</h3>
              <div className="input-group">
                <label>Amount to Deposit</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                />
              </div>
              <button 
                className="action-button"
                onClick={handleDeposit}
                disabled={loading || !depositAmount}
              >
                {loading ? 'Processing...' : 'Deposit'}
              </button>
            </div>

            <div className="vault-card">
              <h3>Withdraw Collateral</h3>
              <div className="input-group">
                <label>Amount to Withdraw</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                  max={vaultData.userDeposit}
                />
              </div>
              <button 
                className="action-button warning"
                onClick={handleWithdraw}
                disabled={loading || !withdrawAmount || parseFloat(vaultData.userDeposit) === 0}
              >
                {loading ? 'Processing...' : 'Withdraw'}
              </button>
            </div>

            <div className="vault-card">
              <h3>Borrow</h3>
              <div className="input-group">
                <label>Amount to Borrow</label>
                <input
                  type="number"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                />
              </div>
              <button 
                className="action-button"
                onClick={handleBorrow}
                disabled={loading || !borrowAmount || parseFloat(vaultData.userDeposit) === 0}
              >
                {loading ? 'Processing...' : 'Borrow'}
              </button>
            </div>

            <div className="vault-card">
              <h3>Repay Debt</h3>
              <div className="input-group">
                <label>Amount to Repay</label>
                <input
                  type="number"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                  max={vaultData.userBorrow}
                />
              </div>
              <button 
                className="action-button danger"
                onClick={handleRepay}
                disabled={loading || !repayAmount || parseFloat(vaultData.userBorrow) === 0}
              >
                {loading ? 'Processing...' : 'Repay'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;