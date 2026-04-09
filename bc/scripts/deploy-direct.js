/**
 * Hardhat 없이 ethers.js로 직접 배포하는 스크립트
 * 여러 RPC를 자동으로 시도합니다
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const RPCS = [
  "https://sepolia.drpc.org",
  "https://rpc2.sepolia.org",
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://eth-sepolia.public.blastapi.io",
  "https://sepolia.gateway.tenderly.co",
];

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

async function getProvider() {
  for (const url of RPCS) {
    try {
      console.log(`RPC 연결 시도: ${url}`);
      const provider = new ethers.JsonRpcProvider(url);
      const network = await Promise.race([
        provider.getNetwork(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
      ]);
      if (Number(network.chainId) !== 11155111) {
        console.log(`  ❌ 잘못된 체인: ${network.chainId}`);
        continue;
      }
      console.log(`  ✅ 연결 성공 (chainId: ${network.chainId})`);
      return provider;
    } catch (e) {
      console.log(`  ❌ 실패: ${e.message}`);
    }
  }
  throw new Error("모든 RPC 연결 실패");
}

// hardhat artifacts에서 ABI+bytecode 읽기
function getArtifact(contractName) {
  const artifactPath = path.join(
    __dirname, "..", "artifacts", "contracts",
    `${contractName}.sol`, `${contractName}.json`
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact 없음: ${artifactPath}\n먼저 'npx hardhat compile' 실행하세요`);
  }
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

async function deployContract(wallet, contractName, args = []) {
  console.log(`\n배포 중: ${contractName}...`);
  const artifact = getArtifact(contractName);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(...args);
  console.log(`  tx: ${contract.deploymentTransaction().hash}`);
  console.log(`  대기 중...`);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`  ✅ ${contractName}: ${address}`);
  return address;
}

async function main() {
  if (!PRIVATE_KEY) throw new Error(".env에 DEPLOYER_PRIVATE_KEY 없음");

  const provider = await getProvider();
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log(`\n배포 지갑: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`잔액: ${ethers.formatEther(balance)} ETH`);
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("잔액 부족 (최소 0.01 ETH 필요)");
  }

  const petSBTAddress = await deployContract(wallet, "PetSBT", []);
  const memoryNFTAddress = await deployContract(wallet, "MemoryNFT", [
    petSBTAddress,
    ethers.parseEther("0.001"),
    1000,
  ]);
  const medicalPassportAddress = await deployContract(wallet, "MedicalPassportSBT", [petSBTAddress]);

  console.log("\n==============================");
  console.log("📋 .env에 아래 값을 복사하세요:");
  console.log("==============================");
  console.log(`VITE_PET_SBT_ADDRESS=${petSBTAddress}`);
  console.log(`VITE_MEMORY_NFT_ADDRESS=${memoryNFTAddress}`);
  console.log(`VITE_MEDICAL_PASSPORT_ADDRESS=${medicalPassportAddress}`);
}

main().catch((e) => { console.error("\n❌ 오류:", e.message); process.exit(1); });
