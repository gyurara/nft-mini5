import { useState, useEffect, useRef, useCallback } from "react";
import { ethers } from 'ethers';

/* ─────────────────────────── CSS ─────────────────────────── */
const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

:root {
  --accent:#ff6b35; --accent2:#7c3aed; --accent3:#10b981; --gold:#f59e0b;
}
[data-theme="dark"] {
  --bg:#0a0a0f; --surface:#111118; --card:#16161f; --border:#2a2a3a;
  --text:#e8e8f0; --muted:#6b6b85; --nav-bg:rgba(10,10,15,0.88); --input-bg:#16161f; --shadow:rgba(0,0,0,0.5);
}
[data-theme="light"] {
  --bg:#f5f4f0; --surface:#eeecea; --card:#ffffff; --border:#d8d5cf;
  --text:#1a1a26; --muted:#8a8a9a; --nav-bg:rgba(245,244,240,0.92); --input-bg:#ffffff; --shadow:rgba(0,0,0,0.12);
}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--text);font-family:'Noto Sans KR',sans-serif;min-height:100vh;overflow-x:hidden;transition:background .35s,color .35s;}
[data-theme="dark"] body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");pointer-events:none;z-index:0;opacity:.6;}

nav{position:sticky;top:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 40px;height:64px;background:var(--nav-bg);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);transition:background .35s;}
.logo{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:4px;color:var(--accent);cursor:pointer;}
.logo span{color:var(--text);}
.nav-links{display:flex;gap:20px;align-items:center;}
.nav-links a{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);text-decoration:none;transition:color .2s;cursor:pointer;}
.nav-links a:hover,.nav-links a.active{color:var(--text);}
.nav-right{display:flex;gap:12px;align-items:center;}

.theme-wrap{display:flex;align-items:center;gap:6px;}
.theme-lbl{font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);}
.theme-toggle{width:44px;height:24px;border-radius:12px;background:var(--border);border:none;cursor:pointer;position:relative;transition:background .3s;flex-shrink:0;}
.theme-toggle::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:var(--accent);transition:transform .3s;}
[data-theme="light"] .theme-toggle::after{transform:translateX(20px);}

