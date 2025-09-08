const { ethers } = require('ethers');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const SEPOLIA_RPC = process.env.SEPOLIA_URL;
const PAUSD_ADDRESS = process.env.NEXT_PUBLIC_PAUSD_CONTRACT_ADDRESS;
const TRUTH_ADDRESS = process.env.NEXT_PUBLIC_TRUTH_CONTRACT_ADDRESS;
const IDO_ADDRESS = process.env.NEXT_PUBLIC_IDO_CONTRACT_ADDRESS;

// Your wallet address from deployment
const WALLET_ADDRESS = '0x4A3e51080844329b7D841e2bE9da7DF5A3dEa4fB';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

async function checkBalances() {
  console.log('🔍 Checking contract balances on Sepolia...\n');
  
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  
  try {
    // Check ETH balance
    const ethBalance = await provider.getBalance(WALLET_ADDRESS);
    console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
    
    // Check pUSD balance
    const pUSDContract = new ethers.Contract(PAUSD_ADDRESS, ERC20_ABI, provider);
    const pUSDBalance = await pUSDContract.balanceOf(WALLET_ADDRESS);
    const pUSDDecimals = await pUSDContract.decimals();
    const pUSDSymbol = await pUSDContract.symbol();
    console.log(`🪙  ${pUSDSymbol} Balance: ${ethers.formatUnits(pUSDBalance, pUSDDecimals)} ${pUSDSymbol}`);
    
    // Check TRUTH balance
    const truthContract = new ethers.Contract(TRUTH_ADDRESS, ERC20_ABI, provider);
    const truthBalance = await truthContract.balanceOf(WALLET_ADDRESS);
    const truthDecimals = await truthContract.decimals();
    const truthSymbol = await truthContract.symbol();
    console.log(`🎯 ${truthSymbol} Balance: ${ethers.formatUnits(truthBalance, truthDecimals)} ${truthSymbol}`);
    
    console.log('\n📋 Contract Addresses:');
    console.log(`   pUSD: ${PAUSD_ADDRESS}`);
    console.log(`   TRUTH: ${TRUTH_ADDRESS}`);
    console.log(`   IDO: ${IDO_ADDRESS}`);
    
  } catch (error) {
    console.error('❌ Error checking balances:', error.message);
  }
}

checkBalances();