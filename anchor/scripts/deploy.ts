import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

const DEPLOYMENTS_FILE = path.join(__dirname, "..", "deployments.json");

async function main() {
  const network = hre.network.name;
  const [deployer] = await hre.ethers.getSigners();

  console.log(`Network:  ${network}`);
  console.log(`Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance:  ${hre.ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error(
      `Deployer wallet has 0 balance on ${network}. Fund it from the faucet first.`
    );
  }

  console.log(`\nDeploying RecordAnchor...`);
  const Factory = await hre.ethers.getContractFactory("RecordAnchor");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash;
  const receipt = await contract.deploymentTransaction()?.wait();

  console.log(`\n✓ Deployed`);
  console.log(`  Address:  ${address}`);
  console.log(`  Tx hash:  ${txHash}`);
  console.log(`  Block:    ${receipt?.blockNumber}`);
  console.log(`  Gas used: ${receipt?.gasUsed}`);

  // Persist deployment info
  let deployments: Record<string, any> = {};
  if (fs.existsSync(DEPLOYMENTS_FILE)) {
    deployments = JSON.parse(fs.readFileSync(DEPLOYMENTS_FILE, "utf8"));
  }

  deployments[network] = {
    address,
    txHash,
    blockNumber: receipt?.blockNumber,
    gasUsed: receipt?.gasUsed.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(DEPLOYMENTS_FILE, JSON.stringify(deployments, null, 2));
  console.log(`\n  Saved to ${DEPLOYMENTS_FILE}`);

  // Explorer link
  const explorers: Record<string, string> = {
    sepolia: "https://sepolia.etherscan.io",
    baseSepolia: "https://sepolia.basescan.org",
  };
  const explorer = explorers[network];
  if (explorer) {
    console.log(`\n  Explorer: ${explorer}/address/${address}`);
    console.log(`  Tx:       ${explorer}/tx/${txHash}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