.btn-connect{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;background:var(--accent);color:#fff;border:none;padding:10px 22px;cursor:pointer;transition:all .2s;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);}
.btn-connect:hover{background:#ff8555;}
.btn-connect.connected{background:var(--accent3);}

.page{display:none;position:relative;z-index:1;}
.page.active{display:block;}

.hero{min-height:calc(100vh - 64px);display:grid;grid-template-columns:1fr 1fr;position:relative;overflow:hidden;}
.hero-left{display:flex;flex-direction:column;justify-content:center;padding:80px 60px 80px 80px;}
.hero-tag{display:inline-flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:32px;}
.hero-tag::before{content:'';width:24px;height:1px;background:var(--accent);}
.hero-h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(72px,8vw,120px);line-height:.92;letter-spacing:2px;margin-bottom:32px;}
.hero-h1 em{color:var(--accent);font-style:normal;}
.hero-sub{font-size:15px;line-height:1.8;color:var(--muted);max-width:440px;margin-bottom:48px;}
.hero-ctas{display:flex;gap:16px;align-items:center;}
.btn-primary{font-family:'Space Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;background:var(--accent);color:#fff;border:none;padding:16px 36px;cursor:pointer;transition:all .2s;clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);}
.btn-primary:hover{background:#ff8555;transform:translateY(-2px);box-shadow:0 12px 40px rgba(255,107,53,.3);}
.btn-outline{font-family:'Space Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;background:transparent;color:var(--text);border:1px solid var(--border);padding:16px 36px;cursor:pointer;transition:all .2s;}
.btn-outline:hover{border-color:var(--text);}
.hero-right{position:relative;background:var(--surface);display:flex;align-items:center;justify-content:center;border-left:1px solid var(--border);overflow:hidden;}
.hero-right::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 60% 40%,rgba(124,58,237,.15) 0%,transparent 70%),radial-gradient(ellipse at 30% 70%,rgba(255,107,53,.1) 0%,transparent 60%);}
.floating-card{position:relative;z-index:2;background:var(--card);border:1px solid var(--border);width:300px;padding:24px;animation:float 4s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.card-badge{display:inline-block;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;background:rgba(255,107,53,.15);color:var(--accent);padding:4px 10px;margin-bottom:16px;text-transform:uppercase;}
.card-pet-img{width:100%;aspect-ratio:1;background:linear-gradient(135deg,#1e1e2e,#2a1a3e);display:flex;align-items:center;justify-content:center;font-size:80px;margin-bottom:16px;position:relative;overflow:hidden;}
.card-pet-img::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(255,107,53,.15),transparent);}
.card-name{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;}
.card-meta{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:12px;border-top:1px solid var(--border);}
.card-meta-label{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;}
.card-meta-val{font-family:'Space Mono',monospace;font-size:12px;color:var(--accent3);}
.sbt-tag{position:absolute;top:16px;right:16px;background:var(--accent2);color:#fff;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;padding:4px 8px;text-transform:uppercase;}

.stats-bar{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);display:grid;grid-template-columns:repeat(4,1fr);position:relative;z-index:1;}
.stat-item{padding:28px 40px;border-right:1px solid var(--border);}
.stat-item:last-child{border-right:none;}
.stat-num{font-family:'Bebas Neue',sans-serif;font-size:42px;color:var(--accent);letter-spacing:2px;}
.stat-label{font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-top:4px;}

.section{padding:100px 80px;position:relative;z-index:1;}
.section-tag{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:16px;display:flex;align-items:center;gap:12px;}
.section-tag::after{content:'';flex:1;height:1px;background:var(--border);max-width:60px;}
.section-h2{font-family:'Bebas Neue',sans-serif;font-size:clamp(48px,5vw,72px);letter-spacing:2px;margin-bottom:16px;}
.section-sub{color:var(--muted);font-size:15px;line-height:1.8;max-width:520px;margin-bottom:60px;}
.flow-steps{display:flex;gap:0;overflow-x:auto;padding-bottom:16px;}
.flow-step{flex:0 0 auto;width:190px;background:var(--card);border:1px solid var(--border);padding:28px 22px;position:relative;}
.flow-step:not(:last-child)::after{content:'→';position:absolute;right:-14px;top:50%;transform:translateY(-50%);color:var(--accent);font-size:18px;z-index:2;}
.flow-num{font-family:'Bebas Neue',sans-serif;font-size:48px;color:var(--border);line-height:1;margin-bottom:12px;}
.flow-icon{font-size:24px;margin-bottom:10px;}
.flow-name{font-size:14px;font-weight:500;margin-bottom:4px;}
.flow-desc{font-size:12px;color:var(--muted);}
.bm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
.bm-card{background:var(--card);border:1px solid var(--border);padding:32px 28px;position:relative;overflow:hidden;transition:border-color .2s;}
.bm-card:hover{border-color:var(--accent);}
.bm-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.bm-card:nth-child(1)::before{background:var(--accent);}
.bm-card:nth-child(2)::before{background:var(--accent2);}
.bm-card:nth-child(3)::before{background:var(--accent3);}
.bm-num{font-family:'Bebas Neue',sans-serif;font-size:64px;opacity:.08;position:absolute;top:16px;right:20px;line-height:1;}
.bm-icon{font-size:32px;margin-bottom:20px;}
.bm-title{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:1px;margin-bottom:8px;}
.bm-desc{font-size:14px;color:var(--muted);line-height:1.7;}

.register-layout{display:grid;grid-template-columns:1fr 1fr;gap:60px;padding:80px;position:relative;z-index:1;}
.form-title{font-family:'Bebas Neue',sans-serif;font-size:52px;letter-spacing:2px;margin-bottom:8px;}
.form-sub{color:var(--muted);font-size:14px;margin-bottom:40px;line-height:1.7;}
.form-group{margin-bottom:24px;}
.form-label{display:block;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
.form-input,.form-select{width:100%;background:var(--input-bg);border:1px solid var(--border);color:var(--text);padding:14px 18px;font-family:'Noto Sans KR',sans-serif;font-size:14px;outline:none;transition:border-color .2s;appearance:none;}
.form-input:focus,.form-select:focus{border-color:var(--accent);}
.form-input::placeholder{color:var(--muted);}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.btn-full{width:100%;padding:18px;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:3px;text-transform:uppercase;background:var(--accent);color:#fff;border:none;cursor:pointer;transition:all .2s;margin-top:8px;clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);}
.btn-full:hover{background:#ff8555;box-shadow:0 16px 48px rgba(255,107,53,.3);}
.btn-full:disabled{background:var(--muted);cursor:not-allowed;clip-path:none;}
.preview-section{position:sticky;top:80px;}
.preview-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:24px;}
.preview-card{background:var(--card);border:1px solid var(--border);padding:32px;position:relative;}
.preview-card::before{content:'SBT';position:absolute;top:16px;right:16px;background:var(--accent2);color:#fff;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;padding:4px 8px;}
.preview-img{width:100%;aspect-ratio:1;background:linear-gradient(135deg,#1e1e2e,#2a1a3e);display:flex;align-items:center;justify-content:center;font-size:100px;margin-bottom:24px;position:relative;overflow:hidden;}
.preview-name{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:2px;margin-bottom:4px;}
.preview-breed{font-size:13px;color:var(--muted);margin-bottom:20px;}
.preview-rows{display:flex;flex-direction:column;gap:12px;}
.preview-row{display:flex;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--border);font-size:13px;}
.preview-row:last-child{border-bottom:none;padding-bottom:0;}
.preview-row-key{color:var(--muted);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase;}
.chain-badge{margin-top:20px;padding:12px 16px;background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);display:flex;align-items:center;gap:10px;}
.chain-dot{width:8px;height:8px;border-radius:50%;background:var(--accent2);animation:pulse 1.5s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
.chain-text{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent2);letter-spacing:1px;}

.mypage-layout{padding:60px 80px;position:relative;z-index:1;}
.mypage-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:48px;padding-bottom:32px;border-bottom:1px solid var(--border);}
.wallet-label{font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
.wallet-addr{font-family:'Space Mono',monospace;font-size:14px;color:var(--accent3);}
.mypage-grid{display:grid;grid-template-columns:320px 1fr;gap:40px;}
.pet-card-main{background:var(--card);border:1px solid var(--border);padding:28px;position:sticky;top:80px;height:fit-content;}
.pet-card-main-img{width:100%;aspect-ratio:1;background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;align-items:center;justify-content:center;font-size:80px;position:relative;margin-bottom:24px;overflow:hidden;}
.pet-card-main-img::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(16,185,129,.1),transparent);}
.verified-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,.15);color:var(--accent3);font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;padding:5px 10px;margin-bottom:12px;text-transform:uppercase;}
.pet-main-name{font-family:'Bebas Neue',sans-serif;font-size:40px;letter-spacing:2px;}
.pet-main-breed{font-size:13px;color:var(--muted);margin-bottom:20px;}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;}
.info-cell{background:var(--surface);padding:12px 14px;}
.info-cell-key{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;}
.info-cell-val{font-size:13px;}
.sbt-block{padding:14px 16px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);display:flex;align-items:center;gap:12px;margin-bottom:16px;}
.sbt-icon{font-size:20px;}
.sbt-info-label{font-family:'Space Mono',monospace;font-size:9px;color:var(--accent2);letter-spacing:1px;text-transform:uppercase;}
.sbt-info-val{font-size:12px;color:var(--muted);margin-top:2px;}
.holder-section{margin-top:16px;padding:20px;background:var(--surface);border:1px solid var(--border);}
.holder-title{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.holder-title::before{content:'★';}
.holder-features{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.holder-feat{background:var(--card);border:1px solid var(--border);padding:14px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.holder-feat:hover{border-color:var(--gold);}
.holder-feat-icon{font-size:20px;margin-bottom:6px;}
.holder-feat-name{font-size:13px;font-weight:500;margin-bottom:2px;}
.holder-feat-desc{font-size:11px;color:var(--muted);}
.lock-overlay{display:none;position:absolute;inset:0;background:rgba(10,10,15,.88);align-items:center;justify-content:center;font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;flex-direction:column;gap:4px;}
.locked .lock-overlay{display:flex;}
.nft-section-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;}
.nft-section-title{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:2px;}
.btn-mint{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;background:var(--accent);color:#fff;border:none;padding:12px 24px;cursor:pointer;transition:all .2s;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);}
.btn-mint:hover{background:#ff8555;}
.btn-mint:disabled{background:var(--muted);cursor:not-allowed;clip-path:none;}
.nft-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.nft-item{background:var(--card);border:1px solid var(--border);overflow:hidden;transition:all .25s;cursor:pointer;position:relative;}
.nft-item:hover{border-color:var(--accent);transform:translateY(-4px);box-shadow:0 20px 40px var(--shadow);}
.nft-item-img{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:56px;position:relative;overflow:hidden;}
.nft-type-badge{position:absolute;top:8px;left:8px;font-family:'Space Mono',monospace;font-size:8px;letter-spacing:1px;padding:4px 8px;text-transform:uppercase;}
.badge-limited{background:rgba(255,107,53,.2);color:var(--accent);}
.nft-item-body{padding:16px;}
.nft-item-name{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;margin-bottom:4px;}
.nft-item-meta{display:flex;justify-content:space-between;align-items:center;}
.nft-item-edition{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;}
.nft-item-num{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);}

.goods-layout{display:grid;grid-template-columns:1fr 1fr;gap:48px;}
.goods-grid-sel{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
.goods-option{background:var(--card);border:2px solid var(--border);padding:16px 12px;text-align:center;cursor:pointer;transition:all .2s;position:relative;}
.goods-option:hover{border-color:var(--muted);}
.goods-option.sel{border-color:var(--accent);background:rgba(255,107,53,.07);}
.goods-option-badge{position:absolute;top:6px;right:6px;background:var(--accent);color:#fff;font-family:'Space Mono',monospace;font-size:7px;letter-spacing:1px;padding:2px 5px;text-transform:uppercase;}
.goods-option-icon{font-size:32px;margin-bottom:6px;}
.goods-option-name{font-size:12px;font-weight:500;margin-bottom:2px;}
.goods-option-price{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);}
.goods-config{display:flex;flex-direction:column;gap:14px;}
.qty-row{display:flex;align-items:center;}
.qty-btn{width:36px;height:36px;background:var(--card);border:1px solid var(--border);color:var(--text);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.qty-val{width:48px;text-align:center;background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);font-family:'Space Mono',monospace;font-size:14px;padding:6px 0;}
.btn-order{width:100%;padding:16px;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:3px;text-transform:uppercase;background:var(--accent);color:#fff;border:none;cursor:pointer;transition:all .2s;clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);}
.btn-order:hover{background:#ff8555;box-shadow:0 12px 40px rgba(255,107,53,.3);}
.goods-preview{position:sticky;top:80px;}
.preview-panel{background:var(--card);border:1px solid var(--border);padding:32px;}
.preview-panel-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:20px;}
.mockup-area{width:100%;aspect-ratio:1;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:20px;overflow:hidden;}
.mockup-bg-pattern{position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,107,53,.04) 20px,rgba(255,107,53,.04) 21px);}
.mockup-product{font-size:80px;position:relative;z-index:2;}
.mockup-nft-stamp{position:absolute;bottom:16px;right:16px;z-index:3;background:rgba(10,10,15,.85);border:1px solid var(--accent);padding:6px 10px;font-family:'Space Mono',monospace;font-size:8px;color:var(--accent);letter-spacing:1px;}
[data-theme="light"] .mockup-nft-stamp{background:rgba(245,244,240,.92);}
.preview-meta{display:flex;flex-direction:column;gap:10px;}
.preview-total{font-family:'Bebas Neue',sans-serif;font-size:32px;color:var(--accent);letter-spacing:2px;}
.nft-source-badge{margin-top:16px;padding:12px 16px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);display:flex;align-items:center;gap:10px;}
.nft-source-icon{font-size:18px;}
.nft-source-text{font-family:'Space Mono',monospace;font-size:9px;color:var(--accent2);letter-spacing:1px;line-height:1.5;}

.modal-overlay{display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);align-items:center;justify-content:center;}
.modal-overlay.open{display:flex;}
.modal{background:var(--card);border:1px solid var(--border);width:500px;max-width:95vw;padding:40px;position:relative;animation:modal-in .3s ease;max-height:90vh;overflow-y:auto;}
@keyframes modal-in{from{opacity:0;transform:scale(.95) translateY(20px)}to{opacity:1;transform:none}}
.modal-close{position:absolute;top:16px;right:16px;background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;}
.modal-close:hover{color:var(--text);}
.modal-title{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:2px;margin-bottom:8px;}
.modal-sub{color:var(--muted);font-size:13px;margin-bottom:28px;}
.btn-modal-mint{width:100%;padding:16px;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:3px;text-transform:uppercase;background:var(--accent);color:#fff;border:none;cursor:pointer;transition:all .2s;clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);}
.btn-modal-mint:hover{background:#ff8555;}
.btn-modal-mint:disabled{background:var(--muted);cursor:not-allowed;clip-path:none;}
.mint-success.show{display:block;}
.success-icon{font-size:64px;margin-bottom:16px;animation:bounce .5s ease;}
@keyframes bounce{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
.success-title{font-family:'Bebas Neue',sans-serif;font-size:40px;letter-spacing:2px;color:var(--accent3);margin-bottom:8px;}
.success-sub{color:var(--muted);font-size:14px;line-height:1.7;}
.tx-hash{margin-top:20px;padding:12px 16px;background:var(--surface);border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);word-break:break-all;}

.toast{position:fixed;bottom:32px;right:32px;z-index:400;background:var(--card);border:1px solid var(--border);padding:16px 24px;display:flex;align-items:center;gap:12px;transform:translateY(100px);opacity:0;transition:all .3s;max-width:360px;}
.toast.show{transform:translateY(0);opacity:1;}
.toast-dot{width:8px;height:8px;border-radius:50%;background:var(--accent3);flex-shrink:0;}
.toast-dot.error{background:#ef4444;}
.toast-text{font-size:13px;}
.toast-label{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-top:2px;}

.empty-state{text-align:center;padding:60px 20px;}
.empty-state-icon{font-size:64px;margin-bottom:16px;opacity:.4;}
.empty-state-title{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:2px;margin-bottom:8px;color:var(--muted);}
.empty-state-desc{font-size:14px;color:var(--muted);}
.no-pet-banner{background:rgba(255,107,53,.06);border:1px solid rgba(255,107,53,.2);padding:24px 28px;margin-bottom:32px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
.no-pet-text{font-size:14px;color:var(--muted);}
.no-pet-text strong{color:var(--text);display:block;margin-bottom:4px;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;}

@media(max-width:900px){
  .hero{grid-template-columns:1fr;}.hero-right{display:none;}
  .register-layout,.mypage-grid,.goods-layout{grid-template-columns:1fr;}
  .stats-bar{grid-template-columns:repeat(2,1fr);}
  .nft-grid,.bm-grid{grid-template-columns:repeat(2,1fr);}
  nav,.section,.mypage-layout{padding-left:20px;padding-right:20px;}
  .register-layout{padding:40px 20px;}
  .nav-links{gap:12px;}
}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:var(--bg);}
::-webkit-scrollbar-thumb{background:var(--border);}
`;

/* ─────────────────────────── 실제 로직 (백엔드 JS 그대로 이식) ─────────────────────────── */

// errors.js
class AppError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

function toAppError(error, fallbackCode, fallbackMessage, details = {}) {
  if (error instanceof AppError) return error;
  return new AppError(
    fallbackCode,
    error?.message || fallbackMessage,
    { ...details, cause: error?.message || String(error) },
  );
}

// pet-validation.js
function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError('INVALID_PET_INPUT', `${fieldName}은(는) 필수 입력값입니다.`, { field: fieldName });
  }
  return value.trim();
}

function validateBirthDate(value) {
  const normalized = requireNonEmptyString(value, 'birthDate');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('INVALID_PET_INPUT', 'birthDate는 유효한 날짜여야 합니다.', { field: 'birthDate', value });
  }
  if (parsed > new Date()) {
    throw new AppError('INVALID_PET_INPUT', 'birthDate는 미래 날짜일 수 없습니다.', { field: 'birthDate', value });
  }
  return normalized;
}

function validatePetInput(input) {
  if (!input || typeof input !== 'object') {
    throw new AppError('INVALID_PET_INPUT', '반려동물 등록 정보가 필요합니다.');
  }
  return {
    account: requireNonEmptyString(input.account, 'account'),
    name: requireNonEmptyString(input.name, 'name'),
    species: requireNonEmptyString(input.species, 'species'),
    birthDate: validateBirthDate(input.birthDate),
    imageUrl: input.imageUrl || null, // 추가
  };
}

// receipt.js
function extractTokenId(mintResult, expectedEventName) {
  if (!mintResult || typeof mintResult !== 'object') {
    throw new AppError('INVALID_RECEIPT', 'mint 결과가 비어 있습니다.');
  }
  if (mintResult.tokenId !== undefined && mintResult.tokenId !== null) {
    return Number(mintResult.tokenId);
  }
  const events = Array.isArray(mintResult.events)
    ? mintResult.events
    : Array.isArray(mintResult.receipt?.events)
    ? mintResult.receipt.events
    : [];
  const event = events.find(c => c?.eventName === expectedEventName || c?.name === expectedEventName);
  const rawTokenId = event?.tokenId ?? event?.args?.tokenId ?? event?.args?.[1];
  if (rawTokenId === undefined || rawTokenId === null) {
    throw new AppError('INVALID_RECEIPT', `${expectedEventName} 이벤트에서 tokenId를 찾을 수 없습니다.`);
  }
  return Number(rawTokenId);
}

// token-uri.js
function sanitizeSegment(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}

function createTokenUriFactory(baseUrl = 'https://mock.example.com/pet') {
  return {
    createSbtTokenUri({ account, pet }) {
      return `${baseUrl}/sbt/${sanitizeSegment(account)}/${sanitizeSegment(pet.id)}`;
    },
    createNftTokenUri({ account, pet }) {
      return `${baseUrl}/nft/${sanitizeSegment(account)}/${sanitizeSegment(pet.id)}`;
    },
    createMetadataRecord({ kind, tokenId, pet }) {
      return {
        url: `${baseUrl}/${kind}/${tokenId}`,
        metadata: {
          name: `Pet #${tokenId}`,
          description: kind === 'sbt' ? '반려동물 신원 SBT' : '반려동물 NFT',
          image: pet.imageUrl || 'https://placekitten.com/400/400', // ← 수정
          attributes: [
            { trait_type: '종', value: pet.species },
            { trait_type: '생년월일', value: pet.birthDate },
            { trait_type: '이름', value: pet.name },
          ],
        },
      };
    },
  };
}

