import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Load contract addresses
  const networkName = (await ethers.provider.getNetwork()).name || "localhost";
  const deploymentFile = path.join(__dirname, "..", "deployments", `${networkName}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const idoContractAddress = deployment.contracts.IDOContract.address;

  console.log("🚀 Starting IDO...");
  console.log("IDO Contract address:", idoContractAddress);
  console.log("Caller:", deployer.address);

  // Get IDO contract instance
  const IDOContract = await ethers.getContractFactory("IDOContract");
  const idoContract = IDOContract.attach(idoContractAddress);

  // Check current phase
  const currentPhase = await idoContract.currentPhase();
  console.log("Current phase:", currentPhase.toString());

  if (currentPhase !== 0n) { // PREPARATION phase is 0
    console.log("❌ IDO is not in PREPARATION phase. Current phase:", currentPhase.toString());
    const phases = ["PREPARATION", "ACTIVE", "FINALIZATION", "CLAIM", "ENDED"];
    console.log("Phase meaning:", phases[Number(currentPhase)] || "UNKNOWN");
    return;
  }

  // Check if contract has enough TRUTH tokens
  const truthTokenAddress = await idoContract.truthToken();
  const TruthToken = await ethers.getContractFactory("TruthToken");
  const truthToken = TruthToken.attach(truthTokenAddress);
  
  const contractBalance = await truthToken.balanceOf(idoContractAddress);
  const tokensForSale = await idoContract.tokensForSale();
  
  console.log("Contract TRUTH balance:", ethers.formatEther(contractBalance));
  console.log("Tokens for sale:", ethers.formatEther(tokensForSale));

  if (contractBalance < tokensForSale) {
    console.log("❌ IDO contract doesn't have enough TRUTH tokens");
    console.log("Required:", ethers.formatEther(tokensForSale));
    console.log("Available:", ethers.formatEther(contractBalance));
    return;
  }

  // Start the IDO
  console.log("🎯 Starting IDO sale...");
  const tx = await idoContract.startSale();
  console.log("Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ IDO started successfully!");
  console.log("Gas used:", receipt.gasUsed.toString());

  // Get sale info
  const saleInfo = await idoContract.getSaleInfo();
  const [phase, startTime, endTime, raised, participants, finalized] = saleInfo;
  
  console.log("\n=== IDO Sale Information ===");
  console.log("Phase:", ["PREPARATION", "ACTIVE", "FINALIZATION", "CLAIM", "ENDED"][Number(phase)]);
  console.log("Start time:", new Date(Number(startTime) * 1000).toISOString());
  console.log("End time:", new Date(Number(endTime) * 1000).toISOString());
  console.log("Total raised:", ethers.formatEther(raised), "pUSD");
  console.log("Participants:", participants.toString());
  console.log("Finalized:", finalized);

  // Get configuration
  const tokenPrice = await idoContract.tokenPrice();
  const softCap = await idoContract.softCap();
  const hardCap = await idoContract.hardCap();
  const minContribution = await idoContract.minContribution();
  const maxContribution = await idoContract.maxContribution();

  console.log("\n=== IDO Configuration ===");
  console.log("Token price:", ethers.formatEther(tokenPrice), "pUSD per TRUTH");
  console.log("Soft cap:", ethers.formatEther(softCap), "pUSD");
  console.log("Hard cap:", ethers.formatEther(hardCap), "pUSD");
  console.log("Min contribution:", ethers.formatEther(minContribution), "pUSD");
  console.log("Max contribution:", ethers.formatEther(maxContribution), "pUSD");

  console.log("\n🎉 IDO is now ACTIVE and accepting contributions!");
  console.log("💰 Users can now purchase TRUTH tokens with pUSD");
  console.log("🕒 Sale ends at:", new Date(Number(endTime) * 1000).toLocaleString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error starting IDO:", error);
    process.exit(1);
  });