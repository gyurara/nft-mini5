import { useState, useEffect, useRef, useCallback } from "react";
import { ethers } from 'ethers';
import { api, animalApi } from './api';

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
  if (!input.adoptDate) throw new AppError('INVALID_PET_INPUT', '입양일은 필수입니다.');
  return {
    account: requireNonEmptyString(input.account, 'account'),
    name: requireNonEmptyString(input.name, 'name'),
    species: requireNonEmptyString(input.species, 'species'),
    registrationNo: input.registrationNo ? String(input.registrationNo).trim() : null,
    gender: input.gender || null,
    birthDate: input.birthDate || null,
    adoptDate: input.adoptDate,
    imageUrl: input.imageUrl || null,
  };
}

function formatBasicDateToInput(value) {
  if (!value || !/^\d{8}$/.test(String(value))) return '';
  const text = String(value);
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

function mapAnimalTypeToSpecies(value) {
  const normalized = String(value || '').trim();
  if (['개', '강아지', '견'].includes(normalized)) return '강아지';
  if (['고양이', '묘'].includes(normalized)) return '고양이';
  if (normalized === '토끼') return '토끼';
  if (normalized === '햄스터') return '햄스터';
  return '기타';
}

function mapAnimalGender(value) {
  const normalized = String(value || '').trim();
  if (normalized === '수컷') return '남아';
  if (normalized === '암컷') return '여아';
  return '중성화';
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
    // account -> [profile, ...] 배열로 변경
    this.petProfiles = new Map(); // account -> profile[]
    this.transactions = new Map();
  }
  // 특정 반려동물 프로필 저장 (petId 기준)
  savePetProfile(profile) {
    const list = this.petProfiles.get(profile.account) || [];
    const idx = list.findIndex(p => p.pet.id === profile.pet.id);
    if (idx >= 0) list[idx] = deepClone(profile);
    else list.push(deepClone(profile));
    this.petProfiles.set(profile.account, list);
    return deepClone(profile);
  }
  // 첫 번째 프로필 반환 (레거시 호환)
  getPetProfileByAccount(account) {
    const list = this.petProfiles.get(account) || [];
    return list.length > 0 ? deepClone(list[0]) : null;
  }
  // 모든 프로필 반환
  getAllProfilesByAccount(account) {
    return deepClone(this.petProfiles.get(account) || []);
  }
  // petId로 특정 프로필 반환
  getProfileByPetId(account, petId) {
    const list = this.petProfiles.get(account) || [];
    const p = list.find(p => p.pet.id === petId);
    return p ? deepClone(p) : null;
  }
  saveSbtIssuance(account, issuance, petId) {
    const list = this.petProfiles.get(account) || [];
    const target = petId ? list.find(p => p.pet.id === petId) : list[0];
    if (!target) throw new Error('프로필을 찾을 수 없습니다.');
    target.sbt = deepClone(issuance);
    this.petProfiles.set(account, list);
    return deepClone(target);
  }
  appendNftIssuance(account, issuance, petId) {
    const list = this.petProfiles.get(account) || [];
    const target = petId ? list.find(p => p.pet.id === petId) : list[0];
    if (!target) throw new Error('프로필을 찾을 수 없습니다.');
    target.nfts = Array.isArray(target.nfts) ? target.nfts : [];
    target.nfts.push(deepClone(issuance));
    this.petProfiles.set(account, list);
    return deepClone(target);
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
  getRequiredProfile(account, petId) {
    const list = this.petProfiles.get(account) || [];
    const profile = petId ? list.find(p => p.pet.id === petId) : list[0];
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
      let apiRes = null;

      try {
        apiRes = await api.registerPet({
          account: pet.account,
          name: pet.name,
          species: pet.species,
          registrationNo: pet.registrationNo,
          gender: pet.gender,
          birthDate: pet.birthDate,
          adoptDate: pet.adoptDate,
          imageUrl: pet.imageUrl,
        });
      } catch (error) {
        console.error('registerPet API 실패, 로컬 상태로 계속 진행합니다.', error);
      }

      // 항상 새 반려동물로 추가 (기존 프로필 덮어쓰기 없음)
      const profile = {
        account: pet.account,
        pet: {
          id: apiRes?.pet?.id ?? apiRes?.petId ?? apiRes?.id ?? crypto.randomUUID(),
          name: apiRes?.pet?.name ?? pet.name,
          species: apiRes?.pet?.species ?? pet.species,
          registrationNo: apiRes?.pet?.registrationNo ?? pet.registrationNo ?? null,
          gender: apiRes?.pet?.gender ?? (pet.gender || null),
          birthDate: apiRes?.pet?.birthDate ?? (pet.birthDate || null),
          adoptDate: apiRes?.pet?.adoptDate ?? pet.adoptDate,
          imageUrl: apiRes?.pet?.imageUrl ?? (pet.imageUrl || null),
          createdAt: apiRes?.pet?.createdAt ?? apiRes?.createdAt ?? now,
          updatedAt: apiRes?.pet?.updatedAt ?? apiRes?.updatedAt ?? now,
        },
        sbt: null,
        nfts: [],
      };
      return petProfileRepository.savePetProfile(profile);
    },
  };
}

