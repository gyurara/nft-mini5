import { useState, useEffect, useRef, useCallback } from "react";
import './styles.css';
import { usePetServiceApp, createRealGateways } from './services.js';
import { HomePage, RegisterPage, MyPage } from './pages.jsx';
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

/* ───────────── 병원 권한 요청 팝업 ───────────── */
function VetApprovalPopup({ request, onRespond }) {
  if (!request) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:32, maxWidth:420, width:'90%' }}>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, color:'var(--accent2)', marginBottom:12 }}>🏥 진료 권한 요청</div>
        <div style={{ fontSize:14, marginBottom:8 }}><b>{request.vetName}</b> 병원이 진료 기록 접근을 요청했습니다.</div>
        {request.message && (
          <div style={{ fontSize:12, color:'var(--muted)', background:'var(--surface)', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
            "{request.message}"
          </div>
        )}
        <div style={{ fontSize:11, color:'var(--muted)', fontFamily:"'Space Mono',monospace", marginBottom:20 }}>
          병원 주소: {request.vetAddress?.slice(0,8)}...{request.vetAddress?.slice(-6)}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={() => onRespond(request, false)}
            style={{ flex:1, padding:'12px 0', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--muted)', cursor:'pointer', borderRadius:8, fontSize:13 }}
          >거절</button>
          <button
            onClick={() => onRespond(request, true)}
            style={{ flex:1, padding:'12px 0', background:'var(--accent2)', border:'none', color:'#fff', cursor:'pointer', borderRadius:8, fontSize:13, fontWeight:600 }}
          >승인</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── App ───────────── */
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('petchain:theme') || 'dark');
  const [page, setPage] = useState(() => localStorage.getItem('petchain:page') || 'home');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimer = useRef(null);
  const [vetRequest, setVetRequest] = useState(null);
  const sseRef = useRef(null);

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

  // SSE 구독: 지갑 연결되면 알림 수신 시작
  useEffect(() => {
    if (!state.account) {
      sseRef.current?.close();
      sseRef.current = null;
      return;
    }
    const es = new EventSource(`${API_BASE}/notifications/${state.account}`, { withCredentials: true });
    sseRef.current = es;
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'VET_APPROVAL_REQUEST') {
          setVetRequest(data);
        }
      } catch (_) {}
    };
    return () => { es.close(); sseRef.current = null; };
  }, [state.account]);

  const handleVetRespond = async (request, approved) => {
    try {
      // 1. 스마트 컨트랙트 approvePermission / rejectPermission 호출
      const { medicalPassport } = await createRealGateways();
      const medicalSbtId = await medicalPassport.medicalSbtByOwnerSbt(Number(request.petSbtId));
      if (Number(medicalSbtId) === 0) throw new Error('해당 펫의 의료 여권이 없습니다.');

      let txHash = null;
      if (approved) {
        const tx = await medicalPassport.approvePermission(medicalSbtId, request.vetAddress);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      } else {
        const tx = await medicalPassport.rejectPermission(medicalSbtId, request.vetAddress);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }

      // 2. 백엔드 상태 업데이트 (실제 tx 해시 전달)
      await fetch(`${API_BASE}/vet/respond-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approvalId: request.id, ownerAddress: state.account, approved, txHash }),
      });
      showToast(approved ? '병원 권한을 승인했습니다.' : '병원 권한 요청을 거절했습니다.', approved ? 'success' : 'error');
    } catch (e) {
      showToast(e.message || '응답 처리에 실패했습니다.', 'error');
    }
    setVetRequest(null);
  };

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
    mypage:   <MyPage {...commonProps} />,
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
      <VetApprovalPopup request={vetRequest} onRespond={handleVetRespond} />
    </>
  );
}
