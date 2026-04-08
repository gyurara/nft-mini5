import { useState, useEffect, useMemo } from "react";
import { UNLOCK_TIERS, DISCOUNT_PER_COUPON } from './services.js';

const EMOJI = { '강아지': '🐶', '고양이': '🐱', '토끼': '🐰', '햄스터': '🐹' };

/* ───────────── SVG 목업들 ───────────── */
export function TshirtSVG({ color, sleeve, imgUrl, petEmoji }) {
  const isLong = sleeve === 'long';
  const isHoodie = sleeve === 'hoodie';
  const shadow = color === '#ffffff' || color === '#f0f0f0' ? '#cccccc' : '#00000040';
  return (
    <svg viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.18))'}}>
      <defs>
        <linearGradient id="shirtGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.13"/><stop offset="100%" stopColor="#000000" stopOpacity="0.08"/></linearGradient>
        <linearGradient id="shirtSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#000000" stopOpacity="0.12"/><stop offset="40%" stopColor="#000000" stopOpacity="0"/><stop offset="60%" stopColor="#000000" stopOpacity="0"/><stop offset="100%" stopColor="#000000" stopOpacity="0.10"/></linearGradient>
        <clipPath id="imgClip"><rect x="138" y="155" width="124" height="124" rx="10"/></clipPath>
      </defs>
      {isHoodie && <><path d="M155,30 Q200,8 245,30 L238,90 Q200,108 162,90Z" fill={color} stroke={shadow} strokeWidth="1.5"/><path d="M155,30 Q200,8 245,30 L238,90 Q200,108 162,90Z" fill="url(#shirtGrad)"/><ellipse cx="200" cy="62" rx="34" ry="28" fill={color} stroke={shadow} strokeWidth="1.5"/><ellipse cx="200" cy="62" rx="34" ry="28" fill="url(#shirtGrad)" opacity=".6"/><ellipse cx="200" cy="62" rx="22" ry="18" fill={shadow} opacity=".15"/></>}
      {!isHoodie && <ellipse cx="200" cy="68" rx="30" ry="14" fill={color} stroke={shadow} strokeWidth="1"/>}
      {isLong || isHoodie ? <path d="M112,90 L58,110 L42,310 L88,316 L100,170 L118,155Z" fill={color} stroke={shadow} strokeWidth="1.5"/> : <path d="M112,90 L62,108 L72,185 L118,170Z" fill={color} stroke={shadow} strokeWidth="1.5"/>}
      {isLong || isHoodie ? <path d="M288,90 L342,110 L358,310 L312,316 L300,170 L282,155Z" fill={color} stroke={shadow} strokeWidth="1.5"/> : <path d="M288,90 L338,108 L328,185 L282,170Z" fill={color} stroke={shadow} strokeWidth="1.5"/>}
      <path d="M112,90 Q120,68 200,60 Q280,68 288,90 L296,390 L104,390Z" fill={color} stroke={shadow} strokeWidth="1.5"/>
      <path d="M112,90 Q120,68 200,60 Q280,68 288,90 L296,390 L104,390Z" fill="url(#shirtGrad)"/>
      <path d="M112,90 Q120,68 200,60 Q280,68 288,90 L296,390 L104,390Z" fill="url(#shirtSide)"/>
      <line x1="200" y1="90" x2="200" y2="390" stroke={shadow} strokeWidth="0.8" strokeDasharray="6,8" opacity=".5"/>
      {isHoodie && <path d="M152,280 Q200,272 248,280 L248,310 Q200,318 152,310Z" fill={shadow} opacity=".18"/>}
      {imgUrl ? <><image href={imgUrl} x="138" y="155" width="124" height="124" clipPath="url(#imgClip)" preserveAspectRatio="xMidYMid slice"/><rect x="138" y="155" width="124" height="124" rx="10" fill="none" stroke="#ffffff30" strokeWidth="2"/></> : <text x="200" y="228" textAnchor="middle" fontSize="72" dominantBaseline="middle">{petEmoji}</text>}
    </svg>
  );
}

