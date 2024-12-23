export const CONTRACT_ADDRESS = '0xaA5B9f8Cea06543c194A93f209049901Ee569d57';
export const TOKEN_ADDRESS = '0x424516fBe635c5642723AB6c1b413fF61B177dd6';

export const MIN_BNB_CONTRIBUTION = 0.1;
export const MAX_BNB_CONTRIBUTION = 5;

export const CONTRACT_ABI = [
  {
    "name": "buyTokens",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "name": "getCurrentTokenPrice",
    "type": "function",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "name": "maxBnbPerUser",
    "type": "function",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "name": "minBnbPerUser",
    "type": "function",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "name": "remainingSRATokens",
    "type": "function",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "name": "tokensPerBNB",
    "type": "function",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "name": "saleActive",
    "type": "function",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "name": "emergencyMode",
    "type": "function",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "name": "claimTokens",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "getVestingInfo",
    "type": "function",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "totalAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "claimedAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "claimableNow",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "nextUnlock",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "remainingAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "priceAtPurchase",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  }
];