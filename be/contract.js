/* be/contract.js */
import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.js";
import { userAccount, web3Provider } from "./auth.js";

const SBT_ADDR = "0xYOUR_ACTUAL_CONTRACT_ADDRESS"; 
const ABI = ["function mintPet(string name) public"];

window.mintSBT = async function() {
    if (!userAccount || !web3Provider) return;
    
    const nameEl = document.getElementById('petName');
    const typeEl = document.getElementById('petType');
    if (!nameEl.value) return alert("이름을 입력하세요.");

    try {
        const signer = await web3Provider.getSigner();
        const contract = new ethers.Contract(SBT_ADDR, ABI, signer);

        const tx = await contract.mintPet(nameEl.value);
        if (window.showToast) window.showToast("⛓️ 블록체인에 기록 중...");
        await tx.wait();

        // Spring Boot 저장
        const response = await fetch('http://localhost:8080/api/pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ownerAddress: userAccount,
                name: nameEl.value,
                type: typeEl.value,
                txHash: tx.hash
            })
        });

        if (response.ok) {
            if (window.showToast) window.showToast("✅ 저장 완료!");
            window.showPage('mypage');
        }
    } catch (error) {
        console.error("Minting Error:", error);
        if (window.showToast) window.showToast("오류가 발생했습니다.");
    }
};