export function DollSVG({ species, imgUrl }) {
  const palettes = { '강아지':{ body:'#c8956c', belly:'#e8c49a', nose:'#5a2d0c', ear:'#b07850' }, '고양이':{ body:'#a0a0a8', belly:'#d0d0d8', nose:'#e88898', ear:'#908898' }, '토끼':{ body:'#e8d8d8', belly:'#f8f0f0', nose:'#e87898', ear:'#f0c0c8' }, '햄스터':{ body:'#d4a060', belly:'#f0d090', nose:'#c07050', ear:'#c89060' } };
  const p = palettes[species] || palettes['강아지'];
  return (
    <svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.18))'}}>
      <defs><radialGradient id="dollGrad" cx="40%" cy="35%"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.3"/><stop offset="100%" stopColor="#000000" stopOpacity="0.1"/></radialGradient><clipPath id="dollFaceClip"><circle cx="200" cy="148" r="74"/></clipPath></defs>
      {species==='토끼' ? <><ellipse cx="148" cy="68" rx="22" ry="52" fill={p.ear}/><ellipse cx="252" cy="68" rx="22" ry="52" fill={p.ear}/><ellipse cx="148" cy="68" rx="13" ry="40" fill={p.nose} opacity=".5"/><ellipse cx="252" cy="68" rx="13" ry="40" fill={p.nose} opacity=".5"/></> : species==='고양이' ? <><polygon points="142,108 120,52 168,96" fill={p.ear}/><polygon points="258,108 280,52 232,96" fill={p.ear}/></> : <><ellipse cx="142" cy="106" rx="30" ry="22" fill={p.ear}/><ellipse cx="258" cy="106" rx="30" ry="22" fill={p.ear}/></>}
      <circle cx="200" cy="148" r="74" fill={p.body}/><circle cx="200" cy="148" r="74" fill="url(#dollGrad)"/>
      <ellipse cx="200" cy="162" rx="46" ry="38" fill={p.belly} opacity=".6"/>
      {imgUrl ? <image href={imgUrl} x="126" y="74" width="148" height="148" clipPath="url(#dollFaceClip)" preserveAspectRatio="xMidYMid slice"/> : <><circle cx="178" cy="138" r="9" fill="#2a1a0a"/><circle cx="222" cy="138" r="9" fill="#2a1a0a"/><circle cx="181" cy="135" r="3" fill="#fff" opacity=".7"/><circle cx="225" cy="135" r="3" fill="#fff" opacity=".7"/><ellipse cx="200" cy="162" rx="14" ry="9" fill={p.nose} opacity=".7"/><path d="M186,174 Q200,184 214,174" stroke="#8a4a3a" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>}
      <ellipse cx="200" cy="300" rx="70" ry="84" fill={p.body}/><ellipse cx="200" cy="300" rx="70" ry="84" fill="url(#dollGrad)"/>
      <ellipse cx="200" cy="310" rx="44" ry="52" fill={p.belly} opacity=".55"/>
      <ellipse cx="122" cy="292" rx="26" ry="58" fill={p.body} transform="rotate(-12,122,292)"/><ellipse cx="278" cy="292" rx="26" ry="58" fill={p.body} transform="rotate(12,278,292)"/>
      <ellipse cx="168" cy="388" rx="28" ry="20" fill={p.ear}/><ellipse cx="232" cy="388" rx="28" ry="20" fill={p.ear}/><ellipse cx="168" cy="376" rx="22" ry="36" fill={p.body}/><ellipse cx="232" cy="376" rx="22" ry="36" fill={p.body}/>
    </svg>
  );
}