// in-memory-pet-profile-repository.js
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

class InMemoryPetProfileRepository {
  constructor() {
    this.petProfiles = new Map();
    this.transactions = new Map();
  }
  savePetProfile(profile) {
    this.petProfiles.set(profile.account, deepClone(profile));
    return deepClone(profile);
  }
  getPetProfileByAccount(account) {
    const profile = this.petProfiles.get(account);
    return profile ? deepClone(profile) : null;
  }
  saveSbtIssuance(account, issuance) {
    const current = this.getRequiredProfile(account);
    current.sbt = deepClone(issuance);
    return this.savePetProfile(current);
  }
  appendNftIssuance(account, issuance) {
    const current = this.getRequiredProfile(account);
    current.nfts = Array.isArray(current.nfts) ? current.nfts : [];
    current.nfts.push(deepClone(issuance));
    return this.savePetProfile(current);
  }
  saveTransaction(account, kind, transaction) {
    const key = `${account}:${kind}`;
    this.transactions.set(key, deepClone(transaction));
    return deepClone(transaction);
  }
  getLatestTransaction(account, kind) {
    const key = `${account}:${kind}`;
    const t = this.transactions.get(key);
    return t ? deepClone(t) : null;
  }
  getRequiredProfile(account) {
    const profile = this.petProfiles.get(account);
    if (!profile) throw new Error(`등록된 반려동물 프로필이 없습니다: ${account}`);
    return deepClone(profile);
  }
}

