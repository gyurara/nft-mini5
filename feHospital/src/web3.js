import { ethers } from 'ethers';

const CHAIN_CONFIG = {
  chainIdHex: import.meta.env.VITE_CHAIN_ID || '0xaa36a7',
  chainName: import.meta.env.VITE_CHAIN_NAME || 'Sepolia',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://rpc.sepolia.org',
  blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: import.meta.env.VITE_NATIVE_CURRENCY_NAME || 'Sepolia ETH',
    symbol: import.meta.env.VITE_NATIVE_CURRENCY_SYMBOL || 'SEP',
    decimals: Number(import.meta.env.VITE_NATIVE_CURRENCY_DECIMALS || 18),
  },
};

const PET_SBT_ADDRESS = import.meta.env.VITE_PET_SBT_ADDRESS || '';
const MEDICAL_PASSPORT_ADDRESS = import.meta.env.VITE_MEDICAL_PASSPORT_ADDRESS || '';

const PET_SBT_ABI = [
  'function getPetTokenIds(address owner) view returns (uint256[])',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
];

const MEDICAL_PASSPORT_ABI = [
  'function mintMedicalPassport(uint256 ownerSbtId, string initialSummaryURI) returns (uint256)',
  'function appendMedicalRecord(uint256 medicalSbtId, string recordURI, bytes32 dataHash, uint64 visitDate, uint32 schemaVersion, string updatedSummaryURI) returns (uint256)',
  'function grantHospitalPermission(uint256 medicalSbtId, address hospital, uint64 validUntil, uint32 remainingWrites)',
  'function revokeHospitalPermission(uint256 medicalSbtId, address hospital)',
  'function getPassportInfo(uint256 medicalSbtId) view returns (tuple(uint256 linkedOwnerSbtId, uint64 createdAt, uint64 lastVisitDate, uint32 latestSchemaVersion, uint32 totalRecords))',
  'function getRecord(uint256 medicalSbtId, uint256 recordIndex) view returns (tuple(address hospital, string recordURI, bytes32 dataHash, uint64 visitDate, uint32 schemaVersion, uint64 createdAt))',
  'function getRecordCount(uint256 medicalSbtId) view returns (uint256)',
  'function canAppendRecord(uint256 medicalSbtId, address hospital) view returns (bool)',
  'function medicalSbtByOwnerSbt(uint256 ownerSbtId) view returns (uint256)',
  'function getPermission(uint256 medicalSbtId, address hospital) view returns (tuple(bool allowed, uint64 validUntil, uint32 remainingWrites))',
];

export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask를 설치해주세요.');
  await ensureCorrectNetwork();
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

export async function getConnectedAccount() {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts[0] || null;
}

export async function getContracts() {
  if (!window.ethereum) throw new Error('MetaMask가 필요합니다.');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const petSBT = new ethers.Contract(PET_SBT_ADDRESS, PET_SBT_ABI, signer);
  const medicalPassport = new ethers.Contract(MEDICAL_PASSPORT_ADDRESS, MEDICAL_PASSPORT_ABI, signer);
  return { petSBT, medicalPassport, signer };
}

async function ensureCorrectNetwork() {
  const ethereum = window.ethereum;
  const currentChainId = await ethereum.request({ method: 'eth_chainId' });
  if (currentChainId === CHAIN_CONFIG.chainIdHex) return;
  try {
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_CONFIG.chainIdHex }] });
  } catch (error) {
    if (error?.code !== 4902) throw new Error(`${CHAIN_CONFIG.chainName} 네트워크로 전환해주세요.`);
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{ chainId: CHAIN_CONFIG.chainIdHex, chainName: CHAIN_CONFIG.chainName, rpcUrls: [CHAIN_CONFIG.rpcUrl], blockExplorerUrls: [CHAIN_CONFIG.blockExplorerUrl], nativeCurrency: CHAIN_CONFIG.nativeCurrency }],
    });
  }
}
