import { useState } from 'react';
import { getContracts } from './web3.js';

const NODE_API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function sendApprovalRequest({ petSbtId, ownerAddress, message }) {
  const res = await fetch(`${NODE_API}/vet/request-approval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ petSbtId, ownerAddress, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '요청 전송에 실패했습니다.');
  return data;
}

async function checkAccess(ownerAddress, vetAddress) {
  const res = await fetch(`${NODE_API}/vet/check-access/${encodeURIComponent(ownerAddress)}/${encodeURIComponent(vetAddress)}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '연결 상태 확인 실패');
  return data.connected;
}

export default function HospitalPage({ account, showToast }) {
  const [petSbtId, setPetSbtId] = useState('');
  const [medicalSbtId, setMedicalSbtId] = useState(null);
  const [passportInfo, setPassportInfo] = useState(null);
  const [records, setRecords] = useState([]);
  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    diagnosis: '', treatment: '', hospital: '', memo: '',
    visitDate: new Date().toISOString().split('T')[0],
  });

  // 권한 요청 상태
  const [reqForm, setReqForm] = useState({ petSbtId: '', ownerAddress: '', message: '' });
  const [reqLoading, setReqLoading] = useState(false);
  const [reqSent, setReqSent] = useState(false);
  const [connectedStatus, setConnectedStatus] = useState(null); // null | true | false

  const handleSendRequest = async () => {
    if (!reqForm.petSbtId.trim() || !reqForm.ownerAddress.trim()) {
      showToast('반려동물 SBT ID와 보호자 지갑 주소를 입력해주세요.', 'error');
      return;
    }
    setReqLoading(true);
    setReqSent(false);
    try {
      await sendApprovalRequest({
        petSbtId: reqForm.petSbtId.trim(),
        ownerAddress: reqForm.ownerAddress.trim(),
        message: reqForm.message.trim(),
      });
      setReqSent(true);
      showToast('✅ 보호자에게 권한 요청을 전송했습니다!');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setReqLoading(false);
    }
  };

  const handleCheckAccess = async () => {
    if (!reqForm.ownerAddress.trim()) {
      showToast('보호자 지갑 주소를 입력해주세요.', 'error');
      return;
    }
    try {
      const connected = await checkAccess(reqForm.ownerAddress.trim(), account);
      setConnectedStatus(connected);
      showToast(connected ? '✅ 이미 연결된 보호자입니다.' : '아직 연결되지 않았습니다.');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const lookupPassport = async () => {
    if (!petSbtId.trim()) { showToast('PetSBT ID를 입력해주세요.', 'error'); return; }
    setLoading(true);
    setMedicalSbtId(null); setPassportInfo(null); setRecords([]); setPermission(null);
    try {
      const { medicalPassport } = await getContracts();
      const mSbtId = await medicalPassport.medicalSbtByOwnerSbt(Number(petSbtId));
      if (Number(mSbtId) === 0) {
        showToast('해당 펫의 의료 여권이 없습니다.', 'error');
        setLoading(false); return;
      }
      const mId = Number(mSbtId);
      setMedicalSbtId(mId);

      // 여권 정보
      const info = await medicalPassport.getPassportInfo(mId);
      setPassportInfo({
        linkedOwnerSbtId: Number(info.linkedOwnerSbtId),
        createdAt: Number(info.createdAt),
        lastVisitDate: Number(info.lastVisitDate),
        totalRecords: Number(info.totalRecords),
      });

      // 권한 확인
      const perm = await medicalPassport.getPermission(mId, account);
      setPermission({ allowed: perm.allowed, validUntil: Number(perm.validUntil), remainingWrites: Number(perm.remainingWrites) });

      // 기록 불러오기
      const count = await medicalPassport.getRecordCount(mId);
      const fetched = [];
      for (let i = 0; i < Number(count); i++) {
        const r = await medicalPassport.getRecord(mId, i);
        let diagnosis = '', treatment = '', hospital = r.hospital, memo = '';
        try {
          const meta = JSON.parse(atob(r.recordURI.split(',')[1]));
          diagnosis = meta.diagnosis || ''; treatment = meta.treatment || '';
          hospital = meta.hospital || r.hospital; memo = meta.memo || '';
        } catch (_) { diagnosis = r.recordURI; }
        fetched.push({ visitDate: Number(r.visitDate), diagnosis, treatment, hospital, memo });
      }
      setRecords(fetched.sort((a, b) => b.visitDate - a.visitDate));
      showToast('의료 여권을 불러왔습니다!');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleAddRecord = async () => {
    if (!form.diagnosis || !form.hospital) { showToast('진단명과 병원명은 필수입니다.', 'error'); return; }
    if (!medicalSbtId) { showToast('먼저 펫의 의료 여권을 조회해주세요.', 'error'); return; }
    setAdding(true);
    try {
      const { medicalPassport } = await getContracts();
      const canAppend = await medicalPassport.canAppendRecord(medicalSbtId, account);
      if (!canAppend) throw new Error('이 의료 여권에 기록을 추가할 권한이 없습니다. 반려동물 주인에게 권한을 요청하세요.');

      const visitDate = Math.floor(new Date(form.visitDate).getTime() / 1000);
      const recordURI = `data:application/json;base64,${btoa(JSON.stringify({
        diagnosis: form.diagnosis, treatment: form.treatment,
        hospital: form.hospital, memo: form.memo, visitDate,
      }))}`;
      const dataHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      const tx = await medicalPassport.appendMedicalRecord(
        medicalSbtId, recordURI, dataHash, visitDate, 1, recordURI
      );
      await tx.wait();
      showToast('✅ 진료 기록이 블록체인에 추가되었습니다!');

      setRecords(prev => [{ visitDate, diagnosis: form.diagnosis, treatment: form.treatment, hospital: form.hospital, memo: form.memo }, ...prev]);
      setForm({ diagnosis: '', treatment: '', hospital: '', memo: '', visitDate: new Date().toISOString().split('T')[0] });

      // 권한 업데이트
      if (permission && permission.remainingWrites !== 4294967295) {
        setPermission(prev => ({ ...prev, remainingWrites: prev.remainingWrites - 1 }));
      }
    } catch (e) { showToast(e.message, 'error'); }
    finally { setAdding(false); }
  };

  return (
    <div className="page active">
      <div className="mypage-layout">
        <div className="mypage-header">
          <div>
            <div className="wallet-label">병원 모드</div>
            <div className="wallet-addr">{account}</div>
          </div>
        </div>

        {/* 보호자 권한 요청 */}
        <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:24, marginBottom:24 }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"var(--muted)", marginBottom:16 }}>
            🔐 보호자 진료 권한 요청
          </div>
          <div style={{ background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, color:"var(--muted)", lineHeight:1.7 }}>
            보호자에게 팝업으로 권한 요청이 전송됩니다. <strong style={{ color:"var(--accent2)" }}>수수료는 병원(현재 지갑)이 부담합니다.</strong>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <div className="form-label">반려동물 SBT Token ID *</div>
              <input
                className="form-input"
                placeholder="예: 31"
                value={reqForm.petSbtId}
                onChange={e => { setReqForm(f => ({ ...f, petSbtId: e.target.value })); setReqSent(false); setConnectedStatus(null); }}
                style={{ fontFamily:"'Space Mono',monospace" }}
              />
            </div>
            <div>
              <div className="form-label">보호자 지갑 주소 *</div>
              <input
                className="form-input"
                placeholder="0x..."
                value={reqForm.ownerAddress}
                onChange={e => { setReqForm(f => ({ ...f, ownerAddress: e.target.value })); setReqSent(false); setConnectedStatus(null); }}
                style={{ fontFamily:"'Space Mono',monospace", fontSize:11 }}
              />
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div className="form-label">요청 메시지 (선택)</div>
            <input
              className="form-input"
              placeholder="예: 정기검진을 위해 진료 기록 접근 권한을 요청합니다."
              value={reqForm.message}
              onChange={e => setReqForm(f => ({ ...f, message: e.target.value }))}
            />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button
              onClick={handleCheckAccess}
              style={{ padding:"0 18px", background:"var(--surface)", border:"1px solid var(--border)", color:"var(--muted)", cursor:"pointer", fontSize:11, fontFamily:"'Space Mono',monospace", whiteSpace:"nowrap", borderRadius:0 }}
            >
              연결 확인
            </button>
            <button
              onClick={handleSendRequest}
              disabled={reqLoading}
              style={{ flex:1, padding:"0 24px", height:50, background:"var(--accent2)", border:"none", color:"#fff", cursor:"pointer", borderRadius:0, fontSize:12, fontFamily:"'Space Mono',monospace", clipPath:"polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)", opacity: reqLoading ? 0.6 : 1 }}
            >
              {reqLoading ? "전송 중..." : "📨 권한 요청 전송"}
            </button>
          </div>
          {connectedStatus !== null && (
            <div style={{ marginTop:10, padding:"8px 12px", borderRadius:6, background: connectedStatus ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${connectedStatus ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, fontSize:12, fontFamily:"'Space Mono',monospace", color: connectedStatus ? "var(--accent3)" : "#ef4444" }}>
              {connectedStatus ? "✅ 이미 연결된 보호자입니다." : "❌ 아직 연결되지 않았습니다."}
            </div>
          )}
          {reqSent && (
            <div style={{ marginTop:10, padding:"8px 12px", borderRadius:6, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.3)", fontSize:12, fontFamily:"'Space Mono',monospace", color:"var(--accent2)" }}>
              ✅ 권한 요청이 전송되었습니다. 보호자의 승인을 기다리고 있습니다.
            </div>
          )}
        </div>

        {/* 펫 의료 여권 조회 */}
        <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:24, marginBottom:24 }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"var(--muted)", marginBottom:16 }}>🔍 펫 의료 여권 조회</div>
          <div style={{ display:"flex", gap:8 }}>
            <input
              className="form-input"
              placeholder="PetSBT Token ID 입력 (예: 31)"
              value={petSbtId}
              onChange={e => setPetSbtId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookupPassport()}
              style={{ flex:1, fontFamily:"'Space Mono',monospace" }}
            />
            <button
              onClick={lookupPassport}
              disabled={loading}
              style={{ padding:"0 24px", background:"var(--accent)", border:"none", color:"#fff", cursor:"pointer", borderRadius:0, fontSize:12, fontFamily:"'Space Mono',monospace", whiteSpace:"nowrap", clipPath:"polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)" }}
            >
              {loading ? "조회 중..." : "조회"}
            </button>
          </div>

          {medicalSbtId && passportInfo && (
            <div style={{ marginTop:16, display:"flex", gap:12, flexWrap:"wrap" }}>
              <div style={{ padding:"8px 14px", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:6, fontSize:11, color:"var(--accent3)", fontFamily:"'Space Mono',monospace" }}>
                ✅ 의료 여권 #{medicalSbtId}
              </div>
              <div style={{ padding:"8px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:6, fontSize:11, fontFamily:"'Space Mono',monospace", color:"var(--muted)" }}>
                총 {passportInfo.totalRecords}건의 기록
              </div>
              {permission && (
                <div style={{ padding:"8px 14px", background: permission.allowed ? "rgba(124,58,237,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${permission.allowed ? "rgba(124,58,237,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius:6, fontSize:11, fontFamily:"'Space Mono',monospace", color: permission.allowed ? "var(--accent2)" : "#ef4444" }}>
                  {permission.allowed
                    ? `권한 있음 (남은 횟수: ${permission.remainingWrites === 4294967295 ? '무제한' : permission.remainingWrites})`
                    : '권한 없음 - 주인에게 요청하세요'}
                </div>
              )}
            </div>
          )}
        </div>

        {medicalSbtId && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
            {/* 진료 기록 추가 */}
            <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:24 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"var(--muted)", marginBottom:20 }}>📋 진료 기록 추가</div>
              {[
                ["방문일", <input key="d" type="date" className="form-input" value={form.visitDate} onChange={e=>setForm(f=>({...f,visitDate:e.target.value}))} />],
                ["진단명 *", <input key="di" className="form-input" placeholder="예: 피부염" value={form.diagnosis} onChange={e=>setForm(f=>({...f,diagnosis:e.target.value}))} />],
                ["치료", <input key="t" className="form-input" placeholder="예: 약 처방" value={form.treatment} onChange={e=>setForm(f=>({...f,treatment:e.target.value}))} />],
                ["병원명 *", <input key="h" className="form-input" placeholder="예: ABC 동물병원" value={form.hospital} onChange={e=>setForm(f=>({...f,hospital:e.target.value}))} />],
                ["메모", <textarea key="m" className="form-input" rows={3} placeholder="추가 메모..." value={form.memo} onChange={e=>setForm(f=>({...f,memo:e.target.value}))} style={{resize:"vertical"}} />],
              ].map(([label, input]) => (
                <div className="form-group" key={label} style={{ marginBottom:14 }}>
                  <label className="form-label">{label}</label>
                  {input}
                </div>
              ))}
              <button className="btn-full" onClick={handleAddRecord} disabled={adding || !permission?.allowed}>
                {adding ? "기록 중..." : permission?.allowed ? "📋 진료 기록 추가하기" : "🔒 권한 없음"}
              </button>
            </div>

            {/* 기존 기록 목록 */}
            <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:24 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"var(--muted)", marginBottom:20 }}>
                기존 진료 기록 ({records.length}건)
              </div>
              {records.length === 0 ? (
                <div className="empty-state" style={{ padding:"40px 0" }}>
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title" style={{ fontSize:20 }}>기록 없음</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:480, overflowY:"auto" }}>
                  {records.map((r, i) => {
                    const d = new Date(r.visitDate * 1000);
                    const dateStr = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
                    return (
                      <div key={i} style={{ padding:"12px 16px", border:"1px solid var(--border)", borderRadius:8, background:"var(--surface)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontWeight:600, fontSize:13 }}>{r.diagnosis}</span>
                          <span style={{ fontSize:10, color:"var(--muted)", fontFamily:"'Space Mono',monospace" }}>{dateStr}</span>
                        </div>
                        {r.treatment && <div style={{ fontSize:12, color:"var(--muted)", marginBottom:2 }}>치료: {r.treatment}</div>}
                        {r.hospital && <div style={{ fontSize:12, color:"var(--muted)", marginBottom:2 }}>병원: {r.hospital}</div>}
                        {r.memo && <div style={{ fontSize:12, color:"var(--muted)", fontStyle:"italic" }}>메모: {r.memo}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
