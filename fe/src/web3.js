const ETHERS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.4/ethers.umd.min.js';
const DEFAULT_CHAIN_ID_HEX = '0xaa36a7';

const CHAIN_CONFIG = {
  chainIdHex: normalizeHexChainId(process.env.REACT_APP_CHAIN_ID || DEFAULT_CHAIN_ID_HEX),
  chainName: process.env.REACT_APP_CHAIN_NAME || 'Sepolia',
  rpcUrl: process.env.REACT_APP_RPC_URL || 'https://rpc.sepolia.org',
  blockExplorerUrl: process.env.REACT_APP_BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: process.env.REACT_APP_NATIVE_CURRENCY_NAME || 'Sepolia ETH',
    symbol: process.env.REACT_APP_NATIVE_CURRENCY_SYMBOL || 'SEP',
    decimals: Number(process.env.REACT_APP_NATIVE_CURRENCY_DECIMALS || 18),
  },
};

const SBT_CONTRACT_ADDRESS = process.env.REACT_APP_SBT_CONTRACT_ADDRESS || '';
const MEMORY_NFT_CONTRACT_ADDRESS = process.env.REACT_APP_MEMORY_NFT_CONTRACT_ADDRESS || '';

const PET_SBT_ABI = [
  'event PetRegistered(address indexed owner, uint256 indexed tokenId, string tokenURI)',
  'function registerPet(string tokenURI) returns (uint256 tokenId)',
  'function getPetTokenIds(address owner) view returns (uint256[] memory)',
  'function tokenURI(uint256 tokenId) view returns (string)',
];

const MEMORY_NFT_ABI = [
  'event MemoryNFTMinted(address indexed owner, uint256 indexed tokenId, uint256 indexed petSbtId, string tokenURI, uint256 paid)',
  'function mintMemoryNFT(uint256 petSbtId, string tokenURI) payable returns (uint256 tokenId)',
  'function mintPrice() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
];

let ethersPromise = null;

export const WEB3_NETWORK_LABEL = CHAIN_CONFIG.chainName;

export async function loadEthers() {
  if (window.ethers) {
    return window.ethers;
  }

  if (!ethersPromise) {
    ethersPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = ETHERS_CDN_URL;
      script.async = true;
      script.onload = () => {
        if (window.ethers) {
          resolve(window.ethers);
          return;
        }

        reject(new Error('ethers 라이브러리를 불러오지 못했습니다.'));
      };
      script.onerror = () => reject(new Error('ethers CDN 로드에 실패했습니다.'));
      document.head.appendChild(script);
    });
  }

  return ethersPromise;
}

export async function getConnectedWalletAccount() {
  const ethereum = getEthereum();
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  return accounts?.[0] || '';
}

export async function connectWalletSession() {
  const ethereum = getEthereum();
  await ensureCorrectNetwork(ethereum);

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const account = accounts?.[0];

  if (!account) {
    throw new Error('연결된 지갑 계정을 찾을 수 없습니다.');
  }

  return { account };
}

export async function mintPetSbtOnChain({ account, pet }) {
  requireContractAddress('SBT', SBT_CONTRACT_ADDRESS);
  const ethers = await loadEthers();
  const provider = new ethers.BrowserProvider(getEthereum());
  await ensureSignerAccount(provider, account);
  await ensureCorrectNetwork(getEthereum());

  const metadata = createSbtMetadata({ account, pet });
  const tokenUri = buildDataTokenUri(metadata);
  const contract = new ethers.Contract(SBT_CONTRACT_ADDRESS, PET_SBT_ABI, await provider.getSigner());

  const tx = await contract.registerPet(tokenUri);
  const receipt = await tx.wait();
  const parsedEvent = findParsedLog(receipt, contract.interface, 'PetRegistered');
  let tokenId = parsedEvent?.args?.tokenId;

  if (tokenId == null) {
    const petTokenIds = await contract.getPetTokenIds(account);
    tokenId = petTokenIds?.[petTokenIds.length - 1];
  }

  if (tokenId == null) {
    throw new Error('SBT 토큰 ID를 확인하지 못했습니다.');
  }

  return {
    tokenId: Number(tokenId),
    transactionHash: receipt.hash || tx.hash,
    tokenUri,
    metadata,
    mintedAt: new Date().toISOString(),
  };
}