export function MugSVG({ color, imgUrl, petEmoji }) {
  const isLight = color === '#f8f8f8' || color === '#a8d8c8';
  const shadow = isLight ? '#99999944' : '#00000044';
  return (
    <svg viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.2))'}}>
      <defs><linearGradient id="mugBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#000" stopOpacity="0.18"/><stop offset="20%" stopColor="#000" stopOpacity="0"/><stop offset="80%" stopColor="#000" stopOpacity="0"/><stop offset="100%" stopColor="#000" stopOpacity="0.22"/></linearGradient><linearGradient id="mugTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.25"/><stop offset="100%" stopColor="#000" stopOpacity="0.1"/></linearGradient><clipPath id="mugImgClip"><rect x="108" y="118" width="148" height="148" rx="12"/></clipPath></defs>
      <path d="M72,88 Q72,340 200,348 Q328,340 328,88Z" fill={color} stroke={shadow} strokeWidth="1.5"/><path d="M72,88 Q72,340 200,348 Q328,340 328,88Z" fill="url(#mugBody)"/>
      <ellipse cx="200" cy="88" rx="128" ry="30" fill={color} stroke={shadow} strokeWidth="1.5"/><ellipse cx="200" cy="88" rx="128" ry="30" fill="url(#mugTop)"/>
      <ellipse cx="200" cy="88" rx="112" ry="24" fill="#00000030"/>
      <path d="M328,130 Q400,130 400,208 Q400,286 328,286" fill="none" stroke={color} strokeWidth="44" strokeLinecap="round"/>
      <path d="M328,130 Q392,130 392,208 Q392,278 328,286" fill="none" stroke={shadow} strokeWidth="2"/>
      {imgUrl ? <><image href={imgUrl} x="108" y="118" width="148" height="148" clipPath="url(#mugImgClip)" preserveAspectRatio="xMidYMid slice"/><rect x="108" y="118" width="148" height="148" rx="12" fill="none" stroke="#ffffff30" strokeWidth="2"/></> : <text x="182" y="206" textAnchor="middle" fontSize="80" dominantBaseline="middle">{petEmoji}</text>}
      <ellipse cx="130" cy="160" rx="18" ry="48" fill="#ffffff" opacity="0.09" transform="rotate(-10,130,160)"/>
    </svg>
  );
}

export function FrameSVG({ imgUrl, petEmoji }) {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 10px 30px rgba(0,0,0,0.28))'}}>
      <defs><linearGradient id="frameOuter" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c8a050"/><stop offset="40%" stopColor="#8b5e1a"/><stop offset="60%" stopColor="#a07828"/><stop offset="100%" stopColor="#6b4410"/></linearGradient><clipPath id="frameImgClip"><rect x="64" y="64" width="272" height="272"/></clipPath></defs>
      <rect x="12" y="12" width="376" height="376" rx="6" fill="url(#frameOuter)"/>
      <rect x="28" y="28" width="344" height="344" rx="4" fill="url(#frameOuter)" opacity=".7"/>
      <rect x="44" y="44" width="312" height="312" rx="3" fill="url(#frameOuter)"/>
      {[[28,28],[372,28],[28,372],[372,372]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="10" fill="#c8a050"/>)}
      <rect x="64" y="64" width="272" height="272" fill="#0a0a12"/>
      {imgUrl ? <image href={imgUrl} x="64" y="64" width="272" height="272" clipPath="url(#frameImgClip)" preserveAspectRatio="xMidYMid slice"/> : <text x="200" y="200" textAnchor="middle" fontSize="120" dominantBaseline="middle">{petEmoji}</text>}
      <path d="M64,64 L200,64 L64,200Z" fill="#ffffff" opacity=".05"/>
    </svg>
  );
}

export function PhoneSVG({ color, imgUrl, petEmoji }) {
  return (
    <svg viewBox="0 0 260 420" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 10px 28px rgba(0,0,0,0.22))'}}>
      <defs><linearGradient id="phoneGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#000" stopOpacity="0.2"/><stop offset="30%" stopColor="#000" stopOpacity="0"/><stop offset="70%" stopColor="#000" stopOpacity="0"/><stop offset="100%" stopColor="#000" stopOpacity="0.18"/></linearGradient><clipPath id="phoneImgClip"><rect x="72" y="130" width="116" height="116" rx="10"/></clipPath></defs>
      <rect x="16" y="12" width="228" height="396" rx="32" fill={color} stroke="#00000030" strokeWidth="2"/>
      <rect x="16" y="12" width="228" height="396" rx="32" fill="url(#phoneGrad)"/>
      <rect x="72" y="28" width="116" height="52" rx="16" fill="#00000025"/>
      <circle cx="104" cy="54" r="14" fill="#1a1a2a"/><circle cx="104" cy="54" r="10" fill="#0d0d1a"/><circle cx="104" cy="54" r="5" fill="#2a3a5a"/><circle cx="100" cy="50" r="2" fill="#ffffff" opacity=".5"/>
      <circle cx="136" cy="54" r="10" fill="#1a1a2a"/><circle cx="136" cy="54" r="6" fill="#0d0d1a"/><circle cx="160" cy="44" r="5" fill="#1a1a2a"/>
      <rect x="28" y="100" width="204" height="300" rx="8" fill="#0a0a14" opacity=".85"/>
      {imgUrl ? <><image href={imgUrl} x="72" y="130" width="116" height="116" clipPath="url(#phoneImgClip)" preserveAspectRatio="xMidYMid slice"/><rect x="72" y="130" width="116" height="116" rx="10" fill="none" stroke="#ffffff20" strokeWidth="1.5"/></> : <text x="130" y="196" textAnchor="middle" fontSize="64" dominantBaseline="middle">{petEmoji}</text>}
      <rect x="96" y="374" width="68" height="5" rx="3" fill="#ffffff" opacity=".3"/>
      <rect x="10" y="120" width="6" height="44" rx="3" fill="#00000030"/>
      <rect x="244" y="106" width="6" height="32" rx="3" fill="#00000030"/>
    </svg>
  );
}