// issue-sbt-service.js
function createIssueSbtService({ sessionGateway, contractGateway, petProfileRepository, tokenUriFactory }) {
  return {
    async execute(account, petId) {
      await sessionGateway.assertConnected(account);
      const profile = petId
        ? await petProfileRepository.getProfileByPetId(account, petId)
        : await petProfileRepository.getPetProfileByAccount(account);
      if (!profile?.pet) throw new AppError('PET_PROFILE_REQUIRED', 'SBT 발급 전 반려동물 등록이 필요합니다.', { account });
      if (profile.sbt) throw new AppError('SBT_ALREADY_ISSUED', '이 반려동물은 이미 SBT를 보유하고 있습니다.', { account });

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
        }, profile.pet.id);

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
          issuance: await petProfileRepository.getProfileByPetId(account, profile.pet.id),
        };
      } catch (error) {
        const appError = toAppError(error, 'SBT_MINT_FAILED', 'SBT 발급에 실패했습니다.', { account });
        await petProfileRepository.saveTransaction(account, 'sbt', {
          ...pendingTransaction, status: 'failed', completedAt: new Date().toISOString(),
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
    async execute(account, nftData = {}, petId) {
      await sessionGateway.assertConnected(account);
      const profile = petId
        ? await petProfileRepository.getProfileByPetId(account, petId)
        : await petProfileRepository.getPetProfileByAccount(account);
      if (!profile?.pet) throw new AppError('PET_PROFILE_REQUIRED', 'NFT 발급 전 반려동물 등록이 필요합니다.', { account });
      if (!profile.sbt) throw new AppError('SBT_REQUIRED', 'SBT 보유자만 NFT를 발급할 수 있습니다.', { account });

      const pendingTransaction = await petProfileRepository.saveTransaction(account, 'nft', {
        kind: 'nft', status: 'pending', startedAt: new Date().toISOString(),
      });

      try {
        const requestTokenUri = tokenUriFactory.createNftTokenUri({ account, pet: profile.pet });
        const mintResult = await contractGateway.mintNft({ account, tokenUri: requestTokenUri });
        const tokenId = extractTokenId(mintResult, 'NFTMinted');
        const petWithNftData = { ...profile.pet, imageUrl: nftData.imageUrl || profile.pet.imageUrl };
        const metadataRecord = tokenUriFactory.createMetadataRecord({ kind: 'nft', tokenId, pet: petWithNftData });
        const refreshedTokenState = await sessionGateway.refreshTokenState(account);

        await petProfileRepository.appendNftIssuance(account, {
          tokenId,
          requestTokenUri,
          resolvedTokenUri: metadataRecord.url,
          metadata: metadataRecord.metadata,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
          mintedAt: new Date().toISOString(),
          nftImageUrl: nftData.imageUrl || null,
          nftDescription: nftData.description || null,
        }, profile.pet.id);

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
          issuance: await petProfileRepository.getProfileByPetId(account, profile.pet.id),
        };
      } catch (error) {
        const appError = toAppError(error, 'NFT_MINT_FAILED', 'NFT 발급에 실패했습니다.', { account });
        await petProfileRepository.saveTransaction(account, 'nft', {
          ...pendingTransaction, status: 'failed', completedAt: new Date().toISOString(),
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
  const [profiles, setProfiles] = useState([]); // 여러 마리
  const [activePetId, setActivePetId] = useState(null); // 현재 선택된 반려동물
  const [tokenStates, setTokenStates] = useState({}); // petId -> { hasSbt, hasNft }

  const appRef = useRef(null);
  const repositoryRef = useRef(new InMemoryPetProfileRepository());
  const tokenUriFactory = useRef(createTokenUriFactory());

  // 현재 선택된 profile
  const activeProfile = profiles.find(p => p.pet.id === activePetId) || profiles[0] || null;
  // 현재 선택된 tokenState
  const activeTokenState = (activePetId && tokenStates[activePetId]) || { hasSbt: false, hasNft: false };
  // 전체 hasSbt/hasNft (어느 반려동물이든 있으면 true)
  const anyHasSbt = profiles.some(p => tokenStates[p.pet.id]?.hasSbt);
  const anyHasNft = profiles.some(p => tokenStates[p.pet.id]?.hasNft);

  const getApp = useCallback(async () => {
    if (!appRef.current) {
      const { sessionGateway, contractGateway } = await createRealGateways();
      appRef.current = {
        registerPetService: createRegisterPetService({ petProfileRepository: repositoryRef.current }),
        issueSbtService: createIssueSbtService({
          sessionGateway, contractGateway,
          petProfileRepository: repositoryRef.current,
          tokenUriFactory: tokenUriFactory.current,
        }),
        issueNftService: createIssueNftService({
          sessionGateway, contractGateway,
          petProfileRepository: repositoryRef.current,
          tokenUriFactory: tokenUriFactory.current,
        }),
        getMyPageService: createGetMyPageService({ sessionGateway, petProfileRepository: repositoryRef.current }),
        getGoodsPreviewService: createGetGoodsPreviewService({ sessionGateway }),
      };
    }
    return appRef.current;
  }, []);

  const refreshProfiles = useCallback((acc) => {
    const all = repositoryRef.current.getAllProfilesByAccount(acc);
    setProfiles(all);
    return all;
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) { alert('MetaMask를 설치해주세요.'); return; }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const acc = accounts[0];
    setAccount(acc);

    // 지갑 주소로 백엔드 세션 자동 생성 (wallet-based login)
    try {
      await api.walletLogin(acc);
    } catch (e) {
      console.warn('[wallet-login] 세션 생성 실패 (서버 미연결 시 무시):', e.message);
    }

    setTokenStates({});
    return acc;
  }, []);

  const disconnectWallet = useCallback(async () => {
    try { await api.walletLogout(); } catch (_) {}
    setAccount(null);
    setProfiles([]);
    setActivePetId(null);
    setTokenStates({});
    repositoryRef.current = new InMemoryPetProfileRepository();
    appRef.current = null;
  }, []);

  const registerPet = useCallback(async (input) => {
    const app = await getApp();
    const result = await app.registerPetService.execute({ ...input, account });
    const all = refreshProfiles(account);
    // 새로 추가된 반려동물을 활성화
    setActivePetId(result.pet.id);
    setTokenStates(prev => ({ ...prev, [result.pet.id]: { hasSbt: false, hasNft: false } }));
    return result;
  }, [account, getApp, refreshProfiles]);

  const issueSbt = useCallback(async (petId) => {
    const app = await getApp();
    const targetId = petId || activePetId;
    // SBT 발급은 petId 기준으로 처리 (서비스 내부에서 profile 조회 시 petId 활용)
    const result = await app.issueSbtService.execute(account, targetId);
    const { sessionGateway } = await createRealGateways();
    const newTs = await sessionGateway.getTokenState(account);
    setTokenStates(prev => ({ ...prev, [targetId]: newTs }));
    refreshProfiles(account);
    return result;
  }, [account, activePetId, getApp, refreshProfiles]);

  const issueNft = useCallback(async (nftData = {}, petId) => {
    const app = await getApp();
    const targetId = petId || activePetId;
    const result = await app.issueNftService.execute(account, nftData, targetId);
    const { sessionGateway } = await createRealGateways();
    const newTs = await sessionGateway.getTokenState(account);
    setTokenStates(prev => ({ ...prev, [targetId]: newTs }));
    refreshProfiles(account);
    return result;
  }, [account, activePetId, getApp, refreshProfiles]);

  const getMyPage = useCallback(async () => {
    const app = await getApp();
    return app.getMyPageService.execute(account);
  }, [account, getApp]);

  const getGoodsPreview = useCallback(async () => {
    const app = await getApp();
    return app.getGoodsPreviewService.execute(account);
  }, [account, getApp]);

  return {
    state: {
      account,
      connected: !!account,
      profiles,
      profile: activeProfile,  // 하위 호환
      activePetId,
      tokenState: activeTokenState,
      tokenStates,
      anyHasSbt,
      anyHasNft,
    },
    connectWallet,
    disconnectWallet,
    registerPet,
    issueSbt,
    issueNft,
    getMyPage,
    getGoodsPreview,
    setActivePetId,
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
  const [form, setForm] = useState({ name: '', species: '강아지', registrationNo: '', gender: '남아', birthDate: '', adoptDate: '', imageUrl: null });
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [twoWayInfo, setTwoWayInfo] = useState(null);
  const [lookupForm, setLookupForm] = useState({
    organization: '0001',
    loginType: '1',
    userId: '',
    userPassword: '',
    loginTypeLevel: '1',
    userName: '',
    birthDate: '',
    telecom: '0',
    phoneNo: '',
  });
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

  const applyLookupData = useCallback((data) => {
    setLookupResult(data);
    setForm(prev => ({
      ...prev,
      name: data?.commName || prev.name,
      species: mapAnimalTypeToSpecies(data?.resType1 || data?.resKind),
      registrationNo: data?.resRegNumber || prev.registrationNo,
      gender: mapAnimalGender(data?.resGender),
      birthDate: formatBasicDateToInput(data?.commBirthDate) || prev.birthDate,
    }));
  }, []);

  const handleLookup = async (is2Way = false) => {
    setLookupLoading(true);
    try {
      const payload = {
        ...lookupForm,
        phoneNo: lookupForm.phoneNo.replace(/\D/g, ''),
        birthDate: lookupForm.birthDate.replace(/\D/g, ''),
      };
      if (is2Way && twoWayInfo) {
        payload.is2Way = true;
        payload.simpleAuth = '1';
        payload.twoWayInfo = twoWayInfo;
      }

      const response = await animalApi.lookupRegistrationNumber(payload);

      if (response?.result?.code === 'CF-03002' && response?.data?.continue2Way) {
        setTwoWayInfo({
          jobIndex: response.data.jobIndex,
          threadIndex: response.data.threadIndex,
          jti: response.data.jti,
          twoWayTimestamp: response.data.twoWayTimestamp,
        });
        showToast('추가인증이 필요합니다. 간편인증 완료 후 확인 버튼을 눌러주세요.');
        return;
      }

      setTwoWayInfo(null);
      applyLookupData(response?.data);
      showToast('동물등록번호 조회 결과를 입력폼에 반영했습니다.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLookupLoading(false);
    }
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

          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', padding:20, marginBottom:24 }}>
            <div className="form-label" style={{ color:'var(--accent)', marginBottom:12 }}>동물등록번호 조회 API</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">로그인 방식</label>
                <select className="form-select" value={lookupForm.loginType} onChange={e => setLookupForm(f => ({ ...f, loginType: e.target.value }))}>
                  <option value="1">아이디 로그인</option>
                  <option value="5">간편인증 로그인</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">기관코드</label>
                <input className="form-input" value={lookupForm.organization} readOnly />
              </div>
            </div>

            {lookupForm.loginType === '1' ? (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">아이디</label>
                  <input className="form-input" value={lookupForm.userId} onChange={e => setLookupForm(f => ({ ...f, userId: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">비밀번호</label>
                  <input type="password" className="form-input" value={lookupForm.userPassword} onChange={e => setLookupForm(f => ({ ...f, userPassword: e.target.value }))} />
                </div>
              </div>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">간편인증 구분</label>
                    <select className="form-select" value={lookupForm.loginTypeLevel} onChange={e => setLookupForm(f => ({ ...f, loginTypeLevel: e.target.value }))}>
                      <option value="1">카카오톡</option>
                      <option value="3">삼성패스</option>
                      <option value="4">KB모바일</option>
                      <option value="5">통신사 PASS</option>
                      <option value="6">네이버</option>
                      <option value="7">신한인증서</option>
                      <option value="10">NH인증서</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">이름</label>
                    <input className="form-input" value={lookupForm.userName} onChange={e => setLookupForm(f => ({ ...f, userName: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">생년월일(yyyymmdd)</label>
                    <input className="form-input" value={lookupForm.birthDate} maxLength={8} onChange={e => setLookupForm(f => ({ ...f, birthDate: e.target.value.replace(/\D/g, '').slice(0, 8) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">전화번호</label>
                    <input className="form-input" value={lookupForm.phoneNo} onChange={e => setLookupForm(f => ({ ...f, phoneNo: e.target.value.replace(/[^\d-]/g, '') }))} />
                  </div>
                </div>
                {lookupForm.loginTypeLevel === '5' && (
                  <div className="form-group">
                    <label className="form-label">통신사</label>
                    <select className="form-select" value={lookupForm.telecom} onChange={e => setLookupForm(f => ({ ...f, telecom: e.target.value }))}>
                      <option value="0">SKT</option>
                      <option value="1">KT</option>
                      <option value="2">LG U+</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button className="btn-mint" style={{ flex:1 }} onClick={() => handleLookup(false)} disabled={lookupLoading}>
                {lookupLoading ? '조회 중...' : '조회해서 입력폼 채우기'}
              </button>
              {twoWayInfo && (
                <button className="btn-outline" style={{ flex:1 }} onClick={() => handleLookup(true)} disabled={lookupLoading}>
                  간편인증 완료 후 확인
                </button>
              )}
            </div>

            {lookupResult && (
              <div style={{ marginTop:14, padding:14, background:'var(--card)', border:'1px solid var(--border)' }}>
                <div className="form-label">조회 결과</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12 }}>
                  <div>이름: {lookupResult.commName}</div>
                  <div>등록번호: {lookupResult.resRegNumber}</div>
                  <div>성별: {lookupResult.resGender}</div>
                  <div>종류: {lookupResult.resType1}</div>
                  <div>품종: {lookupResult.resKind}</div>
                  <div>생년월일: {lookupResult.commBirthDate}</div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">반려동물 이름</label>
            <input className="form-input" placeholder="예: 뭉치" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">동물등록번호 <span style={{ color:'var(--muted)', fontWeight:300 }}>(Animal API용)</span></label>
            <input
              className="form-input"
              placeholder="15자리 숫자 예: 410000000000001"
              value={form.registrationNo}
              maxLength={15}
              onChange={e => setForm(f => ({ ...f, registrationNo: e.target.value.replace(/\D/g, '').slice(0, 15) }))}
            />
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
              cursor:'pointer', transition:'border-color 0.2s, background 0.2s',
              background: form.imageUrl ? 'transparent' : 'var(--surface)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
            >
              {form.imageUrl ? (
                <><img src={form.imageUrl} style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--accent)' }} /><span style={{ fontSize:12, color:'var(--muted)' }}>클릭해서 변경</span></>
              ) : (
                <><span style={{ fontSize:32 }}>📷</span><span style={{ fontSize:13, color:'var(--muted)' }}>클릭해서 사진 업로드</span><span style={{ fontSize:11, color:'var(--muted)', opacity:0.6 }}>JPG, PNG, GIF 지원</span></>
              )}
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
                <span className="preview-row-key">동물등록번호</span>
                <span>{form.registrationNo || '—'}</span>
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


/* ─────────────────────────── MYPAGE ─────────────────────────── */
function DraggableNftDetail({ nft, profile, onClose }) {
  const EMOJI = { '강아지':'🐶', '고양이':'🐱', '토끼':'🐰', '햄스터':'🐹' };
  const petEmoji = EMOJI[profile?.pet?.species] || '🐾';
  const nftBg = ['linear-gradient(135deg,#1e1a2e,#2a1a3e)','linear-gradient(135deg,#0f2027,#203a43)','linear-gradient(135deg,#1a2a1a,#2a3a1e)'];
  const panelRef = useRef(null);
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
    <div ref={panelRef} style={{
      position:'fixed', left:pos.x, top:pos.y, zIndex:500, width:380,
      background:'var(--card)', border:'1px solid var(--border)',
      boxShadow:'0 24px 64px rgba(0,0,0,.5)', animation:'modal-in .25s ease',
    }}>
      {/* 드래그 핸들 */}
      <div onMouseDown={onMouseDown} style={{
        padding:'12px 16px', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        cursor:'grab', userSelect:'none', background:'var(--surface)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'var(--muted)', fontSize:12 }}>⠿⠿</span>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, color:'var(--muted)', textTransform:'uppercase' }}>NFT 상세</span>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:18, cursor:'pointer', lineHeight:1 }}>✕</button>
      </div>
      <div style={{ padding:24, maxHeight:'70vh', overflowY:'auto' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:2, marginBottom:14 }}>
          {profile.pet.name} #{nft.tokenId}
        </div>
        <div style={{
          width:'100%', height:180, borderRadius:10, overflow:'hidden', marginBottom:16,
          background: nftBg[nft.index % nftBg.length],
          display:'flex', alignItems:'center', justifyContent:'center', position:'relative'
        }}>
          {nft.nftImageUrl
            ? <img src={nft.nftImageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : profile?.pet?.imageUrl
            ? <img src={profile.pet.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontSize:64 }}>{petEmoji}</span>
          }
          <div className="nft-type-badge badge-limited" style={{ position:'absolute', top:10, right:10 }}>NFT</div>
        </div>
        {nft.nftDescription && (
          <div style={{ padding:'10px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, marginBottom:10, fontSize:12, lineHeight:1.7, color:'var(--muted)' }}>
            {nft.nftDescription}
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            ['이름', profile.pet.name],
            ['종', profile.pet.species],
            ['성별', profile.pet.gender || '—'],
            ['태어난날', profile.pet.birthDate || '—'],
            ['입양일', profile.pet.adoptDate || '—'],
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
            <div style={{ fontSize:10, fontFamily:"'Space Mono',monospace", wordBreak:'break-all', color:'var(--accent2)' }}>{nft.transactionHash || '—'}</div>
          </div>
        </div>
        {nft.transactionHash && (
          <a href={`https://sepolia.etherscan.io/tx/${nft.transactionHash}`} target="_blank" rel="noopener noreferrer"
            className="btn-modal-mint" style={{ display:'block', textAlign:'center', textDecoration:'none', marginTop:14 }}>
            Etherscan에서 보기 🔗
          </a>
        )}
      </div>
    </div>
  );
}

function MyPage({ state, issueSbt, issueNft, showToast, setPage, connectWallet, setActivePetId }) {
  const [sbtModal, setSbtModal] = useState(false);
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

  const EMOJI = { '강아지':'🐶', '고양이':'🐱', '토끼':'🐰', '햄스터':'🐹' };
  const profile = state.profile;
  const petEmoji = EMOJI[profile?.pet?.species] || '🐾';
  const nftBg = ['linear-gradient(135deg,#1e1a2e,#2a1a3e)','linear-gradient(135deg,#0f2027,#203a43)','linear-gradient(135deg,#1a2a1a,#2a3a1e)'];
  const tokenState = state.tokenState;

  const handleMint = async (type) => {
    setMinting(true);
    try {
      const result = type === 'sbt' ? await issueSbt() : await issueNft(nftForm);
      const issuance = type === 'sbt' ? result.issuance.sbt : result.issuance.nfts?.slice(-1)[0];
      setMintSuccess({ type: type.toUpperCase(), tokenId: issuance?.tokenId, hash: issuance?.transactionHash });
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
            {profile && !tokenState.hasSbt && <button className="btn-mint" onClick={() => setSbtModal(true)}>SBT 발급</button>}
            {tokenState.hasSbt && <button className="btn-mint" onClick={() => setNftModal(true)}>NFT 민팅</button>}
          </div>
        </div>

        {/* 반려동물 탭 선택 */}
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
          <>
          <div className="mypage-grid">
            <div className="pet-card-main">
              <div className="pet-card-main-img">
                {profile?.pet?.imageUrl
                  ? <img src={profile.pet.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                  : petEmoji
                }
              </div>
              {tokenState.hasSbt && <div className="verified-badge">✓ SBT Verified</div>}
              <div className="pet-main-name">{profile.pet.name}</div>
              <div className="pet-main-breed">{profile.pet.species}{profile.pet.gender ? ` · ${profile.pet.gender}` : ''}</div>
              <div className="info-grid">
                <div className="info-cell"><div className="info-cell-key">태어난날</div><div className="info-cell-val">{profile.pet.birthDate || '—'}</div></div>
                <div className="info-cell"><div className="info-cell-key">입양일</div><div className="info-cell-val">{profile.pet.adoptDate || '—'}</div></div>
                <div className="info-cell"><div className="info-cell-key">동물등록번호</div><div className="info-cell-val">{profile.pet.registrationNo || '—'}</div></div>
                <div className="info-cell"><div className="info-cell-key">NFT 수량</div><div className="info-cell-val">{profile.nfts?.length || 0}개</div></div>
              </div>
              {profile.sbt && (
                <div className="sbt-block">
                  <div className="sbt-icon">🪙</div>
                  <div><div className="sbt-info-label">SBT Token</div><div className="sbt-info-val">#{profile.sbt.tokenId}</div></div>
                </div>
              )}
              <div className="holder-section">
                <div className="holder-title">홀더 혜택</div>
                <div className="holder-features">
                  {[
                    ['🎁','굿즈 제작','NFT 도안으로', !tokenState.hasNft, () => setPage('goods')],
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

            <div>
              <div className="nft-section-top">
                <div className="nft-section-title">내 NFT 컬렉션</div>
                <button className="btn-mint" disabled={!tokenState.hasSbt} onClick={() => setNftModal(true)}>+ NFT 민팅</button>
              </div>
              {!profile.nfts?.length ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🖼️</div>
                  <div className="empty-state-title">NFT 없음</div>
                  <p className="empty-state-desc">{tokenState.hasSbt ? 'NFT를 민팅해보세요.' : 'SBT 발급 후 NFT를 민팅할 수 있습니다.'}</p>
                </div>
              ) : (
                <div className="nft-grid">
                  {profile.nfts.map((nft, i) => (
                    <div className="nft-item" key={nft.tokenId} onClick={() => setSelectedNft({ ...nft, index: i })} style={{ cursor:'pointer' }}>
                      <div className="nft-item-img" style={{ background: nftBg[i % nftBg.length] }}>
                        {nft.nftImageUrl
                          ? <img src={nft.nftImageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : profile?.pet?.imageUrl
                          ? <img src={profile.pet.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : petEmoji
                        }
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
          </>
        )}
      </div>

      {/* 드래그 가능한 NFT 상세보기 */}
      {selectedNft && <DraggableNftDetail nft={selectedNft} profile={profile} onClose={() => setSelectedNft(null)} />}

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
                  <span>{profile?.pet?.name}</span>
                </div>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}>
                  <span style={{ color:'var(--muted)',fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:1,textTransform:'uppercase' }}>표준</span>
                  <span style={{ color:'var(--accent2)' }}>ERC-5192 Soulbound</span>
                </div>
              </div>
              <button className="btn-modal-mint" onClick={() => handleMint('sbt')} disabled={minting}>{minting ? '발급 중...' : 'SBT 발급하기'}</button>
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

      {/* NFT Modal */}
      <div className={`modal-overlay${nftModal ? ' open' : ''}`}>
        <div className="modal">
          <button className="modal-close" onClick={closeModal}>✕</button>
          {!mintSuccess ? (
            <>
              <div className="modal-title">NFT 민팅</div>
              <div className="modal-sub">반려동물의 특별한 순간을 NFT로 영구 기록하세요.</div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>NFT 이미지 (선택)</div>
                <label htmlFor="nft-image-upload" style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:8, border:'2px dashed var(--border)', padding:'20px', cursor:'pointer',
                  background: nftForm.imageUrl ? 'transparent' : 'var(--surface)', transition:'border-color .2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                >
                  {nftForm.imageUrl
                    ? <><img src={nftForm.imageUrl} style={{ width:80, height:80, objectFit:'cover', borderRadius:8, border:'2px solid var(--accent)' }} /><span style={{ fontSize:11, color:'var(--muted)' }}>클릭해서 변경</span></>
                    : <><span style={{ fontSize:28 }}>🖼️</span><span style={{ fontSize:12, color:'var(--muted)' }}>클릭해서 이미지 업로드</span></>
                  }
                </label>
                <input id="nft-image-upload" type="file" accept="image/*" style={{ display:'none' }} onChange={handleNftImage} />
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>NFT 설명 (선택)</div>
                <textarea value={nftForm.description} onChange={e => setNftForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="이 NFT에 담긴 특별한 순간을 설명해주세요..." rows={3}
                  style={{ width:'100%', background:'var(--input-bg)', border:'1px solid var(--border)', color:'var(--text)', padding:'12px 14px', fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, outline:'none', resize:'vertical' }} />
              </div>
              <div style={{ background:'var(--surface)',border:'1px solid var(--border)',padding:20,marginBottom:24 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13 }}>
                  <span style={{ color:'var(--muted)',fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:1,textTransform:'uppercase' }}>반려동물</span>
                  <span>{profile?.pet?.name}</span>
                </div>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}>
                  <span style={{ color:'var(--muted)',fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:1,textTransform:'uppercase' }}>발행 번호</span>
                  <span style={{ color:'var(--accent)' }}>#{(profile?.nfts?.length || 0) + 1}</span>
                </div>
              </div>
              <button className="btn-modal-mint" onClick={() => handleMint('nft')} disabled={minting}>{minting ? '민팅 중...' : 'NFT 민팅하기'}</button>
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

      {/* 고화질 다운로드 모달 */}
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
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                {[['파일명', `${profile.pet.name}_original.png`], ['반려동물', profile.pet.name], ['SBT 토큰', `#${profile.sbt?.tokenId ?? '—'}`]].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--border)', fontSize:13 }}>
                    <span style={{ color:'var(--muted)', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:1, textTransform:'uppercase' }}>{k}</span>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11 }}>{v}</span>
                  </div>
                ))}
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

      {/* 신원 인증서 PDF 모달 */}
      <div className={`modal-overlay${pdfModal ? ' open' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:460 }}>
          <button className="modal-close" onClick={closeModal}>✕</button>
          <div className="modal-title">신원 인증서</div>
          <div className="modal-sub">블록체인에 기록된 반려동물 신원 정보를 PDF로 발급합니다.</div>
          <div style={{ border:'2px solid var(--border)', padding:28, marginBottom:20, position:'relative', background:'var(--surface)' }}>
            <div style={{ position:'absolute', top:12, right:12, background:'var(--accent2)', color:'#fff', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:1, padding:'3px 8px' }}>SBT VERIFIED</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:4, color:'var(--muted)', marginBottom:4 }}>PETCHAIN OFFICIAL CERTIFICATE</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, marginBottom:16 }}>반려동물 신원 인증서</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['반려동물명', profile?.pet?.name],
                ['종', profile?.pet?.species],
                ['성별', profile?.pet?.gender || '—'],
                ['태어난날', profile?.pet?.birthDate || '—'],
                ['입양일', profile?.pet?.adoptDate || '—'],
                ['SBT Token ID', `#${profile?.sbt?.tokenId ?? '—'}`],
                ['소유자 지갑', state.account ? state.account.slice(0,14)+'...' : '—'],
                ['발급일', new Date().toLocaleDateString('ko-KR')],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--border)', paddingBottom:8, fontSize:13 }}>
                  <span style={{ color:'var(--muted)', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:1, textTransform:'uppercase' }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="btn-modal-mint" onClick={() => { showToast('PDF 발급이 준비 중입니다.', 'success'); closeModal(); }}>🛡️ PDF 발급하기</button>
        </div>
      </div>

      {/* 1:1 문의 모달 */}
      <div className={`modal-overlay${inquiryModal ? ' open' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:480 }}>
          <button className="modal-close" onClick={closeModal}>✕</button>
          {!inquirySubmitted ? (
            <>
              <div className="modal-title">1:1 문의</div>
              <div className="modal-sub">홀더 전용 채널입니다. 빠른 시간 내에 답변드리겠습니다.</div>
              <div style={{ background:'rgba(255,107,53,.08)', border:'1px solid rgba(255,107,53,.25)', padding:'10px 14px', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                <span>🔒</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'var(--accent)', letterSpacing:1 }}>NFT HOLDER ONLY · 우선 응답 보장</span>
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>문의 유형</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['일반 문의','굿즈 문의','기술 지원','NFT/SBT 문의'].map(cat => (
                    <button key={cat} onClick={() => setInquiryForm(f => ({...f, category:cat}))} style={{
                      padding:'7px 14px', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:1,
                      background: inquiryForm.category===cat ? 'var(--accent)' : 'var(--surface)',
                      color: inquiryForm.category===cat ? '#fff' : 'var(--muted)',
                      border:`1px solid ${inquiryForm.category===cat ? 'var(--accent)' : 'var(--border)'}`,
                      cursor:'pointer', transition:'all .2s'
                    }}>{cat}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>제목</div>
                <input className="form-input" placeholder="문의 제목을 입력해주세요" value={inquiryForm.title} onChange={e => setInquiryForm(f => ({...f, title:e.target.value}))} />
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>내용</div>
                <textarea className="form-input" placeholder="문의 내용을 자세히 작성해주세요..." rows={5} value={inquiryForm.content} onChange={e => setInquiryForm(f => ({...f, content:e.target.value}))} style={{ resize:'vertical', fontFamily:"'Noto Sans KR',sans-serif" }} />
              </div>
              <div style={{ marginBottom:20, padding:'12px 14px', background:'var(--surface)', border:'1px solid var(--border)', fontSize:12, color:'var(--muted)', display:'flex', justifyContent:'space-between' }}>
                <span>연결된 지갑</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'var(--accent3)' }}>{state.account ? state.account.slice(0,16)+'...' : '—'}</span>
              </div>
              <button className="btn-modal-mint" onClick={handleInquirySubmit}>💬 문의 제출하기</button>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'32px 0' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, letterSpacing:2, color:'var(--accent3)', marginBottom:8 }}>접수 완료!</div>
              <div style={{ color:'var(--muted)', fontSize:14, lineHeight:1.8, marginBottom:8 }}>문의가 성공적으로 접수되었습니다.<br/>홀더 전용 채널로 빠르게 답변드리겠습니다.</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:'var(--accent)', marginBottom:24 }}>예상 응답 시간: 24시간 이내</div>
              <button className="btn-modal-mint" onClick={closeModal}>닫기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── GOODS SVG MOCKUPS ─────────────────────────── */
function TshirtSVG({ color, sleeve, imgUrl, petEmoji }) {
  const isLong = sleeve === 'long';
  const isHoodie = sleeve === 'hoodie';
  const shadow = color === '#ffffff' || color === '#f0f0f0' ? '#cccccc' : '#00000040';
  return (
    <svg viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.18))'}}>
      <defs>
        <linearGradient id="shirtGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.13"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0.08"/>
        </linearGradient>
        <linearGradient id="shirtSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.12"/>
          <stop offset="40%" stopColor="#000000" stopOpacity="0"/>
          <stop offset="60%" stopColor="#000000" stopOpacity="0"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0.10"/>
        </linearGradient>
        <clipPath id="imgClip"><rect x="138" y="155" width="124" height="124" rx="10"/></clipPath>
        <clipPath id="hoodClip"><ellipse cx="200" cy="62" rx="34" ry="28"/></clipPath>
      </defs>

      {/* 후드 */}
      {isHoodie && <>
        <path d="M155,30 Q200,8 245,30 L238,90 Q200,108 162,90Z" fill={color} stroke={shadow} strokeWidth="1.5"/>
        <path d="M155,30 Q200,8 245,30 L238,90 Q200,108 162,90Z" fill="url(#shirtGrad)"/>
        <ellipse cx="200" cy="62" rx="34" ry="28" fill={color} stroke={shadow} strokeWidth="1.5"/>
        <ellipse cx="200" cy="62" rx="34" ry="28" fill="url(#shirtGrad)" opacity=".6"/>
        <ellipse cx="200" cy="62" rx="22" ry="18" fill={shadow} opacity=".15"/>
      </>}

      {/* 칼라 */}
      {!isHoodie && <ellipse cx="200" cy="68" rx="30" ry="14" fill={color} stroke={shadow} strokeWidth="1"/>}

      {/* 소매 왼쪽 */}
      {isLong || isHoodie
        ? <path d="M112,90 L58,110 L42,310 L88,316 L100,170 L118,155Z" fill={color} stroke={shadow} strokeWidth="1.5"/>
        : <path d="M112,90 L62,108 L72,185 L118,170Z" fill={color} stroke={shadow} strokeWidth="1.5"/>}

      {/* 소매 오른쪽 */}
      {isLong || isHoodie
        ? <path d="M288,90 L342,110 L358,310 L312,316 L300,170 L282,155Z" fill={color} stroke={shadow} strokeWidth="1.5"/>
        : <path d="M288,90 L338,108 L328,185 L282,170Z" fill={color} stroke={shadow} strokeWidth="1.5"/>}

      {/* 몸통 */}
      <path d="M112,90 Q120,68 200,60 Q280,68 288,90 L296,390 L104,390Z" fill={color} stroke={shadow} strokeWidth="1.5"/>
      <path d="M112,90 Q120,68 200,60 Q280,68 288,90 L296,390 L104,390Z" fill="url(#shirtGrad)"/>
      <path d="M112,90 Q120,68 200,60 Q280,68 288,90 L296,390 L104,390Z" fill="url(#shirtSide)"/>

      {/* 중앙선 */}
      <line x1="200" y1="90" x2="200" y2="390" stroke={shadow} strokeWidth="0.8" strokeDasharray="6,8" opacity=".5"/>

      {/* 후드 포켓 */}
      {isHoodie && <path d="M152,280 Q200,272 248,280 L248,310 Q200,318 152,310Z" fill={shadow} opacity=".18" strokeWidth="0"/>}

      {/* NFT 이미지 */}
      {imgUrl
        ? <><image href={imgUrl} x="138" y="155" width="124" height="124" clipPath="url(#imgClip)" preserveAspectRatio="xMidYMid slice"/><rect x="138" y="155" width="124" height="124" rx="10" fill="none" stroke="#ffffff44" strokeWidth="1.5"/></>
        : <text x="200" y="228" textAnchor="middle" fontSize="72" dominantBaseline="middle">{petEmoji}</text>}
    </svg>
  );
}

function DollSVG({ species, imgUrl }) {
  const palettes = {
    '강아지': { body:'#c8956c', belly:'#e8c49a', nose:'#5a2d0c', ear:'#b07850' },
    '고양이': { body:'#a0a0a8', belly:'#d0d0d8', nose:'#e88898', ear:'#908898' },
    '토끼':   { body:'#e8d8d8', belly:'#f8f0f0', nose:'#e87898', ear:'#f0c0c8' },
    '햄스터': { body:'#d4a060', belly:'#f0d090', nose:'#c07050', ear:'#c89060' },
  };
  const p = palettes[species] || palettes['강아지'];
  return (
    <svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.18))'}}>
      <defs>
        <radialGradient id="dollGrad" cx="40%" cy="35%"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.3"/><stop offset="100%" stopColor="#000000" stopOpacity="0.1"/></radialGradient>
        <clipPath id="dollFaceClip"><circle cx="200" cy="148" r="74"/></clipPath>
      </defs>
      {/* 귀 */}
      {species === '토끼'
        ? <><ellipse cx="148" cy="68" rx="22" ry="52" fill={p.ear}/><ellipse cx="252" cy="68" rx="22" ry="52" fill={p.ear}/><ellipse cx="148" cy="68" rx="13" ry="40" fill={p.nose} opacity=".5"/><ellipse cx="252" cy="68" rx="13" ry="40" fill={p.nose} opacity=".5"/></>
        : species === '고양이'
        ? <><polygon points="142,108 120,52 168,96" fill={p.ear}/><polygon points="258,108 280,52 232,96" fill={p.ear}/><polygon points="145,100 130,66 163,92" fill={p.nose} opacity=".5"/><polygon points="255,100 270,66 237,92" fill={p.nose} opacity=".5"/></>
        : <><ellipse cx="142" cy="106" rx="30" ry="22" fill={p.ear}/><ellipse cx="258" cy="106" rx="30" ry="22" fill={p.ear}/></>}
      {/* 머리 */}
      <circle cx="200" cy="148" r="74" fill={p.body}/>
      <circle cx="200" cy="148" r="74" fill="url(#dollGrad)"/>
      {/* 얼굴 */}
      <ellipse cx="200" cy="162" rx="46" ry="38" fill={p.belly} opacity=".6"/>
      {imgUrl
        ? <><image href={imgUrl} x="126" y="74" width="148" height="148" clipPath="url(#dollFaceClip)" preserveAspectRatio="xMidYMid slice"/></>
        : <>
          <circle cx="178" cy="138" r="9" fill="#2a1a0a"/>
          <circle cx="222" cy="138" r="9" fill="#2a1a0a"/>
          <circle cx="181" cy="135" r="3" fill="#fff" opacity=".7"/>
          <circle cx="225" cy="135" r="3" fill="#fff" opacity=".7"/>
          <ellipse cx="200" cy="162" rx="14" ry="9" fill={p.nose} opacity=".7"/>
          <path d="M186,174 Q200,184 214,174" stroke="#8a4a3a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </>}
      {/* 몸 */}
      <ellipse cx="200" cy="300" rx="70" ry="84" fill={p.body}/>
      <ellipse cx="200" cy="300" rx="70" ry="84" fill="url(#dollGrad)"/>
      <ellipse cx="200" cy="310" rx="44" ry="52" fill={p.belly} opacity=".55"/>
      {/* 팔 */}
      <ellipse cx="122" cy="292" rx="26" ry="58" fill={p.body} transform="rotate(-12,122,292)"/>
      <ellipse cx="278" cy="292" rx="26" ry="58" fill={p.body} transform="rotate(12,278,292)"/>
      {/* 다리 */}
      <ellipse cx="168" cy="388" rx="28" ry="20" fill={p.ear}/>
      <ellipse cx="232" cy="388" rx="28" ry="20" fill={p.ear}/>
      <ellipse cx="168" cy="376" rx="22" ry="36" fill={p.body}/>
      <ellipse cx="232" cy="376" rx="22" ry="36" fill={p.body}/>
    </svg>
  );
}

function MugSVG({ color, imgUrl, petEmoji }) {
  const isLight = color === '#f8f8f8' || color === '#a8d8c8';
  const shadow = isLight ? '#99999944' : '#00000044';
  return (
    <svg viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.2))'}}>
      <defs>
        <linearGradient id="mugBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.18"/>
          <stop offset="20%" stopColor="#000" stopOpacity="0"/>
          <stop offset="80%" stopColor="#000" stopOpacity="0"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.22"/>
        </linearGradient>
        <linearGradient id="mugTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.1"/>
        </linearGradient>
        <clipPath id="mugImgClip"><rect x="108" y="118" width="148" height="148" rx="12"/></clipPath>
      </defs>
      {/* 몸통 */}
      <path d="M72,88 Q72,340 200,348 Q328,340 328,88Z" fill={color} stroke={shadow} strokeWidth="1.5"/>
      <path d="M72,88 Q72,340 200,348 Q328,340 328,88Z" fill="url(#mugBody)"/>
      {/* 윗면 타원 */}
      <ellipse cx="200" cy="88" rx="128" ry="30" fill={color} stroke={shadow} strokeWidth="1.5"/>
      <ellipse cx="200" cy="88" rx="128" ry="30" fill="url(#mugTop)"/>
      {/* 안쪽 */}
      <ellipse cx="200" cy="88" rx="112" ry="24" fill="#00000030"/>
      <ellipse cx="200" cy="92" rx="108" ry="20" fill="#00000025"/>
      {/* 손잡이 */}
      <path d="M328,130 Q400,130 400,208 Q400,286 328,286" fill="none" stroke={color} strokeWidth="44" strokeLinecap="round"/>
      <path d="M328,130 Q392,130 392,208 Q392,278 328,286" fill="none" stroke={shadow} strokeWidth="2"/>
      <path d="M328,130 Q372,140 372,208 Q372,276 328,286" fill="none" stroke="#ffffff18" strokeWidth="16"/>
      {/* NFT 이미지 */}
      {imgUrl
        ? <><image href={imgUrl} x="108" y="118" width="148" height="148" clipPath="url(#mugImgClip)" preserveAspectRatio="xMidYMid slice"/><rect x="108" y="118" width="148" height="148" rx="12" fill="none" stroke="#ffffff30" strokeWidth="2"/></>
        : <text x="182" y="206" textAnchor="middle" fontSize="80" dominantBaseline="middle">{petEmoji}</text>}
      {/* 광택 */}
      <ellipse cx="130" cy="160" rx="18" ry="48" fill="#ffffff" opacity="0.09" transform="rotate(-10,130,160)"/>
    </svg>
  );
}

function FrameSVG({ imgUrl, petEmoji }) {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 10px 30px rgba(0,0,0,0.28))'}}>
      <defs>
        <linearGradient id="frameOuter" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c8a050"/>
          <stop offset="40%" stopColor="#8b5e1a"/>
          <stop offset="60%" stopColor="#a07828"/>
          <stop offset="100%" stopColor="#6b4410"/>
        </linearGradient>
        <linearGradient id="frameInner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a07828"/>
          <stop offset="100%" stopColor="#6b4410"/>
        </linearGradient>
        <clipPath id="frameImgClip"><rect x="64" y="64" width="272" height="272"/></clipPath>
      </defs>
      {/* 외곽 프레임 */}
      <rect x="12" y="12" width="376" height="376" rx="6" fill="url(#frameOuter)"/>
      {/* 내부 홈 */}
      <rect x="28" y="28" width="344" height="344" rx="4" fill="url(#frameInner)"/>
      <rect x="44" y="44" width="312" height="312" rx="3" fill="url(#frameOuter)"/>
      {/* 모서리 장식 */}
      {[[28,28],[372,28],[28,372],[372,372]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="10" fill="#c8a050"/>
      ))}
      {/* 유리판 */}
      <rect x="64" y="64" width="272" height="272" fill="#0a0a12"/>
      {imgUrl
        ? <image href={imgUrl} x="64" y="64" width="272" height="272" clipPath="url(#frameImgClip)" preserveAspectRatio="xMidYMid slice"/>
        : <text x="200" y="200" textAnchor="middle" fontSize="120" dominantBaseline="middle">{petEmoji}</text>}
      {/* 유리 반사 */}
      <rect x="64" y="64" width="272" height="272" fill="url(#frameInner)" opacity=".04"/>
      <path d="M64,64 L200,64 L64,200Z" fill="#ffffff" opacity=".05"/>
    </svg>
  );
}

function PhoneSVG({ color, imgUrl, petEmoji }) {
  return (
    <svg viewBox="0 0 260 420" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 10px 28px rgba(0,0,0,0.22))'}}>
      <defs>
        <linearGradient id="phoneGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.2"/>
          <stop offset="30%" stopColor="#000" stopOpacity="0"/>
          <stop offset="70%" stopColor="#000" stopOpacity="0"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.18"/>
        </linearGradient>
        <clipPath id="phoneImgClip"><rect x="72" y="130" width="116" height="116" rx="10"/></clipPath>
      </defs>
      {/* 케이스 몸통 */}
      <rect x="16" y="12" width="228" height="396" rx="32" fill={color} stroke="#00000030" strokeWidth="2"/>
      <rect x="16" y="12" width="228" height="396" rx="32" fill="url(#phoneGrad)"/>
      {/* 카메라 섬 */}
      <rect x="72" y="28" width="116" height="52" rx="16" fill="#00000025"/>
      <circle cx="104" cy="54" r="14" fill="#1a1a2a"/>
      <circle cx="104" cy="54" r="10" fill="#0d0d1a"/>
      <circle cx="104" cy="54" r="5" fill="#2a3a5a"/>
      <circle cx="100" cy="50" r="2" fill="#ffffff" opacity=".5"/>
      <circle cx="136" cy="54" r="10" fill="#1a1a2a"/>
      <circle cx="136" cy="54" r="6" fill="#0d0d1a"/>
      <circle cx="160" cy="44" r="5" fill="#1a1a2a"/>
      {/* 화면 영역 */}
      <rect x="28" y="100" width="204" height="300" rx="8" fill="#0a0a14" opacity=".85"/>
      {/* NFT 이미지 */}
      {imgUrl
        ? <><image href={imgUrl} x="72" y="130" width="116" height="116" clipPath="url(#phoneImgClip)" preserveAspectRatio="xMidYMid slice"/><rect x="72" y="130" width="116" height="116" rx="10" fill="none" stroke="#ffffff20" strokeWidth="1.5"/></>
        : <text x="130" y="196" textAnchor="middle" fontSize="64" dominantBaseline="middle">{petEmoji}</text>}
      {/* 홈바 */}
      <rect x="96" y="374" width="68" height="5" rx="3" fill="#ffffff" opacity=".3"/>
      {/* 사이드 버튼 */}
      <rect x="10" y="120" width="6" height="44" rx="3" fill="#00000030"/>
      <rect x="244" y="106" width="6" height="32" rx="3" fill="#00000030"/>
    </svg>
  );
}

function BagSVG({ color, imgUrl, petEmoji }) {
  const isDark = color === '#1e2d4a';
  return (
    <svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.18))'}}>
      <defs>
        <linearGradient id="bagGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1"/>
        </linearGradient>
        <clipPath id="bagImgClip"><rect x="125" y="160" width="150" height="150" rx="12"/></clipPath>
      </defs>
      {/* 손잡이 왼쪽 */}
      <path d="M138,82 Q130,28 168,20 Q206,12 212,82" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"/>
      <path d="M138,82 Q130,28 168,20 Q206,12 212,82" fill="none" stroke={isDark?"#ffffff18":"#00000015"} strokeWidth="4"/>
      {/* 손잡이 오른쪽 */}
      <path d="M188,82 Q182,28 220,20 Q258,12 262,82" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"/>
      <path d="M188,82 Q182,28 220,20 Q258,12 262,82" fill="none" stroke={isDark?"#ffffff18":"#00000015"} strokeWidth="4"/>
      {/* 가방 몸통 */}
      <rect x="48" y="82" width="304" height="330" rx="16" fill={color} stroke="#00000020" strokeWidth="1.5"/>
      <rect x="48" y="82" width="304" height="330" rx="16" fill="url(#bagGrad)"/>
      {/* 상단 접힌 부분 */}
      <rect x="48" y="82" width="304" height="42" rx="16" fill="#00000018"/>
      <line x1="48" y1="124" x2="352" y2="124" stroke="#00000022" strokeWidth="1.5"/>
      {/* 중앙선 */}
      <line x1="200" y1="124" x2="200" y2="412" stroke="#00000015" strokeWidth="1" strokeDasharray="8,10"/>
      {/* NFT 이미지 */}
      {imgUrl
        ? <><image href={imgUrl} x="125" y="160" width="150" height="150" clipPath="url(#bagImgClip)" preserveAspectRatio="xMidYMid slice"/><rect x="125" y="160" width="150" height="150" rx="12" fill="none" stroke={isDark?"#ffffff25":"#00000020"} strokeWidth="1.5"/></>
        : <text x="200" y="244" textAnchor="middle" fontSize="80" dominantBaseline="middle">{petEmoji}</text>}
      {/* 하단 */}
      <rect x="48" y="378" width="304" height="34" rx="16" fill="#00000012"/>
    </svg>
  );
}

/* ─────────────────────────── GOODS PAGE ─────────────────────────── */
function GoodsPage({ state, getGoodsPreview, showToast, setPage }) {
  const [selectedGoods, setSelectedGoods] = useState(0);
  const [selectedDesign, setSelectedDesign] = useState(0);
  const [qty, setQty] = useState(1);
  const [preview, setPreview] = useState(null);
  const [selectedNftIdx, setSelectedNftIdx] = useState(0);
  const [orderModal, setOrderModal] = useState(false);
  const [orderTab, setOrderTab] = useState('form');
  const [orders, setOrders] = useState([]);
  const [address, setAddress] = useState({ name:'', phone:'', zip:'', addr1:'', addr2:'' });

  const EMOJI = { '강아지':'🐶', '고양이':'🐱', '토끼':'🐰', '햄스터':'🐹' };
  const petEmoji = EMOJI[state.profile?.pet?.species] || '🐾';
  const nfts = state.profile?.nfts || [];
  const selectedNft = nfts[selectedNftIdx] || null;
  const nftBg = ['linear-gradient(135deg,#1e1a2e,#2a1a3e)','linear-gradient(135deg,#0f2027,#203a43)','linear-gradient(135deg,#1a2a1a,#2a3a1e)'];
  const nftImg = selectedNft?.nftImageUrl || state.profile?.pet?.imageUrl || null;
  const species = state.profile?.pet?.species || '강아지';

  useEffect(() => {
    if (state.connected) getGoodsPreview().then(setPreview).catch(() => {});
  }, [state.connected, state.tokenState.hasNft]);
  useEffect(() => {
    if (selectedNftIdx >= nfts.length && nfts.length > 0) setSelectedNftIdx(0);
  }, [nfts.length]);

  const canPreview = preview?.enabled ?? false;

  const catalog = [
    {
      id:'tshirt', name:'반팔 티셔츠', price:35000, badge:'POPULAR', desc:'순면 20수 · 남녀공용',
      designs:[{name:'화이트',color:'#f5f5f5'},{name:'블랙',color:'#1c1c1c'},{name:'네이비',color:'#1a2f5a'},{name:'그레이',color:'#9e9ea8'}]
    },
    {
      id:'longsleeves', name:'긴팔 티셔츠', price:42000, badge:null, desc:'순면 30수 · 세미오버핏',
      designs:[{name:'화이트',color:'#f5f5f5'},{name:'블랙',color:'#1c1c1c'},{name:'버건디',color:'#5c1a2e'}]
    },
    {
      id:'hoodie', name:'후드 집업', price:68000, badge:'NEW', desc:'기모 안감 · 루즈핏',
      designs:[{name:'차콜',color:'#2c2c2c'},{name:'크림',color:'#f0ead8'},{name:'인디고',color:'#1e2d5a'}]
    },
    {
      id:'doll', name:'반려동물 인형', price:52000, badge:null, desc:'봉제 인형 · 25cm',
      designs:[{name:'기본',color:''}]
    },
    {
      id:'mug', name:'머그컵', price:18000, badge:null, desc:'도자기 · 350ml · 전자레인지 가능',
      designs:[{name:'화이트',color:'#f8f8f8'},{name:'블랙',color:'#222226'},{name:'민트',color:'#a8d8c8'}]
    },
    {
      id:'frame', name:'인테리어 액자', price:34000, badge:null, desc:'원목 프레임 · A4 사이즈',
      designs:[{name:'원목',color:''}]
    },
    {
      id:'phone', name:'폰케이스', price:22000, badge:null, desc:'아이폰 15 Pro · 하드케이스',
      designs:[{name:'클리어',color:'#d8e8f8'},{name:'블랙',color:'#181820'},{name:'핑크',color:'#f8d0dc'}]
    },
    {
      id:'bag', name:'에코백', price:16000, badge:null, desc:'캔버스 · 내추럴 소재',
      designs:[{name:'베이지',color:'#e8dcc8'},{name:'네이비',color:'#1e2d4a'}]
    },
  ];

  const g = catalog[selectedGoods];
  const design = g.designs[Math.min(selectedDesign, g.designs.length - 1)];
  const totalPrice = g.price * qty;

  const renderMockup = () => {
    const props = { color: design.color, imgUrl: nftImg, petEmoji, species };
    switch(g.id) {
      case 'tshirt':      return <TshirtSVG {...props} sleeve="short"/>;
      case 'longsleeves': return <TshirtSVG {...props} sleeve="long"/>;
      case 'hoodie':      return <TshirtSVG {...props} sleeve="hoodie"/>;
      case 'doll':        return <DollSVG {...props}/>;
      case 'mug':         return <MugSVG {...props}/>;
      case 'frame':       return <FrameSVG {...props}/>;
      case 'phone':       return <PhoneSVG {...props}/>;
      case 'bag':         return <BagSVG {...props}/>;
      default:            return null;
    }
  };

  const submitOrder = () => {
    if (!address.name || !address.phone || !address.addr1) { showToast('이름, 연락처, 주소를 입력해주세요.', 'error'); return; }
    setOrders(prev => [{
      id: Date.now(), goods: g.name, design: design.name, qty, total: totalPrice,
      nftId: selectedNft?.tokenId, address: {...address}, status:'결제완료',
      orderedAt: new Date().toLocaleString('ko-KR'),
    }, ...prev]);
    setOrderModal(false);
    setAddress({ name:'', phone:'', zip:'', addr1:'', addr2:'' });
    showToast(`${g.name} ${qty}개 주문이 완료되었습니다! 🎉`);
  };

  if (!canPreview) return (
    <div className="page active">
      <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, padding:40 }}>
        <div style={{ fontSize:72, opacity:.3 }}>🛍️</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:48, letterSpacing:2, textAlign:'center' }}>NFT 홀더 전용</div>
        <p style={{ color:'var(--muted)', fontSize:15, textAlign:'center', maxWidth:380, lineHeight:1.8 }}>NFT를 보유한 멤버만 굿즈를 주문할 수 있어요.<br/>마이페이지에서 NFT를 먼저 민팅해주세요.</p>
        <button className="btn-primary" onClick={() => setPage('mypage')}>NFT 민팅하러 가기</button>
      </div>
    </div>
  );

  return (
    <div className="page active" style={{ minHeight:'calc(100vh - 64px)', background:'var(--bg)' }}>

      {/* 상단 헤더 */}
      <div style={{ borderBottom:'1px solid var(--border)', padding:'32px 64px 24px', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, textTransform:'uppercase', color:'var(--accent)', marginBottom:8 }}>NFT Holder Exclusive</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, letterSpacing:2, lineHeight:1 }}>굿즈 스토어</div>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          {orders.length > 0 && (
            <button onClick={() => { setOrderModal(true); setOrderTab('history'); }} style={{
              fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase',
              background:'transparent', color:'var(--text)', border:'1px solid var(--border)',
              padding:'10px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:8
            }}>
              📦 주문 내역 <span style={{ background:'var(--accent)', color:'#fff', borderRadius:'50%', width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>{orders.length}</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 480px', minHeight:'calc(100vh - 180px)' }}>

        {/* 왼쪽: 상품 목록 + 옵션 */}
        <div style={{ padding:'40px 48px', borderRight:'1px solid var(--border)', overflowY:'auto' }}>

          {/* NFT 선택 */}
          {nfts.length > 0 && (
            <div style={{ marginBottom:40 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, textTransform:'uppercase', color:'var(--muted)', marginBottom:14 }}>
                적용할 NFT 선택
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {nfts.map((nft, i) => (
                  <div key={nft.tokenId} onClick={() => setSelectedNftIdx(i)} style={{
                    width:76, cursor:'pointer', borderRadius:10, overflow:'hidden',
                    border: selectedNftIdx === i ? '2.5px solid var(--accent)' : '2px solid var(--border)',
                    transform: selectedNftIdx === i ? 'translateY(-4px)' : 'none',
                    boxShadow: selectedNftIdx === i ? '0 8px 24px rgba(255,107,53,.3)' : 'none',
                    transition:'all .25s', background:'var(--card)'
                  }}>
                    <div style={{ width:'100%', aspectRatio:'1', background: nftBg[i%nftBg.length], overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {nft.nftImageUrl
                        ? <img src={nft.nftImageUrl} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : state.profile?.pet?.imageUrl
                        ? <img src={state.profile.pet.imageUrl} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : <span style={{fontSize:28}}>{petEmoji}</span>}
                    </div>
                    <div style={{ padding:'5px 8px', borderTop:'1px solid var(--border)' }}>
                      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color: selectedNftIdx===i ? 'var(--accent)' : 'var(--muted)', letterSpacing:1 }}>#{nft.tokenId}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 카테고리 탭 */}
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, textTransform:'uppercase', color:'var(--muted)', marginBottom:14 }}>상품 선택</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:36 }}>
            {catalog.map((item, i) => (
              <div key={item.id} onClick={() => { setSelectedGoods(i); setSelectedDesign(0); }} style={{
                background:'var(--card)', border: selectedGoods===i ? '2px solid var(--accent)' : '2px solid var(--border)',
                borderRadius:12, padding:'16px 10px 12px', textAlign:'center', cursor:'pointer',
                transition:'all .2s', position:'relative',
                transform: selectedGoods===i ? 'translateY(-3px)' : 'none',
                boxShadow: selectedGoods===i ? '0 8px 24px rgba(255,107,53,.18)' : 'none',
              }}>
                {item.badge && <div style={{
                  position:'absolute', top:6, right:6, background: item.badge==='NEW' ? 'var(--accent2)' : 'var(--accent)',
                  color:'#fff', fontFamily:"'Space Mono',monospace", fontSize:6, letterSpacing:1, padding:'2px 5px', borderRadius:3
                }}>{item.badge}</div>}
                <div style={{ fontSize:26, marginBottom:6 }}>
                  {{'tshirt':'👕','longsleeves':'👔','hoodie':'🧥','doll':'🧸','mug':'☕','frame':'🖼️','phone':'📱','bag':'🛍️'}[item.id]}
                </div>
                <div style={{ fontSize:11, fontWeight:600, color: selectedGoods===i ? 'var(--accent)' : 'var(--text)', marginBottom:2, lineHeight:1.3 }}>{item.name}</div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:'var(--muted)' }}>₩{item.price.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* 색상/디자인 선택 */}
          {g.designs.length > 1 && (
            <div style={{ marginBottom:32 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>
                색상 / 디자인
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {g.designs.map((d, i) => (
                  <div key={i} onClick={() => setSelectedDesign(i)} style={{
                    display:'flex', alignItems:'center', gap:8, padding:'8px 16px',
                    border: selectedDesign===i ? '2px solid var(--accent)' : '2px solid var(--border)',
                    borderRadius:24, cursor:'pointer', fontSize:13, fontWeight: selectedDesign===i ? 600 : 400,
                    color: selectedDesign===i ? 'var(--accent)' : 'var(--text)',
                    background: selectedDesign===i ? 'rgba(255,107,53,.08)' : 'var(--card)',
                    transition:'all .2s'
                  }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', background:d.color, border:'1.5px solid #00000030', flexShrink:0 }}/>
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 수량 선택 */}
          <div style={{ marginBottom:32 }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>수량</div>
            <div style={{ display:'inline-flex', alignItems:'center', border:'2px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1,q-1))} style={{ width:44, height:44, background:'var(--card)', border:'none', color:'var(--text)', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .2s' }}>−</button>
              <div style={{ width:56, height:44, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Mono',monospace", fontSize:16, background:'var(--surface)', borderLeft:'1px solid var(--border)', borderRight:'1px solid var(--border)' }}>{qty}</div>
              <button onClick={() => setQty(q => Math.min(10,q+1))} style={{ width:44, height:44, background:'var(--card)', border:'none', color:'var(--text)', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .2s' }}>+</button>
            </div>
          </div>

          {/* 상품 설명 */}
          <div style={{ padding:'20px 24px', background:'var(--surface)', borderRadius:12, border:'1px solid var(--border)', marginBottom:24 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:1, marginBottom:6 }}>{g.name}</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:12 }}>{g.desc}</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['NFT 도안 인쇄','7일 내 배송','정품 보증'].map(tag => (
                <span key={tag} style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:1, padding:'4px 10px', background:'rgba(255,107,53,.1)', color:'var(--accent)', borderRadius:20 }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 미리보기 + 주문 */}
        <div style={{ position:'sticky', top:64, height:'calc(100vh - 64px)', display:'flex', flexDirection:'column', background:'var(--surface)', borderLeft:'1px solid var(--border)' }}>

          {/* 미리보기 영역 */}
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 32px 16px', background:'var(--surface)', position:'relative', overflow:'hidden' }}>
            {/* 배경 패턴 */}
            <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, var(--border) 1px, transparent 1px)', backgroundSize:'24px 24px', opacity:.4 }}/>
            <div style={{ position:'relative', zIndex:2, width:'100%', maxWidth:340, maxHeight:380, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {renderMockup()}
            </div>
            {selectedNft && (
              <div style={{ position:'absolute', top:16, right:16, zIndex:3, background:'rgba(10,10,15,.85)', border:'1px solid var(--accent)', padding:'5px 10px', fontFamily:"'Space Mono',monospace", fontSize:9, color:'var(--accent)', letterSpacing:1, backdropFilter:'blur(8px)' }}>
                NFT #{selectedNft.tokenId}
              </div>
            )}
          </div>

          {/* 하단 주문 패널 */}
          <div style={{ padding:'20px 28px 28px', borderTop:'1px solid var(--border)', background:'var(--card)' }}>
            {/* 썸네일 + 이름 */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{ width:52, height:52, borderRadius:8, overflow:'hidden', background:'var(--surface)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {nftImg ? <img src={nftImg} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:24}}>{petEmoji}</span>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:15, marginBottom:2 }}>{g.name}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{design.name !== '기본' ? design.name : g.desc}</div>
              </div>
            </div>
            {/* 가격 */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:13, color:'var(--muted)' }}>수량 {qty}개</span>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color:'var(--accent)', letterSpacing:1 }}>₩{totalPrice.toLocaleString()}</span>
            </div>
            {/* 주문 버튼 */}
            <button onClick={() => { setOrderModal(true); setOrderTab('form'); }} style={{
              width:'100%', padding:'16px', fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:3,
              textTransform:'uppercase', background:'var(--accent)', color:'#fff', border:'none',
              cursor:'pointer', transition:'all .2s', borderRadius:4,
              clipPath:'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)'
            }}
            onMouseEnter={e=>e.currentTarget.style.background='#ff8555'}
            onMouseLeave={e=>e.currentTarget.style.background='var(--accent)'}
            >주문하기</button>
            <div style={{ display:'flex', gap:8, marginTop:10, justifyContent:'center' }}>
              {['🔒 안전결제','📦 무료배송','✅ NFT 인증'].map(t => (
                <span key={t} style={{ fontSize:10, color:'var(--muted)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 주문 모달 */}
      <div className={`modal-overlay${orderModal ? ' open' : ''}`} onClick={() => setOrderModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ width:560, maxWidth:'95vw' }}>
          <button className="modal-close" onClick={() => setOrderModal(false)}>✕</button>
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:28 }}>
            {[['form','배송지 입력'],['history',`주문 내역 (${orders.length})`]].map(([tab,label]) => (
              <button key={tab} onClick={() => setOrderTab(tab)} style={{
                flex:1, padding:'14px', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:1, textTransform:'uppercase',
                background:'none', border:'none', cursor:'pointer', transition:'all .2s',
                borderBottom: orderTab===tab ? '2px solid var(--accent)' : '2px solid transparent',
                color: orderTab===tab ? 'var(--accent)' : 'var(--muted)',
              }}>{label}</button>
            ))}
          </div>

          {orderTab === 'form' ? (<>
            <div style={{ display:'flex', gap:14, marginBottom:24, padding:'16px', background:'var(--surface)', borderRadius:10, border:'1px solid var(--border)' }}>
              <div style={{ width:60, height:60, borderRadius:8, overflow:'hidden', flexShrink:0, background:'var(--card)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {nftImg ? <img src={nftImg} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:28}}>{petEmoji}</span>}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:15 }}>{g.name} <span style={{ color:'var(--muted)', fontSize:12, fontWeight:400 }}>({design.name})</span></div>
                <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>수량 {qty}개</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'var(--accent)', letterSpacing:1, marginTop:4 }}>₩{totalPrice.toLocaleString()}</div>
              </div>
            </div>
            {[
              {key:'name', label:'수령인', placeholder:'홍길동'},
              {key:'phone', label:'연락처', placeholder:'010-0000-0000'},
              {key:'zip', label:'우편번호', placeholder:'12345 (선택)'},
              {key:'addr1', label:'주소', placeholder:'서울시 강남구 테헤란로 123'},
              {key:'addr2', label:'상세주소', placeholder:'101동 202호 (선택)'},
            ].map(({key,label,placeholder}) => (
              <div key={key} style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>{label}</div>
                <input className="form-input" style={{ borderRadius:6 }} placeholder={placeholder} value={address[key]} onChange={e => setAddress(a => ({...a,[key]:e.target.value}))}/>
              </div>
            ))}
            <button className="btn-modal-mint" style={{ marginTop:8, borderRadius:4 }} onClick={submitOrder}>주문 확정하기 →</button>
          </>) : (<>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, marginBottom:20 }}>주문 내역</div>
            {orders.length === 0
              ? <div style={{ textAlign:'center', padding:'48px 0', color:'var(--muted)', fontSize:14 }}>아직 주문 내역이 없어요.</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:12, maxHeight:440, overflowY:'auto' }}>
                  {orders.map(o => (
                    <div key={o.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'18px 20px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                        <div style={{ fontWeight:600, fontSize:15 }}>{o.goods} <span style={{ fontSize:12, color:'var(--muted)', fontWeight:400 }}>({o.design})</span></div>
                        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, padding:'4px 12px', borderRadius:20, background:'rgba(255,107,53,.12)', color:'var(--accent)' }}>{o.status}</span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'6px 16px', fontSize:12 }}>
                        <span style={{ color:'var(--muted)' }}>수량</span><span>{o.qty}개</span>
                        <span style={{ color:'var(--muted)' }}>결제금액</span><span style={{ color:'var(--accent)', fontWeight:600 }}>₩{o.total.toLocaleString()}</span>
                        <span style={{ color:'var(--muted)' }}>NFT</span><span>#{o.nftId}</span>
                        <span style={{ color:'var(--muted)' }}>수령인</span><span>{o.address.name} · {o.address.phone}</span>
                        <span style={{ color:'var(--muted)' }}>배송지</span><span>{o.address.addr1} {o.address.addr2}</span>
                        <span style={{ color:'var(--muted)' }}>주문일</span><span>{o.orderedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </>)}
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────── VET APPROVAL POPUP ─────────────────────────── */
function VetApprovalPopup({ requests, onRespond }) {
  const [responding, setResponding] = useState(false);
  const req = requests[0];
  if (!req) return null;

  const handle = async (approved) => {
    setResponding(true);
    await onRespond(req.id, req.ownerAddress, approved);
    setResponding(false);
  };

  return (
    <div className="modal-overlay open" style={{ zIndex: 600 }}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
          <div className="modal-title" style={{ fontSize: 28 }}>진료 권한 요청</div>
          <div className="modal-sub">병원에서 반려동물 진료 기록 접근 권한을 요청했습니다.</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 20, marginBottom: 20, borderRadius: 8 }}>
          {[
            ['병원명', req.vetName || '—'],
            ['병원 지갑', req.vetAddress ? req.vetAddress.slice(0, 10) + '...' + req.vetAddress.slice(-6) : '—'],
            ['반려동물 SBT ID', `#${req.petSbtId}`],
            ['요청 메시지', req.message || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, borderRadius: 6 }}>
          💡 승인 시 해당 병원이 진료 기록을 열람하고 추가할 수 있습니다.<br />
          <strong style={{ color: 'var(--accent2)' }}>수수료는 병원이 부담합니다.</strong> 별도 비용이 발생하지 않습니다.
        </div>

        {requests.length > 1 && (
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginBottom: 12 }}>
            대기 중인 요청 {requests.length}건 중 1번째
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => handle(false)}
            disabled={responding}
            style={{ flex: 1, padding: 14, fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', transition: 'all .2s', opacity: responding ? 0.5 : 1 }}>
            거절
          </button>
          <button
            onClick={() => handle(true)}
            disabled={responding}
            className="btn-modal-mint"
            style={{ flex: 2 }}>
            {responding ? '처리 중...' : '✅ 승인하기'}
          </button>
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
  const [vetRequests, setVetRequests] = useState([]);
  const toastTimer = useRef(null);
  const sseRef = useRef(null);

  const { state, connectWallet, disconnectWallet, registerPet, issueSbt, issueNft, getMyPage, getGoodsPreview, setActivePetId } = usePetServiceApp();

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

  // SSE: 병원 권한 요청 실시간 수신
  useEffect(() => {
    if (!state.account) {
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
      setVetRequests([]);
      return;
    }
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
    const es = new EventSource(`${API_BASE}/notifications/${state.account}`, { withCredentials: true });
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'VET_APPROVAL_REQUEST') {
          setVetRequests(prev => prev.find(r => r.id === data.id) ? prev : [...prev, data]);
          showToastRef.current('🏥 병원에서 진료 권한을 요청했습니다!');
        }
      } catch (_) {}
    };
    es.onerror = () => {};
    return () => { es.close(); sseRef.current = null; };
  }, [state.account]);

  const showToastRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, message, type });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }, []);

  // ref를 통해 SSE 핸들러에서도 showToast 사용 가능
  showToastRef.current = showToast;

  const respondApproval = useCallback(async (approvalId, ownerAddress, approved) => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
    try {
      const res = await fetch(`${API_BASE}/vet/respond-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approvalId, ownerAddress, approved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '오류가 발생했습니다.');
      setVetRequests(prev => prev.filter(r => r.id !== approvalId));
      showToast(approved ? `✅ ${data.approval?.vetName || '병원'} 진료 권한을 승인했습니다.` : '거절했습니다.', approved ? 'success' : 'error');
    } catch (e) {
      showToast(e.message || '응답 처리 중 오류가 발생했습니다.', 'error');
    }
  }, [showToast]);

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
        setActivePetId={setActivePetId}
      />
      <Toast toast={toast} />
      {vetRequests.length > 0 && (
        <VetApprovalPopup requests={vetRequests} onRespond={respondApproval} />
      )}
    </>
  );
}