export async function mintMemoryNftOnChain({ account, pet, petSbtTokenId }) {
  requireContractAddress('Memory NFT', MEMORY_NFT_CONTRACT_ADDRESS);

  if (!petSbtTokenId) {
    throw new Error('NFT 발급에 필요한 SBT tokenId가 없습니다.');
  }

  const ethers = await loadEthers();
  const provider = new ethers.BrowserProvider(getEthereum());
  await ensureSignerAccount(provider, account);
  await ensureCorrectNetwork(getEthereum());

  const metadata = createNftMetadata({ account, pet, petSbtTokenId });
  const tokenUri = buildDataTokenUri(metadata);
  const contract = new ethers.Contract(MEMORY_NFT_CONTRACT_ADDRESS, MEMORY_NFT_ABI, await provider.getSigner());
  const mintPrice = await contract.mintPrice();

  const tx = await contract.mintMemoryNFT(petSbtTokenId, tokenUri, { value: mintPrice });
  const receipt = await tx.wait();
  const parsedEvent = findParsedLog(receipt, contract.interface, 'MemoryNFTMinted');
  const tokenId = parsedEvent?.args?.tokenId;

  if (tokenId == null) {
    throw new Error('NFT 토큰 ID를 확인하지 못했습니다.');
  }

  return {
    tokenId: Number(tokenId),
    transactionHash: receipt.hash || tx.hash,
    tokenUri,
    metadata,
    petSbtTokenId: Number(petSbtTokenId),
    paidWei: mintPrice.toString(),
    mintedAt: new Date().toISOString(),
  };
}

function getEthereum() {
  if (!window.ethereum?.request) {
    throw new Error('MetaMask가 필요합니다.');
  }

  return window.ethereum;
}

async function ensureCorrectNetwork(ethereum) {
  const currentChainId = await ethereum.request({ method: 'eth_chainId' });

  if (currentChainId === CHAIN_CONFIG.chainIdHex) {
    return;
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_CONFIG.chainIdHex }],
    });
  } catch (error) {
    if (error?.code !== 4902) {
      throw new Error(`${CHAIN_CONFIG.chainName} 네트워크로 전환하지 못했습니다.`);
    }

    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: CHAIN_CONFIG.chainIdHex,
        chainName: CHAIN_CONFIG.chainName,
        rpcUrls: [CHAIN_CONFIG.rpcUrl],
        blockExplorerUrls: [CHAIN_CONFIG.blockExplorerUrl],
        nativeCurrency: CHAIN_CONFIG.nativeCurrency,
      }],
    });
  }
}

async function ensureSignerAccount(provider, expectedAccount) {
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  if (expectedAccount && signerAddress.toLowerCase() !== expectedAccount.toLowerCase()) {
    throw new Error('연결된 지갑 계정과 현재 서명 계정이 일치하지 않습니다.');
  }
}

function createSbtMetadata({ account, pet }) {
  return {
    name: `${pet.name} Pet SBT`,
    description: `${pet.name}의 소유권과 등록 정보를 증명하는 Soulbound Token`,
    image: pet.image || null,
    external_url: window.location.origin,
    attributes: [
      { trait_type: 'Token Type', value: 'SBT' },
      { trait_type: 'Owner', value: account },
      { trait_type: 'Pet Name', value: pet.name },
      { trait_type: 'Species', value: pet.species },
      { trait_type: 'Birth Date', value: pet.birthDate },
      { trait_type: 'Network', value: CHAIN_CONFIG.chainName },
    ],
  };
}

function createNftMetadata({ account, pet, petSbtTokenId }) {
  return {
    name: `${pet.name} Memory NFT`,
    description: `${pet.name}의 추억을 기록하는 기념 NFT`,
    image: pet.image || null,
    external_url: window.location.origin,
    attributes: [
      { trait_type: 'Token Type', value: 'Memory NFT' },
      { trait_type: 'Owner', value: account },
      { trait_type: 'Linked Pet SBT', value: String(petSbtTokenId) },
      { trait_type: 'Pet Name', value: pet.name },
      { trait_type: 'Species', value: pet.species },
      { trait_type: 'Birth Date', value: pet.birthDate },
      { trait_type: 'Network', value: CHAIN_CONFIG.chainName },
    ],
  };
}

function buildDataTokenUri(metadata) {
  const json = JSON.stringify(metadata);
  const encoded = window.btoa(unescape(encodeURIComponent(json)));
  return `data:application/json;base64,${encoded}`;
}

function findParsedLog(receipt, contractInterface, eventName) {
  for (const log of receipt?.logs || []) {
    try {
      const parsed = contractInterface.parseLog(log);
      if (parsed?.name === eventName) {
        return parsed;
      }
    } catch (_error) {
      // ignore unrelated logs
    }
  }

  return null;
}

function requireContractAddress(label, value) {
  if (!value) {
    throw new Error(`${label} 컨트랙트 주소가 설정되지 않았습니다.`);
  }
}

function normalizeHexChainId(value) {
  if (!value) {
    return DEFAULT_CHAIN_ID_HEX;
  }

  if (String(value).startsWith('0x')) {
    return String(value).toLowerCase();
  }

  return `0x${Number(value).toString(16)}`;
}