export function BagSVG({ color, imgUrl, petEmoji }) {
  const isDark = color === '#1e2d4a';
  return (
    <svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.18))'}}>
      <defs><linearGradient id="bagGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.12"/><stop offset="100%" stopColor="#000" stopOpacity="0.1"/></linearGradient><clipPath id="bagImgClip"><rect x="125" y="160" width="150" height="150" rx="12"/></clipPath></defs>
      <path d="M138,82 Q130,28 168,20 Q206,12 212,82" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"/>
      <path d="M188,82 Q182,28 220,20 Q258,12 262,82" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"/>
      <rect x="48" y="82" width="304" height="330" rx="16" fill={color} stroke="#00000020" strokeWidth="1.5"/>
      <rect x="48" y="82" width="304" height="330" rx="16" fill="url(#bagGrad)"/>
      <rect x="48" y="82" width="304" height="42" rx="16" fill="#00000018"/>
      <line x1="48" y1="124" x2="352" y2="124" stroke="#00000022" strokeWidth="1.5"/>
      {imgUrl ? <><image href={imgUrl} x="125" y="160" width="150" height="150" clipPath="url(#bagImgClip)" preserveAspectRatio="xMidYMid slice"/><rect x="125" y="160" width="150" height="150" rx="12" fill="none" stroke={isDark?"#ffffff25":"#00000020"} strokeWidth="1.5"/></> : <text x="200" y="244" textAnchor="middle" fontSize="80" dominantBaseline="middle">{petEmoji}</text>}
      <rect x="48" y="378" width="304" height="34" rx="16" fill="#00000012"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   GoodsPage Component
