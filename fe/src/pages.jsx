import { useState, useEffect, useRef } from "react";
import { UNLOCK_TIERS, DISCOUNT_PER_COUPON, createRealGateways } from './services.js';

const EMOJI = { '강아지': '🐶', '고양이': '🐱', '토끼': '🐰', '햄스터': '🐹' };

/* ───────────── MedicalCalendar ───────────── */
function MedicalCalendar({ records, selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const highlightDates = new Set(
    records.map(r => {
      const d = new Date(r.visitDate * 1000);
      return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    })
  );

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => { if (viewMonth===0) { setViewYear(y=>y-1); setViewMonth(11); } else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth===11) { setViewYear(y=>y+1); setViewMonth(0); } else setViewMonth(m=>m+1); };

  return (
    <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:16, minWidth:260 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={prevMonth} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:16, padding:"0 6px" }}>{"<"}</button>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:1 }}>{viewYear} {monthNames[viewMonth]}</div>
        <button onClick={nextMonth} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:16, padding:"0 6px" }}>{">"}</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {["일","월","화","수","목","금","토"].map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:10, color:"var(--muted)", padding:"4px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={"e"+i} />;
          const key = viewYear+"-"+(viewMonth+1)+"-"+day;
          const hasRecord = highlightDates.has(key);
          const isToday = today.getFullYear()===viewYear && today.getMonth()===viewMonth && today.getDate()===day;
          const isSelected = selectedDate === key;
          return (
            <div key={key} onClick={() => hasRecord && onSelectDate(isSelected ? null : key)}
              style={{ textAlign:"center", padding:"6px 0", fontSize:11, borderRadius:6, position:"relative",
                cursor: hasRecord ? "pointer" : "default",
                background: isSelected ? "var(--accent)" : hasRecord ? "rgba(255,107,53,0.15)" : "transparent",
                color: isSelected ? "#fff" : isToday ? "var(--accent)" : "var(--text)",
                fontWeight: isToday ? 700 : 400,
                border: (isToday && !isSelected) ? "1px solid var(--accent)" : "1px solid transparent",
              }}>
              {day}
              {hasRecord && !isSelected && <div style={{ position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:"var(--accent)" }} />}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:6, fontSize:10, color:"var(--muted)" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent)" }} />
        <span>진료 기록 있음</span>
      </div>
    </div>
  );
}

/* ───────────── MedicalSection ───────────── */
function MedicalSection({ isHospital, showToast, calendarOpen, setCalendarOpen, grantOpen, setGrantOpen, medicalSbtId, medicalPassport, addNftCoupon, petId }) {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    if (!medicalSbtId || !medicalPassport) return;
    const fetchRecords = async () => {
      setLoadingRecords(true);
      try {
        const count = await medicalPassport.getRecordCount(medicalSbtId);
        const fetched = [];
        for (let i = 0; i < Number(count); i++) {
          const r = await medicalPassport.getRecord(medicalSbtId, i);
          // recordURI에서 메타데이터 파싱 시도
          let diagnosis = '', treatment = '', hospital = r.hospital, memo = '';
          try {
            const meta = JSON.parse(atob(r.recordURI.split(',')[1]));
            diagnosis = meta.diagnosis || meta.name || '';
            treatment = meta.treatment || '';
            hospital = meta.hospital || r.hospital;
            memo = meta.memo || '';
          } catch(_) {
            diagnosis = r.recordURI;
          }
          fetched.push({
            visitDate: Number(r.visitDate),
            diagnosis,
            treatment,
            hospital,
            memo,
          });
        }
        const sorted = fetched.sort((a,b) => b.visitDate - a.visitDate);
        // 새 기록이 오늘 날짜면 NFT 교환권 지급 시도
        const today = new Date().toISOString().split('T')[0];
        const hasNewToday = sorted.some(r => {
          const d = new Date(r.visitDate * 1000).toISOString().split('T')[0];
          return d === today;
        });
        if (hasNewToday && addNftCoupon && petId) {
          addNftCoupon(petId);
        }
        setRecords(sorted);
      } catch(e) {
        console.error('진료 기록 불러오기 실패:', e);
      } finally {
        setLoadingRecords(false);
      }
    };
    fetchRecords();
  }, [medicalSbtId, medicalPassport]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ diagnosis:"", treatment:"", hospital:"", memo:"", visitDate: new Date().toISOString().split("T")[0] });
  const [adding, setAdding] = useState(false);

  const [selectedYear, setSelectedYear] = useState(null);
  const allYears = [...new Set(records.map(r => new Date(r.visitDate*1000).getFullYear()))].sort((a,b)=>b-a);
  const yearFilteredRecords = selectedYear ? records.filter(r => new Date(r.visitDate*1000).getFullYear()===selectedYear) : records;

  const filteredRecords = selectedDate
    ? yearFilteredRecords.filter(r => { const d=new Date(r.visitDate*1000); return (d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate())===selectedDate; })
    : yearFilteredRecords;

  const grouped = {};
  filteredRecords.forEach(r => {
    const d=new Date(r.visitDate*1000); const year=d.getFullYear(), month=d.getMonth()+1;
    if (!grouped[year]) grouped[year]={};
    if (!grouped[year][month]) grouped[year][month]=[];
    grouped[year][month].push({ ...r, _idx: records.indexOf(r) });
  });

  const handleAdd = async () => {
    if (!addForm.diagnosis || !addForm.hospital) { showToast("진단명과 병원명은 필수입니다.","error"); return; }
    setAdding(true);
    try {
      const newRecord = { visitDate:Math.floor(new Date(addForm.visitDate).getTime()/1000), diagnosis:addForm.diagnosis, treatment:addForm.treatment, hospital:addForm.hospital, memo:addForm.memo };
      setRecords(prev => [newRecord,...prev].sort((a,b)=>b.visitDate-a.visitDate));
      showToast("진료 기록이 추가되었습니다!");
      setAddModal(false);
      setAddForm({ diagnosis:"", treatment:"", hospital:"", memo:"", visitDate:new Date().toISOString().split("T")[0] });
    } catch(e) { showToast(e.message,"error"); }
    finally { setAdding(false); }
  };

  const calendarModal = calendarOpen; const setCalendarModal = setCalendarOpen;
  const grantModal = grantOpen; const setGrantModal = setGrantOpen;
  const [grantForm, setGrantForm] = useState({ hospital:"", validUntil:"", remainingWrites:"10" });
  const [granting, setGranting] = useState(false);

  const handleGrant = async () => {
    if (!grantForm.hospital) { showToast("병원 지갑 주소를 입력해주세요.","error"); return; }
    setGranting(true);
    try {
      // TODO: 실제 컨트랙트 호출
      // await medicalPassport.grantHospitalPermission(medicalSbtId, grantForm.hospital, validUntil, remainingWrites)
      showToast("병원 권한이 부여되었습니다!");
      setGrantModal(false);
      setGrantForm({ hospital:"", validUntil:"", remainingWrites:"10" });
    } catch(e) { showToast(e.message,"error"); }
    finally { setGranting(false); }
  };

