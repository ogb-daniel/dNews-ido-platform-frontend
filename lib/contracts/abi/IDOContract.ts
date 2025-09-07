export const IDOContractABI = [
  // Main IDO Functions
  {
    "inputs": [{"name": "pUSDAmount", "type": "uint256"}],
    "name": "buyTokens",
    "outputs": [],
    "type": "function"
  },
  {
    "inputs": [{"name": "pUSDAmount", "type": "uint256"}, {"name": "referrer", "type": "address"}],
    "name": "buyTokensWithReferral",
    "outputs": [],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimTokens",
    "outputs": [],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimRefund",
    "outputs": [],
    "type": "function"
  },

  // Admin Functions
  {
    "inputs": [],
    "name": "startSale",
    "outputs": [],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "finalizeSale",
    "outputs": [],
    "type": "function"
  },

  // View Functions
  {
    "inputs": [],
    "name": "currentPhase",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenPrice",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokensForSale",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRaised",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hardCap",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "softCap",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minContribution",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxContribution",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "saleStartTime",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "saleEndTime",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalParticipants",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "contributions",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "tokenAllocations",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "hasClaimed",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hasEnded",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRemainingTokens",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getContribution",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getClaimableTokens",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSaleInfo",
    "outputs": [
      {"name": "phase", "type": "uint8"},
      {"name": "startTime", "type": "uint256"},
      {"name": "endTime", "type": "uint256"},
      {"name": "raised", "type": "uint256"},
      {"name": "participants", "type": "uint256"},
      {"name": "finalized", "type": "bool"}
    ],
    "type": "function"
  },

  // Token Addresses
  {
    "inputs": [],
    "name": "truthToken",
    "outputs": [{"name": "", "type": "address"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pUSDToken",
    "outputs": [{"name": "", "type": "address"}],
    "type": "function"
  },

  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "name": "startTime", "type": "uint256"},
      {"indexed": false, "name": "endTime", "type": "uint256"}
    ],
    "name": "SaleStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "buyer", "type": "address"},
      {"indexed": false, "name": "pUSDAmount", "type": "uint256"},
      {"indexed": false, "name": "truthAmount", "type": "uint256"}
    ],
    "name": "TokensPurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "claimer", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "TokensClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "claimer", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "RefundClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "name": "successful", "type": "bool"},
      {"indexed": false, "name": "totalRaised", "type": "uint256"}
    ],
    "name": "SaleFinalized",
    "type": "event"
  }
] as const;