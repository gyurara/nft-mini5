import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles.css';
import { connectWallet, getConnectedAccount } from './web3.js';
import HospitalPage from './hospital.jsx';

const NODE_API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// 지갑 주소로 백엔드 세션 생성 (hospital ORG 계정 또는 신규 USER로 자동 로그인)
async function walletLogin(walletAddress) {
  const res = await fetch(`${NODE_API}/auth/wallet-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ walletAddress, role: 'ORG' }),
  });
  return res.json();
}

async function walletLogout() {
  await fetch(`${NODE_API}/auth/logout`, { method: 'POST', credentials: 'include' });
}

/* ───────────── Toast ───────────── */
function Toast({ toast }) {
  return (
    <div className={`toast${toast.show ? ' show' : ''}`}>
      <div className={`toast-dot${toast.type === 'error' ? ' error' : ''}`} />
      <div>
        <div className="toast-text">{toast.message}</div>
        <div className="toast-label">{toast.type === 'error' ? '오류' : '완료'}</div>
      </div>
    </div>
  );
}

/* ───────────── Nav ───────────── */
function Nav({ theme, toggleTheme, account, onConnect, onDisconnect }) {
  const short = account ? account.slice(0, 6) + '...' + account.slice(-4) : '';
  return (
    <nav>
      <div className="logo">Ani<span>Code</span> <span style={{ fontSize:14, letterSpacing:2, color:"var(--accent2)", marginLeft:8 }}>🏥 HOSPITAL</span></div>
      <div className="nav-right">
        <div className="theme-wrap">
          <span className="theme-lbl">{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
          <button className="theme-toggle" onClick={toggleTheme} />
        </div>
        {account
          ? <button className="btn-connect connected" onClick={onDisconnect}>{short}</button>
          : <button className="btn-connect" onClick={onConnect}>지갑 연결</button>
        }
      </div>
    </nav>
  );
}

/* ───────────── App ───────────── */
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('hospital:theme') || 'dark');
  const [account, setAccount] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimer = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hospital:theme', theme);
  }, [theme]);

  useEffect(() => {
    getConnectedAccount().then(acc => { if (acc) setAccount(acc); });
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', accs => setAccount(accs[0] || null));
    }
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, message, type });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  }, []);

  const handleConnect = async () => {
    try {
      const acc = await connectWallet();
      setAccount(acc);
      // 지갑 주소로 백엔드 세션 자동 생성
      const res = await walletLogin(acc);
      if (res.user?.role === 'ORG') {
        showToast(`병원 계정으로 연결되었습니다. (${res.user.name})`);
      } else {
        showToast('지갑이 연결되었습니다.');
      }
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleDisconnect = async () => {
    try { await walletLogout(); } catch (_) {}
    setAccount(null);
    showToast('지갑 연결이 해제되었습니다.', 'error');
  };

  return (
    <>
      <Nav
        theme={theme}
        toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        account={account}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      {account ? (
        <HospitalPage account={account} showToast={showToast} />
      ) : (
        <div className="page active">
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 64px)", gap:24 }}>
            <div style={{ fontSize:64 }}>🏥</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:48, letterSpacing:4, color:"var(--accent2)" }}>HOSPITAL MODE</div>
            <p style={{ color:"var(--muted)", fontSize:14, textAlign:"center", lineHeight:1.8 }}>
              병원 지갑을 연결하여<br/>반려동물 진료 기록을 블록체인에 기록하세요.
            </p>
            <button className="btn-primary" onClick={handleConnect}>병원 지갑 연결하기</button>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  );
}