// register-pet-service.js
function createRegisterPetService({ petProfileRepository }) {
  return {
    async execute(input) {
      const pet = validatePetInput(input);
      const now = new Date().toISOString();
      const existing = await petProfileRepository.getPetProfileByAccount(pet.account);
      const profile = {
        account: pet.account,
       pet: {
  id: existing?.pet?.id || crypto.randomUUID(),
  name: pet.name,
  species: pet.species,
  birthDate: pet.birthDate,
  imageUrl: pet.imageUrl || existing?.pet?.imageUrl || null, // 추가
  createdAt: existing?.pet?.createdAt || now,
  updatedAt: now,
},
        sbt: existing?.sbt || null,
        nfts: existing?.nfts || [],
      };
      return petProfileRepository.savePetProfile(profile);
    },
  };
}

// issue-sbt-service.js
function createIssueSbtService({ sessionGateway, contractGateway, petProfileRepository, tokenUriFactory }) {
  return {
    async execute(account) {
      await sessionGateway.assertConnected(account);
      const profile = await petProfileRepository.getPetProfileByAccount(account);
      if (!profile?.pet) throw new AppError('PET_PROFILE_REQUIRED', 'SBT 발급 전 반려동물 등록이 필요합니다.', { account });
      const tokenState = await sessionGateway.getTokenState(account);
      if (tokenState.hasSbt) throw new AppError('SBT_ALREADY_ISSUED', '이미 SBT를 보유하고 있습니다.', { account });

      const pendingTransaction = await petProfileRepository.saveTransaction(account, 'sbt', {
        kind: 'sbt', status: 'pending', startedAt: new Date().toISOString(),
      });

      try {
        const requestTokenUri = tokenUriFactory.createSbtTokenUri({ account, pet: profile.pet });
        const mintResult = await contractGateway.mintSbt({ account, tokenUri: requestTokenUri });
        const tokenId = extractTokenId(mintResult, 'SBTMinted');
        const metadataRecord = tokenUriFactory.createMetadataRecord({ kind: 'sbt', tokenId, pet: profile.pet });
        const refreshedTokenState = await sessionGateway.refreshTokenState(account);

        await petProfileRepository.saveSbtIssuance(account, {
          tokenId,
          requestTokenUri,
          resolvedTokenUri: metadataRecord.url,
          metadata: metadataRecord.metadata,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
          mintedAt: new Date().toISOString(),
        });

        const completedTransaction = await petProfileRepository.saveTransaction(account, 'sbt', {
          ...pendingTransaction,
          status: 'success',
          completedAt: new Date().toISOString(),
          tokenId,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
        });

        return {
          transaction: completedTransaction,
          tokenState: refreshedTokenState,
          issuance: await petProfileRepository.getPetProfileByAccount(account),
        };
      } catch (error) {
        const appError = toAppError(error, 'SBT_MINT_FAILED', 'SBT 발급에 실패했습니다.', { account });
        await petProfileRepository.saveTransaction(account, 'sbt', {
          ...pendingTransaction,
          status: 'failed',
          completedAt: new Date().toISOString(),
          error: { code: appError.code, message: appError.message },
        });
        throw appError;
      }
    },
  };
}

// issue-nft-service.js
function createIssueNftService({ sessionGateway, contractGateway, petProfileRepository, tokenUriFactory }) {
  return {
    async execute(account) {
      await sessionGateway.assertConnected(account);
      const profile = await petProfileRepository.getPetProfileByAccount(account);
      if (!profile?.pet) throw new AppError('PET_PROFILE_REQUIRED', 'NFT 발급 전 반려동물 등록이 필요합니다.', { account });
      const tokenState = await sessionGateway.getTokenState(account);
      if (!tokenState.hasSbt) throw new AppError('SBT_REQUIRED', 'SBT 보유자만 NFT를 발급할 수 있습니다.', { account });

      const pendingTransaction = await petProfileRepository.saveTransaction(account, 'nft', {
        kind: 'nft', status: 'pending', startedAt: new Date().toISOString(),
      });

      try {
        const requestTokenUri = tokenUriFactory.createNftTokenUri({ account, pet: profile.pet });
        const mintResult = await contractGateway.mintNft({ account, tokenUri: requestTokenUri });
        const tokenId = extractTokenId(mintResult, 'NFTMinted');
        const metadataRecord = tokenUriFactory.createMetadataRecord({ kind: 'nft', tokenId, pet: profile.pet });
        const refreshedTokenState = await sessionGateway.refreshTokenState(account);

        await petProfileRepository.appendNftIssuance(account, {
          tokenId,
          requestTokenUri,
          resolvedTokenUri: metadataRecord.url,
          metadata: metadataRecord.metadata,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
          mintedAt: new Date().toISOString(),
        });

        const completedTransaction = await petProfileRepository.saveTransaction(account, 'nft', {
          ...pendingTransaction,
          status: 'success',
          completedAt: new Date().toISOString(),
          tokenId,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
        });

        return {
          transaction: completedTransaction,
          tokenState: refreshedTokenState,
          issuance: await petProfileRepository.getPetProfileByAccount(account),
        };
      } catch (error) {
        const appError = toAppError(error, 'NFT_MINT_FAILED', 'NFT 발급에 실패했습니다.', { account });
        await petProfileRepository.saveTransaction(account, 'nft', {
          ...pendingTransaction,
          status: 'failed',
          completedAt: new Date().toISOString(),
          error: { code: appError.code, message: appError.message },
        });
        throw appError;
      }
    },
  };
}

