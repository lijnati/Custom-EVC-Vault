# Custom EVC Vault

A comprehensive DeFi lending protocol built with Ethereum Vault Connector (EVC) integration, featuring a full-stack implementation with smart contracts and a React frontend interface.

## 🚀 Features

### Smart Contract Features
- **Collateralized Lending**: Deposit ERC20 tokens as collateral and borrow against them
- **Health Factor Monitoring**: Real-time position health tracking with 80% collateral factor
- **EVC Integration**: Proper controller management and account status validation
- **Liquidation System**: Automated liquidation of unhealthy positions with 10% bonus
- **Interest Rate Management**: Configurable interest rates (default 5% APR)
- **Security**: ReentrancyGuard protection and comprehensive access controls

### Frontend Features
- **Wallet Integration**: Seamless MetaMask connection and management
- **Real-time Dashboard**: Live updates of balances, deposits, borrows, and health factors
- **Interactive UI**: User-friendly interface for all vault operations
- **Transaction Management**: Automatic token approvals and transaction confirmations
- **Health Visualization**: Color-coded health factor indicators (healthy/warning/danger)


## 🏗️ Architecture

### Smart Contracts
- **CustomVault.sol**: Main vault contract with lending/borrowing logic
- **MockToken.sol**: ERC20 token for testing and demonstration
- **MockEVC.sol**: Mock Ethereum Vault Connector for development

### Frontend Stack
- **React 18**: Modern React with hooks and functional components
- **Ethers.js v6**: Latest Web3 integration library
- **CSS3**: Custom styling with gradients and animations
- **MetaMask**: Primary wallet connection method

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- Git

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd custom-evc-vault
```

### 2. Install Dependencies
```bash
# Install smart contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key_here
```

### 4. Compile Smart Contracts
```bash
npm run compile
```

### 5. Run Tests
```bash
npm run test
```

### 6. Deploy Contracts

**Local Deployment:**
```bash
npm run deploy
```

**Sepolia Testnet Deployment:**
```bash
npm run deploy:sepolia
```