return (
    <div style={{ marginTop:32 }}>


      {/* 캘린더 + 기록 모달 */}
      <div className={"modal-overlay"+(calendarModal?" open":"")} onClick={() => setCalendarModal(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:16, padding:24, boxShadow:"0 24px 64px rgba(0,0,0,.5)", position:"relative", width:"90%", maxWidth:800, maxHeight:"85vh", overflowY:"auto" }}>
          <button onClick={() => setCalendarModal(false)} style={{ position:"absolute", top:12, right:12, background:"none", border:"none", color:"var(--muted)", fontSize:18, cursor:"pointer" }}>✕</button>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"var(--muted)", marginBottom:16 }}>📋 진료 기록</div>
          <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
            <button onClick={() => setSelectedYear(null)} style={{ padding:"5px 14px", fontSize:11, fontFamily:"'Space Mono',monospace", background: selectedYear===null ? "var(--accent2)" : "var(--surface)", color: selectedYear===null ? "#fff" : "var(--muted)", border:"1px solid var(--border)", borderRadius:20, cursor:"pointer" }}>전체</button>
            {allYears.map(y => (
              <button key={y} onClick={() => setSelectedYear(selectedYear===y ? null : y)} style={{ padding:"5px 14px", fontSize:11, fontFamily:"'Space Mono',monospace", background: selectedYear===y ? "var(--accent2)" : "var(--surface)", color: selectedYear===y ? "#fff" : "var(--muted)", border:"1px solid var(--border)", borderRadius:20, cursor:"pointer" }}>{y}년</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
            <MedicalCalendar records={yearFilteredRecords} selectedDate={selectedDate} onSelectDate={d => setSelectedDate(d)} />
            <div style={{ flex:1, minWidth:260 }}>
              {selectedDate && <button onClick={() => setSelectedDate(null)} style={{ background:"none", border:"1px solid var(--border)", color:"var(--muted)", fontSize:10, padding:"4px 10px", cursor:"pointer", borderRadius:4, marginBottom:12 }}>전체 보기</button>}
              {loadingRecords && <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)" }}>불러오는 중...</div>}
              {!loadingRecords && Object.keys(grouped).sort((a,b)=>b-a).map(year => (
                <div key={year}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:2, color:"var(--accent2)", marginBottom:8, paddingBottom:4, borderBottom:"1px solid var(--border)" }}>{year}</div>
                  {Object.keys(grouped[year]).sort((a,b)=>b-a).map(month => (
                    <div key={month} style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"'Space Mono',monospace", marginBottom:6, paddingLeft:8 }}>{"├ "+month+"월"}</div>
                      {grouped[year][month].map((r,i) => {
                        const d = new Date(r.visitDate*1000);
                        const dateStr = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
                        const isExpanded = expandedIdx===r._idx;
                        return (
                          <div key={i} style={{ marginLeft:16, marginBottom:6, border:"1px solid var(--border)", borderRadius:8, overflow:"hidden", background:"var(--surface)" }}>
                            <div onClick={() => setExpandedIdx(isExpanded?null:r._idx)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", cursor:"pointer", background:isExpanded?"var(--card)":"transparent" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent)", flexShrink:0 }} />
                                <div>
                                  <div style={{ fontSize:12, fontWeight:600 }}>{r.diagnosis}</div>
                                  <div style={{ fontSize:10, color:"var(--muted)", fontFamily:"'Space Mono',monospace" }}>{dateStr}</div>
                                </div>
                              </div>
                              <span style={{ color:"var(--muted)", fontSize:12 }}>{isExpanded?"▲":"▼"}</span>
                            </div>
                            {isExpanded && (
                              <div style={{ padding:"10px 14px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:6 }}>
                                {[["치료",r.treatment],["병원",r.hospital],["메모",r.memo]].filter(([,v])=>v).map(([k,v]) => (
                                  <div key={k} style={{ display:"flex", gap:8, fontSize:12 }}>
                                    <span style={{ color:"var(--muted)", minWidth:36, fontFamily:"'Space Mono',monospace", fontSize:10 }}>{k}</span>
                                    <span>{v}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
              {!loadingRecords && filteredRecords.length===0 && <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)", fontSize:13 }}>{selectedDate?"해당 날짜의 기록이 없습니다.":"진료 기록이 없습니다."}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* 병원 권한 부여 모달 */}
      <div className={"modal-overlay"+(grantModal?" open":"")} onClick={() => setGrantModal(false)}>
        <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:460 }}>
          <button className="modal-close" onClick={() => setGrantModal(false)}>✕</button>
          <div className="modal-title">🏥 병원 권한 부여</div>
          <div className="modal-sub">병원 지갑 주소에 진료 기록 추가 권한을 부여합니다.</div>
          <div style={{ background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.3)", padding:"12px 16px", marginBottom:20, fontSize:12, color:"var(--muted)", borderRadius:8 }}>
            ⚠️ 권한을 부여하면 해당 병원이 내 반려동물 의료 기록에 진료 내용을 추가할 수 있습니다.
          </div>
          {[
            ["병원 지갑 주소 *", <input key="h" className="form-input" placeholder="0x..." value={grantForm.hospital} onChange={e=>setGrantForm(f=>({...f,hospital:e.target.value}))} style={{fontFamily:"'Space Mono',monospace",fontSize:11}} />],
            ["권한 만료일 (선택)", <input key="v" type="date" className="form-input" value={grantForm.validUntil} onChange={e=>setGrantForm(f=>({...f,validUntil:e.target.value}))} />],
            ["최대 기록 횟수", <input key="r" type="number" className="form-input" value={grantForm.remainingWrites} min="1" max="999" onChange={e=>setGrantForm(f=>({...f,remainingWrites:e.target.value}))} />],
          ].map(([label,input]) => (
            <div className="form-group" key={label} style={{ marginBottom:12 }}><label className="form-label">{label}</label>{input}</div>
          ))}
          <button className="btn-modal-mint" onClick={handleGrant} disabled={granting}>{granting?"처리 중...":"🏥 권한 부여하기"}</button>
        </div>
      </div>

      {isHospital && (
        <div className={"modal-overlay"+(addModal?" open":"")} onClick={()=>setAddModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:460 }}>
            <button className="modal-close" onClick={()=>setAddModal(false)}>✕</button>
            <div className="modal-title">진료 기록 추가</div>
            <div className="modal-sub">새로운 진료 기록을 블록체인에 기록합니다.</div>
            {[
              ["방문일", <input key="d" type="date" className="form-input" value={addForm.visitDate} onChange={e=>setAddForm(f=>({...f,visitDate:e.target.value}))} />],
              ["진단명 *", <input key="di" className="form-input" placeholder="예: 피부염" value={addForm.diagnosis} onChange={e=>setAddForm(f=>({...f,diagnosis:e.target.value}))} />],
              ["치료", <input key="t" className="form-input" placeholder="예: 약 처방" value={addForm.treatment} onChange={e=>setAddForm(f=>({...f,treatment:e.target.value}))} />],
              ["병원명 *", <input key="ho" className="form-input" placeholder="예: ABC 동물병원" value={addForm.hospital} onChange={e=>setAddForm(f=>({...f,hospital:e.target.value}))} />],
              ["메모", <textarea key="m" className="form-input" placeholder="추가 메모..." rows={3} value={addForm.memo} onChange={e=>setAddForm(f=>({...f,memo:e.target.value}))} style={{resize:"vertical"}} />],
            ].map(([label,input]) => (
              <div className="form-group" key={label} style={{ marginBottom:12 }}><label className="form-label">{label}</label>{input}</div>
            ))}
            <button className="btn-modal-mint" onClick={handleAdd} disabled={adding}>{adding?"기록 중...":"📋 기록 추가하기"}</button>
          </div>
        </div>
      )}
    </div>
  );
}



/* ───────────── HomePage ───────────── */
export function HomePage({ setPage, state }) {
  const petEmoji = EMOJI[state.profile?.pet?.species] || '🐾';
  return (
    <div className="page active">
      <div className="hero">
        <div className="hero-left">
          <div className="hero-tag">Web3 Pet Identity Platform</div>
          <h1 className="hero-h1">반려동물의<br /><em>디지털</em><br />신원을<br />만드세요</h1>
          <p className="hero-sub">블록체인 기반 SBT로 반려동물의 신원을 영구 기록하고, NFT로 특별한 순간을 소유하세요.</p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => setPage('register')}>지금 시작하기</button>
            <button className="btn-outline" onClick={() => setPage('mypage')}>마이페이지</button>
          </div>
        </div>
        <div className="hero-right">
          <div className="floating-card">
            <div className="card-badge">SBT · Verified</div>
            <div className="card-pet-img">{petEmoji}</div>
            <div className="card-name">{state.profile?.pet?.name || 'BUDDY'}</div>
            <div className="card-meta">
              <div>
                <div className="card-meta-label">Species</div>
                <div className="card-meta-val">{state.profile?.pet?.species || '강아지'}</div>
              </div>
              <div>
                <div className="card-meta-label">Token</div>
                <div className="card-meta-val">#{state.profile?.sbt?.tokenId || '?????'}</div>
              </div>
            </div>
            {state.tokenState.hasSbt && <div className="sbt-tag">SBT</div>}
          </div>
        </div>
      </div>

      <div className="stats-bar">
        {[['12,847','등록된 반려동물'],['9,231','발급된 SBT'],['24,156','발행된 NFT'],['3,892','활성 홀더']].map(([n, l]) => (
          <div className="stat-item" key={l}><div className="stat-num">{n}</div><div className="stat-label">{l}</div></div>
        ))}
      </div>

      <div className="section">
        <div className="section-tag">How It Works</div>
        <h2 className="section-h2">5단계로 시작하기</h2>
        <p className="section-sub">지갑 연결부터 굿즈 혜택까지, 간단한 절차로 반려동물의 디지털 신원을 만드세요.</p>
        <div className="flow-steps">
          {[
            ['01','🦊','지갑 연결','MetaMask 또는 WalletConnect'],
            ['02','🐾','반려동물 등록','이름, 종, 생년월일 입력'],
            ['03','🪙','SBT 발급','신원 증명 토큰 발행 + NFT 교환권 3개 지급'],
            ['04','🖼️','NFT 민팅','교환권 1개 소모 → 굿즈 교환권 1개 생성'],
            ['05','🎁','혜택 이용','굿즈 교환권으로 굿즈 해금 및 교환'],
          ].map(([n,i,name,desc]) => (
            <div className="flow-step" key={n}>
              <div className="flow-num">{n}</div>
              <div className="flow-icon">{i}</div>
              <div className="flow-name">{name}</div>
              <div className="flow-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="section-tag">Benefits</div>
        <h2 className="section-h2">왜 PetChain인가요?</h2>
        <p className="section-sub">단순한 NFT를 넘어, 반려동물과의 진짜 유대를 기록합니다.</p>
        <div className="bm-grid">
          {[
            ['🛡️','영구 신원 기록','SBT는 양도 불가능한 토큰으로, 반려동물의 신원을 블록체인에 영구 기록합니다.'],
            ['🎮','NFT 교환권 시스템','SBT 발급 시 NFT 교환권 3개 지급! 교환권 1개당 NFT 1개를 민팅할 수 있습니다.'],
            ['🎁','굿즈 교환권 & 할인권','NFT 민팅 시 굿즈 교환권 1개 + 할인권 1개 적립. 교환권으로 굿즈를 해금하세요.'],
          ].map(([icon,title,desc],i) => (
            <div className="bm-card" key={i}>
              <div className="bm-num">0{i+1}</div>
              <div className="bm-icon">{icon}</div>
              <div className="bm-title">{title}</div>
              <div className="bm-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────── RegisterPage ───────────── */
export function RegisterPage({ state, registerPet, connectWallet, showToast, setPage }) {
  const [form, setForm] = useState({ name: '', species: '강아지', gender: '남아', birthDate: '', adoptDate: '', imageUrl: null });
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!state.connected) { showToast('먼저 지갑을 연결해주세요.', 'error'); return; }
    if (!form.adoptDate) { showToast('입양일은 필수입니다.', 'error'); return; }
    setLoading(true);
    try {
      await registerPet(form);
      showToast('반려동물 등록 완료!');
      setTimeout(() => setPage('mypage'), 800);
    } catch (e) {
      showToast(e.message, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="page active">
      <div className="register-layout">
        <div>
          <div className="form-title">반려동물 등록</div>
          <p className="form-sub">
            반려동물의 정보를 입력하면 블록체인에 프로필이 생성됩니다.<br />
            등록 후 SBT를 발급받으면 <strong style={{ color: 'var(--accent2)' }}>NFT 교환권 3개</strong>를 드립니다!
          </p>

          {!state.connected && (
            <div className="no-pet-banner" style={{ marginBottom: 28 }}>
              <div className="no-pet-text"><strong>지갑 연결 필요</strong>등록하려면 먼저 지갑을 연결해주세요.</div>
              <button className="btn-mint" onClick={connectWallet}>지갑 연결</button>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">반려동물 이름</label>
            <input className="form-input" placeholder="예: 뭉치" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">종류</label>
              <select className="form-select" value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))}>
                {['강아지','고양이','토끼','햄스터','기타'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">성별</label>
              <div style={{ display:'flex', gap:8, height:50 }}>
                {['남아','여아','중성화'].map(g => (
                  <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))} style={{
                    flex:1, border:`1px solid ${form.gender===g ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.gender===g ? 'rgba(255,107,53,.12)' : 'var(--input-bg)',
                    color: form.gender===g ? 'var(--accent)' : 'var(--muted)',
                    fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:1, cursor:'pointer', transition:'all .2s'
                  }}>{g}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">태어난날 <span style={{ color:'var(--muted)', fontWeight:300 }}>(선택)</span></label>
              <input type="date" className="form-input" value={form.birthDate} max={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">입양일 <span style={{ color:'var(--accent)', fontSize:10 }}>*필수</span></label>
              <input type="date" className="form-input" value={form.adoptDate} max={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, adoptDate: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">반려동물 사진</label>
            <label htmlFor="pet-image-upload" style={{
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:8, border:'2px dashed var(--border)', borderRadius:12, padding:'28px 20px',
              cursor:'pointer', transition:'border-color 0.2s',
              background: form.imageUrl ? 'transparent' : 'var(--surface)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
            >
              {form.imageUrl
                ? <><img src={form.imageUrl} style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--accent)' }} /><span style={{ fontSize:12, color:'var(--muted)' }}>클릭해서 변경</span></>
                : <><span style={{ fontSize:32 }}>📷</span><span style={{ fontSize:13, color:'var(--muted)' }}>클릭해서 사진 업로드</span><span style={{ fontSize:11, color:'var(--muted)', opacity:0.6 }}>JPG, PNG, GIF 지원</span></>
              }
            </label>
            <input id="pet-image-upload" type="file" accept="image/*" style={{ display:'none' }} onChange={handleImage} />
          </div>

          <button className="btn-full" onClick={handleSubmit} disabled={loading || !state.connected}>
            {loading ? '등록 중...' : '반려동물 등록하기'}
          </button>
        </div>

        <div className="preview-section">
          <div className="preview-label">미리보기</div>
          <div className="preview-card">
            <div className="preview-img">
              {form.imageUrl
                ? <img src={form.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                : EMOJI[form.species] || '🐾'
              }
            </div>
            <div className="preview-name">{form.name || '반려동물 이름'}</div>
            <div className="preview-breed">{form.species} · {form.gender}</div>
            <div className="preview-rows">
              <div className="preview-row">
                <span className="preview-row-key">계정</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10 }}>{state.account ? state.account.slice(0,10)+'...' : '미연결'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-row-key">태어난날</span>
                <span>{form.birthDate || '—'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-row-key">입양일</span>
                <span>{form.adoptDate || '—'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-row-key">등록 반려동물</span>
                <span style={{ color:'var(--accent3)' }}>{state.profiles?.length || 0}마리 등록됨</span>
              </div>
            </div>
            <div className="chain-badge">
              <div className="chain-dot" /><div className="chain-text">BLOCKCHAIN READY · ERC-5192</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── DraggableNftDetail ───────────── */
export function DraggableNftDetail({ nft, profile, onClose }) {
  const petEmoji = EMOJI[profile?.pet?.species] || '🐾';
  const nftBg = ['linear-gradient(135deg,#1e1a2e,#2a1a3e)','linear-gradient(135deg,#0f2027,#203a43)','linear-gradient(135deg,#1a2a1a,#2a3a1e)'];
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 220, y: window.innerHeight / 2 - 300 });

  const onMouseDown = (e) => {
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!dragRef.current.dragging) return;
    setPos({ x: dragRef.current.origX + e.clientX - dragRef.current.startX, y: dragRef.current.origY + e.clientY - dragRef.current.startY });
  };
  const onMouseUp = () => {
    dragRef.current.dragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  if (!nft) return null;
  return (
    <div style={{ position:'fixed', left:pos.x, top:pos.y, zIndex:500, width:380, background:'var(--card)', border:'1px solid var(--border)', boxShadow:'0 24px 64px rgba(0,0,0,.5)', animation:'modal-in .25s ease' }}>
      <div onMouseDown={onMouseDown} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'grab', userSelect:'none', background:'var(--surface)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'var(--muted)', fontSize:12 }}>⠿⠿</span>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, color:'var(--muted)', textTransform:'uppercase' }}>NFT 상세</span>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:18, cursor:'pointer' }}>✕</button>
      </div>
      <div style={{ padding:24, maxHeight:'70vh', overflowY:'auto' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:2, marginBottom:14 }}>{profile.pet.name} #{nft.tokenId}</div>
        <div style={{ width:'100%', height:180, borderRadius:10, overflow:'hidden', marginBottom:16, background: nftBg[nft.index % nftBg.length], display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          {nft.nftImageUrl ? <img src={nft.nftImageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : profile?.pet?.imageUrl ? <img src={profile.pet.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontSize:64 }}>{petEmoji}</span>}
          <div className="nft-type-badge badge-limited" style={{ position:'absolute', top:10, right:10 }}>NFT</div>
        </div>
        {nft.nftDescription && <div style={{ padding:'10px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, marginBottom:10, fontSize:12, lineHeight:1.7, color:'var(--muted)' }}>{nft.nftDescription}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            ['이름', profile.pet.name],
            ['토큰 ID', `#${nft.tokenId}`],
            ['민팅일', nft.mintedAt ? new Date(nft.mintedAt).toLocaleString('ko-KR') : '—'],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--border)', fontSize:12 }}>
              <span style={{ color:'var(--muted)', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:1, textTransform:'uppercase' }}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
          <div style={{ padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--border)' }}>
            <div style={{ color:'var(--muted)', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>TX HASH</div>
            <div style={{ fontSize:10, fontFamily:"'Space Mono',monospace", wordBreak:'break-all', color:'var(--accent2)' }}>{nft.transactionHash||'—'}</div>
          </div>
        </div>
        {nft.transactionHash && (
          <a href={`https://sepolia.etherscan.io/tx/${nft.transactionHash}`} target="_blank" rel="noopener noreferrer" className="btn-modal-mint" style={{ display:'block', textAlign:'center', textDecoration:'none', marginTop:14 }}>Etherscan에서 보기 🔗</a>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   CouponSection
─────────────────────────────────────────── */
function CouponSection({ state }) {
  const { nftCoupons, goodsCoupons, couponHistory } = state;
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="info-grid">
        <div className="info-cell" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="info-cell-key">NFT 교환권</div>
            <div className="help-icon" title="NFT를 민팅할 수 있는 티켓입니다. (SBT 발급 시 3개 지급)" style={{ cursor: 'help', fontSize: 10, background: 'var(--border)', width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>?</div>
          </div>
          <div className="info-cell-val" style={{ color: 'var(--accent2)' }}>{nftCoupons || 0}개</div>
        </div>

        <div className="info-cell" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="info-cell-key">굿즈 교환권</div>
            <div className="help-icon" title="해금 굿즈를 교환할 수 있는 티켓입니다. (NFT 민팅 시 1개 생성)" style={{ cursor: 'help', fontSize: 10, background: 'var(--border)', width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>?</div>
          </div>
          <div className="info-cell-val" style={{ color: 'var(--accent3)' }}>{goodsCoupons || 0}개</div>
        </div>
      </div>

      {couponHistory?.length > 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', padding:'8px 12px', borderRadius:4 }}>
          <button onClick={() => setShowHistory(h => !h)} style={{ background:'none', border:'none', color:'var(--muted)', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:1, cursor:'pointer', textTransform:'uppercase', padding:0 }}>
            {showHistory ? '▲ 내역 닫기' : '▼ 교환권 내역 보기'}
          </button>
          {showHistory && (
            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4, maxHeight:100, overflowY:'auto' }}>
              {couponHistory.slice(0, 10).map(h => (
                <div key={h.id} style={{ display:'flex', justifyContent:'space-between', fontSize:10 }}>
                  <span style={{ color:'var(--muted)' }}>{h.desc}</span>
                  <span style={{ color: h.amount > 0 ? 'var(--accent3)' : '#ef4444' }}>{h.amount > 0 ? `+${h.amount}` : h.amount}개</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────── MyPage ───────────── */
export function MyPage({ state, issueSbt, issueNft, showToast, setPage, connectWallet, setActivePetId, addNftCouponFromMedical, mintMedicalPassport }) {
  const [sbtModal, setSbtModal] = useState(false);
  const [medicalCalendarOpen, setMedicalCalendarOpen] = useState(false);
  const [medicalGrantOpen, setMedicalGrantOpen] = useState(false);
  const [medicalSbtId, setMedicalSbtId] = useState(null);
  const [medicalPassportContract, setMedicalPassportContract] = useState(null);
  const [mintingPassport, setMintingPassport] = useState(false);
  const [nftModal, setNftModal] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(null);
  const [selectedNft, setSelectedNft] = useState(null);
  const [nftForm, setNftForm] = useState({ imageUrl: null, description: '' });
  const [downloadModal, setDownloadModal] = useState(false);
  const [pdfModal, setPdfModal] = useState(false);
  const [inquiryModal, setInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ category: '일반 문의', title: '', content: '' });
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const profile = state.profile;
  const petEmoji = EMOJI[profile?.pet?.species] || '🐾';
  const nftBg = ['linear-gradient(135deg,#1e1a2e,#2a1a3e)','linear-gradient(135deg,#0f2027,#203a43)','linear-gradient(135deg,#1a2a1a,#2a3a1e)'];
  const tokenState = state.tokenState;

  const canMintNft = tokenState.hasSbt && (state.nftCoupons || 0) > 0;

  const handleMint = async (type) => {
    setMinting(true);
    try {
      const result = type === 'sbt' ? await issueSbt() : await issueNft(nftForm);
      const issuance = type === 'sbt' ? result.issuance.sbt : result.issuance.nfts?.slice(-1)[0];
      setMintSuccess({ type: type.toUpperCase(), tokenId: issuance?.tokenId, hash: issuance?.transactionHash });
      if (type === 'sbt') showToast('🎮 SBT 발급 완료! NFT 교환권 3개가 지급되었습니다.');
      if (type === 'nft') showToast('🎁 NFT 민팅 완료! 굿즈 교환권 1개가 생성되었습니다.');
    } catch (e) {
      showToast(e.message, 'error');
      type === 'sbt' ? setSbtModal(false) : setNftModal(false);
    } finally { setMinting(false); }
  };

  const handleNftImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNftForm(f => ({ ...f, imageUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const closeModal = () => {
    setSbtModal(false); setNftModal(false); setMintSuccess(null); setNftForm({ imageUrl: null, description: '' });
    setDownloadModal(false); setPdfModal(false); setInquiryModal(false);
    setInquirySubmitted(false); setInquiryForm({ category: '일반 문의', title: '', content: '' });
  };

  const handleInquirySubmit = () => {
    if (!inquiryForm.title.trim() || !inquiryForm.content.trim()) { showToast('제목과 내용을 입력해주세요.', 'error'); return; }
    setInquirySubmitted(true);
  };

  // medicalSbtId 조회
  useEffect(() => {
    if (!profile?.sbt?.tokenId) return;
    const init = async () => {
      try {
        const { medicalPassport, petSBT } = await createRealGateways();
        setMedicalPassportContract(medicalPassport);
        const sbtId = await medicalPassport.medicalSbtByOwnerSbt(profile.sbt.tokenId);
        if (Number(sbtId) !== 0) setMedicalSbtId(Number(sbtId));
      } catch(e) {
        console.error('의료 여권 조회 실패:', e);
      }
    };
    init();
  }, [profile?.sbt?.tokenId]);

  const handleMintPassport = async () => {
    setMintingPassport(true);
    try {
      await mintMedicalPassport(profile?.pet?.id);
      showToast('🏥 의료 여권이 발급되었습니다!');
      if (medicalPassportContract && profile?.sbt?.tokenId) {
        const sbtId = await medicalPassportContract.medicalSbtByOwnerSbt(profile.sbt.tokenId);
        if (Number(sbtId) !== 0) setMedicalSbtId(Number(sbtId));
      }
    } catch(e) { showToast(e.message, 'error'); }
    finally { setMintingPassport(false); }
  };

  if (!state.connected) return (
    <div className="page active">
      <div className="mypage-layout">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <div className="empty-state-title">지갑을 연결해주세요</div>
          <p className="empty-state-desc" style={{ marginBottom:24 }}>마이페이지를 이용하려면 지갑 연결이 필요합니다.</p>
          <button className="btn-primary" onClick={connectWallet}>지갑 연결하기</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page active">
      <div className="mypage-layout">
        <div className="mypage-header">
          <div>
            <div className="wallet-label">연결된 지갑</div>
            <div className="wallet-addr">{state.account}</div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button className="btn-mint" onClick={() => setPage('register')}>+ 반려동물 추가</button>
            {profile && !tokenState.hasSbt && (
              <button className="btn-mint" onClick={() => setSbtModal(true)}>SBT 발급</button>
            )}
            {canMintNft && (
              <button className="btn-mint" onClick={() => setNftModal(true)}>
                NFT 민팅 <span style={{ fontSize:10, opacity:.8 }}>(교환권 {state.nftCoupons || 0}개)</span>
              </button>
            )}
            {tokenState.hasSbt && (state.nftCoupons || 0) === 0 && (
              <div style={{ padding:'0 14px', border:'1px solid var(--border)', display:'flex', alignItems:'center', fontSize:11, color:'var(--muted)' }}>
                교환권 부족
              </div>
            )}
          </div>
        </div>

        {state.profiles?.length > 0 && (
          <div style={{ display:'flex', gap:10, marginBottom:28, overflowX:'auto', paddingBottom:4 }}>
            {state.profiles.map(p => {
              const isActive = p.pet.id === state.activePetId || (!state.activePetId && p === state.profiles[0]);
              const ts = state.tokenStates?.[p.pet.id] || { hasSbt:false, hasNft:false };
              return (
                <button key={p.pet.id} onClick={() => setActivePetId(p.pet.id)} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 18px',
                  background: isActive ? 'var(--card)' : 'var(--surface)',
                  border:`1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  cursor:'pointer', transition:'all .2s', flexShrink:0, minWidth:140
                }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {p.pet.imageUrl ? <img src={p.pet.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : (EMOJI[p.pet.species] || '🐾')}
                  </div>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:13, fontWeight:600, color: isActive ? 'var(--text)' : 'var(--muted)' }}>{p.pet.name}</div>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:'var(--muted)', letterSpacing:1 }}>
                      {ts.hasSbt ? '🟢 SBT' : '⚪ 미발급'}{ts.hasNft ? ' · NFT' : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!profile ? (
          <div className="no-pet-banner">
            <div className="no-pet-text"><strong>반려동물 미등록</strong>먼저 반려동물을 등록해야 SBT와 NFT를 발급받을 수 있습니다.</div>
            <button className="btn-mint" onClick={() => setPage('register')}>지금 등록하기</button>
          </div>
        ) : (
          <div className="mypage-grid">
            <div className="pet-card-main">
              <div className="pet-card-main-img">
                {profile?.pet?.imageUrl
                  ? <img src={profile.pet.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                  : petEmoji}
              </div>
              {tokenState.hasSbt && <div className="verified-badge">✓ SBT Verified</div>}
              <div className="pet-main-name">{profile.pet.name}</div>
              <div className="pet-main-breed">{profile.pet.species}{profile.pet.gender ? ` · ${profile.pet.gender}` : ''}</div>

              <div className="info-grid">
                <div className="info-cell"><div className="info-cell-key">태어난날</div><div className="info-cell-val">{profile.pet.birthDate || '—'}</div></div>
                <div className="info-cell"><div className="info-cell-key">입양일</div><div className="info-cell-val">{profile.pet.adoptDate || '—'}</div></div>
                <div className="info-cell"><div className="info-cell-key">성별</div><div className="info-cell-val">{profile.pet.gender || '—'}</div></div>
                <div className="info-cell"><div className="info-cell-key">NFT 수량</div><div className="info-cell-val">{profile.nfts?.length || 0}개</div></div>
              </div>

              {/* NFT교환권 / 굿즈교환권 */}
              <CouponSection state={state} />

              {/* 🏥 의료 여권 발급하기 */}
              {profile.sbt && !medicalSbtId && (
                <button onClick={handleMintPassport} disabled={mintingPassport} style={{ width:"100%", marginTop:8, padding:"10px", background:"rgba(255,107,53,0.1)", border:"1px dashed var(--accent)", color:"var(--accent)", cursor:"pointer", fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:1, borderRadius:8 }}>
                  {mintingPassport ? "발급 중..." : "🏥 의료 여권 발급하기"}
                </button>
              )}
              {medicalSbtId && (
                <div style={{ marginTop:8, padding:"8px 12px", background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:6, fontSize:11, color:"var(--accent3)", fontFamily:"'Space Mono',monospace" }}>
                  ✅ 의료 여권 발급됨 (#{medicalSbtId})
                </div>
              )}

              {/* 병원 권한 부여 / 📅 */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:8, marginTop:8 }}>
                <button onClick={() => setMedicalGrantOpen(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.4)", color:"var(--accent2)", fontSize:11, cursor:"pointer", borderRadius:6, fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
                  🏥 병원 권한 부여
                </button>
                <button onClick={() => setMedicalCalendarOpen(true)} style={{ width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, cursor:"pointer", fontSize:18 }}>
                  📅
                </button>
              </div>

              {/* SBT TOKEN */}
              {profile.sbt && (
                <div className="sbt-block" style={{ marginTop: 8 }}>
                  <div className="sbt-icon">🪙</div>
                  <div><div className="sbt-info-label">SBT Token</div><div className="sbt-info-val">#{profile.sbt.tokenId}</div></div>
                </div>
              )}

              <MedicalSection isHospital={false} showToast={showToast} calendarOpen={medicalCalendarOpen} setCalendarOpen={setMedicalCalendarOpen} grantOpen={medicalGrantOpen} setGrantOpen={setMedicalGrantOpen} medicalSbtId={medicalSbtId} medicalPassport={medicalPassportContract} addNftCoupon={addNftCouponFromMedical} petId={profile?.pet?.id} />

              <div className="holder-section" style={{ marginTop:16 }}>
                <div className="holder-title">홀더 혜택</div>
                <div className="holder-features">
                  {[
                    ['🎁','굿즈 스토어','주문하러 가기', !tokenState.hasNft, () => setPage('goods')],
                    ['📥','고화질 다운로드','원본 파일', !tokenState.hasSbt, () => setDownloadModal(true)],
                    ['💬','1:1 문의','홀더 전용', !tokenState.hasNft, () => setInquiryModal(true)],
                    ['🛡️','신원 인증서','PDF 발급', !tokenState.hasSbt, () => setPdfModal(true)],
                  ].map(([icon,name,desc,locked,action]) => (
                    <div key={name} className={`holder-feat${locked ? ' locked' : ''}`} onClick={locked ? undefined : action}>
                      <div className="holder-feat-icon">{icon}</div>
                      <div className="holder-feat-name">{name}</div>
                      <div className="holder-feat-desc">{desc}</div>
                      <div className="lock-overlay"><span>🔒</span><span>잠김</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 오른쪽 NFT 컬렉션 */}
            <div>
              <div className="nft-section-top">
                <div className="nft-section-title">내 NFT 컬렉션</div>
                <button
                  className="btn-mint"
                  disabled={!canMintNft}
                  onClick={() => setNftModal(true)}
                >
                  + NFT 민팅{(state.nftCoupons || 0) > 0 ? ` (${state.nftCoupons})` : ''}
                </button>
              </div>
              {!profile.nfts?.length ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🖼️</div>
                  <div className="empty-state-title">NFT 없음</div>
                  <p className="empty-state-desc">
                    {!tokenState.hasSbt
                      ? 'SBT 발급 후 NFT를 민팅할 수 있습니다.'
                      : (state.nftCoupons || 0) === 0
                      ? 'SBT를 더 발급해 교환권을 획득하세요.'
                      : 'NFT를 민팅해보세요.'}
                  </p>
                </div>
              ) : (
                <div className="nft-grid">
                  {profile.nfts.map((nft, i) => (
                    <div className="nft-item" key={nft.tokenId} onClick={() => setSelectedNft({ ...nft, index: i })}>
                      <div className="nft-item-img" style={{ background: nftBg[i % nftBg.length] }}>
                        {nft.nftImageUrl ? <img src={nft.nftImageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : profile?.pet?.imageUrl ? <img src={profile.pet.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : petEmoji}
                        <div className="nft-type-badge badge-limited">NFT</div>
                      </div>
                      <div className="nft-item-body">
                        <div className="nft-item-name">{profile.pet.name} #{nft.tokenId}</div>
                        <div className="nft-item-meta">
                          <span className="nft-item-edition">Edition #{i + 1}</span>
                          <span className="nft-item-num">#{nft.tokenId}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedNft && <DraggableNftDetail nft={selectedNft} profile={profile} onClose={() => setSelectedNft(null)} />}

      <div className={`modal-overlay${sbtModal ? ' open' : ''}`}>
        <div className="modal">
          <button className="modal-close" onClick={closeModal}>✕</button>
          {!mintSuccess ? (
            <>
              <div className="modal-title">SBT 발급</div>
              <div className="modal-sub">SBT(Soulbound Token)는 반려동물의 블록체인 신원 증명입니다.</div>
              <div style={{ background:'rgba(124,58,237,.08)', border:'1px solid rgba(124,58,237,.3)', padding:'14px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:24 }}>🎮</span>
                <div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'var(--accent2)', letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>발급 보상</div>
                  <div style={{ fontSize:13 }}>NFT 교환권 <strong style={{ color:'var(--accent2)' }}>3개</strong> 즉시 지급!</div>
                </div>
              </div>
              <button className="btn-modal-mint" onClick={() => handleMint('sbt')} disabled={minting}>
                {minting ? '발급 중...' : 'SBT 발급하기'}
              </button>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div className="success-icon">🎉</div>
              <div className="success-title">발급 완료!</div>
              <div className="success-sub">SBT #{mintSuccess.tokenId}가 발급되었으며, <span style={{ color:'var(--accent2)' }}>NFT 교환권 3개</span>가 충전되었습니다.</div>
              <button className="btn-modal-mint" style={{ marginTop:20 }} onClick={closeModal}>닫기</button>
            </div>
          )}
        </div>
      </div>

      <div className={`modal-overlay${nftModal ? ' open' : ''}`}>
        <div className="modal">
          <button className="modal-close" onClick={closeModal}>✕</button>
          {!mintSuccess ? (
            <>
              <div className="modal-title">NFT 민팅</div>
              <div className="modal-sub">특별한 순간을 NFT로 기록하고 굿즈 교환권을 획득하세요.</div>
              <div style={{ background:'rgba(52,211,153,.08)', border:'1px solid rgba(52,211,153,.25)', padding:'14px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:24 }}>🎁</span>
                <div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'var(--accent3)', letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>민팅 보상</div>
                  <div style={{ fontSize:13 }}>굿즈 교환권 <strong style={{ color:'var(--accent3)' }}>1개</strong> 즉시 지급!</div>
                </div>
              </div>
              
              {/* 이미지 업로드 영역 개선 */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>이미지 선택</label>
                <label htmlFor="nft-image-input" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  width: '100%', height: 160, border: '2px dashed var(--border)', borderRadius: 12,
                  background: 'var(--surface)', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {nftForm.imageUrl ? (
                    <img src={nftForm.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>사진 업로드하기</div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>JPG, PNG 지원</div>
                    </div>
                  )}
                </label>
                <input id="nft-image-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleNftImage} />
              </div>

              <textarea value={nftForm.description} onChange={e => setNftForm(f => ({ ...f, description: e.target.value }))} placeholder="이 NFT에 대한 설명을 적어주세요..." rows={3} style={{ width:'100%', background:'var(--input-bg)', border:'1px solid var(--border)', color:'var(--text)', padding:'12px 14px', marginBottom: 20 }} />
              <button className="btn-modal-mint" onClick={() => handleMint('nft')} disabled={minting}>
                {minting ? '민팅 중...' : 'NFT 민팅하기 (교환권 1개 소모)'}
              </button>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'32px 0' }}>
              <div className="success-icon">✅</div>
              <div className="success-title" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2 }}>민팅 완료!</div>
              <div className="success-sub" style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>NFT 발행과 함께 굿즈 교환권 1개가 지급되었습니다.</div>
              <button className="btn-modal-mint" style={{ marginTop:24 }} onClick={closeModal}>확인</button>
            </div>
          )}
        </div>
      </div>

      <div className={`modal-overlay${downloadModal ? ' open' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:440 }}>
          <button className="modal-close" onClick={closeModal}>✕</button>
          <div className="modal-title">고화질 다운로드</div>
          <div className="modal-sub">SBT에 등록된 원본 파일을 다운로드합니다.</div>
          {profile?.pet?.imageUrl ? (
            <>
              <div style={{ width:'100%', aspectRatio:'1', background:'var(--surface)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, overflow:'hidden' }}>
                <img src={profile.pet.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <a href={profile.pet.imageUrl} download={`${profile.pet.name}_original.png`} className="btn-modal-mint" style={{ display:'block', textAlign:'center', textDecoration:'none' }}>📥 원본 다운로드</a>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🖼️</div>
              <div style={{ fontSize:14 }}>등록된 이미지가 없습니다.</div>
            </div>
          )}
        </div>
      </div>

      <div className={`modal-overlay${pdfModal ? ' open' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:460 }}>
          <button className="modal-close" onClick={closeModal}>✕</button>
          <div className="modal-title">신원 인증서</div>
          <div className="modal-sub">블록체인에 기록된 반려동물 신원 정보를 PDF로 발급합니다.</div>
          <div style={{ border:'2px solid var(--border)', padding:28, marginBottom:20, position:'relative', background:'var(--surface)' }}>
            <div style={{ position:'absolute', top:12, right:12, background:'var(--accent2)', color:'#fff', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:1, padding:'3px 8px' }}>SBT VERIFIED</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, marginBottom:16 }}>반려동물 신원 인증서</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['반려동물명', profile?.pet?.name],
                ['종', profile?.pet?.species],
                ['SBT Token ID', `#${profile?.sbt?.tokenId ?? '—'}`],
                ['발급일', new Date().toLocaleDateString('ko-KR')],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--border)', paddingBottom:8, fontSize:13 }}>
                  <span style={{ color:'var(--muted)', fontFamily:"'Space Mono',monospace", fontSize:10 }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="btn-modal-mint" onClick={() => { showToast('PDF 발급이 준비 중입니다.'); closeModal(); }}>🛡️ PDF 발급하기</button>
        </div>
      </div>

      <div className={`modal-overlay${inquiryModal ? ' open' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:480 }}>
          <button className="modal-close" onClick={closeModal}>✕</button>
          {!inquirySubmitted ? (
            <>
              <div className="modal-title">1:1 문의</div>
              <div className="modal-sub">홀더 전용 채널입니다. 빠른 시간 내에 답변드리겠습니다.</div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>문의 유형</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['일반 문의','굿즈 문의','기술 지원','NFT/SBT 문의'].map(cat => (
                    <button key={cat} onClick={() => setInquiryForm(f => ({...f, category:cat}))} style={{ padding:'7px 14px', fontFamily:"'Space Mono',monospace", fontSize:10, background: inquiryForm.category===cat ? 'var(--accent)' : 'var(--surface)', color: inquiryForm.category===cat ? '#fff' : 'var(--muted)', border:`1px solid ${inquiryForm.category===cat ? 'var(--accent)' : 'var(--border)'}`, cursor:'pointer', transition:'all .2s' }}>{cat}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>제목</div>
                <input className="form-input" placeholder="문의 제목을 입력해주세요" value={inquiryForm.title} onChange={e => setInquiryForm(f => ({...f, title:e.target.value}))} />
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>내용</div>
                <textarea className="form-input" placeholder="문의 내용을 자세히 작성해주세요..." rows={5} value={inquiryForm.content} onChange={e => setInquiryForm(f => ({...f, content:e.target.value}))} style={{ resize:'vertical', fontFamily: "'Noto Sans KR', sans-serif" }} />
              </div>
              <button className="btn-modal-mint" onClick={handleInquirySubmit}>💬 문의 제출하기</button>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'32px 0' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, letterSpacing:2, color:'var(--accent3)', marginBottom:8 }}>접수 완료!</div>
              <div style={{ color:'var(--muted)', fontSize:14, lineHeight:1.8 }}>문의가 성공적으로 접수되었습니다.</div>
              <button className="btn-modal-mint" style={{ marginTop:20 }} onClick={closeModal}>닫기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}