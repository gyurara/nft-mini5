import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./api";
import {
  WEB3_NETWORK_LABEL,
  connectWalletSession,
  getConnectedWalletAccount,
  mintMemoryNftOnChain,
  mintPetSbtOnChain,
} from "./web3";

/* ─── CSS ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap');

  :root {
    --accent:#ff6b35; --accent2:#7c3aed; --accent3:#10b981; --gold:#f59e0b;
    --bg:#0a0a0f; --surface:#111118; --card:#16161f; --border:#2a2a3a;
    --text:#e8e8f0; --muted:#6b6b85; --nav-bg:rgba(10,10,15,0.88);
    --input-bg:#16161f; --shadow:rgba(0,0,0,0.5);
  }
  .light {
    --bg:#f5f4f0; --surface:#eeecea; --card:#ffffff; --border:#d8d5cf;
    --text:#1a1a26; --muted:#8a8a9a; --nav-bg:rgba(245,244,240,0.92);
    --input-bg:#ffffff; --shadow:rgba(0,0,0,0.12);
  }

  * { margin:0; padding:0; box-sizing:border-box; }
  .pawchain-root {
    background:var(--bg); color:var(--text);
    font-family:'Noto Sans KR',sans-serif;
    min-height:100vh; overflow-x:hidden;
    transition:background .35s, color .35s;
  }

  /* NAV */
  .pc-nav {
    position:sticky; top:0; z-index:200;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 40px; height:64px;
    background:var(--nav-bg); backdrop-filter:blur(16px);
    border-bottom:1px solid var(--border);
  }
  .pc-logo { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:4px; color:var(--accent); cursor:pointer; }
  .pc-logo span { color:var(--text); }
  .pc-nav-links { display:flex; gap:20px; align-items:center; }
  .pc-nav-links a {
    font-family:'Space Mono',monospace; font-size:10px;
    letter-spacing:2px; text-transform:uppercase; color:var(--muted);
    text-decoration:none; cursor:pointer; transition:color .2s;
  }
  .pc-nav-links a:hover, .pc-nav-links a.active { color:var(--text); }
  .pc-nav-right { display:flex; gap:12px; align-items:center; }
  .pc-theme-wrap { display:flex; align-items:center; gap:6px; }
  .pc-theme-lbl { font-family:'Space Mono',monospace; font-size:10px; color:var(--muted); }
  .pc-theme-toggle {
    width:44px; height:24px; border-radius:12px;
    background:var(--border); border:none; cursor:pointer;
    position:relative; transition:background .3s; flex-shrink:0;
  }
  .pc-theme-toggle::after {
    content:''; position:absolute; top:3px; left:3px;
    width:18px; height:18px; border-radius:50%;
    background:var(--accent); transition:transform .3s;
  }
  .light .pc-theme-toggle::after { transform:translateX(20px); }
  .pc-btn-connect {
    font-family:'Space Mono',monospace; font-size:11px;
    letter-spacing:2px; text-transform:uppercase;
    background:var(--accent); color:#fff; border:none;
    padding:10px 22px; cursor:pointer;
    clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
    transition:all .2s;
  }
  .pc-btn-connect:hover { background:#ff8555; }
  .pc-btn-connect.connected { background:var(--accent3); }

  /* PAGE */
  .pc-page { display:none; position:relative; z-index:1; }
  .pc-page.active { display:block; }

  /* HERO */
  .pc-hero {
    min-height:calc(100vh - 64px);
    display:grid; grid-template-columns:1fr 1fr;
    overflow:hidden;
  }
  .pc-hero-left {
    display:flex; flex-direction:column; justify-content:center;
    padding:80px 60px 80px 80px;
  }
  .pc-hero-tag {
    display:inline-flex; align-items:center; gap:8px;
    font-family:'Space Mono',monospace; font-size:11px;
    letter-spacing:3px; text-transform:uppercase; color:var(--accent);
    margin-bottom:32px;
  }
  .pc-hero-tag::before { content:''; width:24px; height:1px; background:var(--accent); }
  .pc-hero-h1 {
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(72px,8vw,120px); line-height:.92;
    letter-spacing:2px; margin-bottom:32px;
  }
  .pc-hero-h1 em { color:var(--accent); font-style:normal; }
  .pc-hero-sub { font-size:15px; line-height:1.8; color:var(--muted); max-width:440px; margin-bottom:48px; }
  .pc-hero-ctas { display:flex; gap:16px; align-items:center; }
  .pc-btn-primary {
    font-family:'Space Mono',monospace; font-size:12px;
    letter-spacing:2px; text-transform:uppercase;
    background:var(--accent); color:#fff; border:none;
    padding:16px 36px; cursor:pointer;
    clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
    transition:all .2s;
  }
  .pc-btn-primary:hover { background:#ff8555; transform:translateY(-2px); box-shadow:0 12px 40px rgba(255,107,53,.3); }
  .pc-btn-outline {
    font-family:'Space Mono',monospace; font-size:12px;
    letter-spacing:2px; text-transform:uppercase;
    background:transparent; color:var(--text);
    border:1px solid var(--border); padding:16px 36px; cursor:pointer;
    transition:all .2s;
  }
  .pc-btn-outline:hover { border-color:var(--text); }
  .pc-hero-right {
    position:relative; background:var(--surface);
    display:flex; align-items:center; justify-content:center;
    border-left:1px solid var(--border); overflow:hidden;
  }
  .pc-hero-right::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse at 60% 40%,rgba(124,58,237,.15) 0%,transparent 70%),
               radial-gradient(ellipse at 30% 70%,rgba(255,107,53,.1) 0%,transparent 60%);
  }
  .pc-floating-card {
    position:relative; z-index:2;
    background:var(--card); border:1px solid var(--border);
    width:300px; padding:24px;
    animation:pc-float 4s ease-in-out infinite;
  }
  @keyframes pc-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  .pc-sbt-tag {
    position:absolute; top:16px; right:16px;
    background:var(--accent2); color:#fff;
    font-family:'Space Mono',monospace; font-size:9px;
    letter-spacing:1px; padding:4px 8px; text-transform:uppercase;
  }
  .pc-card-badge {
    display:inline-block;
    font-family:'Space Mono',monospace; font-size:9px; letter-spacing:2px;
    background:rgba(255,107,53,.15); color:var(--accent);
    padding:4px 10px; margin-bottom:16px; text-transform:uppercase;
  }
  .pc-card-pet-img {
    width:100%; aspect-ratio:1;
    background:linear-gradient(135deg,#1e1e2e,#2a1a3e);
    display:flex; align-items:center; justify-content:center;
    font-size:80px; margin-bottom:16px;
  }
  .pc-card-name { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:2px; }
  .pc-card-meta {
    display:flex; justify-content:space-between; align-items:center;
    margin-top:8px; padding-top:12px; border-top:1px solid var(--border);
  }
  .pc-card-meta-label { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
  .pc-card-meta-val { font-family:'Space Mono',monospace; font-size:12px; color:var(--accent3); }

  /* STATS */
  .pc-stats-bar {
    background:var(--surface); border-top:1px solid var(--border);
    border-bottom:1px solid var(--border);
    display:grid; grid-template-columns:repeat(4,1fr);
  }
  .pc-stat-item { padding:28px 40px; border-right:1px solid var(--border); }
  .pc-stat-item:last-child { border-right:none; }
  .pc-stat-num { font-family:'Bebas Neue',sans-serif; font-size:42px; color:var(--accent); letter-spacing:2px; }
  .pc-stat-label { font-family:'Space Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:2px; text-transform:uppercase; margin-top:4px; }

  /* SECTION */
  .pc-section { padding:100px 80px; }
  .pc-section.surface-bg { background:var(--surface); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
  .pc-section-tag {
    font-family:'Space Mono',monospace; font-size:10px;
    letter-spacing:3px; text-transform:uppercase;
    color:var(--accent); margin-bottom:16px;
    display:flex; align-items:center; gap:12px;
  }
  .pc-section-tag::after { content:''; flex:1; height:1px; background:var(--border); max-width:60px; }
  .pc-section-h2 { font-family:'Bebas Neue',sans-serif; font-size:clamp(48px,5vw,72px); letter-spacing:2px; margin-bottom:16px; }
  .pc-section-sub { color:var(--muted); font-size:15px; line-height:1.8; max-width:520px; margin-bottom:60px; }

  .pc-flow-steps { display:flex; gap:0; overflow-x:auto; padding-bottom:16px; }
  .pc-flow-step {
    flex:0 0 auto; width:190px; background:var(--card);
    border:1px solid var(--border); padding:28px 22px; position:relative;
  }
  .pc-flow-step:not(:last-child)::after {
    content:'→'; position:absolute; right:-14px; top:50%;
    transform:translateY(-50%); color:var(--accent); font-size:18px; z-index:2;
  }
  .pc-flow-num { font-family:'Bebas Neue',sans-serif; font-size:48px; color:var(--border); line-height:1; margin-bottom:12px; }
  .pc-flow-icon { font-size:24px; margin-bottom:10px; }
  .pc-flow-name { font-size:14px; font-weight:500; margin-bottom:4px; }
  .pc-flow-desc { font-size:12px; color:var(--muted); }

  .pc-bm-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
  .pc-bm-card {
    background:var(--card); border:1px solid var(--border);
    padding:32px 28px; position:relative; overflow:hidden; transition:border-color .2s;
  }
  .pc-bm-card:hover { border-color:var(--accent); }
  .pc-bm-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
  .pc-bm-card:nth-child(1)::before { background:var(--accent); }
  .pc-bm-card:nth-child(2)::before { background:var(--accent2); }
  .pc-bm-card:nth-child(3)::before { background:var(--accent3); }
  .pc-bm-num { font-family:'Bebas Neue',sans-serif; font-size:64px; opacity:.08; position:absolute; top:16px; right:20px; line-height:1; }
  .pc-bm-icon { font-size:32px; margin-bottom:20px; }
  .pc-bm-title { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:1px; margin-bottom:8px; }
  .pc-bm-desc { font-size:14px; color:var(--muted); line-height:1.7; }

  /* REGISTER */
  .pc-register-layout { display:grid; grid-template-columns:1fr 1fr; gap:60px; padding:80px; }
  .pc-form-title { font-family:'Bebas Neue',sans-serif; font-size:52px; letter-spacing:2px; margin-bottom:8px; }
  .pc-form-sub { color:var(--muted); font-size:14px; margin-bottom:40px; line-height:1.7; }
  .pc-form-group { margin-bottom:24px; }
  .pc-form-label {
    display:block; font-family:'Space Mono',monospace; font-size:10px;
    letter-spacing:2px; text-transform:uppercase; color:var(--muted); margin-bottom:8px;
  }
  .pc-form-input, .pc-form-select {
    width:100%; background:var(--input-bg); border:1px solid var(--border);
    color:var(--text); padding:14px 18px;
    font-family:'Noto Sans KR',sans-serif; font-size:14px;
    outline:none; transition:border-color .2s; appearance:none;
  }
  .pc-form-input[type="date"] { appearance:auto; cursor:pointer; }
  .pc-form-input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity:0.85;
    cursor:pointer;
  }
  .pc-form-input:focus, .pc-form-select:focus { border-color:var(--accent); }
  .pc-form-input::placeholder { color:var(--muted); }
  .pc-form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .pc-upload-area {
    border:1px dashed var(--border); background:var(--card);
    padding:40px; text-align:center; cursor:pointer; transition:all .2s;
  }
  .pc-upload-area:hover { border-color:var(--accent); background:rgba(255,107,53,.05); }
  .pc-upload-icon { font-size:36px; margin-bottom:12px; }
  .pc-upload-text { font-size:14px; color:var(--muted); }
  .pc-upload-text strong { color:var(--accent); }
  .pc-btn-full {
    width:100%; padding:18px;
    font-family:'Space Mono',monospace; font-size:12px;
    letter-spacing:3px; text-transform:uppercase;
    background:var(--accent); color:#fff; border:none; cursor:pointer;
    transition:all .2s; margin-top:8px;
    clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
  }
  .pc-btn-full:hover { background:#ff8555; box-shadow:0 16px 48px rgba(255,107,53,.3); }
  .pc-preview-section { position:sticky; top:80px; }
  .pc-preview-label { font-family:'Space Mono',monospace; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:var(--muted); margin-bottom:24px; }
  .pc-preview-card { background:var(--card); border:1px solid var(--border); padding:32px; position:relative; }
  .pc-preview-card::before {
    content:'SBT'; position:absolute; top:16px; right:16px;
    background:var(--accent2); color:#fff;
    font-family:'Space Mono',monospace; font-size:9px; letter-spacing:1px; padding:4px 8px;
  }
  .pc-preview-img {
    width:100%; aspect-ratio:1;
    background:linear-gradient(135deg,#1e1e2e,#2a1a3e);
    display:flex; align-items:center; justify-content:center;
    font-size:100px; margin-bottom:24px; position:relative; overflow:hidden;
  }
  .pc-preview-name { font-family:'Bebas Neue',sans-serif; font-size:36px; letter-spacing:2px; margin-bottom:4px; }
  .pc-preview-breed { font-size:13px; color:var(--muted); margin-bottom:20px; }
  .pc-preview-rows { display:flex; flex-direction:column; gap:12px; }
  .pc-preview-row {
    display:flex; justify-content:space-between; padding-bottom:12px;
    border-bottom:1px solid var(--border); font-size:13px;
  }
  .pc-preview-row:last-child { border-bottom:none; padding-bottom:0; }
  .pc-preview-row-key { color:var(--muted); font-family:'Space Mono',monospace; font-size:10px; letter-spacing:1px; text-transform:uppercase; }
  .pc-chain-badge {
    margin-top:20px; padding:12px 16px;
    background:rgba(124,58,237,.1); border:1px solid rgba(124,58,237,.3);
    display:flex; align-items:center; gap:10px;
  }
  .pc-chain-dot { width:8px; height:8px; border-radius:50%; background:var(--accent2); animation:pc-pulse 1.5s ease-in-out infinite; }
  @keyframes pc-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
  .pc-chain-text { font-family:'Space Mono',monospace; font-size:10px; color:var(--accent2); letter-spacing:1px; }

  /* MYPAGE */
  .pc-mypage-layout { padding:60px 80px; }
  .pc-mypage-header {
    display:flex; justify-content:space-between; align-items:flex-end;
    margin-bottom:48px; padding-bottom:32px; border-bottom:1px solid var(--border);
  }
  .pc-wallet-label { font-family:'Space Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:2px; text-transform:uppercase; margin-bottom:6px; }
  .pc-wallet-addr { font-family:'Space Mono',monospace; font-size:14px; color:var(--accent3); }
  .pc-mypage-grid { display:grid; grid-template-columns:320px 1fr; gap:40px; }
  .pc-pet-card-main {
    background:var(--card); border:1px solid var(--border);
    padding:28px; position:sticky; top:80px; height:fit-content;
  }
  .pc-pet-card-main-img {
    width:100%; aspect-ratio:1;
    background:linear-gradient(135deg,#1a1a2e,#16213e);
    display:flex; align-items:center; justify-content:center;
    font-size:80px; position:relative; margin-bottom:24px; overflow:hidden;
  }
  .pc-verified-badge {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(16,185,129,.15); color:var(--accent3);
    font-family:'Space Mono',monospace; font-size:9px;
    letter-spacing:1px; padding:5px 10px; margin-bottom:12px; text-transform:uppercase;
  }
  .pc-pet-main-name { font-family:'Bebas Neue',sans-serif; font-size:40px; letter-spacing:2px; }
  .pc-pet-main-breed { font-size:13px; color:var(--muted); margin-bottom:20px; }
  .pc-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; }
  .pc-info-cell { background:var(--surface); padding:12px 14px; }
  .pc-info-cell-key { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
  .pc-info-cell-val { font-size:13px; }
  .pc-sbt-block {
    padding:14px 16px; background:rgba(124,58,237,.08);
    border:1px solid rgba(124,58,237,.25);
    display:flex; align-items:center; gap:12px; margin-bottom:16px;
  }
  .pc-sbt-icon { font-size:20px; }
  .pc-sbt-info-label { font-family:'Space Mono',monospace; font-size:9px; color:var(--accent2); letter-spacing:1px; text-transform:uppercase; }
  .pc-sbt-info-val { font-size:12px; color:var(--muted); margin-top:2px; }
  .pc-holder-section { margin-top:16px; padding:20px; background:var(--surface); border:1px solid var(--border); }
  .pc-holder-title {
    font-family:'Space Mono',monospace; font-size:10px; letter-spacing:3px;
    text-transform:uppercase; color:var(--gold); margin-bottom:14px;
    display:flex; align-items:center; gap:8px;
  }
  .pc-holder-title::before { content:'★'; }
  .pc-holder-features { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .pc-holder-feat {
    background:var(--card); border:1px solid var(--border);
    padding:14px; cursor:pointer; transition:all .2s; position:relative; overflow:hidden;
  }
  .pc-holder-feat:hover { border-color:var(--gold); }
  .pc-holder-feat-icon { font-size:20px; margin-bottom:6px; }
  .pc-holder-feat-name { font-size:13px; font-weight:500; margin-bottom:2px; }
  .pc-holder-feat-desc { font-size:11px; color:var(--muted); }
  .pc-lock-overlay {
    display:flex; position:absolute; inset:0;
    background:rgba(10,10,15,.88); align-items:center; justify-content:center;
    font-family:'Space Mono',monospace; font-size:10px;
    color:var(--muted); letter-spacing:1px; flex-direction:column; gap:4px;
  }
  .pc-nft-section-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; }
  .pc-nft-section-title { font-family:'Bebas Neue',sans-serif; font-size:36px; letter-spacing:2px; }
  .pc-btn-mint {
    font-family:'Space Mono',monospace; font-size:11px; letter-spacing:2px;
    text-transform:uppercase; background:var(--accent); color:#fff;
    border:none; padding:12px 24px; cursor:pointer;
    clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
    transition:all .2s;
  }
  .pc-btn-mint:hover { background:#ff8555; }
  .pc-nft-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .pc-nft-item {
    background:var(--card); border:1px solid var(--border);
    overflow:hidden; transition:all .25s; cursor:pointer;
  }
  .pc-nft-item:hover { border-color:var(--accent); transform:translateY(-4px); box-shadow:0 20px 40px var(--shadow); }
  .pc-nft-item-img {
    width:100%; aspect-ratio:1;
    display:flex; align-items:center; justify-content:center;
    font-size:56px; position:relative; overflow:hidden;
  }
  .pc-nft-type-badge {
    position:absolute; top:8px; left:8px;
    font-family:'Space Mono',monospace; font-size:8px;
    letter-spacing:1px; padding:4px 8px; text-transform:uppercase;
  }
  .badge-birthday { background:rgba(245,158,11,.2); color:var(--gold); }
  .badge-adoption { background:rgba(16,185,129,.2); color:var(--accent3); }
  .badge-limited  { background:rgba(255,107,53,.2);  color:var(--accent); }
  .pc-nft-item-body { padding:16px; }
  .pc-nft-item-name { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:1px; margin-bottom:4px; }
  .pc-nft-item-meta { display:flex; justify-content:space-between; align-items:center; }
  .pc-nft-item-edition { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:1px; }
  .pc-nft-item-num { font-family:'Space Mono',monospace; font-size:10px; color:var(--accent); }

  /* HOLDER */
  .pc-gate-banner {
    background:linear-gradient(135deg,rgba(124,58,237,.15),rgba(255,107,53,.1));
    border-bottom:1px solid var(--border);
    padding:28px 80px; display:flex; align-items:center; justify-content:space-between; gap:24px;
  }
  .pc-gate-left { display:flex; align-items:center; gap:20px; }
  .pc-gate-nft-thumb {
    width:56px; height:56px;
    background:linear-gradient(135deg,#1a1226,#2d1f3d);
    display:flex; align-items:center; justify-content:center;
    font-size:28px; border:1px solid var(--accent2); flex-shrink:0;
  }
  .pc-gate-info-label { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:2px; text-transform:uppercase; }
  .pc-gate-info-val { font-size:15px; font-weight:500; margin-top:3px; }
  .pc-gate-right { display:flex; gap:12px; align-items:center; }
  .pc-gate-badge {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(16,185,129,.12); border:1px solid rgba(16,185,129,.3);
    color:var(--accent3); padding:8px 16px;
    font-family:'Space Mono',monospace; font-size:10px; letter-spacing:1px; text-transform:uppercase;
  }
  .pc-gate-count { font-family:'Bebas Neue',sans-serif; font-size:36px; color:var(--accent); letter-spacing:2px; }
  .pc-gate-count-label { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; margin-top:2px; }
  .pc-holder-tabs {
    display:flex; border-bottom:1px solid var(--border);
    background:var(--surface); padding:0 80px;
  }
  .pc-holder-tab {
    font-family:'Space Mono',monospace; font-size:11px;
    letter-spacing:2px; text-transform:uppercase; color:var(--muted);
    padding:18px 22px; cursor:pointer; border:none; background:none;
    border-bottom:2px solid transparent; transition:all .2s; margin-bottom:-1px;
  }
  .pc-holder-tab:hover { color:var(--text); }
  .pc-holder-tab.active { color:var(--accent); border-bottom-color:var(--accent); }
  .pc-holder-tab-content { display:none; padding:60px 80px; }
  .pc-holder-tab-content.active { display:block; }
  .pc-verify-layout { display:grid; grid-template-columns:1fr 1fr; gap:48px; }
  .pc-verify-card { background:var(--card); border:1px solid var(--border); padding:28px; }
  .pc-verify-card-title { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:1px; margin-bottom:18px; }
  .pc-nft-verify-list { display:flex; flex-direction:column; gap:10px; }
  .pc-nft-verify-item {
    display:flex; align-items:center; gap:14px;
    background:var(--surface); border:1px solid var(--border); padding:12px 16px;
  }
  .pc-nft-verify-thumb { width:44px; height:44px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:22px; }
  .pc-nft-verify-info { flex:1; }
  .pc-nft-verify-name { font-size:13px; font-weight:500; }
  .pc-nft-verify-id { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:1px; margin-top:2px; }
  .pc-nft-verify-status { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:1px; text-transform:uppercase; padding:4px 10px; flex-shrink:0; }
  .status-verified { background:rgba(16,185,129,.15); color:var(--accent3); }
  .pc-access-matrix { display:flex; flex-direction:column; gap:10px; }
  .pc-access-row {
    display:flex; align-items:center; justify-content:space-between;
    background:var(--surface); border:1px solid var(--border); padding:12px 16px;
  }
  .pc-access-row-left { display:flex; align-items:center; gap:12px; }
  .pc-access-row-icon { font-size:20px; }
  .pc-access-row-name { font-size:13px; font-weight:500; }
  .pc-access-row-req { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); margin-top:2px; }
  .pc-access-pill { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:1px; text-transform:uppercase; padding:5px 12px; }
  .pill-open   { background:rgba(16,185,129,.12); color:var(--accent3); border:1px solid rgba(16,185,129,.25); }
  .pill-locked { background:rgba(107,107,133,.12); color:var(--muted); border:1px solid var(--border); }
  .pc-pmr {
    display:flex; justify-content:space-between; align-items:center;
    padding-bottom:10px; border-bottom:1px solid var(--border); font-size:13px;
  }
  .pc-pmr:last-child { border-bottom:none; padding-bottom:0; }
  .pc-pmr-key { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; }

  /* GOODS */
  .pc-goods-layout { display:grid; grid-template-columns:1fr 1fr; gap:48px; }
  .pc-goods-grid-sel { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:24px; }
  .pc-goods-option {
    background:var(--card); border:2px solid var(--border);
    padding:16px 12px; text-align:center; cursor:pointer; transition:all .2s; position:relative;
  }
  .pc-goods-option:hover { border-color:var(--muted); }
  .pc-goods-option.sel { border-color:var(--accent); background:rgba(255,107,53,.07); }
  .pc-goods-option-badge {
    position:absolute; top:6px; right:6px;
    background:var(--accent); color:#fff;
    font-family:'Space Mono',monospace; font-size:7px; letter-spacing:1px; padding:2px 5px; text-transform:uppercase;
  }
  .pc-goods-option-icon { font-size:32px; margin-bottom:6px; }
  .pc-goods-option-name { font-size:12px; font-weight:500; margin-bottom:2px; }
  .pc-goods-option-price { font-family:'Space Mono',monospace; font-size:10px; color:var(--accent); }
  .pc-goods-config { display:flex; flex-direction:column; gap:14px; }
  .pc-qty-row { display:flex; align-items:center; }
  .pc-qty-btn {
    width:36px; height:36px; background:var(--card); border:1px solid var(--border);
    color:var(--text); font-size:18px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
  }
  .pc-qty-val {
    width:48px; text-align:center; background:var(--surface);
    border-top:1px solid var(--border); border-bottom:1px solid var(--border);
    font-family:'Space Mono',monospace; font-size:14px; padding:6px 0;
  }
  .pc-btn-order {
    width:100%; padding:16px;
    font-family:'Space Mono',monospace; font-size:12px; letter-spacing:3px; text-transform:uppercase;
    background:var(--accent); color:#fff; border:none; cursor:pointer; transition:all .2s;
    clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
  }
  .pc-btn-order:hover { background:#ff8555; box-shadow:0 12px 40px rgba(255,107,53,.3); }
  .pc-goods-img-upload-row { display:flex; gap:10px; align-items:flex-start; flex-wrap:wrap; }
  .pc-goods-img-thumb {
    width:64px; height:64px; border:2px solid var(--border); cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    font-size:26px; transition:border-color .2s;
    position:relative; overflow:hidden; flex-shrink:0; background:var(--surface);
  }
  .pc-goods-img-thumb:hover { border-color:var(--muted); }
  .pc-goods-img-thumb.sel-img { border-color:var(--accent); }
  .pc-goods-img-thumb img { width:100%; height:100%; object-fit:cover; }
  .pc-goods-add-img {
    width:64px; height:64px; border:2px dashed var(--border); cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    font-size:22px; color:var(--muted); transition:all .2s; flex-shrink:0; background:var(--surface);
  }
  .pc-goods-add-img:hover { border-color:var(--accent); color:var(--accent); }
  .pc-goods-preview { position:sticky; top:80px; }
  .pc-preview-panel { background:var(--card); border:1px solid var(--border); padding:32px; }
  .pc-preview-panel-label { font-family:'Space Mono',monospace; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:var(--muted); margin-bottom:20px; }
  .pc-mockup-area {
    width:100%; aspect-ratio:1; background:var(--surface);
    border:1px solid var(--border);
    display:flex; align-items:center; justify-content:center;
    position:relative; margin-bottom:20px; overflow:hidden;
  }
  .pc-mockup-bg-pattern {
    position:absolute; inset:0;
    background-image:repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,107,53,.04) 20px,rgba(255,107,53,.04) 21px);
  }
  .pc-mockup-product { font-size:80px; position:relative; z-index:2; }
  .pc-mockup-nft-stamp {
    position:absolute; bottom:16px; right:16px; z-index:3;
    background:rgba(10,10,15,.85); border:1px solid var(--accent);
    padding:6px 10px; font-family:'Space Mono',monospace; font-size:8px; color:var(--accent); letter-spacing:1px;
  }
  .pc-preview-meta { display:flex; flex-direction:column; gap:10px; }
  .pc-preview-total { font-family:'Bebas Neue',sans-serif; font-size:32px; color:var(--accent); letter-spacing:2px; }
  .pc-nft-source-badge {
    margin-top:16px; padding:12px 16px;
    background:rgba(124,58,237,.08); border:1px solid rgba(124,58,237,.25);
    display:flex; align-items:center; gap:10px;
  }
  .pc-nft-source-icon { font-size:18px; }
  .pc-nft-source-text { font-family:'Space Mono',monospace; font-size:9px; color:var(--accent2); letter-spacing:1px; line-height:1.5; }

  /* DOWNLOAD */
  .pc-download-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .pc-dl-card {
    background:var(--card); border:1px solid var(--border);
    overflow:hidden; transition:all .25s; cursor:pointer; position:relative;
  }
  .pc-dl-card:hover { border-color:var(--accent); transform:translateY(-4px); }
  .pc-dl-card-img {
    width:100%; aspect-ratio:1;
    display:flex; align-items:center; justify-content:center;
    font-size:56px; position:relative; overflow:hidden;
  }
  .pc-dl-overlay {
    position:absolute; inset:0; background:rgba(0,0,0,.7);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:8px; opacity:0; transition:opacity .2s;
  }
  .pc-dl-card:hover .pc-dl-overlay { opacity:1; }
  .pc-dl-btn-i {
    font-family:'Space Mono',monospace; font-size:10px; letter-spacing:1px;
    text-transform:uppercase; background:var(--accent); color:#fff; border:none; padding:10px 20px; cursor:pointer;
  }
  .pc-dl-card-body { padding:16px; }
  .pc-dl-card-name { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:1px; margin-bottom:4px; }
  .pc-dl-card-meta { display:flex; justify-content:space-between; font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:1px; }
  .pc-dl-res { color:var(--accent3); }
  .pc-dl-lock {
    position:absolute; inset:0; background:rgba(10,10,15,.88);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:6px; font-family:'Space Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:1px;
  }

  /* MINING */
  .pc-mining-header {
    padding:48px 80px 32px;
    display:flex; justify-content:space-between; align-items:flex-end;
    border-bottom:1px solid var(--border);
  }
  .pc-mining-layout { display:grid; grid-template-columns:1fr 380px; gap:40px; padding:48px 80px; }
  .pc-mining-arena {
    background:var(--card); border:1px solid var(--border);
    overflow:hidden; position:relative; display:flex; flex-direction:column; min-height:480px;
  }
  .pc-arena-header {
    padding:18px 22px; border-bottom:1px solid var(--border);
    display:flex; align-items:center; justify-content:space-between;
  }
  .pc-arena-title { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:2px; }
  .pc-arena-status { font-family:'Space Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:1px; }
  .pc-arena-canvas-wrap { flex:1; position:relative; overflow:hidden; min-height:360px; }
  .pc-mining-panel { display:flex; flex-direction:column; gap:16px; }
  .pc-mine-card { background:var(--card); border:1px solid var(--border); padding:22px; }
  .pc-mine-card-title { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--muted); margin-bottom:14px; }
  .pc-mine-big-num { font-family:'Bebas Neue',sans-serif; font-size:52px; color:var(--accent); letter-spacing:2px; line-height:1; }
  .pc-mine-big-label { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; margin-top:4px; }
  .pc-mine-bar-wrap { background:var(--border); height:6px; margin-top:12px; }
  .pc-mine-bar { height:6px; background:var(--accent); transition:width .4s; }
  .pc-mine-bar.full { background:var(--accent3); }
  .pc-mine-rows { display:flex; flex-direction:column; gap:8px; margin-top:14px; }
  .pc-mine-row {
    display:flex; justify-content:space-between; font-size:12px;
    padding:8px 0; border-bottom:1px solid var(--border);
  }
  .pc-mine-row:last-child { border-bottom:none; }
  .pc-mine-row-key { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; }
  .pc-mine-row-val { font-size:12px; }
  .pc-mine-row-val.g { color:var(--accent3); }
  .pc-mine-row-val.o { color:var(--accent); }
  .pc-mine-pet-sel { display:flex; gap:8px; flex-wrap:wrap; }
  .pc-mine-pet-btn {
    display:flex; align-items:center; gap:6px; background:var(--surface);
    border:1px solid var(--border); padding:9px 12px; cursor:pointer;
    transition:all .2s; font-size:13px; color:var(--text);
  }
  .pc-mine-pet-btn:hover { border-color:var(--muted); }
  .pc-mine-pet-btn.active { border-color:var(--accent); color:var(--accent); }
  .pc-mine-pet-icon { font-size:18px; }
  .pc-mine-actions { display:flex; gap:10px; }
  .pc-btn-mine-go {
    flex:1; padding:14px; font-family:'Space Mono',monospace; font-size:11px;
    letter-spacing:2px; text-transform:uppercase;
    background:var(--accent); color:#fff; border:none; cursor:pointer; transition:all .2s;
    clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
  }
  .pc-btn-mine-go:hover { background:#ff8555; }
  .pc-btn-mine-stop {
    flex:1; padding:14px; font-family:'Space Mono',monospace; font-size:11px;
    letter-spacing:2px; text-transform:uppercase;
    background:transparent; color:var(--muted); border:1px solid var(--border); cursor:pointer; transition:all .2s;
  }
  .pc-btn-mine-stop:hover { border-color:var(--text); color:var(--text); }
  .pc-mine-guide { background:rgba(124,58,237,.06); border:1px solid rgba(124,58,237,.25); padding:18px 20px; }
  .pc-mine-guide-title { font-family:'Space Mono',monospace; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--accent2); margin-bottom:12px; }
  .pc-mine-guide-step { display:flex; align-items:flex-start; gap:8px; font-size:12px; color:var(--muted); line-height:1.5; margin-bottom:6px; }
  .pc-mine-guide-num { font-family:'Space Mono',monospace; font-size:10px; color:var(--accent2); flex-shrink:0; width:16px; }
  .pc-claimed-list { display:flex; flex-direction:column; gap:8px; max-height:180px; overflow-y:auto; }
  .pc-claimed-empty { font-family:'Space Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:1px; text-align:center; padding:16px; }
  .pc-claimed-item {
    display:flex; align-items:center; gap:10px;
    background:var(--surface); border:1px solid var(--border); padding:10px 14px;
    animation:pc-slide-in .3s ease;
  }
  @keyframes pc-slide-in { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
  .pc-claimed-icon { font-size:18px; flex-shrink:0; }
  .pc-claimed-info { flex:1; }
  .pc-claimed-name { font-size:12px; font-weight:500; }
  .pc-claimed-id { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); }
  .pc-claimed-badge { font-family:'Space Mono',monospace; font-size:8px; letter-spacing:1px; padding:3px 7px; text-transform:uppercase; }

  /* MODAL */
  .pc-modal-overlay {
    display:none; position:fixed; inset:0; z-index:300;
    background:rgba(0,0,0,.8); backdrop-filter:blur(8px);
    align-items:center; justify-content:center;
  }
  .pc-modal-overlay.open { display:flex; }
  .pc-modal {
    background:var(--card); border:1px solid var(--border);
    width:500px; max-width:95vw; padding:40px; position:relative;
    animation:pc-modal-in .3s ease; max-height:90vh; overflow-y:auto;
  }
  @keyframes pc-modal-in { from{opacity:0;transform:scale(.95) translateY(20px)} to{opacity:1;transform:none} }
  .pc-modal-close {
    position:absolute; top:16px; right:16px;
    background:none; border:none; color:var(--muted);
    font-size:20px; cursor:pointer; width:32px; height:32px;
    display:flex; align-items:center; justify-content:center;
  }
  .pc-modal-close:hover { color:var(--text); }
  .pc-modal-title { font-family:'Bebas Neue',sans-serif; font-size:36px; letter-spacing:2px; margin-bottom:8px; }
  .pc-modal-sub { color:var(--muted); font-size:13px; margin-bottom:28px; }
  .pc-nft-type-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:24px; }
  .pc-nft-type-option {
    background:var(--surface); border:2px solid var(--border);
    padding:16px 12px; text-align:center; cursor:pointer; transition:all .2s;
  }
  .pc-nft-type-option:hover, .pc-nft-type-option.selected { border-color:var(--accent); background:rgba(255,107,53,.08); }
  .pc-nft-type-option-icon { font-size:28px; margin-bottom:6px; }
  .pc-nft-type-option-name { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:1px; text-transform:uppercase; color:var(--muted); }
  .pc-supply-info {
    padding:14px 16px; background:var(--surface); border:1px solid var(--border);
    display:flex; justify-content:space-between; align-items:center;
    font-family:'Space Mono',monospace; font-size:11px; margin-bottom:24px;
  }
  .pc-supply-label { color:var(--muted); letter-spacing:1px; }
  .pc-supply-val { color:var(--accent); }
  .pc-prog-wrap { margin-top:8px; background:var(--border); height:3px; width:200px; }
  .pc-prog-fill { height:3px; background:var(--accent); width:30%; }
  .pc-btn-modal-mint {
    width:100%; padding:16px;
    font-family:'Space Mono',monospace; font-size:12px; letter-spacing:3px; text-transform:uppercase;
    background:var(--accent); color:#fff; border:none; cursor:pointer; transition:all .2s;
    clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
  }
  .pc-btn-modal-mint:hover { background:#ff8555; }
  .pc-mint-success { display:none; text-align:center; padding:20px 0; }
  .pc-mint-success.show { display:block; }
  .pc-success-icon { font-size:64px; margin-bottom:16px; animation:pc-bounce .5s ease; }
  @keyframes pc-bounce { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
  .pc-success-title { font-family:'Bebas Neue',sans-serif; font-size:40px; letter-spacing:2px; color:var(--accent3); margin-bottom:8px; }
  .pc-success-sub { color:var(--muted); font-size:14px; line-height:1.7; }
  .pc-tx-hash {
    margin-top:20px; padding:12px 16px;
    background:var(--surface); border:1px solid var(--border);
    font-family:'Space Mono',monospace; font-size:10px; color:var(--muted); word-break:break-all;
  }

  /* TOAST */
  .pc-toast {
    position:fixed; bottom:32px; right:32px; z-index:400;
    background:var(--card); border:1px solid var(--border);
    padding:16px 24px; display:flex; align-items:center; gap:12px;
    transform:translateY(100px); opacity:0; transition:all .3s; max-width:360px;
    pointer-events:none;
  }
  .pc-toast.show { transform:translateY(0); opacity:1; pointer-events:auto; }
  .pc-toast-dot { width:8px; height:8px; border-radius:50%; background:var(--accent3); flex-shrink:0; }
  .pc-toast-text { font-size:13px; }
  .pc-toast-label { font-family:'Space Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; margin-top:2px; }

  /* ACCESS DENIED OVERLAY */
  .pc-access-denied-overlay {
    position:fixed; inset:0; z-index:350;
    background:rgba(0,0,0,0.85); backdrop-filter:blur(12px);
    display:flex; align-items:center; justify-content:center;
    animation:pc-modal-in .3s ease;
  }
  .pc-access-denied-inner {
    background:var(--card); border:1px solid var(--border);
    padding:48px 40px; max-width:420px; width:90%; text-align:center; position:relative;
  }

  @media(max-width:900px){
    .pc-hero { grid-template-columns:1fr; }
    .pc-hero-right { display:none; }
    .pc-register-layout,.pc-mypage-grid,.pc-verify-layout,.pc-goods-layout,.pc-mining-layout { grid-template-columns:1fr; }
    .pc-stats-bar { grid-template-columns:repeat(2,1fr); }
    .pc-nft-grid,.pc-bm-grid { grid-template-columns:repeat(2,1fr); }
    .pc-download-grid { grid-template-columns:repeat(2,1fr); }
    .pc-nav,.pc-section,.pc-mypage-layout,.pc-mining-header { padding-left:20px; padding-right:20px; }
    .pc-register-layout { padding:40px 20px; }
    .pc-gate-banner,.pc-holder-tab-content { padding:20px; }
    .pc-holder-tabs { padding:0 20px; }
    .pc-mining-layout { padding:30px 20px; }
    .pc-nav-links { gap:12px; }
  }
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:var(--bg);}
  ::-webkit-scrollbar-thumb{background:var(--border);}
`;

/* ─── CONSTANTS ─── */
const PET_EMOJIS = { 강아지:'🐕', 고양이:'🐈', 토끼:'🐇', 햄스터:'🐹', 기타:'🐾' };
const USER_NFTS = [
  { id:'#0023', name:"MOCHI's 2nd Birthday", type:'birthday', emoji:'🎂' },
  { id:'#0001', name:'Adoption Day 2022',     type:'adoption', emoji:'🏠' },
  { id:'#0007', name:'Golden Pom #001',        type:'limited',  emoji:'✨' },
];
const getBgForType = t => ({
  birthday:'linear-gradient(135deg,#1a1226,#2d1f3d)',
  adoption:'linear-gradient(135deg,#0a1628,#1a2f4a)',
  limited: 'linear-gradient(135deg,#1a0f0a,#3d1a0a)',
}[t] || 'var(--card)');

/* ─── TOAST ─── */
function Toast({ msg, visible }) {
  return (
    <div className={`pc-toast${visible ? ' show' : ''}`}>
      <div className="pc-toast-dot" />
      <div>
        <div className="pc-toast-text">{msg}</div>
        <div className="pc-toast-label">PAWCHAIN</div>
      </div>
    </div>
  );
}

/* ─── ACCESS DENIED ─── */
function AccessDenied({ onClose, onRegister, onConnect }) {
  return (
    <div className="pc-access-denied-overlay">
      <div className="pc-access-denied-inner">
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,background:'none',border:'none',color:'var(--muted)',fontSize:18,cursor:'pointer'}}>✕</button>
        <div style={{fontSize:56,marginBottom:16}}>🔒</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:2,color:'var(--accent)',marginBottom:8}}>접근 제한</div>
        <p style={{color:'var(--muted)',fontSize:14,lineHeight:1.7,marginBottom:28}}>
          이 페이지는 <strong style={{color:'var(--text)'}}>NFT 보유자 전용</strong>입니다.<br/>
          반려동물을 등록하고 NFT를 발행하면<br/>보유자 전용 기능을 이용할 수 있습니다.
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <button onClick={onRegister} className="pc-btn-full">🐾 반려동물 등록하기</button>
          <button onClick={onConnect} style={{padding:14,fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:2,textTransform:'uppercase',background:'transparent',color:'var(--muted)',border:'1px solid var(--border)',cursor:'pointer'}}>🦊 지갑 먼저 연결</button>
        </div>
        <div style={{marginTop:20,padding:'12px 14px',background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.25)',fontFamily:"'Space Mono',monospace",fontSize:9,color:'var(--accent2)',letterSpacing:1,textAlign:'left'}}>
          보유자 전용 기능: 굿즈 제작 · HD 이미지 다운로드 · 프리미엄 콘텐츠
        </div>
      </div>
    </div>
  );
}

/* ─── HOME PAGE ─── */
function HomePage({ showPage }) {
  return (
    <>
      <section className="pc-hero">
        <div className="pc-hero-left">
          <div className="pc-hero-tag">Web3 반려동물 생태계</div>
          <h1 className="pc-hero-h1">당신의<br/>반려동물을<br/><em>체인 위에</em></h1>
          <p className="pc-hero-sub">SBT로 소유권을 증명하고, NFT로 특별한 순간을 영원히 보존하세요.</p>
          <div className="pc-hero-ctas">
            <button className="pc-btn-primary" onClick={() => showPage('register')}>반려동물 등록하기</button>
            <button className="pc-btn-outline" onClick={() => showPage('mypage')}>마이페이지 보기</button>
          </div>
        </div>
        <div className="pc-hero-right">
          <div className="pc-floating-card">
            <span className="pc-sbt-tag">SBT</span>
            <div className="pc-card-badge">🔒 양도 불가 · 인증됨</div>
            <div className="pc-card-pet-img">🐕</div>
            <div className="pc-card-name">MOCHI</div>
            <div className="pc-card-meta">
              <div><div className="pc-card-meta-label">품종</div><div style={{fontSize:13,marginTop:2}}>포메라니안</div></div>
              <div><div className="pc-card-meta-label">발행일</div><div className="pc-card-meta-val">2024.03.15</div></div>
            </div>
          </div>
        </div>
      </section>
      <div className="pc-stats-bar">
        {[['2,847','등록된 반려동물'],['1,203','발행된 NFT'],['892','SBT 보유자']].map(([n,l]) => (
          <div key={l} className="pc-stat-item"><div className="pc-stat-num">{n}</div><div className="pc-stat-label">{l}</div></div>
        ))}
      </div>
      <section className="pc-section">
        <div className="pc-section-tag">사용자 흐름</div>
        <h2 className="pc-section-h2">어떻게 작동하나요?</h2>
        <p className="pc-section-sub">지갑 연결부터 기념 NFT 발행, 굿즈 제작까지 원스텝 흐름.</p>
        <div className="pc-flow-steps">
          {[['01','🦊','지갑 연결','MetaMask'],['02','📝','반려동물 등록','정보 + 이미지'],['03','🔒','SBT 발급','양도 불가 토큰'],['04','🎨','NFT 발행','기념 NFT 민팅'],['05','✅','보유 확인','토큰 게이팅'],['06','🧸','굿즈 제작','내 사진으로']].map(([n,icon,name,desc]) => (
            <div key={n} className="pc-flow-step">
              <div className="pc-flow-num">{n}</div>
              <div className="pc-flow-icon">{icon}</div>
              <div className="pc-flow-name">{name}</div>
              <div className="pc-flow-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="pc-section surface-bg">
        <div className="pc-section-tag">수익 모델</div>
        <h2 className="pc-section-h2">비즈니스 모델</h2>
        <p className="pc-section-sub">인증과 거래를 분리한 토큰 구조로 지속 가능한 수익 생태계.</p>
        <div className="pc-bm-grid">
          {[['01','💸','NFT 발행 수수료','기념 NFT 생성 시 발행 수수료 발생. 생일, 입양일 등 특별한 순간마다 수익 창출.'],
            ['02','🎁','굿즈 교환권','NFT 보유자 전용 실물 굿즈. 내 사진을 직접 올려 나만의 굿즈 제작.'],
            ['03','🪪','SBT 인증 서비스','파트너 서비스에서 SBT 기반 인증/멤버십 제공으로 수익화.']].map(([n,icon,title,desc]) => (
            <div key={n} className="pc-bm-card">
              <div className="pc-bm-num">{n}</div>
              <div className="pc-bm-icon">{icon}</div>
              <div className="pc-bm-title">{title}</div>
              <div className="pc-bm-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ─── REGISTER PAGE ─── */
function RegisterPage({ walletConnected, walletAddr, showToast, showPage, onProfileChanged }) {
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petBirth, setPetBirth] = useState('');
  const [petAdopt, setPetAdopt] = useState('');
  const [previewImgSrc, setPreviewImgSrc] = useState(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [minting, setMinting] = useState(false);

  const handleFile = e => {
    const file = e.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = ev => { setPreviewImgSrc(ev.target.result); setUploadDone(true); };
    r.readAsDataURL(file);
  };

  const buildPetPayload = useCallback(() => {
    if (!walletConnected || !walletAddr) {
      throw new Error('먼저 지갑을 연결해주세요!');
    }

    if (!petName || !petType || !petBirth) {
      throw new Error('이름, 종, 생일을 입력해주세요.');
    }

    return {
      account: walletAddr,
      name: petName,
      species: petType || petBreed || 'pet',
      birthDate: petBirth,
      image: previewImgSrc || undefined,
    };
  }, [walletAddr, walletConnected, petBirth, petBreed, petName, petType, previewImgSrc]);

  const persistPetProfile = useCallback(async () => {
    const payload = buildPetPayload();
    await api.registerPet(payload);
    return payload;
  }, [buildPetPayload]);

  const submitRegister = async () => {
    try {
      setSubmitting(true);
      await persistPetProfile();
      showToast('등록이 완료되었습니다.');
      onProfileChanged?.();
      showPage('mypage');
    } catch (err) {
      console.error(err);
      showToast(err?.message || '등록에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  const mintSBT = async () => {
    if (!walletConnected || !walletAddr) { showToast('먼저 지갑을 연결해주세요!'); return; }
    try {
      setMinting(true);
      showToast('등록 정보를 저장하고 있습니다...');
      const petPayload = await persistPetProfile();
      const currentProfile = await api.getMyPage(walletAddr).catch(() => null);

      if (currentProfile?.holdings?.hasSbt) {
        throw new Error('이미 SBT를 보유하고 있습니다.');
      }

      showToast(`${WEB3_NETWORK_LABEL}에서 SBT 발급을 요청했습니다...`);
      const result = await mintPetSbtOnChain({
        account: walletAddr,
        pet: petPayload,
      });

      await api.syncSbt({
        account: walletAddr,
        tokenId: result.tokenId,
        transactionHash: result.transactionHash,
        tokenUri: result.tokenUri,
        metadata: result.metadata,
        mintedAt: result.mintedAt,
      });

      showToast('✅ SBT 온체인 발급 및 저장 완료!');
      onProfileChanged?.();
      showPage('mypage');
    } catch (err) {
      console.error(err);
      showToast(err?.message || 'SBT 발급에 실패했습니다.');
    } finally {
      setMinting(false);
    }
  };
  const previewName = petName ? petName.toUpperCase() : '반려동물 이름';
  const previewBreed = [petType, petBreed].filter(Boolean).join(' · ') || '종류 · 품종';
  const previewEmoji = PET_EMOJIS[petType] || '🐾';

  return (
    <div className="pc-register-layout">
      <div>
        <div className="pc-form-title">반려동물<br/>등록</div>
        <p className="pc-form-sub">정보를 입력하면 지갑에 SBT가 발급됩니다.<br/>발급된 SBT는 양도할 수 없으며, 소유권 인증 역할을 합니다.</p>
        <div className="pc-upload-area" onClick={() => document.getElementById('pc-file-input').click()}>
          {uploadDone ? <img src={previewImgSrc} style={{width:'100%',height:160,objectFit:'cover',display:'block'}} alt="" />
            : <><div className="pc-upload-icon">📷</div><p className="pc-upload-text"><strong>클릭하여 이미지 업로드</strong><br/>또는 드래그 앤 드롭 (IPFS 저장)</p></>}
        </div>
        <input type="file" id="pc-file-input" style={{display:'none'}} accept="image/*" onChange={handleFile} />
        <div style={{marginTop:28}}>
          <div className="pc-form-group">
            <label className="pc-form-label">반려동물 이름 *</label>
            <input className="pc-form-input" value={petName} onChange={e=>setPetName(e.target.value)} placeholder="예: 모찌" />
          </div>
          <div className="pc-form-row">
            <div className="pc-form-group">
              <label className="pc-form-label">종류 *</label>
              <select className="pc-form-select pc-form-input" value={petType} onChange={e=>setPetType(e.target.value)}>
                <option value="">선택</option>
                <option value="강아지">강아지 🐕</option>
                <option value="고양이">고양이 🐈</option>
                <option value="토끼">토끼 🐇</option>
                <option value="햄스터">햄스터 🐹</option>
                <option value="기타">기타 🐾</option>
              </select>
            </div>
            <div className="pc-form-group">
              <label className="pc-form-label">품종</label>
              <input className="pc-form-input" value={petBreed} onChange={e=>setPetBreed(e.target.value)} placeholder="예: 포메라니안" />
            </div>
          </div>
          <div className="pc-form-row">
            <div className="pc-form-group">
              <label className="pc-form-label">생년월일</label>
              <input type="date" className="pc-form-input" value={petBirth} onChange={e=>setPetBirth(e.target.value)} />
            </div>
            <div className="pc-form-group">
              <label className="pc-form-label">입양일</label>
              <input type="date" className="pc-form-input" value={petAdopt} onChange={e=>setPetAdopt(e.target.value)} />
            </div>
          </div>
          <div className="pc-form-group">
            <label className="pc-form-label">보호자 지갑 주소</label>
            <input className="pc-form-input" value={walletAddr || ''} readOnly placeholder="MetaMask 연결 시 자동 입력" style={{color:'var(--muted)'}} />
          </div>
          <button className="pc-btn-full" onClick={submitRegister} disabled={submitting || minting}>
            {submitting ? '저장 중...' : '📥 등록 저장하기'}
          </button>
          <button className="pc-btn-full" style={{marginTop:10}} onClick={mintSBT} disabled={submitting || minting}>
            {minting ? 'SBT 발급 중...' : '🔒 SBT 발급하기'}
          </button>
        </div>
      </div>
      <div className="pc-preview-section">
        <div className="pc-preview-label">미리보기 · SBT 카드</div>
        <div className="pc-preview-card">
          <div className="pc-preview-img">
            {previewImgSrc ? <img src={previewImgSrc} style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}} alt="" /> : previewEmoji}
          </div>
          <div className="pc-preview-name">{previewName}</div>
          <div className="pc-preview-breed">{previewBreed}</div>
          <div className="pc-preview-rows">
            <div className="pc-preview-row"><span className="pc-preview-row-key">생년월일</span><span>{petBirth ? petBirth.replace(/-/g,'.') : '—'}</span></div>
            <div className="pc-preview-row"><span className="pc-preview-row-key">입양일</span><span>{petAdopt ? petAdopt.replace(/-/g,'.') : '—'}</span></div>
            <div className="pc-preview-row"><span className="pc-preview-row-key">토큰 유형</span><span style={{color:'var(--accent2)'}}>SBT (양도 불가)</span></div>
            <div className="pc-preview-row"><span className="pc-preview-row-key">저장소</span><span style={{color:'var(--accent3)'}}>IPFS</span></div>
          </div>
          <div className="pc-chain-badge"><div className="pc-chain-dot"/><div className="pc-chain-text">{WEB3_NETWORK_LABEL} · ERC-721 SBT</div></div>
        </div>
      </div>
    </div>
  );
}

/* ─── HOLDER PAGE ─── */
function HolderPage({ walletConnected, showToast, showPage }) {
  const [activeTab, setActiveTab] = useState('verify');
  const [gs, setGs] = useState({ name:'머그컵', price:15000, qty:1, imgEmoji:'🎂', imgBg:'linear-gradient(135deg,#1a1226,#2d1f3d)', imgSrc:null, imgLabel:'Birthday NFT #0023' });
  const [orderOpen, setOrderOpen] = useState(false);
  const [userImgs, setUserImgs] = useState([]);

  const GOODS = [
    { name:'머그컵', icon:'☕', price:15000, popular:true },
    { name:'쿠션',   icon:'🛋️', price:22000 },
    { name:'에코백', icon:'👜', price:18000 },
    { name:'아크릴', icon:'🪪', price:12000 },
    { name:'후드티', icon:'👕', price:42000 },
    { name:'포스터', icon:'🖼', price:9000 },
  ];

  const addGoodsImg = e => {
    const file = e.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = ev => {
      const src = ev.target.result, label = file.name.replace(/\.[^.]+$/,'');
      setUserImgs(prev => [...prev, {src, label}]);
      setGs(g => ({...g, imgSrc:src, imgBg:'#111118', imgEmoji:null, imgLabel:label}));
      showToast('📸 이미지가 추가되었습니다!');
    };
    r.readAsDataURL(file);
  };

  const openOrder = () => {
    if (!walletConnected) { showToast('먼저 지갑을 연결해주세요!'); return; }
    setOrderOpen(true);
  };

  const doDownload = name => {
    showToast(`⬇️ ${name} 다운로드 중...`);
    setTimeout(() => showToast(`✅ ${name} 다운로드 완료! (4K)`), 1500);
  };

  const nftCount = USER_NFTS.length;
  const ACCESS = [
    {icon:'🧸', name:'굿즈 제작',           req:'NFT 1개 이상', min:1},
    {icon:'🖼️', name:'HD 이미지 다운로드', req:'NFT 1개 이상', min:1},
    {icon:'🎫', name:'프리미엄 NFT 발행',   req:'NFT 5개 이상', min:5},
    {icon:'🏥', name:'병원 진료 기록 연동', req:'SBT + 파트너 병원', min:99},
  ];

  return (
    <>
      <div className="pc-gate-banner">
        <div className="pc-gate-left">
          <div className="pc-gate-nft-thumb">🎂</div>
          <div>
            <div className="pc-gate-info-label">보유 NFT 기반 접근</div>
            <div className="pc-gate-info-val">MOCHI's NFT Holder Dashboard</div>
          </div>
        </div>
        <div className="pc-gate-right">
          <div style={{textAlign:'right'}}>
            <div className="pc-gate-count">{nftCount}</div>
            <div className="pc-gate-count-label">보유 NFT</div>
          </div>
          <div className="pc-gate-badge">✓ 보유 확인됨</div>
        </div>
      </div>
      <div className="pc-holder-tabs">
        {[['verify','🔍 NFT 보유 확인'],['goods','🧸 굿즈 제작'],['download','🖼️ 이미지 다운로드']].map(([id,label]) => (
          <button key={id} className={`pc-holder-tab${activeTab===id?' active':''}`} onClick={()=>setActiveTab(id)}>{label}</button>
        ))}
      </div>

      {/* VERIFY TAB */}
      <div className={`pc-holder-tab-content${activeTab==='verify'?' active':''}`}>
        <div className="pc-verify-layout">
          <div>
            <div className="pc-verify-card">
              <div className="pc-verify-card-title">보유 NFT 목록</div>
              <div className="pc-nft-verify-list">
                {USER_NFTS.map(nft => (
                  <div key={nft.id} className="pc-nft-verify-item">
                    <div className="pc-nft-verify-thumb" style={{background:getBgForType(nft.type)}}>{nft.emoji}</div>
                    <div className="pc-nft-verify-info">
                      <div className="pc-nft-verify-name">{nft.name}</div>
                      <div className="pc-nft-verify-id">Token {nft.id} · Edition 1/10</div>
                    </div>
                    <div className="pc-nft-verify-status status-verified">✓ 확인됨</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pc-verify-card" style={{marginTop:14}}>
              <div className="pc-verify-card-title">지갑 검증 정보</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div className="pc-pmr"><span className="pc-pmr-key">지갑 주소</span><span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:'var(--accent3)'}}>0x1a2b...9a0b</span></div>
                <div className="pc-pmr"><span className="pc-pmr-key">SBT 토큰</span><span style={{color:'var(--accent2)'}}>Token #0041</span></div>
                <div className="pc-pmr"><span className="pc-pmr-key">총 보유 NFT</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:'var(--accent)'}}>{nftCount}개</span></div>
              </div>
              <div className="pc-chain-badge" style={{marginTop:16}}><div className="pc-chain-dot"/><div className="pc-chain-text">Ethereum Mainnet · ERC-721 검증 완료</div></div>
            </div>
          </div>
          <div>
            <div className="pc-verify-card">
              <div className="pc-verify-card-title">기능 접근 권한</div>
              <div className="pc-access-matrix">
                {ACCESS.map((a,i) => {
                  let cls, txt;
                  if(i===4){ cls='pill-locked'; txt='준비 중'; }
                  else if(nftCount>=a.min){ cls='pill-open'; txt='✓ 접근 가능'; }
                  else{ cls='pill-locked'; txt=`🔒 NFT ${a.min-nftCount}개 더 필요`; }
                  return (
                    <div key={a.name} className="pc-access-row">
                      <div className="pc-access-row-left">
                        <div className="pc-access-row-icon">{a.icon}</div>
                        <div><div className="pc-access-row-name">{a.name}</div><div className="pc-access-row-req">{a.req}</div></div>
                      </div>
                      <div className={`pc-access-pill ${cls}`}>{txt}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GOODS TAB */}
      <div className={`pc-holder-tab-content${activeTab==='goods'?' active':''}`}>
        <div className="pc-goods-layout">
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:1,marginBottom:20}}>굿즈 종류 선택</div>
            <div className="pc-goods-grid-sel">
              {GOODS.map(g => (
                <div key={g.name} className={`pc-goods-option${gs.name===g.name?' sel':''}`} onClick={()=>setGs(prev=>({...prev,name:g.name,price:g.price}))}>
                  {g.popular && <div className="pc-goods-option-badge">인기</div>}
                  <div className="pc-goods-option-icon">{g.icon}</div>
                  <div className="pc-goods-option-name">{g.name}</div>
                  <div className="pc-goods-option-price">₩{g.price.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="pc-goods-config">
              <div className="pc-form-group" style={{marginBottom:0}}>
                <label className="pc-form-label">굿즈에 넣을 이미지 <span style={{color:'var(--accent)'}}>★ 내 사진 직접 업로드 가능</span></label>
                <div className="pc-goods-img-upload-row">
                  {USER_NFTS.map((nft,i) => (
                    <div key={nft.id} className={`pc-goods-img-thumb${gs.imgLabel.includes(nft.name)?' sel-img':''}`}
                      onClick={()=>setGs(g=>({...g,imgEmoji:nft.emoji,imgBg:getBgForType(nft.type),imgSrc:null,imgLabel:nft.name+' '+nft.id}))}>
                      <span style={{fontSize:26}}>{nft.emoji}</span>
                    </div>
                  ))}
                  {userImgs.map((img,i) => (
                    <div key={i} className={`pc-goods-img-thumb${gs.imgLabel===img.label?' sel-img':''}`}
                      onClick={()=>setGs(g=>({...g,imgEmoji:null,imgBg:'#111118',imgSrc:img.src,imgLabel:img.label}))}>
                      <img src={img.src} alt="" />
                    </div>
                  ))}
                  <div className="pc-goods-add-img" onClick={()=>document.getElementById('pc-goods-img-input').click()}>➕</div>
                  <input type="file" id="pc-goods-img-input" style={{display:'none'}} accept="image/*" onChange={addGoodsImg} />
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'var(--muted)',marginTop:6,letterSpacing:1}}>선택된 이미지: <span style={{color:'var(--accent)'}}>{gs.imgLabel}</span></div>
              </div>
              <div className="pc-form-group" style={{marginBottom:0}}>
                <label className="pc-form-label">수량</label>
                <div className="pc-qty-row">
                  <button className="pc-qty-btn" onClick={()=>setGs(g=>({...g,qty:Math.max(1,g.qty-1)}))}>−</button>
                  <div className="pc-qty-val">{gs.qty}</div>
                  <button className="pc-qty-btn" onClick={()=>setGs(g=>({...g,qty:Math.min(10,g.qty+1)}))}>+</button>
                </div>
              </div>
              <div className="pc-form-group" style={{marginBottom:0}}>
                <label className="pc-form-label">배송 메모</label>
                <input type="text" className="pc-form-input" placeholder="예: 선물 포장 요청" />
              </div>
              <button className="pc-btn-order" onClick={openOrder}>🧸 굿즈 주문하기 · NFT 교환권 사용</button>
            </div>
          </div>
          <div className="pc-goods-preview">
            <div className="pc-preview-panel">
              <div className="pc-preview-panel-label">실시간 굿즈 미리보기</div>
              <div className="pc-mockup-area" style={{background:gs.imgBg||'var(--surface)'}}>
                <div className="pc-mockup-bg-pattern"/>
                <div className="pc-mockup-product">
                  {gs.imgSrc ? <img src={gs.imgSrc} style={{width:120,height:120,objectFit:'contain',borderRadius:4}} alt="" /> : <span style={{fontSize:80}}>{gs.imgEmoji}</span>}
                </div>
                <div className="pc-mockup-nft-stamp">{gs.imgLabel} · MOCHI</div>
              </div>
              <div className="pc-preview-meta">
                {[['선택 굿즈', gs.name],['이미지', gs.imgLabel],['수량', gs.qty+'개'],['총 금액', null]].map(([k,v]) => (
                  <div key={k} className="pc-pmr" style={k==='총 금액'?{borderBottom:'none'}:{}}>
                    <span className="pc-pmr-key">{k}</span>
                    {k==='총 금액' ? <span className="pc-preview-total">₩{(gs.price*gs.qty).toLocaleString()}</span> : <span style={{fontSize:13}}>{v}</span>}
                  </div>
                ))}
              </div>
              <div className="pc-nft-source-badge">
                <div className="pc-nft-source-icon">🔗</div>
                <div className="pc-nft-source-text">NFT 보유 인증 기반 주문<br/>ERC-721 검증됨</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DOWNLOAD TAB */}
      <div className={`pc-holder-tab-content${activeTab==='download'?' active':''}`}>
        <div style={{marginBottom:28}}>
          <div className="pc-section-tag">NFT 기반 이미지</div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,letterSpacing:2,marginBottom:8}}>기념 이미지 다운로드</h2>
          <p style={{color:'var(--muted)',fontSize:14,lineHeight:1.7}}>NFT 보유자 전용 고해상도 이미지를 다운로드하세요.</p>
        </div>
        <div className="pc-download-grid">
          {[
            { bg:'linear-gradient(135deg,#1a1226,#2d1f3d)', icon:'🎂', name:'Birthday NFT #0023', sub:'2nd Birthday', res:'4K', owned:true },
            { bg:'linear-gradient(135deg,#0a1628,#1a2f4a)', icon:'🏠', name:'Adoption Day #0001', sub:'입양 기념', res:'4K', owned:true },
            { bg:'linear-gradient(135deg,#1a0f0a,#3d1a0a)', icon:'✨', name:'Golden Pom #0007',   sub:'한정판', res:'4K', owned:true },
            { bg:'var(--surface)', icon:'🎴', name:'Premium NFT #0099', sub:'프리미엄', owned:false },
            { bg:'var(--surface)', icon:'🎴', name:'Diamond Edition',   sub:'다이아몬드', owned:false },
            { bg:'var(--surface)', icon:'🎴', name:'Limited NFT',   sub:'한정판', owned:false },
          ].map((item,i) => (
            <div key={i} className="pc-dl-card" style={!item.owned?{opacity:.55}:{}}>
              <div className="pc-dl-card-img" style={{background:item.bg}}>
                {item.icon}
                {item.owned ? (
                  <div className="pc-dl-overlay">
                    <div style={{fontSize:11,color:'#aaa',fontFamily:"'Space Mono',monospace"}}>4096×4096 px</div>
                    <button className="pc-dl-btn-i" onClick={()=>doDownload(item.name)}>↓ 다운로드</button>
                  </div>
                ) : (
                  <div className="pc-dl-lock">🔒<span style={{fontSize:9,marginTop:4}}>NFT 미보유</span></div>
                )}
              </div>
              <div className="pc-dl-card-body">
                <div className="pc-dl-card-name" style={!item.owned?{color:'var(--muted)'}:{}}>{item.name}</div>
                <div className="pc-dl-card-meta"><span>{item.sub}</span><span className="pc-dl-res">{item.res||'—'}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ORDER MODAL */}
      {orderOpen && (
        <div className="pc-modal-overlay open" onClick={e=>{if(e.target===e.currentTarget)setOrderOpen(false);}}>
          <div className="pc-modal" style={{maxWidth:460}}>
            <button className="pc-modal-close" onClick={()=>setOrderOpen(false)}>✕</button>
            <div style={{textAlign:'center',padding:'12px 0'}}>
              <div className="pc-success-icon">🧸</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:2,color:'var(--accent)'}}>주문 완료!</div>
              <p style={{color:'var(--muted)',fontSize:14,margin:'12px 0'}}>NFT 교환권이 사용되었습니다.<br/>굿즈 제작 후 배송까지 5~7일 소요됩니다.</p>
              <div className="pc-tx-hash">NFT Token #0023 · 교환권 소모<br/>TX: 0x3f8a1c2b4e5d7f9a0c2b4e6d8f1a3c5e</div>
              <div style={{marginTop:20,padding:16,background:'var(--surface)',border:'1px solid var(--border)',textAlign:'left'}}>
                <div className="pc-form-label" style={{marginBottom:10}}>배송 정보 입력</div>
                <input className="pc-form-input" placeholder="수령인 이름" style={{marginBottom:8}} />
                <input className="pc-form-input" placeholder="배송 주소" />
              </div>
              <button className="pc-btn-modal-mint" style={{marginTop:16}} onClick={()=>setOrderOpen(false)}>확인 · 마이페이지로</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── MYPAGE (API 연동) ─── */
function MyPageNew({ walletConnected, walletAddr, refreshKey, showPage, showToast }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);

  const shortAddr = walletAddr ? walletAddr.slice(0,6)+'...'+walletAddr.slice(-4) : '';

  const refreshProfile = useCallback(async () => {
    if (!walletConnected || !walletAddr) { setProfile(null); return; }
    setLoading(true);
    try {
      const data = await api.getMyPage(walletAddr);
      setProfile(data);
    } catch (err) {
      console.error(err);
      showToast(err?.message || '프로필을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [walletConnected, walletAddr, showToast]);

  useEffect(() => { refreshProfile(); }, [refreshProfile, refreshKey]);

  const handleIssueSbt = async () => {
    if (!walletConnected || !walletAddr) { showToast('먼저 지갑을 연결해주세요!'); return; }
    if (!pet) { showToast('먼저 반려동물을 등록해주세요.'); return; }
    if (holdings.hasSbt) { showToast('이미 SBT를 보유하고 있습니다.'); return; }
    try {
      setMinting(true);
      showToast(`${WEB3_NETWORK_LABEL}에서 SBT 발급을 요청했습니다...`);
      const result = await mintPetSbtOnChain({ account: walletAddr, pet });
      await api.syncSbt({
        account: walletAddr,
        tokenId: result.tokenId,
        transactionHash: result.transactionHash,
        tokenUri: result.tokenUri,
        metadata: result.metadata,
        mintedAt: result.mintedAt,
      });
      showToast('SBT 온체인 발급 완료!');
      await refreshProfile();
    } catch (err) {
      console.error(err);
      showToast(err?.message || 'SBT 발급 실패');
    } finally {
      setMinting(false);
    }
  };

  const handleIssueNft = async () => {
    if (!walletConnected || !walletAddr) { showToast('먼저 지갑을 연결해주세요!'); return; }
    if (!pet) { showToast('먼저 반려동물을 등록해주세요.'); return; }
    if (!sbt?.tokenId) { showToast('먼저 SBT를 발급해주세요.'); return; }
    try {
      setMinting(true);
      showToast(`${WEB3_NETWORK_LABEL}에서 NFT 발행을 요청했습니다...`);
      const result = await mintMemoryNftOnChain({
        account: walletAddr,
        pet,
        petSbtTokenId: sbt.tokenId,
      });
      await api.syncNft({
        account: walletAddr,
        tokenId: result.tokenId,
        petSbtTokenId: result.petSbtTokenId,
        transactionHash: result.transactionHash,
        tokenUri: result.tokenUri,
        metadata: result.metadata,
        paidWei: result.paidWei,
        mintedAt: result.mintedAt,
      });
      showToast('NFT 온체인 발행 완료!');
      await refreshProfile();
    } catch (err) {
      console.error(err);
      showToast(err?.message || 'NFT 발행 실패');
    } finally {
      setMinting(false);
    }
  };

  const pet = profile?.pet;
  const sbt = profile?.sbt;
  const nfts = profile?.nfts || [];
  const holdings = profile?.holdings || { hasSbt:false, hasNft:false, nftBalance:0 };

  return (
    <div className="pc-mypage-layout">
      <div className="pc-mypage-header">
        <div>
          <div className="pc-section-tag">마이페이지</div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,letterSpacing:2}}>내 반려동물</h2>
        </div>
        <div>
          <div className="pc-wallet-label">연결된 지갑</div>
          <div className="pc-wallet-addr">{shortAddr || '지갑 미연결'}</div>
        </div>
      </div>

      {!walletConnected && <div style={{margin:'12px 0', color:'var(--muted)'}}>지갑을 연결하면 프로필을 확인할 수 있습니다.</div>}
      {loading && <div style={{margin:'12px 0'}}>불러오는 중...</div>}

      <div className="pc-mypage-grid">
        <div className="pc-pet-card-main">
          <div className="pc-pet-card-main-img">
            {pet?.image ? <img src={pet.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (pet?.name ? '🐾' : '🐕')}
          </div>
          <div className="pc-verified-badge">{holdings.hasSbt ? '🔒 SBT 발급됨' : '⏳ 미발급'}</div>
          <div className="pc-pet-main-name">{pet?.name || '아직 등록된 반려동물이 없어요'}</div>
          <div className="pc-pet-main-breed">{pet?.species || '종 / 품종을 등록해주세요'}</div>
          <div className="pc-info-grid">
            {[['생년월일', pet?.birthDate ? pet.birthDate.replace(/-/g,'.') : '—'],['입양일','—'],['NFT 보유', `${holdings.nftBalance || 0}개`, 'var(--accent)'],['네트워크',WEB3_NETWORK_LABEL]].map(([k,v,c]) => (
              <div key={k} className="pc-info-cell">
                <div className="pc-info-cell-key">{k}</div>
                <div className="pc-info-cell-val" style={c?{color:c}:{}}>{v}</div>
              </div>
            ))}
          </div>
          <div className="pc-sbt-block">
            <div className="pc-sbt-icon">🔒</div>
            <div><div className="pc-sbt-info-label">SBT 발급정보</div><div className="pc-sbt-info-val">{holdings.hasSbt && sbt?.tokenId ? `Token #${sbt.tokenId}` : '아직 미발급'}</div></div>
          </div>
          <div className="pc-holder-section">
            <div className="pc-holder-title">보유자 전용 기능</div>
            <div className="pc-holder-features">
              {[['🛍','굿즈 주문','실물 굿즈로',()=>showPage('holder','goods')],['⬇️','원본 사진 다운로드','HD 원본 다운로드',()=>showPage('holder','download')],['👥','커뮤니티 활동','진행 예정',null]].map(([icon,name,desc,handler]) => (
                <div key={name} className={`pc-holder-feat${!handler?' locked':''}`} onClick={handler||undefined}>
                  <div className="pc-holder-feat-icon">{icon}</div>
                  <div className="pc-holder-feat-name">{name}</div>
                  <div className="pc-holder-feat-desc">{desc}</div>
                  {!handler && <div className="pc-lock-overlay">🔒<span style={{fontSize:9}}>준비중</span></div>}
                </div>
              ))}
            </div>
            <div style={{display:'grid', gap:8, marginTop:12}}>
              <button className="pc-btn-full" onClick={handleIssueSbt} disabled={minting || holdings.hasSbt}>SBT 발급하기</button>
              <button className="pc-btn-full" onClick={handleIssueNft} disabled={minting || !holdings.hasSbt}>NFT 발행하기</button>
              <button className="pc-btn-full" style={{marginTop:4}} onClick={refreshProfile}>새로고침</button>
            </div>
          </div>
        </div>
        <div>
          <div className="pc-nft-section-top">
            <div className="pc-nft-section-title">보유 NFT 목록</div>
          </div>
          <div className="pc-nft-grid">
            {(nfts || []).length === 0 && <div className="pc-claimed-empty" style={{width:'100%'}}>아직 발행된 NFT가 없습니다</div>}
            {nfts.map(nft => (
              <div key={nft.tokenId || nft.id} className="pc-nft-item">
                <div className="pc-nft-item-img" style={{background:'linear-gradient(135deg,#1a1226,#2d1f3d)'}}>
                  <span className="pc-nft-type-badge badge-birthday">NFT</span>
                  {nft.metadata?.emoji || '🐾'}
                </div>
                <div className="pc-nft-item-body">
                  <div className="pc-nft-item-name">{nft.metadata?.name || `NFT #${nft.tokenId}`}</div>
                  <div className="pc-nft-item-meta">
                    <span className="pc-nft-item-edition">{nft.metadata?.description || '반려동물 기념 NFT'}</span>
                    <span className="pc-nft-item-num">#{nft.tokenId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ─── */
export default function PawChain() {
  const [theme, setTheme] = useState('dark');
  const [activePage, setActivePage] = useState('home');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddr, setWalletAddr] = useState('');
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [toast, setToast] = useState({ msg:'', visible:false });
  const [accessDenied, setAccessDenied] = useState(false);
  const toastTimer = useRef(null);

  const showToast = msg => {
    setToast({ msg, visible:true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({...t, visible:false})), 3000);
  };

  const bumpProfileRefresh = useCallback(() => setProfileRefreshKey(k => k + 1), []);

  const connectWallet = useCallback(async () => {
    try {
      const { account } = await connectWalletSession();
      setWalletAddr(account);
      setWalletConnected(true);
      showToast(`${WEB3_NETWORK_LABEL} 지갑이 연결되었습니다!`);
      bumpProfileRefresh();
    } catch (err) {
      console.error(err);
      showToast(err?.message || '지갑 연결에 실패했습니다.');
    }
  }, [bumpProfileRefresh]);

  useEffect(() => {
    let cancelled = false;

    const hydrateWallet = async () => {
      if (!window.ethereum?.request) {
        return;
      }

      try {
        const account = await getConnectedWalletAccount();
        if (!cancelled && account) {
          setWalletAddr(account);
          setWalletConnected(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    const handleAccountsChanged = accounts => {
      const account = accounts?.[0] || '';
      setWalletAddr(account);
      setWalletConnected(Boolean(account));
      if (account) {
        bumpProfileRefresh();
      }
    };

    const handleChainChanged = () => {
      bumpProfileRefresh();
    };

    hydrateWallet();

    window.ethereum?.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum?.on?.('chainChanged', handleChainChanged);

    return () => {
      cancelled = true;
      clearTimeout(toastTimer.current);
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [bumpProfileRefresh]);

  const showPage = (id, sub) => {
    if (id === 'holder' && !walletConnected) { showToast('⚠️ NFT 보유자만 접근할 수 있습니다.'); setAccessDenied(true); return; }
    setActivePage(id);
    window.scrollTo(0,0);
  };

  const PAGES = ['home','register','mypage','holder'];
  const NAV = [['home','홈'],['register','등록'],['mypage','마이페이지'],['holder','보유자 전용']];
  const shortAddr = walletAddr ? walletAddr.slice(0,6)+'...'+walletAddr.slice(-4) : '';

  return (
    <div className={`pawchain-root${theme==='light'?' light':''}`}>
      <style>{css}</style>

      <nav className="pc-nav">
        <div className="pc-logo" onClick={()=>setActivePage('home')}>PAW<span>CHAIN</span></div>
        <div className="pc-nav-links">
          {NAV.map(([id,label]) => (
            <a key={id} className={activePage===id?'active':''} onClick={()=>showPage(id)}>{label}</a>
          ))}
        </div>
        <div className="pc-nav-right">
          <div className="pc-theme-wrap">
            <span className="pc-theme-lbl">{theme==='dark'?'🌙 DARK':'☀️ LIGHT'}</span>
            <button className="pc-theme-toggle" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} />
          </div>
          <button className={`pc-btn-connect${walletConnected?' connected':''}`} onClick={connectWallet}>
            {walletConnected ? shortAddr : '지갑 연결'}
          </button>
        </div>
      </nav>

      {PAGES.map(id => (
        <div key={id} className={`pc-page${activePage===id?' active':''}`}>
          {id==='home'     && <HomePage     showPage={showPage} />}
          {id==='register' && <RegisterPage walletConnected={walletConnected} walletAddr={walletAddr} showToast={showToast} showPage={showPage} onProfileChanged={bumpProfileRefresh} />}
          {id==='mypage'   && <MyPageNew    walletConnected={walletConnected} walletAddr={walletAddr} showToast={showToast} showPage={showPage} refreshKey={profileRefreshKey} />}
          {id==='holder'   && <HolderPage   walletConnected={walletConnected} showToast={showToast} showPage={showPage} />}
        </div>
      ))}

      {accessDenied && (
        <AccessDenied
          onClose={()=>setAccessDenied(false)}
          onRegister={()=>{setAccessDenied(false); showPage('register');}}
          onConnect={()=>{setAccessDenied(false); connectWallet();}}
        />
      )}

      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}