───────────────────────────────────────────────────── */
export function GoodsPage({ state, getGoodsPreview, showToast, setPage, useDiscountCoupons, redeemGoodsCoupon }) {
  const [activeTab, setActiveTab] = useState('store');
  const [selectedGoodsIdx, setSelectedGoodsIdx] = useState(0);
  const [selectedDesignIdx, setSelectedDesignIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [preview, setPreview] = useState(null);
  const [selectedNftIdx, setSelectedNftIdx] = useState(0);
  const [orderModal, setOrderModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [address, setAddress] = useState({ name:'', phone:'', addr1:'' });
  const [useCoupons, setUseCoupons] = useState(0);
  const [unlockOrderModal, setUnlockOrderModal] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); 

  const nfts = state.profile?.nfts || [];
  const petEmoji = EMOJI[state.profile?.pet?.species] || '🐾';
  const species = state.profile?.pet?.species || '강아지';
  const goodsIcons = { tshirt:'👕', longsleeves:'👔', hoodie:'🧥', doll:'🧸', mug:'☕', frame:'🖼️', phone:'📱', bag:'🛍️' };

  const catalog = useMemo(() => [
    { id:'tshirt',      name:'반팔 티셔츠',     price:35000, badge:'POPULAR', desc:'순면 20수 · 남녀공용',     designs:[{name:'화이트',color:'#f5f5f5'},{name:'블랙',color:'#1c1c1c'},{name:'네이비',color:'#1a2f5a'},{name:'그레이',color:'#9e9ea8'}] },
    { id:'longsleeves', name:'긴팔 티셔츠',     price:42000, badge:null,      desc:'순면 30수 · 세미오버핏',   designs:[{name:'화이트',color:'#f5f5f5'},{name:'블랙',color:'#1c1c1c'},{name:'버건디',color:'#5c1a2e'}] },
    { id:'hoodie',      name:'후드 집업',       price:68000, badge:'NEW',     desc:'기모 안감 · 루즈핏',       designs:[{name:'차콜',color:'#2c2c2c'},{name:'크림',color:'#f0ead8'},{name:'인디고',color:'#1e2d5a'}] },
    { id:'doll',        name:'반려동물 인형',   price:52000, badge:null,      desc:'봉제 인형 · 25cm',        designs:[{name:'기본',color:''}] },
    { id:'mug',         name:'머그컵',         price:18000, badge:null,      desc:'도자기 · 350ml',          designs:[{name:'화이트',color:'#f8f8f8'},{name:'블랙',color:'#222226'},{name:'민트',color:'#a8d8c8'}] },
    { id:'frame',       name:'인테리어 액자',  price:34000, badge:null,      desc:'원목 프레임 · A4',         designs:[{name:'원목',color:''}] },
    { id:'phone',       name:'폰케이스',       price:22000, badge:null,      desc:'아이폰 15 Pro · 하드케이스',designs:[{name:'클리어',color:'#d8e8f8'},{name:'블랙',color:'#181820'},{name:'핑크',color:'#f8d0dc'}] },
    { id:'bag',         name:'에코백',         price:16000, badge:null,      desc:'캔버스 · 내추럴 소재',     designs:[{name:'베이지',color:'#e8dcc8'},{name:'네이비',color:'#1e2d4a'}] },
  ], []);

  const g = catalog[selectedGoodsIdx] || catalog[0];
  const design = g.designs[selectedDesignIdx] || g.designs[0];
  const selectedNft = nfts[selectedNftIdx] || null;
  const nftImg = selectedNft?.nftImageUrl || state.profile?.pet?.imageUrl || null;

  const { basePrice, discountAmount, totalPrice } = useMemo(() => {
    const base = g.price * qty;
    const discount = useCoupons * DISCOUNT_PER_COUPON;
    return { basePrice: base, discountAmount: discount, totalPrice: Math.max(0, base - discount) };
  }, [g, qty, useCoupons]);

  useEffect(() => {
    if (state.connected) getGoodsPreview().then(setPreview).catch(() => {});
  }, [state.connected, state.tokenState?.hasNft]);

  // Spring Boot에서 주문 내역 불러오기
  useEffect(() => {
    if (!state.account) return;
    const ANIMAL_API = import.meta.env.VITE_ANIMAL_API_BASE_URL || 'http://localhost:8080/api';
    fetch(`${ANIMAL_API}/orders/owner/${state.account}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data.map(o => ({
            id: o.id,
            goods: o.goodsType,
            design: o.imageLabel,
            qty: o.quantity,
            total: 0,
            address: { name: o.recipientName, addr1: o.address },
            status: o.status,
            orderedAt: o.createdAt,
          })));
        }
      })
      .catch(() => {});
  }, [state.account]);

  useEffect(() => {
    setUseCoupons(prev => Math.min(prev, state.discountCoupons));
  }, [state.discountCoupons]);

  const handleFieldChange = (key, value) => {
    setAddress(prev => ({ ...prev, [key]: value }));
  };

  const submitOrder = async () => {
    if (!address.name || !address.phone || !address.addr1) {
      showToast('모든 배송 정보를 입력해주세요.', 'error');
      return;
    }
    const { discounted = 0 } = (typeof useDiscountCoupons === 'function' ? useDiscountCoupons(useCoupons) : { discounted: 0 }) || {};
    const newOrder = {
      id: Date.now(),
      goods: g.name,
      design: design.name,
      qty,
      baseTotal: basePrice,
      discounted,
      total: totalPrice,
      couponsUsed: useCoupons,
      address: { ...address },
      status: '결제완료',
      orderedAt: new Date().toLocaleString('ko-KR'),
    };
    // DB 저장 (Spring Boot)
    try {
      const ANIMAL_API = import.meta.env.VITE_ANIMAL_API_BASE_URL || 'http://localhost:8080/api';
      await fetch(`${ANIMAL_API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: state.account,
          goodsType: g.id,
          imageLabel: design.name,
          quantity: qty,
          recipientName: address.name,
          address: `${address.addr1}`,
          memo: `${g.name} / ${design.name}`,
        }),
      });
    } catch (_) {}
    setOrders(prev => [newOrder, ...prev]);
    setOrderModal(false);
    setAddress({ name:'', phone:'', addr1:'' });
    showToast(`${g.name} 주문 완료! 🎉`);
  };

  const submitUnlockOrder = async (tier) => {
    if (!address.name || !address.phone || !address.addr1) {
      showToast('모든 배송 정보를 입력해주세요.', 'error');
      return;
    }
    const result = redeemGoodsCoupon(tier.id);
    if (result.success) {
      const newOrder = {
        id: Date.now(),
        goods: tier.name,
        design: '해금 보상',
        qty: 1,
        baseTotal: tier.price,
        discounted: tier.price,
        total: 0,
        address: { ...address },
        status: '교환완료',
        orderedAt: new Date().toLocaleString('ko-KR'),
      };
      // DB 저장 (Spring Boot)
      try {
        const ANIMAL_API = import.meta.env.VITE_ANIMAL_API_BASE_URL || 'http://localhost:8080/api';
        await fetch(`${ANIMAL_API}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerAddress: state.account,
            goodsType: tier.id,
            imageLabel: '해금 보상',
            quantity: 1,
            recipientName: address.name,
            address: `${address.addr1}`,
            memo: `${tier.name} 교환권 교환`,
          }),
        });
      } catch (_) {}
      setOrders(prev => [newOrder, ...prev]);
      setUnlockOrderModal(null);
      setAddress({ name:'', phone:'', addr1:'' });
      showToast(result.message);
    } else {
      showToast(result.message, 'error');
    }
  };

  const updateOrderAddress = () => {
    if (!selectedOrder) return;
    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, address: { ...address } } : o));
    setSelectedOrder(null);
    setAddress({ name:'', phone:'', addr1:'' });
    showToast('배송지가 수정되었습니다.');
  };

  const renderMockup = () => {
    const props = { color: design.color, imgUrl: nftImg, petEmoji, species };
    switch(g.id) {
      case 'tshirt': return <TshirtSVG {...props} sleeve="short"/>;
      case 'longsleeves': return <TshirtSVG {...props} sleeve="long"/>;
      case 'hoodie': return <TshirtSVG {...props} sleeve="hoodie"/>;
      case 'doll': return <DollSVG {...props}/>;
      case 'mug': return <MugSVG {...props}/>;
      case 'frame': return <FrameSVG {...props}/>;
      case 'phone': return <PhoneSVG {...props}/>;
      case 'bag': return <BagSVG {...props}/>;
      default: return null;
    }
  };

  if (!(preview?.enabled ?? false)) return (
    <div className="page active">
      <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, padding:40 }}>
        <div style={{ fontSize:72, opacity:.3 }}>🛍️</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:48, letterSpacing:2 }}>NFT 홀더 전용</div>
        <p style={{ color:'var(--muted)', textAlign:'center' }}>NFT를 보유한 멤버만 굿즈를 주문할 수 있습니다.</p>
        <button className="btn-primary" onClick={() => setPage('mypage')}>마이페이지로 이동</button>
      </div>
    </div>
  );

  return (
    <div className="page active" style={{ minHeight:'calc(100vh - 64px)' }}>
      <div style={{ borderBottom:'1px solid var(--border)', padding:'32px 64px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, textTransform:'uppercase', color:'var(--accent)', marginBottom:8 }}>NFT Holder Exclusive</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, letterSpacing:2, lineHeight:1 }}>굿즈 스토어</div>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center', paddingBottom:4 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(255,107,53,.1)', border:'1px solid rgba(255,107,53,.25)', borderRadius:4 }}>
            <span style={{ fontSize:14 }}>🎫</span>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:'var(--accent)' }}>할인권 {state.discountCoupons || 0}개</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(52,211,153,.08)', border:'1px solid rgba(52,211,153,.25)', borderRadius:4 }}>
            <span style={{ fontSize:14 }}>🎁</span>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:'var(--accent3)' }}>굿즈교환권 {state.goodsCoupons || 0}개</span>
          </div>
          {orders.length > 0 && (
            <button onClick={() => setOrderModal(true)} style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase', background:'transparent', color:'var(--text)', border:'1px solid var(--border)', padding:'10px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              📦 주문 내역 ({orders.length})
            </button>
          )}
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 64px', background:'var(--card)' }}>
        {[['store', '🛍️ 커스텀 굿즈'], ['unlock', `🔓 해금 굿즈`]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding:'16px 28px', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:'uppercase', background:'none', border:'none', cursor:'pointer', borderBottom: activeTab===key ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab===key ? 'var(--accent)' : 'var(--muted)', transition:'all .2s' }}>{label}</button>
        ))}
      </div>

      {activeTab === 'store' ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 480px', minHeight:'calc(100vh - 230px)' }}>
          <div style={{ padding:'40px 48px', borderRight:'1px solid var(--border)', overflowY:'auto' }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, color:'var(--muted)', marginBottom:14 }}>상품 및 디자인 선택</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:32 }}>
              {catalog.map((item, i) => (
                <div key={item.id} onClick={() => { setSelectedGoodsIdx(i); setSelectedDesignIdx(0); }} style={{ background:'var(--card)', border: selectedGoodsIdx===i ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius:12, padding:16, textAlign:'center', cursor:'pointer' }}>
                  <div style={{ fontSize:24 }}>{goodsIcons[item.id]}</div>
                  <div style={{ fontSize:11, fontWeight:600, marginTop:6 }}>{item.name}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:32 }}>
              {g.designs.map((d, i) => (
                <button key={i} onClick={() => setSelectedDesignIdx(i)} style={{ padding:'8px 16px', border: selectedDesignIdx===i ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius:20, background:'var(--card)', cursor:'pointer' }}>{d.name}</button>
              ))}
            </div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'var(--muted)', marginBottom:10 }}>수량</div>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width:32, height:32, border:'1px solid var(--border)', background:'none', color:'var(--text)', cursor:'pointer' }}>-</button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width:32, height:32, border:'1px solid var(--border)', background:'none', color:'var(--text)', cursor:'pointer' }}>+</button>
            </div>
          </div>
          <div style={{ background:'var(--surface)', padding:40, display:'flex', flexDirection:'column' }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>{renderMockup()}</div>
            <div style={{ background:'var(--card)', padding:24, borderRadius:12, border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <span>{g.name}</span>
                <span style={{ fontSize:20, fontWeight:700, color:'var(--accent)' }}>₩{totalPrice.toLocaleString()}</span>
              </div>
              <button onClick={() => { setAddress({ name:'', phone:'', addr1:'' }); setOrderModal(true); }} style={{ width:'100%', padding:16, background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>주문하기</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding:'40px 64px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:24 }}>
            {UNLOCK_TIERS.map(tier => {
              const canRedeem = (state.goodsCoupons || 0) >= tier.cost;
              const discountedPrice = Math.floor(tier.price * 0.9);
              return (
                <div key={tier.id} style={{ background:'var(--card)', padding:24, borderRadius:12, border: canRedeem ? '1px solid var(--accent3)' : '1px solid var(--border)', opacity: canRedeem ? 1 : 0.6 }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color:'var(--accent3)', marginBottom:8 }}>굿즈교환권 {tier.cost}개 필요</div>
                  <div style={{ fontSize:40, marginBottom:12 }}>{tier.emoji}</div>
                  <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{tier.name}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>{tier.desc}</div>
                  <div style={{ marginBottom:16 }}>
                    <span style={{ textDecoration:'line-through', color:'var(--muted)', marginRight:8 }}>₩{tier.price.toLocaleString()}</span>
                    <span style={{ fontSize:22, fontWeight:800, color:'var(--accent2)' }}>₩{discountedPrice.toLocaleString()}</span>
                    <div style={{ fontSize:10, color:'var(--accent2)', marginTop:2 }}>해금 보상 10% 추가 할인</div>
                  </div>
                  <button onClick={() => { setAddress({ name:'', phone:'', addr1:'' }); setUnlockOrderModal(tier); }} disabled={!canRedeem} style={{ width:'100%', padding:'12px 0', background: canRedeem ? 'var(--accent3)' : 'var(--border)', color:'#fff', border:'none', borderRadius:6, cursor: canRedeem ? 'pointer' : 'not-allowed' }}>{canRedeem ? `교환권 ${tier.cost}개로 교환` : '교환권 부족'}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {orderModal && (
        <div className="modal-overlay open" onClick={() => setOrderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding:32, maxWidth:500 }}>
            <button className="modal-close" onClick={() => setOrderModal(false)}>✕</button>
            <div className="modal-title">내 주문 내역</div>
            <div style={{ maxHeight:240, overflowY:'auto', marginBottom: 24 }}>
              {orders.length > 0 ? orders.map(o => (
                <div key={o.id} onClick={() => { setSelectedOrder(o); setAddress(o.address); }} style={{ padding:16, border:'1px solid var(--border)', borderRadius:8, marginBottom:10, cursor:'pointer', background: 'var(--surface)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:700 }}>{o.goods}</span>
                    <span style={{ color:'var(--accent)', fontSize:11 }}>{o.status}</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{o.orderedAt}</div>
                </div>
              )) : (
                <div style={{ padding:'20px 0', textAlign:'center', color:'var(--muted)', fontSize: 13 }}>주문 내역이 없습니다.</div>
              )}
            </div>
            {!selectedOrder && (
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:24 }}>
                <div className="modal-title" style={{ fontSize:16, marginBottom: 16 }}>신규 주문 배송지</div>
                {[{k:'name', l:'이름', p:'홍길동'}, {k:'phone', l:'연락처', p:'010-0000-0000'}, {k:'addr1', l:'주소', p:'서울특별시...'}].map(f => (
                  <div key={f.k} style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11, color:'var(--muted)', display:'block', marginBottom:4 }}>{f.l}</label>
                    <input className="form-input" placeholder={f.p} value={address[f.k] || ''} onChange={e => handleFieldChange(f.k, e.target.value)} />
                  </div>
                ))}
                <button className="btn-primary" style={{ width:'100%', marginTop:12 }} onClick={submitOrder}>주문 확정</button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay open" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding:32, maxWidth:480 }}>
            <button className="modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            <div className="modal-title">주문 상세 및 수정</div>
            <div style={{ padding:16, background:'var(--surface)', borderRadius:8, marginBottom:20, fontSize:13 }}>
              <div style={{ marginBottom: 4 }}><strong>상품:</strong> {selectedOrder.goods} ({selectedOrder.design})</div>
              <div><strong>금액:</strong> ₩{selectedOrder.total.toLocaleString()}</div>
            </div>
            {[{k:'name', l:'이름'}, {k:'phone', l:'연락처'}, {k:'addr1', l:'주소'}].map(f => (
              <div key={f.k} style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, color:'var(--muted)', display:'block', marginBottom:4 }}>{f.l}</label>
                <input className="form-input" value={address[f.k] || ''} onChange={e => handleFieldChange(f.k, e.target.value)} />
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button className="btn-primary" style={{ flex:1 }} onClick={updateOrderAddress}>수정사항 저장</button>
              <button className="btn-outline" style={{ flex:1 }} onClick={() => setSelectedOrder(null)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {unlockOrderModal && (
        <div className="modal-overlay open" onClick={() => setUnlockOrderModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding:32, maxWidth:500 }}>
            <button className="modal-close" onClick={() => setUnlockOrderModal(null)}>✕</button>
            <div className="modal-title">해금 굿즈 배송 정보</div>
            <div style={{ marginBottom:20, padding:14, background:'rgba(52,211,153,0.1)', border:'1px solid var(--accent3)', borderRadius:6, fontSize: 13 }}>
               <strong>{unlockOrderModal.name}</strong> 교환을 위해 배송지를 입력해주세요.
            </div>
            {[{k:'name', l:'이름', p:'홍길동'}, {k:'phone', l:'연락처', p:'010-0000-0000'}, {k:'addr1', l:'주소', p:'서울특별시...'}].map(f => (
              <div key={f.k} style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, color:'var(--muted)', display:'block', marginBottom:4 }}>{f.l}</label>
                <input className="form-input" placeholder={f.p} value={address[f.k] || ''} onChange={e => handleFieldChange(f.k, e.target.value)} />
              </div>
            ))}
            <button className="btn-primary" style={{ width:'100%', marginTop:20, background:'var(--accent3)' }} onClick={() => submitUnlockOrder(unlockOrderModal)}>교환 및 주문 완료</button>
          </div>
        </div>
      )}
    </div>
  );
}