# dNews TRUTH Token & IDO - Product Requirements Document

## 1. Executive Summary

### Project Overview

Development and deployment of the TRUTH token ecosystem for dNews, a decentralized media platform. This includes an ERC-20 compliant token contract and an Initial DEX Offering (IDO) smart contract system deployed on Ethereum Sepolia testnet, accompanied by a user-friendly frontend application.

### Key Objectives

- Deploy secure, auditable smart contracts for TRUTH token and IDO
- Create intuitive frontend for token purchase and management
- Implement comprehensive testing framework
- Ensure security best practices across all layers
- Enable transparent, community-driven token distribution

## 2. Technical Architecture

### 2.1 Smart Contract Layer

- **Blockchain**: Ethereum Sepolia Testnet
- **Language**: Solidity ^0.8.19
- **Framework**: Hardhat for development, testing, and deployment
- **Standards**: ERC-20, OpenZeppelin contracts for security

### 2.2 Frontend Layer

- **Framework**: Nextjs with TypeScript
- **Web3 Integration**: Ethers.js v6 or Wagmi
- **UI Library**: Tailwind CSS with shadcn/ui components
- **Wallet Connection**: WalletConnect v2, MetaMask support
- **State Management**: React Context API or Zustand

### 2.3 Testing Framework

- **Smart Contracts**: Hardhat testing with Mocha/Chai
- **Frontend**: Jest, React Testing Library, Cypress for E2E
- **Coverage**: Minimum 95% code coverage for smart contracts

## 3. Smart Contract Requirements

### 3.1 TRUTH Token Contract (ERC-20)

#### Core Features

- **Name**: TRUTH Token
- **Symbol**: TRUTH
- **Decimals**: 18
- **Total Supply**: 1,000,000,000 TRUTH (fixed supply)
- **Mintable**: No (fixed supply prevents inflation)
- **Burnable**: Yes (for deflationary mechanics)

#### Distribution Allocation

```
- Community Rewards: 400,000,000 TRUTH (40%)
- Team & Founders: 200,000,000 TRUTH (20%)
- IDO Sale: 150,000,000 TRUTH (15%)
- DAO Treasury: 150,000,000 TRUTH (15%)
- Private Investors: 100,000,000 TRUTH (10%)
```

#### Advanced Features

- **Vesting Mechanism**: Linear vesting for team and investor allocations
- **Transfer Restrictions**: Pausable transfers (emergency use only)
- **Governance Integration**: EIP-2612 permit functionality
- **Blacklisting**: Emergency blacklist functionality for malicious actors

#### Security Requirements

- Reentrancy protection
- Access control (Owner, Admin roles)
- Emergency pause functionality
- Rate limiting for large transfers
- Multi-signature wallet integration for critical functions

### 3.2 IDO Contract

#### Sale Configuration

- **Sale Token**: TRUTH
- **Payment Token**: ETH
- **Sale Duration**: 7 days (configurable)
- **Price**: 0.00015 ETH per TRUTH (adjustable)
- **Hard Cap**: 22.5 ETH (150M TRUTH at 0.00015 ETH/TRUTH)
- **Soft Cap**: 7.5 ETH (minimum viable raise)
- **Individual Caps**: Min 0.01 ETH, Max 2 ETH per address

#### Phases

1. **Preparation Phase**: Contract deployment and configuration
2. **Active Sale Phase**: Public token sale period
3. **Finalization Phase**: Liquidity pool creation and token distribution
4. **Claim Phase**: Token claiming for participants

#### Core Functions

```solidity
// Purchase functions
function buyTokens() external payable
function buyTokensWithReferral(address referrer) external payable

// Admin functions
function startSale() external onlyOwner
function finalizeSale() external onlyOwner
function emergencyPause() external onlyOwner

// User functions
function claimTokens() external
function getContribution(address user) external view returns (uint256)
function getRemainingTokens() external view returns (uint256)
```

#### Security Features

- Contribution limits per address
- Whitelist functionality (optional)
- Refund mechanism if soft cap not met
- Time-locked token release
- Reentrancy guards on all state-changing functions

### 3.3 Vesting Contract

#### Features

- Linear vesting over specified periods
- Cliff periods for team and investors
- Emergency revoke functionality
- Multiple beneficiary support

#### Vesting Schedules

- **Team/Founders**: 4-year linear vesting, 1-year cliff
- **Private Investors**: 2-year linear vesting, 6-month cliff
- **Community Rewards**: Gradual release over 5 years

## 4. Frontend Requirements

### 4.1 Core Pages

#### Landing Page

- Project overview and tokenomics
- IDO countdown timer
- Key metrics display (raised amount, remaining tokens)
- Team and roadmap sections

#### IDO Dashboard

- Wallet connection interface
- Real-time sale statistics
- Token purchase interface
- Transaction history
- Claiming interface post-sale

#### Portfolio Page

- User token balance
- Vesting schedules (if applicable)
- Transaction history
- Staking interface (future implementation)

### 4.2 Key Components

#### Wallet Integration

- Support for MetaMask, WalletConnect, Coinbase Wallet
- Network switching to Sepolia testnet
- Account balance display
- Connection status indicators

#### Purchase Interface

```typescript
interface PurchaseForm {
  ethAmount: string;
  truthAmount: string;
  gasEstimate: string;
  transactionFee: string;
}
```

#### Real-time Updates

- WebSocket or polling for live sale data
- Transaction status notifications
- Progress bars for sale completion
- Countdown timers