// get-my-page-service.js
function createGetMyPageService({ sessionGateway, petProfileRepository }) {
  return {
    async execute(account) {
      const tokenState = await sessionGateway.getTokenState(account);
      const profile = await petProfileRepository.getPetProfileByAccount(account);
      return {
        account,
        pet: profile?.pet || null,
        holdings: tokenState,
        sbt: profile?.sbt || null,
        nfts: profile?.nfts || [],
        controls: {
          canIssueSbt: !tokenState.hasSbt,
          canIssueNft: tokenState.hasSbt,
          canAccessHolderBenefits: tokenState.hasNft,
        },
      };
    },
  };
}

// get-goods-preview-service.js
function createGetGoodsPreviewService({ sessionGateway }) {
  return {
    async execute(account) {
      const tokenState = await sessionGateway.getTokenState(account);
      const canPreview = Boolean(tokenState.hasNft);
      return {
        enabled: canPreview,
        reason: canPreview ? null : 'NFT 보유자만 굿즈 미리보기를 사용할 수 있습니다.',
        previewImageUrl: canPreview ? 'https://placekitten.com/600/600' : null,
        ctaLabel: '제작하기',
        canOrder: false,
      };
    },
  };
}

/* ─────────────────────────── Mock Gateway (지갑 연결 전 stub) ─────────────────────────── */
// 나중에 MetaMask + 실제 컨트랙트로 교체할 부분
const PET_SBT_ADDRESS = '0x149c3A733A5344B3F39361930A90B7E384F9D8E8';
const MEMORY_NFT_ADDRESS = '0x3fB61aC6C00c58092E418b4E7bC1B0Cfea72eb2d';

async function createRealGateways() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const petSBT = new ethers.Contract(PET_SBT_ADDRESS, [
    'function registerPet(string tokenURI) returns (uint256)',
    'function hasPetSBT(address owner) view returns (bool)',
    'function getPetTokenIds(address owner) view returns (uint256[])',
    'event PetRegistered(address indexed owner, uint256 indexed tokenId, string tokenURI)',
  ], signer);

  const memoryNFT = new ethers.Contract(MEMORY_NFT_ADDRESS, [
    'function mintMemoryNFT(uint256 petSbtId, string tokenURI) payable returns (uint256)',
    'function hasMemoryNFT(address owner) view returns (bool)',
    'function mintPrice() view returns (uint256)',
    'event MemoryNFTMinted(address indexed owner, uint256 indexed tokenId, uint256 indexed petSbtId, string tokenURI, uint256 paid)',
  ], signer);

  const sessionGateway = {
    async assertConnected(account) {
      if (!window.ethereum) throw new AppError('NOT_CONNECTED', 'MetaMask를 설치해주세요.');
      const accounts = await provider.listAccounts();
      if (!accounts.length) throw new AppError('NOT_CONNECTED', '지갑이 연결되어 있지 않습니다.');
    },
    async getTokenState(account) {
  const hasSbt = await petSBT.hasPetSBT(account);
  const hasNft = await memoryNFT.hasMemoryNFT(account);
  console.log('account:', account);
  console.log('hasSbt:', hasSbt);
  console.log('hasNft:', hasNft);
  return { hasSbt, hasNft };
},
    async refreshTokenState(account) {
      return this.getTokenState(account);
    },
  };

  const contractGateway = {
    async mintSbt({ account, tokenUri }) {
      const tx = await petSBT.registerPet(tokenUri);
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => { try { return petSBT.interface.parseLog(log); } catch { return null; } })
        .find(e => e?.name === 'PetRegistered');
      const tokenId = event?.args?.tokenId;
      return { tokenId, hash: receipt.hash, events: [{ eventName: 'SBTMinted', args: { tokenId } }] };
    },
    async mintNft({ account, tokenUri }) {
      const petTokenIds = await petSBT.getPetTokenIds(account);
      const petSbtId = petTokenIds[0];
      const price = await memoryNFT.mintPrice();
      const tx = await memoryNFT.mintMemoryNFT(petSbtId, tokenUri, { value: price });
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => { try { return memoryNFT.interface.parseLog(log); } catch { return null; } })
        .find(e => e?.name === 'MemoryNFTMinted');
      const tokenId = event?.args?.tokenId;
      return { tokenId, hash: receipt.hash, events: [{ eventName: 'NFTMinted', args: { tokenId } }] };
    },
  };

  return { sessionGateway, contractGateway };
}
/* ─────────────────────────── usePetServiceApp 훅 ─────────────────────────── */
function usePetServiceApp() {
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tokenState, setTokenState] = useState({ hasSbt: false, hasNft: false });

  // tokenState를 ref로도 유지 (gateway 내부에서 최신값 참조용)
  const tokenStateRef = useRef({ hasSbt: false, hasNft: false });

  // 서비스 앱 인스턴스 (account가 바뀌면 재생성)
  const appRef = useRef(null);
  const repositoryRef = useRef(new InMemoryPetProfileRepository());
  const tokenUriFactory = useRef(createTokenUriFactory());

 const getApp = useCallback(async () => {
  if (!appRef.current) {
    const { sessionGateway, contractGateway } = await createRealGateways();
    appRef.current = {
      registerPetService: createRegisterPetService({ petProfileRepository: repositoryRef.current }),
      issueSbtService: createIssueSbtService({
        sessionGateway,
        contractGateway,
        petProfileRepository: repositoryRef.current,
        tokenUriFactory: tokenUriFactory.current,
      }),
      issueNftService: createIssueNftService({
        sessionGateway,
        contractGateway,
        petProfileRepository: repositoryRef.current,
        tokenUriFactory: tokenUriFactory.current,
      }),
      getMyPageService: createGetMyPageService({
        sessionGateway,
        petProfileRepository: repositoryRef.current,
      }),
      getGoodsPreviewService: createGetGoodsPreviewService({ sessionGateway }),
    };
  }
  return appRef.current;
}, []);

const connectWallet = useCallback(async () => {
  if (!window.ethereum) {
    alert('MetaMask를 설치해주세요.');
    return;
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const account = accounts[0];
  setAccount(account);
  // 연결하자마자 현재 토큰 상태 조회
  const { sessionGateway } = await createRealGateways();
  const tokenState = await sessionGateway.getTokenState(account);
  setTokenState(tokenState);
  return account;
}, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProfile(null);
    const reset = { hasSbt: false, hasNft: false };
    setTokenState(reset);
    tokenStateRef.current = reset;
    repositoryRef.current = new InMemoryPetProfileRepository();
    appRef.current = null;
  }, []);

  const registerPet = useCallback(async (input) => {
    const app = await getApp();
    const result = await app.registerPetService.execute({ ...input, account });
    setProfile(result);
    return result;
  }, [account, getApp]);

 const issueSbt = useCallback(async () => {
  const app = await getApp();
  const result = await app.issueSbtService.execute(account);
  // tokenStateRef 대신 실제 컨트랙트에서 직접 조회
  const { sessionGateway } = await createRealGateways();
  const newTokenState = await sessionGateway.getTokenState(account);
  setTokenState(newTokenState);
  const updated = await repositoryRef.current.getPetProfileByAccount(account);
  setProfile(updated);
  return result;
}, [account, getApp]);

 const issueNft = useCallback(async () => {
  const app = await getApp();
  const result = await app.issueNftService.execute(account);
  const { sessionGateway } = await createRealGateways();
  const newTokenState = await sessionGateway.getTokenState(account);
  setTokenState(newTokenState);
  const updated = await repositoryRef.current.getPetProfileByAccount(account);
  setProfile(updated);
  return result;
}, [account, getApp]);

  const getMyPage = useCallback(async () => {
    const app = await getApp();
    return app.getMyPageService.execute(account);
  }, [account, getApp]);

  const getGoodsPreview = useCallback(async () => {
    const app = await getApp();
    return app.getGoodsPreviewService.execute(account);
  }, [account, getApp]);

  return {
    state: { account, connected: !!account, profile, tokenState },
    connectWallet,
    disconnectWallet,
    registerPet,
    issueSbt,
    issueNft,
    getMyPage,
    getGoodsPreview,
  };
}

