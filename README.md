# dNews TRUTH Token IDO Platform

A complete decentralized Initial DEX Offering (IDO) platform for the TRUTH token, built with Next.js frontend and Solidity smart contracts.

## 🌟 Features

### Smart Contracts

- **TRUTH Token (ERC-20)**: Fixed supply of 1B tokens with burning, pausing, and blacklisting features
- **IDO Contract**: Multi-phase token sale accepting PAU Dollar (pUSD) as payment
- **Vesting Contract**: Linear vesting for team and investor allocations
- **PAU Dollar Token**: Existing stable token (0xDd7639e3920426de6c59A1009C7ce2A9802d0920) for purchases

### Frontend

- **Modern UI**: Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui
- **Web3 Integration**: Complete wallet connection with MetaMask and other providers
- **Real-time Updates**: Live IDO statistics and progress tracking
- **Multi-phase Support**: Handles all IDO phases (Preparation, Active, Finalization, Claim, Ended)
- **Transaction Management**: Automatic approval flow for ERC-20 token purchases

## 🏗️ Architecture

### Smart Contract Layer

```
contracts/
├── TruthToken.sol       # Main ERC-20 token with advanced features
├── IDOContract.sol      # Token sale contract with multi-phase support
├── VestingContract.sol  # Token vesting for team/investors
└── PAUDollar.sol       # Mock pUSD token for testing
```

### Frontend Layer

```
components/
├── WalletConnection.tsx  # Wallet integration component
├── IDODashboard.tsx     # Main IDO interface
└── CountdownTimer.tsx   # Sale countdown timer

contexts/
├── WalletContext.tsx    # Wallet state management
└── IDOContext.tsx       # IDO data and contract interactions

lib/
└── contracts/           # Contract ABIs and utilities
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or compatible wallet
- Git

### Installation

1. **Install dependencies** (Hardhat may need manual installation)

   ```bash
   npm install
   # If Hardhat isn't installed:
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

### Local Development

1. **Compile contracts**

   ```bash
   npx hardhat compile
   # or
   npm run compile
   ```

2. **Deploy to local network**

   ```bash
   # Start local Hardhat network
   npx hardhat node

   # In another terminal, deploy contracts
   npx hardhat run scripts/deploy.js
   # or
   npm run deploy
   ```

3. **Start the frontend**

   ```bash
   npm run dev
   ```

4. **Configure MetaMask**
   - Add local network: http://localhost:8545, Chain ID: 31337
   - Import one of the test accounts from Hardhat node output

### Testnet Deployment

1. **Configure environment**

   ```bash
   # Add to .env
   SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   PRIVATE_KEY=your_deployer_private_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

2. **Deploy to Sepolia**

   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   # or
   npm run deploy:sepolia
   ```

3. **Start IDO**
   ```bash
   npx hardhat run scripts/start-ido.js --network sepolia
   # or
   npm run start-ido:sepolia
   ```

## 💡 Usage

### For Users

1. **Connect Wallet**: Use MetaMask or compatible wallet
2. **Get pUSD Tokens**: Ensure you have PAU Dollar tokens in your wallet (contract: 0xDd7639e3920426de6c59A1009C7ce2A9802d0920)
3. **Approve pUSD**: Allow the IDO contract to spend your pUSD
4. **Purchase TRUTH**: Buy tokens during the active phase
5. **Claim Tokens**: Claim your TRUTH tokens after successful IDO

### For Developers

#### Smart Contract Interactions

```typescript
import { getIDOContract, getPAUDollarContract } from "@/lib/contracts";

// Get pUSD for testing
const pUSDContract = getPAUDollarContract(signer);
await pUSDContract.faucet(ethers.parseEther("1000")); // Get 1000 pUSD

// Approve pUSD spending
const idoContract = getIDOContract(provider);
const idoAddress = await idoContract.getAddress();
await pUSDContract.approve(idoAddress, ethers.parseEther("100"));

// Purchase TRUTH tokens
await idoContract.buyTokens(ethers.parseEther("100")); // Buy with 100 pUSD
```

## 📊 IDO Configuration

### Token Economics

- **Total Supply**: 1,000,000,000 TRUTH
- **IDO Allocation**: 150,000,000 TRUTH (15%)
- **Token Price**: 1 pUSD per TRUTH (₦1,500 per TRUTH)
- **Hard Cap**: 22,500 pUSD (₦33,750,000)
- **Soft Cap**: 7,500 pUSD (₦11,250,000)
- **Primary Target**: Raise ₦10-30 million Nigerian Naira for development

### Contribution Limits

- **Minimum**: 10 pUSD (₦15,000)
- **Maximum**: 2,000 pUSD per address (₦3,000,000)

### Currency Context

- **pUSD Token**: Blockchain representation of Nigerian Naira value
- **Exchange Rate**: 1 pUSD = ₦1,500 (fixed for IDO)
- **Purpose**: Enable blockchain-based fundraising while targeting Naira amounts

### Sale Phases

1. **Preparation**: Contract deployment and setup
2. **Active**: Public token sale (30 days)
3. **Finalization**: Process results and setup claiming
4. **Claim**: Token claiming for participants
5. **Ended**: Sale concluded

## 🔒 Security Features

### Smart Contracts

- **Access Control**: Owner-only admin functions
- **Reentrancy Protection**: Guards on state-changing functions
- **Rate Limiting**: Protection against large transfers
- **Emergency Pause**: Ability to pause operations
- **Input Validation**: Comprehensive parameter validation

### Frontend

- **Secure Connections**: HTTPS enforcement
- **Input Sanitization**: XSS protection
- **Transaction Validation**: Multi-layer validation
- **Error Handling**: Graceful error management

## 🛠️ Implementation Status

### ✅ Completed

- Smart contract implementation (TruthToken, IDOContract, VestingContract, PAUDollar)
- Frontend contexts with Web3 integration
- IDO dashboard with approval flow
- Deployment scripts and configuration
- Comprehensive test cases (see `smart_contract_tests.js` and `frontend_tests.js`)

### 🔄 Next Steps

1. **Complete Hardhat setup**: Install dependencies and compile contracts
2. **Deploy contracts**: Run deployment script to local network or testnet
3. **Update contract addresses**: Copy deployed addresses to `lib/contracts/addresses.json`
4. **Test integration**: Verify frontend connects to deployed contracts
5. **Run tests**: Execute comprehensive test suites

## 🧪 Testing

Run the test suites to validate implementation:

```bash
# Contract tests (once Hardhat is set up)
npx hardhat test

# Frontend tests (configure as needed)
npm run test:frontend

# All tests
npm run test:all
```

## 🚀 Deployment Commands

```bash
# Local development
npx hardhat node                    # Start local network
npx hardhat run scripts/deploy.js   # Deploy contracts
npx hardhat run scripts/start-ido.js # Start IDO

# Testnet deployment
npm run deploy:sepolia              # Deploy to Sepolia
npm run start-ido:sepolia          # Start IDO on Sepolia
```

## ⚠️ Important Notes

- This implementation uses PAU Dollar (pUSD) as specified in requirements
- Contracts include comprehensive security features and access controls
- Frontend includes complete Web3 integration with error handling
- Test cases cover both smart contracts and frontend functionality
- **Always test thoroughly** before any production deployment
