/* be/auth.js */
import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.js";

export let userAccount = null;
export let web3Provider = null;
const SEPOLIA_ID = '0xaa36a7';

window.realConnectWallet = async function() {
    if (!window.ethereum) {
        if (window.showToast) window.showToast("MetaMask를 설치해주세요!");
        return false;
    }

    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== SEPOLIA_ID) {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: SEPOLIA_ID }],
            });
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        web3Provider = new ethers.BrowserProvider(window.ethereum);

        updateWalletUI(userAccount);
        localStorage.setItem('isLogged', 'true');
        if (window.showToast) window.showToast("지갑 연결 성공!");
        return true;
    } catch (error) {
        console.error("Connect Error:", error); // error 변수 사용함
        return false;
    }
};

window.showPage = async function(id) {
    const protectedPages = ['register', 'mypage', 'holder', 'mining'];
    if (protectedPages.includes(id) && !userAccount) {
        const success = await window.realConnectWallet();
        if (!success) {
            if (window.showToast) window.showToast("🔒 지갑 연결이 필요합니다.");
            if (window.renderPageDirect) window.renderPageDirect('home');
            return;
        }
    }
    if (window.renderPageDirect) window.renderPageDirect(id);
};

function updateWalletUI(account) {
    const btn = document.getElementById('walletBtn');
    if (btn) btn.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
    const addrInput = document.getElementById('walletAddr');
    if (addrInput) addrInput.value = account;
    const myAddrText = document.getElementById('myWalletAddr');
    if (myAddrText) myAddrText.textContent = account;
}

window.addEventListener('load', async () => {
    if (localStorage.getItem('isLogged') === 'true' && window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                userAccount = accounts[0];
                web3Provider = new ethers.BrowserProvider(window.ethereum);
                updateWalletUI(userAccount);
            }
        } catch (error) { console.error("Session recovery failed", error); }
    }
});