/* ─────────────────────────── TOAST ─────────────────────────── */
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

/* ─────────────────────────── NAV ─────────────────────────── */
function Nav({ page, setPage, theme, toggleTheme, state, connectWallet, disconnectWallet }) {
  const short = state.account ? state.account.slice(0, 6) + '...' + state.account.slice(-4) : '';
  return (
    <nav>
      <div className="logo" onClick={() => setPage('home')}>PET<span>CHAIN</span></div>
      <div className="nav-links">
        {[['home', '홈'], ['register', '등록'], ['mypage', '마이페이지'], ['goods', '굿즈']].map(([k, v]) => (
          <a key={k} className={page === k ? 'active' : ''} onClick={() => setPage(k)}>{v}</a>
        ))}
      </div>
      <div className="nav-right">
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

/* ─────────────────────────── HOME ─────────────────────────── */
function HomePage({ setPage, state }) {
  const EMOJI = { '강아지': '🐶', '고양이': '🐱', '토끼': '🐰', '햄스터': '🐹' };
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
        <h2 className="section-h2">4단계로 시작하기</h2>
        <p className="section-sub">지갑 연결부터 NFT 발급까지, 간단한 절차로 반려동물의 디지털 신원을 만드세요.</p>
        <div className="flow-steps">
          {[['01','🦊','지갑 연결','MetaMask 또는 WalletConnect'],['02','🐾','반려동물 등록','이름, 종, 생년월일 입력'],['03','🪙','SBT 발급','신원 증명 토큰 발행'],['04','🖼️','NFT 민팅','기념 NFT 컬렉션 생성'],['05','🎁','혜택 이용','홀더 전용 굿즈·서비스']].map(([n,i,name,desc]) => (
            <div className="flow-step" key={n}>
              <div className="flow-num">{n}</div><div className="flow-icon">{i}</div>
              <div className="flow-name">{name}</div><div className="flow-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="section-tag">Benefits</div>
        <h2 className="section-h2">왜 PetChain인가요?</h2>
        <p className="section-sub">단순한 NFT를 넘어, 반려동물과의 진짜 유대를 기록합니다.</p>
        <div className="bm-grid">
          {[['🛡️','영구 신원 기록','SBT는 양도 불가능한 토큰으로, 반려동물의 신원을 블록체인에 영구 기록합니다.'],['🎨','고유한 디지털 자산','각 NFT는 세상에 하나뿐인 디지털 아트로, 반려동물의 특별한 순간을 담습니다.'],['🎁','홀더 전용 혜택','NFT 보유자는 굿즈 제작, 특별 이벤트 등 다양한 혜택을 누릴 수 있습니다.']].map(([icon,title,desc],i) => (
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

/* ─────────────────────────── REGISTER ─────────────────────────── */
function RegisterPage({ state, registerPet, connectWallet, showToast, setPage }) {
  const [form, setForm] = useState({ name: '', species: '강아지', birthDate: '', imageUrl: null });
  const [loading, setLoading] = useState(false);
  const EMOJI = { '강아지': '🐶', '고양이': '🐱', '토끼': '🐰', '햄스터': '🐹', '기타': '🐾' };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!state.connected) { showToast('먼저 지갑을 연결해주세요.', 'error'); return; }
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
          <p className="form-sub">반려동물의 정보를 입력하면 블록체인에 프로필이 생성됩니다.<br />등록 후 SBT를 발급받을 수 있습니다.</p>

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
              <label className="form-label">생년월일</label>
              <input type="date" className="form-input" value={form.birthDate} max={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
            </div>
          </div>

          {/* 추가 */}
         <div className="form-group">
  <label className="form-label">반려동물 사진</label>
  <label htmlFor="pet-image-upload" style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: '2px dashed var(--border)',
    borderRadius: 12,
    padding: '28px 20px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    background: form.imageUrl ? 'transparent' : 'var(--surface)',
  }}
  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
  >
    {form.imageUrl ? (
      <>
        <img src={form.imageUrl} style={{
          width: 80, height: 80,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--accent)',
        }} />
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>클릭해서 변경</span>
      </>
    ) : (
      <>
        <span style={{ fontSize: 32 }}>📷</span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>클릭해서 사진 업로드</span>
        <span style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.6 }}>JPG, PNG, GIF 지원</span>
      </>
    )}
  </label>
  <input
    id="pet-image-upload"
    type="file"
    accept="image/*"
    style={{ display: 'none' }}
    onChange={handleImage}
  />
</div>

          <button className="btn-full" onClick={handleSubmit} disabled={loading || !state.connected}>
            {loading ? '등록 중...' : '반려동물 등록하기'}
          </button>
        </div>

        <div className="preview-section">
          <div className="preview-label">미리보기</div>
          <div className="preview-card">
            {/* 수정 */}
            <div className="preview-img">
              {form.imageUrl
                ? <img src={form.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : EMOJI[form.species] || '🐾'
              }
            </div>
            <div className="preview-name">{form.name || '반려동물 이름'}</div>
            <div className="preview-breed">{form.species}</div>
            <div className="preview-rows">
              <div className="preview-row">
                <span className="preview-row-key">계정</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10 }}>{state.account ? state.account.slice(0,10)+'...' : '미연결'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-row-key">생년월일</span>
                <span>{form.birthDate || '—'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-row-key">등록 상태</span>
                <span style={{ color: 'var(--accent3)' }}>{state.profile ? '등록됨' : '미등록'}</span>
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


/* ─────────────────────────── MYPAGE ─────────────────────────── */
function MyPage({ state, issueSbt, issueNft, showToast, setPage, connectWallet }) {
  const [sbtModal, setSbtModal] = useState(false);
  const [nftModal, setNftModal] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(null);
  const [selectedNft, setSelectedNft] = useState(null);

  const EMOJI = { '강아지': '🐶', '고양이': '🐱', '토끼': '🐰', '햄스터': '🐹' };
  const petEmoji = EMOJI[state.profile?.pet?.species] || '🐾';
  const nftBg = ['linear-gradient(135deg,#1e1a2e,#2a1a3e)','linear-gradient(135deg,#0f2027,#203a43)','linear-gradient(135deg,#1a2a1a,#2a3a1e)'];

  const handleMint = async (type) => {
    setMinting(true);
    try {
      const result = type === 'sbt' ? await issueSbt() : await issueNft();
      const issuance = type === 'sbt' ? result.issuance.sbt : result.issuance.nfts?.slice(-1)[0];
      setMintSuccess({ type: type.toUpperCase(), tokenId: issuance?.tokenId, hash: issuance?.transactionHash });
    } catch (e) {
      showToast(e.message, 'error');
      type === 'sbt' ? setSbtModal(false) : setNftModal(false);
    } finally { setMinting(false); }
  };

  const closeModal = () => { setSbtModal(false); setNftModal(false); setMintSuccess(null); };

  if (!state.connected) return (
    <div className="page active">
      <div className="mypage-layout">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <div className="empty-state-title">지갑을 연결해주세요</div>
          <p className="empty-state-desc" style={{ marginBottom: 24 }}>마이페이지를 이용하려면 지갑 연결이 필요합니다.</p>
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
          <div style={{ display: 'flex', gap: 12 }}>
            {!state.profile && <button className="btn-mint" onClick={() => setPage('register')}>반려동물 등록</button>}
            {state.profile && !state.tokenState.hasSbt && <button className="btn-mint" onClick={() => setSbtModal(true)}>SBT 발급</button>}
            {state.tokenState.hasSbt && <button className="btn-mint" onClick={() => setNftModal(true)}>NFT 민팅</button>}
          </div>
        </div>

        {!state.profile ? (
          <div className="no-pet-banner">
            <div className="no-pet-text"><strong>반려동물 미등록</strong>먼저 반려동물을 등록해야 SBT와 NFT를 발급받을 수 있습니다.</div>
            <button className="btn-mint" onClick={() => setPage('register')}>지금 등록하기</button>
          </div>
        ) : (
          <div className="mypage-grid">
            <div className="pet-card-main">
             <div className="pet-card-main-img">
  {state.profile?.pet?.imageUrl
    ? <img src={state.profile.pet.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
    : petEmoji
  }
</div>
              {state.tokenState.hasSbt && <div className="verified-badge">✓ SBT Verified</div>}
              <div className="pet-main-name">{state.profile.pet.name}</div>
              <div className="pet-main-breed">{state.profile.pet.species}</div>
              <div className="info-grid">
                <div className="info-cell"><div className="info-cell-key">생년월일</div><div className="info-cell-val">{state.profile.pet.birthDate}</div></div>
                <div className="info-cell"><div className="info-cell-key">NFT 수량</div><div className="info-cell-val">{state.profile.nfts?.length || 0}개</div></div>
              </div>
              {state.profile.sbt && (
                <div className="sbt-block">
                  <div className="sbt-icon">🪙</div>
                  <div><div className="sbt-info-label">SBT Token</div><div className="sbt-info-val">#{state.profile.sbt.tokenId}</div></div>
                </div>
              )}
              <div className="holder-section">
                <div className="holder-title">홀더 혜택</div>
                <div className="holder-features">
                  {[['🎁','굿즈 제작','NFT 도안으로',!state.tokenState.hasNft],['📥','고화질 다운로드','원본 파일',!state.tokenState.hasSbt],['🎉','이벤트 참여','홀더 전용',!state.tokenState.hasNft],['🛡️','신원 인증서','PDF 발급',!state.tokenState.hasSbt]].map(([icon,name,desc,locked]) => (
                    <div key={name} className={`holder-feat${locked ? ' locked' : ''}`}>
                      <div className="holder-feat-icon">{icon}</div>
                      <div className="holder-feat-name">{name}</div>
                      <div className="holder-feat-desc">{desc}</div>
                      <div className="lock-overlay"><span>🔒</span><span>잠김</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="nft-section-top">
                <div className="nft-section-title">내 NFT 컬렉션</div>
                <button className="btn-mint" disabled={!state.tokenState.hasSbt} onClick={() => setNftModal(true)}>+ NFT 민팅</button>
              </div>
              {!state.profile.nfts?.length ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🖼️</div>
                  <div className="empty-state-title">NFT 없음</div>
                  <p className="empty-state-desc">{state.tokenState.hasSbt ? 'NFT를 민팅해보세요.' : 'SBT 발급 후 NFT를 민팅할 수 있습니다.'}</p>
                </div>
              ) : (
                <div className="nft-grid">
  {state.profile.nfts.map((nft, i) => (
    <div className="nft-item" key={nft.tokenId} onClick={() => setSelectedNft({ ...nft, index: i })} style={{ cursor: 'pointer' }}>
      <div className="nft-item-img" style={{ background: nftBg[i % nftBg.length] }}>
        {state.profile?.pet?.imageUrl
          ? <img src={state.profile.pet.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : petEmoji
        }
        <div className="nft-type-badge badge-limited">NFT</div>
      </div>
      <div className="nft-item-body">
        <div className="nft-item-name">{state.profile.pet.name} #{nft.tokenId}</div>
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

     {/* SBT Modal */}
      <div className={`modal-overlay${sbtModal ? ' open' : ''}`}>
        <div className="modal">
          <button className="modal-close" onClick={closeModal}>✕</button>
          {!mintSuccess ? (
            <>
              <div className="modal-title">SBT 발급</div>
              <div className="modal-sub">SBT(Soulbound Token)는 양도 불가능한 신원 증명 토큰입니다.</div>
              <div style={{ background:'var(--surface)',border:'1px solid var(--border)',padding:20,marginBottom:24 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13 }}>
                  <span style={{ color:'var(--muted)',fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:1,textTransform:'uppercase' }}>반려동물</span>
                  <span>{state.profile?.pet?.name}</span>
                </div>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}>
                  <span style={{ color:'var(--muted)',fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:1,textTransform:'uppercase' }}>표준</span>
                  <span style={{ color:'var(--accent2)' }}>ERC-5192 Soulbound</span>
                </div>
              </div>
              <button className="btn-modal-mint" onClick={() => handleMint('sbt')} disabled={minting}>
                {minting ? '발급 중...' : 'SBT 발급하기'}
              </button>
            </>
          ) : (
            <div className="mint-success show" style={{ textAlign:'center',padding:'20px 0' }}>
              <div className="success-icon">🎉</div>
              <div className="success-title">발급 완료!</div>
              <div className="success-sub">SBT #{mintSuccess.tokenId}가 성공적으로 발급되었습니다.<br />이제 NFT를 민팅할 수 있습니다.</div>
              <div className="tx-hash">TX: {mintSuccess.hash}</div>
              <button className="btn-modal-mint" style={{ marginTop:20 }} onClick={closeModal}>닫기</button>
            </div>
          )}
        </div>
      </div>

      {/* NFT 상세보기 모달 - 추가 */}
      <div className={`modal-overlay${selectedNft ? ' open' : ''}`} onClick={() => setSelectedNft(null)}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <button className="modal-close" onClick={() => setSelectedNft(null)}>✕</button>
          {selectedNft && (
            <>
              <div className="modal-title">{state.profile.pet.name} #{selectedNft.tokenId}</div>
              <div style={{
                width:'100%', height:220, borderRadius:12, overflow:'hidden',
                marginBottom:20, background: nftBg[selectedNft.index % nftBg.length],
                display:'flex', alignItems:'center', justifyContent:'center', position:'relative'
              }}>
                {state.profile?.pet?.imageUrl
                  ? <img src={state.profile.pet.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:80 }}>{petEmoji}</span>
                }
                <div className="nft-type-badge badge-limited" style={{ position:'absolute', top:12, right:12 }}>NFT</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {[
                  ['이름', state.profile.pet.name],
                  ['종', state.profile.pet.species],
                  ['생년월일', state.profile.pet.birthDate],
                  ['토큰 ID', `#${selectedNft.tokenId}`],
                  ['민팅 날짜', selectedNft.mintedAt ? new Date(selectedNft.mintedAt).toLocaleString('ko-KR') : '—'],
                ].map(([key, val]) => (
                  <div key={key} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'10px 14px', background:'var(--surface)', borderRadius:8,
                    border:'1px solid var(--border)', fontSize:13
                  }}>
                    <span style={{ color:'var(--muted)', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:1, textTransform:'uppercase' }}>{key}</span>
                    <span>{val}</span>
                  </div>
                ))}
                <div style={{ padding:'10px 14px', background:'var(--surface)', borderRadius:8, border:'1px solid var(--border)' }}>
                  <div style={{ color:'var(--muted)', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>TX HASH</div>
                  <div style={{ fontSize:11, fontFamily:"'Space Mono',monospace", wordBreak:'break-all', color:'var(--accent2)' }}>
                    {selectedNft.transactionHash || '—'}
                  </div>
                </div>
              </div>
              {selectedNft.transactionHash && (
                
                 <a href={`https://sepolia.etherscan.io/tx/${selectedNft.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-modal-mint"
                  style={{ display:'block', textAlign:'center', textDecoration:'none' }}
                >
                  Etherscan에서 보기 🔗
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {/* NFT Modal */}
      <div className={`modal-overlay${nftModal ? ' open' : ''}`}>
        <div className="modal">
          <button className="modal-close" onClick={closeModal}>✕</button>
          {!mintSuccess ? (
            <>
              <div className="modal-title">NFT 민팅</div>
              <div className="modal-sub">반려동물의 특별한 순간을 NFT로 영구 기록하세요.</div>
              <div style={{ background:'var(--surface)',border:'1px solid var(--border)',padding:20,marginBottom:24 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13 }}>
                  <span style={{ color:'var(--muted)',fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:1,textTransform:'uppercase' }}>반려동물</span>
                  <span>{state.profile?.pet?.name}</span>
                </div>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}>
                  <span style={{ color:'var(--muted)',fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:1,textTransform:'uppercase' }}>발행 번호</span>
                  <span style={{ color:'var(--accent)' }}>#{(state.profile?.nfts?.length || 0) + 1}</span>
                </div>
              </div>
              <button className="btn-modal-mint" onClick={() => handleMint('nft')} disabled={minting}>
                {minting ? '민팅 중...' : 'NFT 민팅하기'}
              </button>
            </>
          ) : (
            <div className="mint-success show" style={{ textAlign:'center',padding:'20px 0' }}>
              <div className="success-icon">🎊</div>
              <div className="success-title">민팅 완료!</div>
              <div className="success-sub">NFT #{mintSuccess.tokenId}가 성공적으로 발행되었습니다.<br />이제 굿즈 제작이 가능합니다.</div>
              <div className="tx-hash">TX: {mintSuccess.hash}</div>
              <button className="btn-modal-mint" style={{ marginTop:20 }} onClick={closeModal}>닫기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── GOODS ─────────────────────────── */
function GoodsPage({ state, getGoodsPreview, showToast, setPage }) {
  const [selected, setSelected] = useState(0);
  const [qty, setQty] = useState(1);
  const [preview, setPreview] = useState(null);

  const EMOJI = { '강아지': '🐶', '고양이': '🐱', '토끼': '🐰', '햄스터': '🐹' };
  const petEmoji = EMOJI[state.profile?.pet?.species] || '🐾';

  useEffect(() => {
    if (state.connected) {
      getGoodsPreview().then(setPreview).catch(() => {});
    }
  }, [state.connected, state.tokenState.hasNft]);

  const canPreview = preview?.enabled ?? false;

  const goods = [
    { icon: '👕', name: '티셔츠', price: '35,000', badge: 'POPULAR' },
    { icon: '🧸', name: '인형', price: '52,000', badge: null },
    { icon: '🖼️', name: '액자', price: '28,000', badge: 'NEW' },
    { icon: '📱', name: '폰케이스', price: '22,000', badge: null },
    { icon: '☕', name: '머그컵', price: '18,000', badge: null },
    { icon: '🛍️', name: '에코백', price: '15,000', badge: null },
  ];

  const handleOrder = () => {
    if (!canPreview) { showToast('NFT 보유자만 굿즈를 주문할 수 있습니다.', 'error'); return; }
    showToast(`${goods[selected].name} ${qty}개 주문이 완료되었습니다! 🎉`);
  };

  return (
    <div className="page active">
      <div className="section">
        <div className="section-tag">NFT Holder Only</div>
        <h2 className="section-h2">굿즈 미리보기</h2>
        <p className="section-sub">NFT 보유자만 이용할 수 있는 맞춤 굿즈 서비스입니다.</p>

        {!canPreview && (
          <div className="no-pet-banner">
            <div className="no-pet-text">
              <strong>NFT 보유 필요</strong>
              {preview?.reason || 'NFT 보유자만 굿즈 제작이 가능합니다.'}
            </div>
            <button className="btn-mint" onClick={() => setPage('mypage')}>NFT 발급받기</button>
          </div>
        )}

        <div className="goods-layout" style={{ opacity: canPreview ? 1 : 0.5, pointerEvents: canPreview ? 'auto' : 'none' }}>
          <div>
            <div className="goods-grid-sel">
              {goods.map((g, i) => (
                <div key={i} className={`goods-option${selected === i ? ' sel' : ''}`} onClick={() => setSelected(i)}>
                  {g.badge && <div className="goods-option-badge">{g.badge}</div>}
                  <div className="goods-option-icon">{g.icon}</div>
                  <div className="goods-option-name">{g.name}</div>
                  <div className="goods-option-price">₩{g.price}</div>
                </div>
              ))}
            </div>
            <div className="goods-config">
              <div>
                <div className="form-label">수량</div>
                <div className="qty-row">
                  <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <div className="qty-val">{qty}</div>
                  <button className="qty-btn" onClick={() => setQty(q => Math.min(10, q + 1))}>+</button>
                </div>
              </div>
              <button className="btn-order" onClick={handleOrder}>주문하기</button>
            </div>
          </div>

          <div className="goods-preview">
            <div className="preview-panel">
              <div className="preview-panel-label">굿즈 미리보기</div>
              <div className="mockup-area">
                <div className="mockup-bg-pattern" />
                <div className="mockup-product">{goods[selected].icon}</div>
                {canPreview && <div className="mockup-nft-stamp">NFT #{state.profile?.nfts?.[0]?.tokenId || '???'}</div>}
                <div style={{ position:'absolute',top:16,left:16,fontSize:32 }}>{petEmoji}</div>
              </div>
              <div className="preview-meta">
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}>
                  <span style={{ color:'var(--muted)' }}>{goods[selected].name} × {qty}</span>
                  <div className="preview-total">₩{(parseInt(goods[selected].price.replace(',','')) * qty).toLocaleString()}</div>
                </div>
              </div>
              <div className="nft-source-badge">
                <div className="nft-source-icon">🪙</div>
                <div className="nft-source-text">NFT 도안 기반 제작<br />보유 NFT가 굿즈에 반영됩니다</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── APP ROOT ─────────────────────────── */
export default function App() {
  const [theme, setTheme] = useState('dark');
  const [page, setPage] = useState('home');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimer = useRef(null);

  const { state, connectWallet, disconnectWallet, registerPet, issueSbt, issueNft, getMyPage, getGoodsPreview } = usePetServiceApp();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (document.getElementById('petchain-styles')) return;
    const style = document.createElement('style');
    style.id = 'petchain-styles';
    style.textContent = globalCSS;
    document.head.appendChild(style);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, message, type });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }, []);

  const handleConnect = async () => {
    await connectWallet();
    showToast('지갑이 연결되었습니다.');
  };

  const handleDisconnect = () => {
    disconnectWallet();
    showToast('지갑 연결이 해제되었습니다.', 'error');
  };

  const pages = { home: HomePage, register: RegisterPage, mypage: MyPage, goods: GoodsPage };
  const PageComponent = pages[page] || HomePage;

  return (
    <>
      <Nav page={page} setPage={setPage} theme={theme} toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        state={state} connectWallet={handleConnect} disconnectWallet={handleDisconnect} />
      <PageComponent
        state={state}
        registerPet={registerPet}
        issueSbt={issueSbt}
        issueNft={issueNft}
        getMyPage={getMyPage}
        getGoodsPreview={getGoodsPreview}
        connectWallet={handleConnect}
        showToast={showToast}
        setPage={setPage}
      />
      <Toast toast={toast} />
    </>
  );
}
