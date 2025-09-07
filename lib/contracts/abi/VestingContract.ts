export const VestingContractABI = [
  // Main Functions
  {
    "inputs": [],
    "name": "release",
    "outputs": [],
    "type": "function"
  },
  {
    "inputs": [{"name": "beneficiary", "type": "address"}],
    "name": "releaseFor",
    "outputs": [],
    "type": "function"
  },
  {
    "inputs": [
      {"name": "beneficiary", "type": "address"},
      {"name": "totalAmount", "type": "uint256"},
      {"name": "cliffDuration", "type": "uint256"},
      {"name": "duration", "type": "uint256"},
      {"name": "revocable", "type": "bool"}
    ],
    "name": "createVestingSchedule",
    "outputs": [],
    "type": "function"
  },
  {
    "inputs": [{"name": "beneficiary", "type": "address"}],
    "name": "revoke",
    "outputs": [],
    "type": "function"
  },

  // View Functions
  {
    "inputs": [{"name": "beneficiary", "type": "address"}],
    "name": "releasableAmount",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [{"name": "beneficiary", "type": "address"}],
    "name": "vestedAmount",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [{"name": "beneficiary", "type": "address"}],
    "name": "getVestingSchedule",
    "outputs": [
      {"name": "totalAmount", "type": "uint256"},
      {"name": "releasedAmount", "type": "uint256"},
      {"name": "startTime", "type": "uint256"},
      {"name": "cliffDuration", "type": "uint256"},
      {"name": "duration", "type": "uint256"},
      {"name": "revocable", "type": "bool"},
      {"name": "revoked", "type": "bool"},
      {"name": "vested", "type": "uint256"},
      {"name": "releasable", "type": "uint256"}
    ],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBeneficiaries",
    "outputs": [{"name": "", "type": "address[]"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBeneficiariesCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVestingAmount",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalReleasedAmount",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },

  // Storage mappings
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "vestingSchedules",
    "outputs": [
      {"name": "totalAmount", "type": "uint256"},
      {"name": "releasedAmount", "type": "uint256"},
      {"name": "startTime", "type": "uint256"},
      {"name": "cliffDuration", "type": "uint256"},
      {"name": "duration", "type": "uint256"},
      {"name": "revocable", "type": "bool"},
      {"name": "revoked", "type": "bool"}
    ],
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "uint256"}],
    "name": "beneficiaries",
    "outputs": [{"name": "", "type": "address"}],
    "type": "function"
  },

  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "beneficiary", "type": "address"},
      {"indexed": false, "name": "totalAmount", "type": "uint256"},
      {"indexed": false, "name": "cliffDuration", "type": "uint256"},
      {"indexed": false, "name": "duration", "type": "uint256"},
      {"indexed": false, "name": "revocable", "type": "bool"}
    ],
    "name": "VestingScheduleCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "beneficiary", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "TokensReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "beneficiary", "type": "address"}
    ],
    "name": "VestingRevoked",
    "type": "event"
  }
] as const;