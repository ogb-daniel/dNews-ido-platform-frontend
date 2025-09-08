import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString()
  );

  // PAU Dollar token decimals (we know it's 0 from previous checks)
  const pUSDAddress = "0xDd7639e3920426de6c59A1009C7ce2A9802d0920";
  const pUSDDecimals = 0;
  
  console.log("pUSD token decimals:", pUSDDecimals);

  // Deployment parameters - use correct decimals for pUSD amounts
  // Since pUSD has 0 decimals, prices must be whole numbers
  const TOTAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion TRUTH tokens
  const TOKEN_PRICE = ethers.parseUnits("1", pUSDDecimals); // 1 pUSD per TRUTH token (whole number)
  const TOKENS_FOR_SALE = ethers.parseEther("150000000"); // 150 million TRUTH for IDO (TRUTH has 18 decimals)
  const SOFT_CAP = ethers.parseUnits("7500", pUSDDecimals); // 7,500 pUSD
  const HARD_CAP = ethers.parseUnits("22500", pUSDDecimals); // 22,500 pUSD  
  const MIN_CONTRIBUTION = ethers.parseUnits("10", pUSDDecimals); // 10 pUSD minimum
  const MAX_CONTRIBUTION = ethers.parseUnits("2000", pUSDDecimals); // 2,000 pUSD maximum
  const SALE_DURATION = 30 * 24 * 60 * 60; // 30 days

  // Use existing PAU Dollar token
  console.log("\n=== Using Existing PAU Dollar (pUSD) Token ===");
  console.log("PAU Dollar address:", pUSDAddress);

  // Deploy TRUTH Token
  console.log("\n=== Deploying TRUTH Token ===");
  const TruthToken = await ethers.getContractFactory("TruthToken");
  const truthToken = await TruthToken.deploy(
    "TRUTH Token",
    "TRUTH",
    TOTAL_SUPPLY,
    deployer.address, // Treasury address
    deployer.address // Team address
  );
  await truthToken.waitForDeployment();
  const truthTokenAddress = await truthToken.getAddress();
  console.log("TRUTH Token deployed to:", truthTokenAddress);

  // Deploy IDO Contract
  console.log("\n=== Deploying IDO Contract ===");
  const IDOContract = await ethers.getContractFactory("IDOContract");
  const idoContract = await IDOContract.deploy(
    truthTokenAddress,
    pUSDAddress,
    TOKEN_PRICE,
    TOKENS_FOR_SALE,
    SOFT_CAP,
    HARD_CAP,
    MIN_CONTRIBUTION,
    MAX_CONTRIBUTION,
    SALE_DURATION
  );
  await idoContract.waitForDeployment();
  const idoContractAddress = await idoContract.getAddress();
  console.log("IDO Contract deployed to:", idoContractAddress);

  // Deploy Vesting Contract
  console.log("\n=== Deploying Vesting Contract ===");
  const VestingContract = await ethers.getContractFactory("VestingContract");
  const vestingContract = await VestingContract.deploy(truthTokenAddress);
  await vestingContract.waitForDeployment();
  const vestingContractAddress = await vestingContract.getAddress();
  console.log("Vesting Contract deployed to:", vestingContractAddress);

  // Transfer tokens to IDO contract
  console.log("\n=== Setting up token allocations ===");
  console.log("Transferring TRUTH tokens to IDO contract...");
  const transferTx = await truthToken.transfer(
    idoContractAddress,
    TOKENS_FOR_SALE
  );
  await transferTx.wait();
  console.log(
    "✅ Transferred",
    ethers.formatEther(TOKENS_FOR_SALE),
    "TRUTH tokens to IDO contract"
  );

  // Check pUSD balance (existing token, no minting needed)
  // console.log("Checking pUSD balance...");
  // try {
  //   const pUSDBalance = await pUSD.balanceOf(deployer.address);
  //   console.log(
  //     "✅ Deployer pUSD balance:",
  //     ethers.formatEther(pUSDBalance),
  //     "pUSD"
  //   );
  // } catch (error) {
  //   console.log(
  //     "⚠️ Could not check pUSD balance (contract may not be accessible)"
  //   );
  // }

  // Create deployment info object
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      PAUDollar: {
        address: pUSDAddress,
        constructorArgs: [],
      },
      TruthToken: {
        address: truthTokenAddress,
        constructorArgs: [
          "TRUTH Token",
          "TRUTH",
          TOTAL_SUPPLY.toString(),
          deployer.address,
          deployer.address,
        ],
      },
      IDOContract: {
        address: idoContractAddress,
        constructorArgs: [
          truthTokenAddress,
          pUSDAddress,
          TOKEN_PRICE.toString(),
          TOKENS_FOR_SALE.toString(),
          SOFT_CAP.toString(),
          HARD_CAP.toString(),
          MIN_CONTRIBUTION.toString(),
          MAX_CONTRIBUTION.toString(),
          SALE_DURATION,
        ],
      },
      VestingContract: {
        address: vestingContractAddress,
        constructorArgs: [truthTokenAddress],
      },
    },
    configuration: {
      tokenPrice: ethers.formatEther(TOKEN_PRICE),
      tokensForSale: ethers.formatEther(TOKENS_FOR_SALE),
      softCap: ethers.formatEther(SOFT_CAP),
      hardCap: ethers.formatEther(HARD_CAP),
      minContribution: ethers.formatEther(MIN_CONTRIBUTION),
      maxContribution: ethers.formatEther(MAX_CONTRIBUTION),
      saleDuration: SALE_DURATION,
    },
    deploymentTime: new Date().toISOString(),
    gasUsed: {
      pUSD: "N/A",
      truthToken:
        (await truthToken.deploymentTransaction()).gasLimit?.toString() ||
        "N/A",
      idoContract:
        (await idoContract.deploymentTransaction()).gasLimit?.toString() ||
        "N/A",
      vestingContract:
        (await vestingContract.deploymentTransaction()).gasLimit?.toString() ||
        "N/A",
    },
  };

  // Save deployment info to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkName = (await ethers.provider.getNetwork()).name || "localhost";
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  // Create contract addresses file for frontend
  const contractAddresses = {
    PAUDollar: pUSDAddress,
    TruthToken: truthTokenAddress,
    IDOContract: idoContractAddress,
    VestingContract: vestingContractAddress,
  };

  const contractAddressesFile = path.join(
    __dirname,
    "..",
    "lib",
    "contracts",
    "addresses.json"
  );
  const contractsDir = path.join(__dirname, "..", "lib", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  fs.writeFileSync(
    contractAddressesFile,
    JSON.stringify(contractAddresses, null, 2)
  );

  console.log("\n=== Deployment Summary ===");
  console.log("✅ All contracts deployed successfully!");
  console.log("📄 Deployment info saved to:", deploymentFile);
  console.log("🔗 Contract addresses saved to:", contractAddressesFile);

  console.log("\n=== Contract Addresses ===");
  console.log("PAU Dollar (pUSD):", pUSDAddress);
  console.log("TRUTH Token:", truthTokenAddress);
  console.log("IDO Contract:", idoContractAddress);
  console.log("Vesting Contract:", vestingContractAddress);

  console.log("\n=== Next Steps ===");
  console.log("1. Verify contracts on Etherscan (if on testnet/mainnet)");
  console.log("2. Update frontend with contract addresses");
  console.log("3. Start the IDO when ready using: idoContract.startSale()");
  console.log("4. Set up vesting schedules for team and investors");

  // If this is a testnet deployment, provide additional testing info
  if (networkName === "sepolia" || networkName === "localhost") {
    console.log("\n=== Testing Information ===");
    console.log("🧪 Test pUSD tokens minted to deployer:", deployer.address);
    console.log("💡 Use pUSD.faucet(amount) to get more test tokens");
    console.log("🚀 Start IDO with: idoContract.startSale()");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
