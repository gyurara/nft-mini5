import { useState, useEffect, useRef, useCallback } from "react";
import './styles.css';
import { usePetServiceApp } from './services.js';
import { HomePage, RegisterPage, MyPage, DraggableNftDetail } from './pages.jsx';
import { GoodsPage } from './goods.jsx';

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
function Nav({ page, setPage, theme, toggleTheme, state, connectWallet, disconnectWallet }) {
  const short = state.account ? state.account.slice(0, 6) + '...' + state.account.slice(-4) : '';
  return (
    <nav>
      <div className="logo" onClick={() => setPage('home')}>Ani<span>Code</span></div>
      <div className="nav-links">
        {[['home', '홈'], ['register', '등록'], ['mypage', '마이페이지'], ['goods', '굿즈']].map(([k, v]) => (
          <a key={k} className={page === k ? 'active' : ''} onClick={() => setPage(k)}>{v}</a>
        ))}
      </div>
      <div className="nav-right">
        {/* 교환권 현황 (로그인 시) */}
        {state.connected && (
          <div style={{ display:'flex', gap:6, alignItems:'center', marginRight:8 }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:1, color:'var(--accent)', background:'rgba(255,107,53,.1)', padding:'4px 8px', borderRadius:3 }}>
              🎫{state.discountCoupons}
            </div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:1, color:'var(--accent2)', background:'rgba(124,58,237,.1)', padding:'4px 8px', borderRadius:3 }}>
              🔓SBT {state.sbtCount}
            </div>
          </div>
        )}
        <div className="theme-wrap">
          <span className="theme-lbl">{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
          <button className="theme-toggle" onClick={toggleTheme} />
        </div>
        {state.connected
          ? <button className="btn-connect connected" onClick={disconnectWallet}>{short}</button>
          : <button className="btn-connect" onClick={connectWallet}>지갑 연결</button>
        }
      </div>
    </nav>
  );
}

/* ───────────── App ───────────── */
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('petchain:theme') || 'dark');
  const [page, setPage] = useState(() => localStorage.getItem('petchain:page') || 'home');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [selectedNft, setSelectedNft] = useState(null);
  const toastTimer = useRef(null);

  const {
    state,
    connectWallet,
    disconnectWallet,
    registerPet,
    issueSbt,
    issueNft,
    redeemGoodsCoupon,
    addNftCouponFromMedical,
    mintMedicalPassport,
    useDiscountCoupons,
    getMyPage,
    getGoodsPreview,
    setActivePetId,
  } = usePetServiceApp();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('petchain:theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('petchain:page', page);
  }, [page]);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, message, type });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  }, []);

  const handleConnect = async () => {
    await connectWallet();
    showToast('지갑이 연결되었습니다.');
  };

  const handleDisconnect = () => {
    disconnectWallet();
    showToast('지갑 연결이 해제되었습니다.', 'error');
  };

  const commonProps = {
    state,
    registerPet,
    issueSbt,
    issueNft,
    redeemGoodsCoupon,
    addNftCouponFromMedical,
    mintMedicalPassport,
    useDiscountCoupons,
    getMyPage,
    getGoodsPreview,
    connectWallet: handleConnect,
    showToast,
    setPage,
    setActivePetId,
  };

  const pages = {
    home:     <HomePage {...commonProps} />,
    register: <RegisterPage {...commonProps} />,
    mypage:   <MyPage {...commonProps} selectedNft={selectedNft} setSelectedNft={setSelectedNft} />,
    goods:    <GoodsPage {...commonProps} />,
  };

  return (
    <>
      <Nav
        page={page}
        setPage={setPage}
        theme={theme}
        toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        state={state}
        connectWallet={handleConnect}
        disconnectWallet={handleDisconnect}
      />
      {pages[page] || pages.home}
      <Toast toast={toast} />
      {selectedNft && (
        <DraggableNftDetail
          nft={selectedNft}
          profile={state.profile}
          onClose={() => setSelectedNft(null)}
        />
      )}
    </>
  );
}