#### Security Features

- Input validation and sanitization
- Rate limiting on API calls
- CSP (Content Security Policy) headers
- XSS protection
- Secure wallet connection handling

### 4.3 Web3 Integration

#### Core Functions

```typescript
// Contract interactions
async function purchaseTokens(ethAmount: string): Promise<TransactionResponse>;
async function claimTokens(): Promise<TransactionResponse>;
async function getContribution(address: string): Promise<BigNumber>;

// Utility functions
async function connectWallet(): Promise<string>;
async function switchNetwork(): Promise<void>;
async function getGasEstimate(ethAmount: string): Promise<BigNumber>;
```

## 5. Testing Requirements

### 5.1 Smart Contract Testing

#### Unit Tests

- Token contract functionality (transfer, approve, burn)
- IDO contract purchase logic
- Vesting contract release mechanisms
- Access control and permissions
- Edge cases and error conditions

#### Integration Tests

- End-to-end IDO flow simulation
- Multi-contract interactions
- Gas optimization validation
- Network congestion scenarios

#### Security Tests

- Reentrancy attack prevention
- Integer overflow/underflow protection
- Access control bypass attempts
- Front-running resistance

### 5.2 Frontend Testing

#### Unit Tests

- Component rendering and behavior
- Utility function accuracy
- Web3 integration functions
- State management logic

#### Integration Tests

- Wallet connection flows
- Contract interaction scenarios
- Error handling and recovery
- Cross-browser compatibility

#### End-to-End Tests

- Complete user journey testing
- Mobile responsiveness
- Performance under load
- Accessibility compliance

## 6. Security Requirements

### 6.1 Smart Contract Security

#### Code Review Checklist

- OpenZeppelin library usage for standard functionality
- Proper access control implementation
- Reentrancy protection on all external calls
- Input validation for all parameters
- Gas optimization to prevent DoS attacks

#### Audit Requirements

- Internal security review
- Automated security scanning (Slither, MythX)
- Manual penetration testing
- Third-party audit (recommended for mainnet)

### 6.2 Frontend Security

#### Implementation Standards

- Secure wallet connection protocols
- Input sanitization and validation
- XSS and CSRF protection
- Secure API communication
- Private key protection education

#### Monitoring and Logging

- Transaction monitoring dashboard
- Error logging and alerting
- Performance metrics tracking
- Security incident response procedures

## 7. Deployment Strategy

### 7.1 Smart Contract Deployment

#### Sepolia Testnet Deployment

```bash
# Deployment sequence
1. Deploy TRUTH token contract
2. Deploy vesting contracts
3. Deploy IDO contract
4. Configure contract relationships
5. Transfer ownership to multisig wallet
```

#### Verification and Setup

- Contract verification on Etherscan
- Initial token distribution
- IDO configuration
- Admin role assignments

### 7.2 Frontend Deployment

#### Hosting Requirements

- Static site hosting (Vercel, Netlify)
- CDN integration for global performance
- SSL certificate and HTTPS enforcement
- Environment-specific configurations

#### CI/CD Pipeline

- Automated testing on pull requests
- Staging environment deployment
- Production deployment with manual approval
- Rollback procedures

## 8. User Experience Flow

### 8.1 First-Time User Journey

1. User visits IDO website
2. Connects MetaMask wallet
3. Switches to Sepolia testnet (if needed)
4. Reviews IDO details and tokenomics
5. Enters purchase amount
6. Confirms transaction in wallet
7. Receives confirmation and tracking info

### 8.2 Returning User Experience

1. Automatic wallet connection
2. Dashboard showing contribution history
3. Real-time updates on sale progress
4. Token claiming interface post-sale
5. Portfolio management features

## 9. Success Metrics

### 9.1 Technical Metrics

- Zero critical security vulnerabilities
- 99.9% uptime during IDO period
- <3 second page load times
- <$5 average gas cost per transaction

### 9.2 Business Metrics

- Successful IDO completion within timeline
- Community participation rate >70%
- User satisfaction score >4.5/5
- Zero fund loss incidents

## 10. Risk Management

### 10.1 Technical Risks

- Smart contract vulnerabilities
- Frontend security breaches
- Network congestion during high demand
- Wallet compatibility issues

### 10.2 Mitigation Strategies

- Comprehensive testing and audits
- Emergency pause mechanisms
- Load balancing and scaling
- Multi-wallet support implementation

## 11. Timeline and Milestones

### Phase 1: Development (Weeks 1-4)

- Smart contract development and testing
- Frontend application development
- Integration and system testing

### Phase 2: Security Review (Weeks 5-6)

- Internal security audit
- Penetration testing
- Bug fixes and optimizations

### Phase 3: Deployment (Weeks 7-8)

- Testnet deployment and validation
- Frontend deployment and testing
- Documentation and user guides

### Phase 4: IDO Launch (Week 9)

- Public IDO announcement
- Community engagement
- Live monitoring and support

## 12. Future Considerations

### Mainnet Migration

- Gas optimization for mainnet deployment
- Liquidity pool integration with Uniswap
- Cross-chain compatibility planning

### Feature Enhancements

- Staking mechanism implementation
- Governance voting interface
- Advanced analytics dashboard
- Mobile application development

---

This PRD serves as the foundation for implementing a secure, user-friendly, and technically robust TRUTH token and IDO system that aligns with dNews's vision of decentralized, community-driven journalism.
