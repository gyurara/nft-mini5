const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("배포 지갑:", deployer.address);

  // 1. PetSBT
  console.log("\n[1/3] PetSBT 배포 중...");
  const PetSBT = await hre.ethers.getContractFactory("PetSBT");
  const petSBT = await PetSBT.deploy();
  await petSBT.waitForDeployment();
  const petSBTAddress = await petSBT.getAddress();
  console.log("✅ PetSBT:", petSBTAddress);

  // 2. MemoryNFT (PetSBT 주소 필요)
  console.log("\n[2/3] MemoryNFT 배포 중...");
  const MemoryNFT = await hre.ethers.getContractFactory("MemoryNFT");
  const mintPrice = hre.ethers.parseEther("0.001"); // 0.001 ETH
  const maxSupply = 1000;
  const memoryNFT = await MemoryNFT.deploy(petSBTAddress, mintPrice, maxSupply);
  await memoryNFT.waitForDeployment();
  const memoryNFTAddress = await memoryNFT.getAddress();
  console.log("✅ MemoryNFT:", memoryNFTAddress);

  // 3. MedicalPassportSBT (PetSBT 주소 필요)
  console.log("\n[3/3] MedicalPassportSBT 배포 중...");
  const MedicalPassportSBT = await hre.ethers.getContractFactory("MedicalPassportSBT");
  const medicalPassport = await MedicalPassportSBT.deploy(petSBTAddress);
  await medicalPassport.waitForDeployment();
  const medicalPassportAddress = await medicalPassport.getAddress();
  console.log("✅ MedicalPassportSBT:", medicalPassportAddress);

  console.log("\n==============================");
  console.log("📋 .env에 아래 값을 복사하세요:");
  console.log("==============================");
  console.log(`VITE_PET_SBT_ADDRESS=${petSBTAddress}`);
  console.log(`VITE_MEMORY_NFT_ADDRESS=${memoryNFTAddress}`);
  console.log(`VITE_MEDICAL_PASSPORT_ADDRESS=${medicalPassportAddress}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
