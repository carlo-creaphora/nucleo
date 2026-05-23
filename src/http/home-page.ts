export function renderHomePage() {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nucleo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@200;400;500;600;900&display=swap" rel="stylesheet" />
    <style>
      :root {
        --ink: #09090b;
        --muted: #78716c;
        --line: #e7e5e4;
        --panel: #ffffff;
        --warm: #faf9f5;
        --accent: #0c0a09;
        --soft: #f5f4ef;
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Geist", "Geist Fallback", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        color: var(--ink);
        background: linear-gradient(#fff, #f8fafc 44%, #f1f5f9);
      }
      button, input, textarea { font: inherit; }
      button { cursor: pointer; }
      .shell {
        display: grid;
        grid-template-columns: 244px minmax(0, 1fr);
        grid-template-rows: 76px minmax(0, 1fr);
        width: 100%;
        height: 100dvh;
        min-height: 760px;
        margin: 0;
        padding: 0;
      }
      .shell.splash-mode {
        display: block;
        height: 100vh;
        min-height: 620px;
      }
      .shell.splash-mode .topbar,
      .shell.splash-mode .sidebar {
        display: none;
      }
      .shell.splash-mode .layout {
        display: block;
        height: 100%;
      }
      .shell.splash-mode .workspace {
        display: block;
        height: 100%;
        overflow: hidden;
      }
      .topbar {
        grid-column: 2;
        grid-row: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin: 0;
        border-bottom: 1px solid var(--line);
        background: rgba(250, 249, 245, 0.9);
        padding: 12px 20px;
        backdrop-filter: blur(10px);
      }
      .brand {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      .brand h1 {
        margin: 0;
        font-size: 24px;
        line-height: 1.25;
        letter-spacing: 0;
        font-weight: 600;
      }
      .brand span {
        color: var(--muted);
        font-size: 12px;
        line-height: 16px;
        font-weight: 500;
        text-transform: uppercase;
      }
      .status {
        display: inline-flex;
        min-width: 36px;
        height: 36px;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 6px;
        padding: 0 12px;
        background: var(--accent);
        color: white;
        font-size: 13px;
        font-weight: 700;
      }
      .layout {
        display: contents;
      }
      .sidebar, .workspace, .panel {
        border: 1px solid var(--line);
        background: var(--panel);
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }
      .sidebar, .workspace { border-radius: 0; }
      .sidebar {
        grid-column: 1;
        grid-row: 1 / span 2;
        min-height: 0;
        overflow: auto;
        border-width: 0 1px 0 0;
        background: #f5f4ef;
        padding: 18px 12px;
        position: static;
      }
      .sidebar::before {
        content: "Innovación";
        display: block;
        margin: 0 4px 28px;
        color: #1c1917;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0;
      }
      .sidebar-kicker {
        margin: 0 8px 8px;
        color: #a8a29e;
        font-size: 12px;
        font-weight: 600;
      }
      .step {
        width: 100%;
        display: grid;
        grid-template-columns: 24px 1fr;
        gap: 10px;
        align-items: start;
        border: 1px solid transparent;
        border-radius: 8px;
        padding: 10px 8px;
        background: transparent;
        text-align: left;
        color: #d6d3d1;
      }
      .step + .step { margin-top: 4px; }
      .step strong { display: block; color: inherit; font-size: 13px; font-weight: 650; }
      .step span:last-child { font-size: 12px; color: inherit; }
      .num {
        display: grid;
        place-items: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 1px solid currentColor;
        background: transparent;
        font-size: 11px;
        font-weight: 700;
        color: inherit;
      }
      .step.active {
        border-color: #d6d3d1;
        background: white;
        color: #0c0a09;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
      }
      .step.done { color: #44403c; }
      .step.done .num { background: #0c0a09; border-color: #0c0a09; color: white; }
      .sidebar-note {
        margin: 24px 8px 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.5;
      }
      .workspace {
        grid-column: 2;
        grid-row: 2;
        min-height: 0;
        overflow: auto;
        border: 0;
        background: transparent;
        box-shadow: none;
      }
      .section {
        display: none;
        width: min(1440px, calc(100% - 64px));
        margin: 0 auto;
        padding: 28px 0 40px;
      }
      .section.splash {
        display: block;
        width: 100%;
        height: 100dvh;
        margin: 0;
        padding: 0;
      }
      .section.splash.hidden {
        display: none;
      }
      .section.active { display: block; }
      .section-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 1px solid var(--line);
        margin-bottom: 24px;
        padding-bottom: 20px;
      }
      .section h2 {
        margin: 0;
        font-size: clamp(28px, 3vw, 36px);
        line-height: 1.08;
        letter-spacing: 0;
        font-weight: 700;
      }
      .section p {
        margin: 10px 0 0;
        max-width: 740px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .full { grid-column: 1 / -1; }
      label {
        display: block;
        font-size: 12px;
        font-weight: 800;
        color: rgba(5, 6, 15, 0.55);
        text-transform: uppercase;
      }
      input, textarea {
        width: 100%;
        margin-top: 8px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: white;
        color: var(--ink);
        padding: 12px 13px;
        outline: none;
      }
      textarea { min-height: 96px; resize: vertical; line-height: 1.45; }
      input:focus, textarea:focus { border-color: rgba(5, 6, 15, 0.42); background: white; }
      .group-title {
        grid-column: 1 / -1;
        margin-top: 10px;
        padding-top: 18px;
        border-top: 1px solid var(--line);
        font-size: 13px;
        color: var(--ink);
        font-weight: 850;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 22px;
        flex-wrap: wrap;
      }
      .btn {
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: white;
        color: var(--ink);
        padding: 0 18px;
        font-size: 14px;
        font-weight: 650;
      }
      .btn.primary { background: #0c0a09; color: white; border-color: #0c0a09; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08); }
      .btn:disabled { opacity: 0.48; cursor: not-allowed; }
      .chat-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
        gap: 16px;
      }
      .diagnosis-page {
        width: min(930px, calc(100% - 64px));
        padding-top: 24px;
      }
      .diagnosis-phase-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 0;
        margin-bottom: 30px;
        padding-bottom: 0;
      }
      .diagnosis-phase-head .eyebrow,
      .diagnosis-card-kicker {
        margin: 0;
        color: #a8a29e;
        font-size: 12px;
        line-height: 16px;
        font-weight: 500;
        text-transform: uppercase;
      }
      .diagnosis-phase-head h2 {
        margin-top: 8px;
        color: #1c1917;
        font-size: 30px;
        line-height: 36px;
        font-weight: 600;
      }
      .diagnosis-phase-head p:not(.eyebrow) {
        max-width: 680px;
        margin-top: 8px;
        color: #78716c;
        font-size: 14px;
        line-height: 24px;
      }
      .diagnosis-layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .diagnosis-chat-panel {
        border-radius: 24px;
        border: 1px solid #e7e5e4;
        background: white;
        padding: 20px;
        box-shadow: 0 18px 60px rgba(28, 25, 23, 0.07);
      }
      .diagnosis-chat-panel .messages {
        height: 250px;
      }
      .diagnosis-output {
        display: grid;
        gap: 20px;
        max-height: none;
        overflow: visible;
      }
      .diagnosis-challenge {
        border: 0;
        border-radius: 0;
        background: transparent;
        padding: 0;
      }
      .diagnosis-challenge h3 {
        margin: 0;
        color: #1c1917;
        font-size: 24px;
        line-height: 30px;
        letter-spacing: 0;
        font-weight: 600;
      }
      .diagnosis-challenge p {
        max-width: none;
        margin-top: 16px;
        color: #57534e;
        font-size: 14px;
        line-height: 28px;
      }
      .diagnosis-reading {
        border: 1px solid #e7e5e4;
        border-radius: 24px;
        background: white;
        padding: 20px;
        box-shadow: 0 18px 60px rgba(28, 25, 23, 0.07);
      }
      .diagnosis-reading h3,
      .diagnosis-brief h3 {
        margin: 0;
        color: #1c1917;
        font-size: 18px;
        line-height: 28px;
        font-weight: 600;
      }
      .diagnosis-row-list {
        display: flex;
        flex-direction: column;
        margin-top: 12px;
      }
      .diagnosis-row {
        padding: 12px 0;
        border-top: 1px solid #e7e5e4;
      }
      .diagnosis-row:first-child { border-top: 0; padding-top: 0; }
      .diagnosis-row:last-child { padding-bottom: 0; }
      .diagnosis-row-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .diagnosis-row-title {
        margin: 0;
        color: #1c1917;
        font-size: 14px;
        line-height: 20px;
        font-weight: 600;
      }
      .diagnosis-row-body {
        margin-top: 4px;
        color: #44403c;
        font-size: 14px;
        line-height: 20px;
      }
      .diagnosis-row-body ul {
        margin: 0;
        padding-left: 18px;
      }
      .diagnosis-brief {
        border: 1px solid #e7e5e4;
        border-radius: 24px;
        background: #f5f4ef;
        padding: 20px;
        box-shadow: 0 1px 2px rgba(28, 25, 23, 0.04);
      }
      .diagnosis-brief p {
        max-width: 768px;
        margin-top: 12px;
        color: #57534e;
        font-size: 14px;
        line-height: 28px;
      }
      .panel {
        border-radius: 16px;
        padding: 18px;
      }
      .messages {
        height: 430px;
        overflow: auto;
        padding-right: 4px;
      }
      .msg {
        max-width: 86%;
        margin-bottom: 12px;
        border-radius: 16px;
        padding: 12px 14px;
        line-height: 1.48;
        font-size: 15px;
      }
      .msg.assistant { background: #f5f4ef; border: 1px solid var(--line); }
      .msg.user { margin-left: auto; background: #0c0a09; color: white; }
      .composer {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        margin-top: 14px;
      }
      .composer textarea { min-height: 72px; }
      .result {
        display: grid;
        gap: 10px;
        max-height: 565px;
        overflow: auto;
      }
      .result-item {
        border: 1px solid var(--line);
        border-radius: 12px;
        background: rgba(255,255,255,0.76);
        padding: 12px;
      }
      .result-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 6px;
      }
      .result-item strong {
        display: block;
        font-size: 13px;
      }
      .result-item div, .result-item ul {
        margin: 0;
        color: var(--muted);
        line-height: 1.48;
        font-size: 14px;
      }
      .result-item ul { padding-left: 18px; }
      .clarify-btn {
        min-height: 28px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: white;
        color: var(--ink);
        padding: 0 10px;
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
      }
      .clarify-btn:disabled { opacity: 0.42; cursor: not-allowed; }
      .loading {
        display: none;
        color: var(--muted);
        font-size: 13px;
        font-weight: 800;
      }
      .loading.active { display: inline; }
      .error {
        display: none;
        margin-top: 12px;
        border: 1px solid #fecaca;
        border-radius: 12px;
        background: #fff1f2;
        color: #991b1b;
        padding: 12px;
        font-size: 14px;
      }
      .error.active { display: block; }
      .critical {
        display: none;
        margin-bottom: 12px;
        border: 1px solid #fed7aa;
        border-radius: 12px;
        background: #fff7ed;
        color: #7c2d12;
        padding: 12px;
        font-size: 13px;
        line-height: 1.45;
      }
      .critical.active { display: block; }
      .critical ul { margin: 8px 0 0; padding-left: 18px; }
      .document-list {
        grid-column: 1 / -1;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .intro-card {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0;
        width: 100%;
        min-height: 100vh;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 0;
        background: transparent;
        isolation: isolate;
        margin: 0;
        overflow: hidden;
        padding: 32px;
        text-align: center;
        box-shadow: none;
      }
      .intro-card::before {
        content: "";
        position: absolute;
        top: -18vh;
        left: -18vw;
        width: 136vw;
        height: 136vh;
        z-index: 0;
        opacity: 0.74;
        pointer-events: none;
        filter: blur(12px);
        background:
          repeating-linear-gradient(105deg, rgba(255, 255, 255, 0.96) 0px, rgba(255, 255, 255, 0.96) 8%, rgba(255, 255, 255, 0) 11%, rgba(255, 255, 255, 0) 13%, rgba(255, 255, 255, 0.88) 17%),
          repeating-linear-gradient(105deg, rgba(125, 178, 255, 0.42) 9%, rgba(167, 184, 255, 0.36) 15%, rgba(116, 224, 239, 0.28) 22%, rgba(199, 181, 255, 0.26) 28%, rgba(105, 178, 255, 0.34) 34%);
        background-size: 300% 300%, 210% 210%;
        animation: aurora-drift 64s linear infinite;
      }
      .intro-card::after {
        content: none;
      }
      .intro-card > * { position: relative; z-index: 1; }
      .intro-eyebrow {
        color: #a8a29e;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .intro-card h1,
      .intro-card h2 {
        max-width: none;
        margin: 0;
        color: #05060f;
        font-size: clamp(76px, 15vw, 192px);
        line-height: 0.9;
        letter-spacing: 0;
        font-weight: 900;
      }
      .intro-card p {
        max-width: 920px;
        margin: 32px 0 0;
        color: rgba(37, 37, 42, 0.75);
        font-size: clamp(24px, 2.8125vw, 36px);
        line-height: 1.22;
        font-weight: 200;
      }
      .intro-actions {
        display: flex;
        margin-top: 36px;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
      }
      .intro-actions .btn {
        min-height: 48px;
        border: 0;
        padding: 0 28px;
        border-radius: 9999px;
        background: #05060f;
        box-shadow: 0 18px 50px rgba(5, 6, 15, 0.18);
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
      }
      .intro-words {
        width: min(760px, 100%);
        margin-top: 36px;
        color: rgba(5, 6, 15, 0.3);
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
        letter-spacing: 0.08em;
      }
      @keyframes aurora-drift {
        0% { background-position: 0% 50%, 0% 50%; }
        50% { background-position: 100% 50%, 100% 50%; }
        100% { background-position: 0% 50%, 0% 50%; }
      }
      .signals-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(300px, 0.7fr);
        gap: 16px;
      }
      .signal-stack {
        display: grid;
        gap: 12px;
      }
      .source-list {
        display: grid;
        gap: 8px;
        max-height: 420px;
        overflow: auto;
      }
      .source-list a {
        display: block;
        color: var(--ink);
        font-size: 13px;
        line-height: 1.35;
        word-break: break-word;
      }
      .ideation-canvas {
        position: relative;
      }
      .ideation-flow-frame {
        position: relative;
        height: 760px;
        min-height: 640px;
        overflow: hidden;
        touch-action: none;
        cursor: grab;
        border: 1px solid #e7e5e4;
        border-radius: 16px;
        background-color: white;
        background-image: radial-gradient(#d6d3d1 0.65px, transparent 0.65px);
        background-size: 22px 22px;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }
      .ideation-flow-viewport {
        width: 920px;
        margin: 72px 0 120px;
        transform-origin: top left;
        transition: none;
        will-change: transform;
      }
      .ideation-flow-frame.dragging {
        cursor: grabbing;
        user-select: none;
      }
      .workflow-node {
        position: relative;
        width: 760px;
        margin: 0 auto;
      }
      .workflow-node + .workflow-node { margin-top: 58px; }
      .workflow-shell {
        border-radius: 16px;
        background: rgba(255,255,255,0.80);
        padding: 12px;
        backdrop-filter: blur(4px);
      }
      .workflow-inner {
        border-radius: 14px;
        background: rgba(255,255,255,0.72);
        padding: 16px;
      }
      .workflow-handle {
        position: absolute;
        left: 50%;
        z-index: 2;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(168, 162, 158, 0.62);
        border-radius: 50%;
        background: white;
        transform: translateX(-50%);
      }
      .workflow-handle.top { top: -7px; }
      .workflow-handle.bottom { bottom: -7px; }
      .workflow-connector {
        width: 2px;
        height: 58px;
        margin: 0 auto;
        background: rgba(168, 162, 158, 0.42);
      }
      .workflow-context {
        margin-bottom: 16px;
        border-bottom: 1px solid #e7e5e4;
        padding-bottom: 16px;
      }
      .workflow-eyebrow, .workflow-context strong {
        display: block;
        color: #a8a29e;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .workflow-context div {
        margin-top: 4px;
        color: #44403c;
        font-size: 14px;
        line-height: 1.7;
      }
      .workflow-prompt {
        margin: 4px 0 0;
        color: var(--ink);
        font-size: 20px;
        font-weight: 700;
        line-height: 1.35;
      }
      .workflow-output {
        margin-top: 8px;
        color: #78716c;
        font-size: 13px;
        font-weight: 500;
      }
      .flow-controls {
        position: sticky;
        left: 18px;
        bottom: 18px;
        z-index: 4;
        display: inline-grid;
        overflow: hidden;
        border: 1px solid rgba(5, 6, 15, 0.12);
        border-radius: 10px;
        background: white;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.10);
      }
      .flow-controls button {
        width: 38px;
        height: 36px;
        border: 0;
        border-bottom: 1px solid rgba(5, 6, 15, 0.10);
        background: white;
        color: rgba(5, 6, 15, 0.72);
        font-size: 24px;
        line-height: 1;
      }
      .flow-controls button:last-child { border-bottom: 0; font-size: 18px; }
      .challenge-card, .route-summary, .idea-card {
        border: 1px solid #e7e5e4;
        border-radius: 16px;
        background: white;
        padding: 16px;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }
      .challenge-card strong, .route-summary strong, .idea-card strong {
        display: block;
        font-size: 13px;
        margin-bottom: 6px;
      }
      .challenge-card div, .route-summary div {
        color: var(--muted);
        line-height: 1.48;
        font-size: 14px;
      }
      .choice-board {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 16px;
      }
      .choice-column {
        display: grid;
        align-content: start;
        gap: 8px;
      }
      .choice-column h3 {
        margin: 0;
        font-size: 13px;
      }
      .choice-card {
        display: flex;
        min-height: 248px;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #e7e5e4;
        border-radius: 16px;
        background: white;
        color: var(--ink);
        padding: 16px;
        text-align: left;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
        transition: border-color 160ms ease, box-shadow 160ms ease;
      }
      .choice-card.active {
        border-color: #0c0a09;
        box-shadow: inset 0 0 0 1px #0c0a09, 0 10px 24px rgba(15, 23, 42, 0.10);
      }
      .choice-card:hover {
        border-color: #d6d3d1;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
      }
      .choice-card strong {
        display: block;
        max-height: 72px;
        overflow: hidden;
        border-bottom: 1px solid #e7e5e4;
        margin-bottom: 12px;
        padding-bottom: 12px;
        font-size: 16px;
        font-weight: 700;
        line-height: 1.5;
      }
      .choice-card span {
        display: block;
        min-height: 0;
        flex: 1;
        overflow-y: auto;
        color: #57534e;
        font-size: 14px;
        line-height: 1.45;
      }
      .ideas-grid {
        display: grid;
        gap: 12px;
        margin-top: 14px;
      }
      .idea-card h3 {
        margin: 0 0 14px;
        color: #09090b;
        font-size: 20px;
        font-weight: 750;
        line-height: 1.28;
        letter-spacing: 0;
      }
      .idea-field {
        border-top: 1px solid #e7e5e4;
        padding-top: 12px;
        margin-top: 12px;
      }
      .idea-field span {
        display: block;
        color: #78716c;
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 6px;
        text-transform: uppercase;
      }
      .idea-field div, .idea-field ul {
        margin: 0;
        color: #57534e;
        font-size: 14px;
        line-height: 1.55;
      }
      .workflow-node.output-node .idea-card {
        background: white;
      }
      .workflow-node.output-node .idea-card + .idea-card {
        margin-top: 12px;
      }
      .idea-set-board {
        display: flex;
        flex-wrap: nowrap;
        justify-content: center;
        align-items: flex-start;
        gap: 28px;
      }
      .idea-set {
        flex: 0 0 760px;
        width: 760px;
      }
      .workflow-node.output-node {
        left: 50%;
        transform: translateX(-50%);
        width: max-content;
        max-width: none;
      }
      .workflow-node.output-node .workflow-shell,
      .workflow-node.output-node .workflow-inner {
        width: max-content;
      }
      .idea-card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .idea-select {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #57534e;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .idea-select input { accent-color: #0c0a09; }
      .manual-idea-form {
        display: grid;
        gap: 10px;
        margin-top: 12px;
        border: 1px solid #e7e5e4;
        border-radius: 16px;
        background: white;
        padding: 16px;
      }
      .idea-set .route-summary {
        margin-bottom: 0;
        border-radius: 16px 16px 0 0;
        padding: 18px 20px;
      }
      .idea-set .route-summary strong {
        color: #09090b;
        font-size: 18px;
        font-weight: 750;
      }
      .idea-set .route-summary div {
        color: #57534e;
        font-size: 15px;
        line-height: 1.45;
      }
      .idea-set .idea-card {
        border-radius: 16px;
        padding: 24px 22px;
      }
      .idea-set .route-summary + .idea-card {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        margin-top: -1px;
      }
      .idea-set .idea-card h3 {
        font-size: 24px;
        line-height: 1.2;
      }
      .manual-idea-form textarea {
        min-height: 70px;
        resize: vertical;
      }
      .manual-idea-form .btn {
        justify-self: start;
      }
      .workflow-action {
        display: flex;
        justify-content: flex-end;
        margin-top: 18px;
      }
      .workflow-action .btn,
      .idea-set > .btn,
      .manual-idea-form .btn {
        border-radius: 999px;
        background: #0c0a09;
        color: white;
        padding: 12px 18px;
        font-size: 14px;
        font-weight: 650;
      }
      .idea-set > .btn {
        margin-top: 12px;
        width: 100%;
      }
      .workflow-action .btn:disabled,
      .idea-set > .btn:disabled {
        background: #e7e5e4;
        color: #78716c;
      }
      @media (max-width: 920px) {
        .shell { display: block; height: auto; min-height: 100vh; }
        .topbar { position: sticky; top: 0; z-index: 10; }
        .layout { display: block; }
        .layout, .chat-layout, .signals-layout, .grid, .choice-board { grid-template-columns: 1fr; }
        .sidebar { position: static; }
        .section-head { display: block; }
        .section { width: min(100% - 28px, 1440px); }
        .composer { grid-template-columns: 1fr; }
        .msg { max-width: 100%; }
        .ideation-flow-viewport, .workflow-node { width: min(760px, calc(100vw - 72px)); }
        .workflow-prompt { font-size: 24px; }
        .intro-card { min-height: 100vh; }
      }
    </style>
  </head>
  <body>
    <main id="app-shell" class="shell splash-mode">
      <header class="topbar">
        <div class="brand">
          <span>Sistema de innovación</span>
          <h1>Chat estratégico</h1>
        </div>
        <div id="phase-status" class="status">1</div>
      </header>

      <div class="layout">
        <aside class="sidebar">
          <p class="sidebar-kicker">Fases</p>
          <button id="step-registration" class="step active" type="button">
            <span class="num">1</span>
            <span><strong>Registro</strong><span>Perfil, empresa y categoría</span></span>
          </button>
          <button id="step-diagnosis" class="step" type="button">
            <span class="num">2</span>
            <span><strong>Diagnóstico</strong><span>Preguntas IA y reto real</span></span>
          </button>
          <button id="step-signals" class="step" type="button">
            <span class="num">3</span>
            <span><strong>Señales</strong><span>Social listening, tendencias y competidores</span></span>
          </button>
          <button id="step-ideation" class="step" type="button">
            <span class="num">4</span>
            <span><strong>Ideación</strong><span>Ruptura, gap e insight</span></span>
          </button>
          <p class="sidebar-note">Este demo usa la API pública de Núcleo. Registro prepara contexto, Diagnóstico reinterpreta el reto, Señales consulta fuentes públicas e Ideación genera ideas con OpenAI.</p>
        </aside>

        <section class="workspace">
          <div id="splash-section" class="section splash">
            <div class="intro-card">
              <h1>Núcleo</h1>
              <p>Una solución que ayuda a encontrar el reto correcto y convertirlo en acción.</p>
              <div class="intro-actions">
                <button id="start-clean-demo" class="btn primary" type="button">Iniciar demo</button>
              </div>
              <div class="intro-words">Diagnostica · Idea · Prueba · Evalúa</div>
            </div>
          </div>

          <div id="registration-section" class="section">
            <div class="section-head">
              <div>
                <h2>Registro</h2>
                <p>Completa el perfil de licencia, empresa y categoría. Estos datos viajan al diagnóstico para que la IA no empiece desde cero.</p>
              </div>
            </div>
            <form id="registration-form" class="grid">
              <div class="group-title">Perfil / licencia</div>
              <label>Nombre<input name="profileName" required /></label>
              <label>Email<input name="profileEmail" type="email" required /></label>
              <label>Cargo<input name="profileRole" required /></label>
              <label>Área<input name="profileArea" required /></label>
              <label>País<input name="profileCountry" required /></label>
              <label>Personas a cargo<input name="peopleManaged" type="number" min="0" /></label>

              <div class="group-title">Empresa</div>
              <label>Nombre empresa<input name="companyName" required /></label>
              <label>Sector / categoría<input name="sectorCategory" required /></label>
              <label>Número empleados<input name="employeeCount" type="number" min="1" /></label>
              <label>Años en mercado<input name="yearsInMarket" type="number" min="0" /></label>
              <label>Países donde opera<input name="operatingCountries" placeholder="Colombia, Panamá" required /></label>
              <label>A quién le vende<input name="sellsTo" required /></label>
              <label>Modelo de cobro<input name="revenueModel" required /></label>
              <label>Web<input name="website" type="url" placeholder="https://..." /></label>
              <label class="full">Canales de adquisición<input name="acquisitionChannels" placeholder="referidos, venta consultiva" /></label>

              <div class="group-title">Categoría</div>
              <label>Ticket promedio<input name="averageTicket" /></label>
              <label>Ciclo venta promedio días<input name="averageSalesCycleDays" type="number" min="0" /></label>
              <label>Competidor 1<input name="competitor1" /></label>
              <label>Web competidor 1<input name="competitor1Web" type="url" /></label>
              <label>Competidor 2<input name="competitor2" /></label>
              <label>Web competidor 2<input name="competitor2Web" type="url" /></label>
              <label>Competidor 3<input name="competitor3" /></label>
              <label>Web competidor 3<input name="competitor3Web" type="url" /></label>
              <label class="full">Notas de categoría<textarea name="categoryNotes"></textarea></label>
              <label class="full">Cargar archivos<input id="document-files" name="documentFiles" type="file" multiple accept=".txt,.md,.csv,.json,.xml,.html,.pdf,.docx,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" /></label>
              <div id="document-list" class="document-list"></div>
              <label class="full">Documentos o notas cargadas<textarea name="documents" placeholder="Pega aquí resumen de documentos, contexto interno o enlaces relevantes."></textarea></label>
            </form>
            <div class="actions">
              <button id="start-diagnosis" class="btn primary" type="button">Guardar registro y diagnosticar</button>
            </div>
          </div>

          <div id="diagnosis-section" class="section diagnosis-page">
            <div class="section-head diagnosis-phase-head">
              <div>
                <p class="eyebrow">Revisión de fase</p>
                <h2>Diagnóstico estratégico</h2>
                <p>Revisa esta lectura y confirma el diagnóstico antes de leer señales externas.</p>
              </div>
              <div class="actions" style="margin-top:0;">
                <span id="loading" class="loading">Pensando...</span>
                <button id="confirm-diagnosis-signals" class="btn primary" type="button" disabled>Confirmar y consultar señales</button>
              </div>
            </div>
            <div class="chat-layout diagnosis-layout">
              <div class="diagnosis-chat-panel">
                <div id="messages" class="messages"></div>
                <div class="composer">
                  <textarea id="user-message" placeholder="Escribe tu respuesta o describe el reto..."></textarea>
                  <button id="send-message" class="btn primary" type="button">Enviar</button>
                </div>
                <div class="actions">
                  <button id="complete-diagnosis" class="btn" type="button">Cerrar diagnóstico</button>
                </div>
                <div id="error" class="error"></div>
              </div>
              <div id="critical-missing" class="critical"></div>
              <div id="result" class="result diagnosis-output">
                <p style="color: var(--muted); line-height: 1.6;">Cuando cierres el diagnóstico, aquí aparecerá la lectura diagnóstica.</p>
              </div>
            </div>
          </div>

          <div id="signals-section" class="section">
            <div class="section-head">
              <div>
                <h2>Señales públicas</h2>
                <p>Consulta social listening, tendencias y competidores con búsqueda web real. La síntesis solo debe trabajar sobre evidencia encontrada.</p>
              </div>
              <span id="signals-loading" class="loading">Buscando...</span>
            </div>
            <div class="signals-layout" style="grid-template-columns: minmax(0, 1fr);">
              <div class="panel">
                <h3 style="margin:0 0 12px;">Análisis</h3>
                <div id="signals-result" class="result">
                  <p style="color: var(--muted); line-height: 1.6;">Confirma el diagnóstico para ejecutar Señales.</p>
                </div>
                <div id="signals-error" class="error"></div>
                <div class="actions">
                  <button id="go-ideation" class="btn primary" type="button" disabled>Diseñar ruta de ideación</button>
                </div>
              </div>
              <aside class="panel" hidden>
                <h3 style="margin:0 0 12px;">Fuentes y vacíos</h3>
                <div id="signals-sources" class="source-list">
                  <p style="color: var(--muted); line-height: 1.6;">Aquí aparecerán las fuentes consultadas y vacíos de evidencia.</p>
                </div>
              </aside>
            </div>
          </div>

          <div id="ideation-section" class="section">
            <div class="section-head">
              <div>
                <h2>Ideación disruptiva</h2>
                <p>Elige una ruta de ruptura, un gap y un insight. La IA traducirá casos disruptivos al reto seleccionado para generar una idea por vez y acumular sets por ruta.</p>
              </div>
              <span id="ideation-loading" class="loading">Ideando...</span>
            </div>
            <div class="panel">
              <div id="ideation-canvas" class="ideation-canvas">
                <p style="color: var(--muted); line-height: 1.6;">Consulta Señales para cargar rutas, gaps e insights.</p>
              </div>
              <div id="ideation-error" class="error"></div>
              <div id="ideation-result" class="ideas-grid"></div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <script>
      const storageKey = "nucleo-current-cycle-v4-clean";

      const state = {
        registration: null,
        registrationRecord: null,
        uploadedDocuments: [],
        messages: [],
        diagnosis: null,
        signals: null,
        ideationOptions: null,
        ideationSelection: {
          ruptureType: null,
          gapTitle: null,
          insightTitle: null
        },
        ideationZoom: 0.88,
        ideationPan: { x: 0, y: 0 },
        ideation: null,
        ideationSets: [],
        criticalMissing: [],
        correctedSections: [],
        clarificationTarget: null,
        activeStep: "splash",
        started: false,
        cycleId: "cycle-" + Date.now()
      };

      const clarifiableSections = {
        symptoms: "Síntomas",
        causes: "Causas",
        tensions: "Tensiones",
        metrics: "Métricas",
        restrictions: "Restricciones",
        notWorthAttackingYet: "Qué no conviene atacar todavía"
      };

      const $ = (id) => document.getElementById(id);
      const form = $("registration-form");
      const loading = $("loading");
      const errorBox = $("error");

      resetLegacyDemoState();

      $("start-clean-demo").addEventListener("click", () => {
        state.started = true;
        $("app-shell").classList.remove("splash-mode");
        $("splash-section").classList.add("hidden");
        setStep("registration");
        persistDraft();
      });

      $("start-diagnosis").addEventListener("click", async () => {
        if (!form.reportValidity()) return;
        setLoading(true);
        setError("");
        try {
          const registrationPayload = {
            cycleId: state.cycleId,
            ...readRegistration()
          };
          const response = await fetch("/api/registration", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(registrationPayload)
          });
          const data = await parseResponse(response);
          state.registrationRecord = data.registration;
          if (!data.registration.output.readiness.isReadyForDiagnosis) {
            setError("Registro incompleto: " + data.registration.output.readiness.blockingIssues.join(", "));
            return;
          }
          state.registration = data.registration.output.contextForDiagnosis;
          setStep("diagnosis");
          if (state.messages.length === 0) {
            addMessage("assistant", "Cuéntame el reto como lo dirías en una reunión. Necesito entender qué está pasando antes de buscar ideas.");
          }
          persistDraft();
        } catch (error) {
          setError(error.message || "No se pudo guardar Registro.");
        } finally {
          setLoading(false);
        }
      });

      $("step-registration").addEventListener("click", () => setStep("registration"));
      $("step-diagnosis").addEventListener("click", () => {
        if (state.registration) setStep("diagnosis");
      });
      $("step-signals").addEventListener("click", () => {
        if (state.diagnosis || state.signals) setStep("signals");
      });
      $("step-ideation").addEventListener("click", () => {
        if (state.signals) openIdeation();
      });
      $("send-message").addEventListener("click", sendMessage);
      $("complete-diagnosis").addEventListener("click", completeDiagnosis);
      $("confirm-diagnosis-signals").addEventListener("click", generateSignals);
      $("go-ideation").addEventListener("click", openIdeation);
      $("document-files").addEventListener("change", uploadSelectedDocuments);
      $("result").addEventListener("click", (event) => {
        const button = event.target?.closest?.("[data-clarify-section]");
        if (!button) return;
        startClarification(button.dataset.clarifySection);
      });
      form.addEventListener("input", persistDraft);

      function setStep(step) {
        if (step !== "splash") {
          state.started = true;
          $("app-shell").classList.remove("splash-mode");
          $("splash-section").classList.add("hidden");
        }
        state.activeStep = step;
        $("registration-section").classList.toggle("active", step === "registration");
        $("diagnosis-section").classList.toggle("active", step === "diagnosis");
        $("signals-section").classList.toggle("active", step === "signals");
        $("ideation-section").classList.toggle("active", step === "ideation");
        $("step-registration").classList.toggle("active", step === "registration");
        $("step-diagnosis").classList.toggle("active", step === "diagnosis");
        $("step-signals").classList.toggle("active", step === "signals");
        $("step-ideation").classList.toggle("active", step === "ideation");
        $("step-registration").classList.toggle("done", Boolean(state.registration));
        $("step-diagnosis").classList.toggle("done", Boolean(state.diagnosis) && canAdvanceToSignals());
        $("step-signals").classList.toggle("done", Boolean(state.signals));
        $("step-ideation").classList.toggle("done", Boolean(state.ideation) || state.ideationSets.length > 0);
        const phaseNumber = { registration: "1", diagnosis: "2", signals: "3", ideation: "4" }[step] || "1";
        $("phase-status").textContent = phaseNumber;
        persistDraft();
      }

      function readRegistration() {
        const value = (name) => form.elements[name]?.value?.trim() || "";
        const numberValue = (name) => {
          const raw = value(name);
          return raw ? Number(raw) : undefined;
        };
        const list = (name) => value(name).split(",").map((item) => item.trim()).filter(Boolean);
        const competitors = [
          [value("competitor1"), value("competitor1Web")],
          [value("competitor2"), value("competitor2Web")],
          [value("competitor3"), value("competitor3Web")]
        ].filter((item) => item[0] && item[1]).map((item) => ({ name: item[0], website: item[1] }));
        const documents = [
          ...state.uploadedDocuments,
          ...(value("documents") ? [{ id: "doc-notes", name: "Notas cargadas", summary: value("documents"), extractionStatus: "TEXT_PROVIDED" }] : [])
        ];

        return {
          profileLicense: {
            licenseId: "license-demo",
            name: value("profileName"),
            role: value("profileRole"),
            area: value("profileArea"),
            email: value("profileEmail"),
            country: value("profileCountry"),
            peopleManaged: numberValue("peopleManaged")
          },
          company: {
            companyId: slug(value("companyName")) || "company-demo",
            name: value("companyName"),
            sectorCategory: value("sectorCategory"),
            employeeCount: numberValue("employeeCount"),
            yearsInMarket: numberValue("yearsInMarket"),
            operatingCountries: list("operatingCountries"),
            sellsTo: value("sellsTo"),
            revenueModel: value("revenueModel"),
            website: value("website") || undefined,
            acquisitionChannels: list("acquisitionChannels")
          },
          category: {
            averageTicket: value("averageTicket") || undefined,
            averageSalesCycleDays: numberValue("averageSalesCycleDays"),
            competitors,
            notes: value("categoryNotes") || undefined
          },
          uploadedDocuments: documents
        };
      }

      async function uploadSelectedDocuments(event) {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        setLoading(true);
        setError("");
        try {
          const documents = await Promise.all(files.map(readFileForUpload));
          const response = await fetch("/api/registration/documents", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ cycleId: state.cycleId, documents })
          });
          const data = await parseResponse(response);
          state.uploadedDocuments = [...state.uploadedDocuments, ...data.documents];
          renderDocumentList();
          persistDraft();
        } catch (error) {
          setError(error.message || "No se pudieron cargar los documentos.");
        } finally {
          setLoading(false);
        }
      }

      function readFileForUpload(file) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          const baseDocument = {
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size
          };
          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve({ ...baseDocument, text: reader.result });
              return;
            }

            resolve({
              ...baseDocument,
              dataBase64: arrayBufferToBase64(reader.result)
            });
          };
          reader.onerror = () => resolve({
            ...baseDocument,
            summary: "Archivo cargado, pero no se pudo leer desde el navegador."
          });
          if (/text|json|csv|markdown|xml|html|javascript|plain/i.test(file.type) || /\\.(txt|md|csv|json|xml|html)$/i.test(file.name)) {
            reader.readAsText(file);
          } else if (/pdf|wordprocessingml|spreadsheetml|excel/i.test(file.type) || /\\.(pdf|docx|xlsx|xls)$/i.test(file.name)) {
            reader.readAsArrayBuffer(file);
          } else {
            resolve({
              ...baseDocument,
              summary: "Archivo cargado. Extraccion automatica no disponible para este tipo en el demo."
            });
          }
        });
      }

      function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
      }

      function renderDocumentList() {
        $("document-list").textContent = state.uploadedDocuments.length
          ? "Archivos cargados: " + state.uploadedDocuments.map((document) => document.name).join(", ")
          : "";
      }

      async function sendMessage() {
        const textarea = $("user-message");
        const content = textarea.value.trim();
        if (!content || !state.registration) return;
        textarea.value = "";
        addMessage("user", content);
        if (state.clarificationTarget && state.diagnosis) {
          await reinterpretDiagnosis(content);
          return;
        }
        await requestQuestion();
      }

      function startClarification(section) {
        if (!state.diagnosis || !clarifiableSections[section]) return;
        state.clarificationTarget = {
          section,
          label: clarifiableSections[section]
        };
        addMessage(
          "assistant",
          "Aclara " + clarifiableSections[section] + " con evidencia concreta. No lo formules para defender la lectura anterior; escribe lo que obliga a corregir el diagnóstico."
        );
        updateClarifyButtons();
        $("user-message").focus();
        persistDraft();
      }

      async function reinterpretDiagnosis(clarification) {
        const target = state.clarificationTarget;
        if (!target || !state.diagnosis) return;

        state.correctedSections.push({
          section: target.section,
          clarification
        });
        state.clarificationTarget = null;
        setLoading(true);
        setError("");
        try {
          const response = await fetch("/api/diagnosis/reinterpret", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              input: buildPayload(),
              previousDiagnosis: state.diagnosis
            })
          });
          const data = await parseResponse(response);
          renderCriticalMissing(data.criticalMissing || []);
          renderDiagnosis(data.diagnosis);
          if (canAdvanceToSignals()) {
            addMessage("assistant", "Reinterpreté el diagnóstico usando la aclaración de " + target.label + ". " + (data.changeSummary?.summary || ""));
          } else {
            addMessage("assistant", "Reinterpreté el diagnóstico, pero no queda cerrado. Responde en el chat las piezas críticas que faltan antes de pasar a Señales.");
          }
        } catch (error) {
          state.correctedSections.pop();
          state.clarificationTarget = target;
          setError(error.message || "No se pudo reinterpretar el diagnóstico.");
        } finally {
          setLoading(false);
          updateClarifyButtons();
          persistDraft();
        }
      }

      async function requestQuestion() {
        setLoading(true);
        setError("");
        try {
          const response = await fetch("/api/diagnosis/question", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(buildPayload())
          });
          const data = await parseResponse(response);
          renderCriticalMissing(data.criticalMissing || []);
          if (data.diagnosis) {
            renderDiagnosis(data.diagnosis);
            if (canAdvanceToSignals()) {
              addMessage("assistant", "Ya tengo suficiente contexto. Cerré el diagnóstico y dejé el resultado a la derecha.");
            } else {
              addMessage("assistant", "No cierro el diagnóstico todavía. Responde en el chat las piezas críticas que faltan.");
            }
          } else if (data.question) {
            addMessage("assistant", data.question.question);
          } else if ((data.criticalMissing || []).length > 0) {
            addMessage("assistant", "No cierro el diagnóstico todavía. Responde en el chat las piezas críticas que faltan.");
          }
        } catch (error) {
          setError(error.message || "No se pudo consultar la IA.");
        } finally {
          setLoading(false);
        }
      }

      async function completeDiagnosis() {
        if (!state.registration || state.messages.filter((item) => item.role === "user").length === 0) {
          setError("Escribe al menos una respuesta de diagnóstico antes de cerrar.");
          return;
        }
        setLoading(true);
        setError("");
        try {
          const response = await fetch("/api/diagnosis/complete", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(buildPayload())
          });
          const data = await parseResponse(response);
          renderCriticalMissing(data.criticalMissing || []);
          renderDiagnosis(data.diagnosis);
          if (canAdvanceToSignals()) {
            addMessage("assistant", "Diagnóstico cerrado. Revisa el reto recomendado y el brief para ideación.");
          } else {
            addMessage("assistant", "No cierro el diagnóstico todavía. Responde en el chat las piezas críticas que faltan.");
          }
        } catch (error) {
          setError(error.message || "No se pudo cerrar el diagnóstico.");
          if (!canAdvanceToSignals()) {
            addMessage("assistant", "Responde esas piezas críticas en el chat y vuelve a cerrar el diagnóstico.");
          }
        } finally {
          setLoading(false);
        }
      }

      async function generateSignals() {
        if (!state.diagnosis) {
          setError("Cierra el diagnóstico antes de consultar señales.");
          return;
        }
        if (!canAdvanceToSignals()) {
          setError("Antes de consultar Señales, responde las piezas críticas pendientes y vuelve a cerrar el diagnóstico.");
          return;
        }
        setLoading(true);
        setError("");
        setSignalsError("");
        try {
          const response = await fetch("/api/signals/cycles/" + encodeURIComponent(state.cycleId) + "/generate", {
            method: "POST",
            headers: { "content-type": "application/json" }
          });
          const data = await parseResponse(response);
          state.signals = data.signals.output;
          renderSignals(state.signals);
          setStep("signals");
          addMessage("assistant", "Señales consultadas. Revisa los 2 gaps y 2 insights para pasar a ideación.");
        } catch (error) {
          setSignalsError(error.message || "No se pudo consultar Señales.");
          setStep("signals");
        } finally {
          setLoading(false);
          persistDraft();
        }
      }

      function buildPayload() {
        return {
          cycleId: state.cycleId,
          ...state.registration,
          dialogMessages: state.messages.map((item) => ({ role: item.role, content: item.content })),
          userClarifications: [],
          previousCycleLearnings: [],
          correctedSections: state.correctedSections
        };
      }

      function addMessage(role, content) {
        state.messages.push({ role, content });
        const node = document.createElement("div");
        node.className = "msg " + role;
        node.textContent = content;
        $("messages").appendChild(node);
        $("messages").scrollTop = $("messages").scrollHeight;
        persistDraft();
      }

      function renderDiagnosis(diagnosis) {
        const previousDiagnosis = state.diagnosis ? JSON.stringify(state.diagnosis) : "";
        const nextDiagnosis = JSON.stringify(diagnosis);
        state.diagnosis = diagnosis;
        if (previousDiagnosis && previousDiagnosis !== nextDiagnosis) {
          state.signals = null;
          state.ideationOptions = null;
          state.ideation = null;
          state.ideationSets = [];
          state.ideationSelection = { ruptureType: null, gapTitle: null, insightTitle: null };
          $("signals-result").innerHTML = "";
          $("signals-sources").innerHTML = "";
          $("ideation-canvas").innerHTML = "";
          $("ideation-result").innerHTML = "";
          setSignalsError("");
          setIdeationError("");
        }
        $("result").innerHTML = "";

        const challenge = document.createElement("section");
        challenge.className = "diagnosis-challenge";
        const challengeKicker = document.createElement("p");
        challengeKicker.className = "diagnosis-card-kicker";
        challengeKicker.textContent = "Reto recomendado";
        const challengeTitle = document.createElement("h3");
        challengeTitle.textContent = diagnosis.recommendedChallenge || "Sin reto recomendado.";
        const challengeReason = document.createElement("p");
        challengeReason.textContent = diagnosis.whyThisChallenge || "Sin justificación declarada.";
        challenge.append(challengeKicker, challengeTitle, challengeReason);
        $("result").appendChild(challenge);

        const reading = document.createElement("section");
        reading.className = "diagnosis-reading";
        const readingTitle = document.createElement("h3");
        readingTitle.textContent = "Lectura diagnóstica";
        const rowList = document.createElement("div");
        rowList.className = "diagnosis-row-list";
        const items = [
          ["symptoms", "Síntomas observados", diagnosis.symptoms],
          ["causes", "Causas probables", diagnosis.causes],
          ["tensions", "Tensión estratégica", diagnosis.tensions],
          ["metrics", "Métrica prioritaria", diagnosis.metrics],
          ["restrictions", "Restricciones no negociables", diagnosis.restrictions],
          ["notWorthAttackingYet", "No conviene atacar todavía", diagnosis.notWorthAttackingYet],
          ["assumptionToQuestion", "Supuesto a cuestionar", diagnosis.assumptionToQuestion]
        ];
        for (const [key, label, value] of items) {
          const box = document.createElement("div");
          box.className = "diagnosis-row";
          const header = document.createElement("div");
          header.className = "diagnosis-row-head";
          const title = document.createElement("strong");
          title.className = "diagnosis-row-title";
          title.textContent = label;
          header.appendChild(title);
          if (clarifiableSections[key]) {
            const clarifyButton = document.createElement("button");
            clarifyButton.className = "clarify-btn";
            clarifyButton.type = "button";
            clarifyButton.dataset.clarifySection = key;
            clarifyButton.textContent = "Aclarar";
            clarifyButton.disabled = Boolean(state.clarificationTarget);
            header.appendChild(clarifyButton);
          }
          box.appendChild(header);
          const body = document.createElement("div");
          body.className = "diagnosis-row-body";
          if (Array.isArray(value)) {
            const ul = document.createElement("ul");
            for (const item of value.length ? value : ["Sin dato declarado"]) {
              const li = document.createElement("li");
              li.textContent = item;
              ul.appendChild(li);
            }
            body.appendChild(ul);
          } else {
            body.textContent = value || "Sin dato declarado";
          }
          box.appendChild(body);
          rowList.appendChild(box);
        }
        reading.append(readingTitle, rowList);
        $("result").appendChild(reading);

        const brief = document.createElement("section");
        brief.className = "diagnosis-brief";
        const briefTitle = document.createElement("h3");
        briefTitle.textContent = "Brief para ideación";
        const briefText = document.createElement("p");
        briefText.textContent = diagnosis.ideationBrief || "Sin brief para ideación.";
        brief.append(briefTitle, briefText);
        $("result").appendChild(brief);

        $("confirm-diagnosis-signals").disabled = !state.diagnosis || !canAdvanceToSignals() || Boolean(state.clarificationTarget);
        persistDraft();
      }

      function renderSignals(signals, resetIdeation = true) {
        state.signals = signals;
        if (resetIdeation) {
          state.ideationOptions = null;
          state.ideation = null;
          state.ideationSets = [];
          state.ideationSelection = { ruptureType: null, gapTitle: null, insightTitle: null };
          $("ideation-result").innerHTML = "";
          setIdeationError("");
        }
        const sections = [
          ["gaps", "Gaps", signals.gaps],
          ["insights", "Insights", signals.insights],
          ["analisisSocialListening", "Social listening usado", signals.analisisSocialListening],
          ["analisisTendencias", "Tendencias usadas", signals.analisisTendencias],
          ["analisisCompetidores", "Competidores usados", signals.analisisCompetidores],
          ["memoriaEmpresa", "Memoria empresa", signals.memoriaEmpresa]
        ];
        $("signals-result").innerHTML = "";
        for (const [key, label, value] of sections) {
          const box = document.createElement("div");
          box.className = "result-item";
          const title = document.createElement("strong");
          title.textContent = label;
          box.appendChild(title);

          if (key === "gaps") {
            box.appendChild(renderBulletList(value.map((item, index) => "Gap " + (index + 1) + " · " + item.title + " [" + item.evidenceBase + "]: Mercado: " + item.potencialMercado + " Brecha: " + item.brecha)));
          } else if (key === "insights") {
            box.appendChild(renderBulletList(value.map((item, index) => "Insight " + (index + 1) + " · " + item.title + " [" + item.evidenceBase + "]: " + item.cliente + " observa/hace: " + item.comportamientoObservado + " Motivación: " + item.motivacionODeseo)));
          } else if (key === "memoriaEmpresa") {
            const memoryItems = [
              ...(value.companyPatterns || []).map((item) => "Patrón: " + item),
              ...(value.previousLearnings || []).map((item) => "Aprendizaje: " + item),
              ...(value.avoidRepeating || []).map((item) => "Evitar repetir: " + item)
            ];
            box.appendChild(renderBulletList(memoryItems.length ? memoryItems : ["Sin memoria previa de empresa."]));
          } else {
            const summary = document.createElement("div");
            summary.textContent = value.summary;
            box.appendChild(summary);
            box.appendChild(renderBulletList([...(value.findings || []), ...(value.limitations || []).map((item) => "Límite: " + item)]));
          }
          $("signals-result").appendChild(box);
        }
        renderSignalsSources(signals);
        $("go-ideation").disabled = false;
        persistDraft();
      }

      async function openIdeation() {
        if (!state.signals) {
          setSignalsError("Consulta Señales antes de pasar a Ideación.");
          return;
        }
        setStep("ideation");
        await loadIdeationOptions();
      }

      async function loadIdeationOptions() {
        if (state.ideationOptions) {
          renderIdeationCanvas();
          return;
        }

        setLoading(true);
        setIdeationError("");
        try {
          const response = await fetch("/api/ideation/cycles/" + encodeURIComponent(state.cycleId) + "/options");
          const data = await parseResponse(response);
          state.ideationOptions = data.options;
          state.ideationSelection = {
            ruptureType: state.ideationSelection.ruptureType || null,
            gapTitle: state.ideationSelection.gapTitle || null,
            insightTitle: state.ideationSelection.insightTitle || null
          };
          renderIdeationCanvas();
        } catch (error) {
          setIdeationError(error.message || "No se pudieron cargar opciones de Ideación.");
        } finally {
          setLoading(false);
          persistDraft();
        }
      }

      function renderIdeationCanvas() {
        const options = state.ideationOptions;
        const canvas = $("ideation-canvas");
        canvas.innerHTML = "";
        if (!options) {
          const empty = document.createElement("p");
          empty.style.color = "var(--muted)";
          empty.style.lineHeight = "1.6";
          empty.textContent = "Consulta Señales para cargar rutas, gaps e insights.";
          canvas.appendChild(empty);
          return;
        }

        $("ideation-result").innerHTML = "";
        const frame = document.createElement("div");
        frame.className = "ideation-flow-frame";
        const viewport = document.createElement("div");
        viewport.className = "ideation-flow-viewport";
        applyCanvasTransform(frame, viewport);
        attachCanvasNavigation(frame);

        viewport.appendChild(renderWorkflowNode({
          contextLabel: "Reto recomendado",
          contextValue: state.diagnosis?.recommendedChallenge || "Sin reto recomendado.",
          eyebrow: "Ruptura",
          prompt: "Selecciona qué tan lejos debe moverse la solución.",
          output: getSelectedRoute()?.title || "Ideation route",
          complete: Boolean(state.ideationSelection.ruptureType),
          options: options.ruptureTypes.map((route) => ({
            id: route.id,
            title: route.title === "Ruptura radical controlada" ? "Ruptura radical pero controlada" : route.title,
            description: ruptureCanvasDescription(route.id, route.description),
            active: state.ideationSelection.ruptureType === route.id,
            onSelect: () => {
              state.ideationSelection.ruptureType = route.id;
              state.ideationSelection.gapTitle = null;
              state.ideationSelection.insightTitle = null;
              state.ideationZoom = 0.76;
              state.ideationPan = { x: 0, y: -150 };
              renderIdeationCanvas();
              persistDraft();
            }
          }))
        }));

        if (state.ideationSelection.ruptureType) {
          viewport.appendChild(renderWorkflowConnector());
          viewport.appendChild(renderWorkflowNode({
            eyebrow: "Gap",
            prompt: "Selecciona la brecha que el set de ideas debe atacar.",
            output: getSelectedGap()?.title || "Gap",
            complete: Boolean(state.ideationSelection.gapTitle),
            options: options.gaps.map((gap) => ({
              id: gap.title,
              title: gap.title,
              description: gap.implicationForIdeation || gap.brecha,
              active: state.ideationSelection.gapTitle === gap.title,
              onSelect: () => {
                state.ideationSelection.gapTitle = gap.title;
                state.ideationSelection.insightTitle = null;
                renderIdeationCanvas();
                persistDraft();
              }
            }))
          }));
        }

        if (state.ideationSelection.gapTitle) {
          viewport.appendChild(renderWorkflowConnector());
          viewport.appendChild(renderWorkflowNode({
            eyebrow: "Insight",
            prompt: "Elige la verdad accionable que debe orientar la ideación.",
            output: getSelectedInsight()?.title || "Insight",
            complete: Boolean(state.ideationSelection.insightTitle),
            options: options.insights.map((insight) => ({
              id: insight.title,
              title: insight.title,
              description: insight.promptParaIdeacion || insight.verdadAccionable || insight.motivacionODeseo,
              active: state.ideationSelection.insightTitle === insight.title,
              onSelect: () => {
                state.ideationSelection.insightTitle = insight.title;
                renderIdeationCanvas();
                persistDraft();
              }
            }))
          }));
        }

        if (state.ideationSelection.insightTitle) {
          viewport.appendChild(renderWorkflowConnector());
          viewport.appendChild(renderWorkflowNode({
            eyebrow: "Ruta de ideación",
            prompt: buildRouteSummary(),
            output: getCurrentSet() ? "Set en construcción" : "Pendiente de primera idea",
            complete: Boolean(getCurrentSet()),
            actionLabel: buildGenerateIdeaLabel(),
            actionDisabled: Boolean(getCurrentSet() && countGeneratedIdeas(getCurrentSet()) >= 4),
            onAction: generateIdeation
          }));
        }

        if (state.ideationSets.length) {
          viewport.appendChild(renderWorkflowConnector());
          viewport.appendChild(renderWorkflowOutputNode());
        }

        frame.appendChild(viewport);
        frame.appendChild(renderFlowControls());
        canvas.appendChild(frame);
        applyCanvasTransform(frame, viewport);
      }

      function renderWorkflowNode(data) {
        const node = document.createElement("section");
        node.className = "workflow-node";
        const topHandle = document.createElement("span");
        topHandle.className = "workflow-handle top";
        const bottomHandle = document.createElement("span");
        bottomHandle.className = "workflow-handle bottom";
        const shell = document.createElement("div");
        shell.className = "workflow-shell";
        const inner = document.createElement("div");
        inner.className = "workflow-inner";

        if (data.contextLabel) {
          const context = document.createElement("div");
          context.className = "workflow-context";
          const label = document.createElement("strong");
          label.textContent = data.contextLabel;
          const value = document.createElement("div");
          value.textContent = data.contextValue;
          context.append(label, value);
          inner.appendChild(context);
        }

        const eyebrow = document.createElement("span");
        eyebrow.className = "workflow-eyebrow";
        eyebrow.textContent = data.eyebrow;
        const prompt = document.createElement("p");
        prompt.className = "workflow-prompt";
        prompt.textContent = data.prompt;
        const output = document.createElement("div");
        output.className = "workflow-output";
        output.textContent = data.output;
        inner.append(eyebrow, prompt, output);

        if (data.options) {
          const board = document.createElement("div");
          board.className = "choice-board";
          for (const option of data.options) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "choice-card" + (option.active ? " active" : "");
            button.addEventListener("click", option.onSelect);
            const label = document.createElement("strong");
            label.textContent = option.title;
            const description = document.createElement("span");
            description.textContent = option.description;
            button.append(label, description);
            board.appendChild(button);
          }
          inner.appendChild(board);
        }

        if (data.actionLabel) {
          const action = document.createElement("div");
          action.className = "workflow-action";
          const button = document.createElement("button");
          button.id = "generate-ideation";
          button.type = "button";
          button.className = "btn primary";
          button.textContent = data.actionLabel;
          button.disabled = !isIdeationSelectionComplete() || Boolean(data.actionDisabled);
          button.addEventListener("click", data.onAction);
          action.appendChild(button);
          inner.appendChild(action);
        }

        shell.appendChild(inner);
        node.append(topHandle, shell, bottomHandle);
        return node;
      }

      function renderWorkflowConnector() {
        const connector = document.createElement("div");
        connector.className = "workflow-connector";
        return connector;
      }

      function renderWorkflowOutputNode() {
        const node = renderWorkflowNode({
          eyebrow: "Output",
          prompt: "Sets de ideas por ruta",
          output: state.ideationSets.length + " ruta(s) generada(s)",
          complete: true
        });
        node.classList.add("output-node");
        const inner = node.querySelector(".workflow-inner");
        const board = document.createElement("div");
        board.className = "idea-set-board";
        for (const set of state.ideationSets) {
          board.appendChild(renderIdeaSet(set));
        }
        inner.appendChild(board);
        return node;
      }

      function renderIdeaSet(set) {
        const wrapper = document.createElement("section");
        wrapper.className = "idea-set";
        const header = document.createElement("div");
        header.className = "route-summary";
        const title = document.createElement("strong");
        title.textContent = set.route.title + " · " + set.ideas.length + " idea(s)";
        const context = document.createElement("div");
        const gapTitle = set.selection.gapTitle || set.route.usesGapTitles?.[0] || "Gap sin nombre";
        const insightTitle = set.selection.insightTitle || set.route.usesInsightTitles?.[0] || "Insight sin nombre";
        context.textContent = gapTitle + " · " + insightTitle;
        header.append(title, context);
        wrapper.appendChild(header);

        for (const [index, idea] of set.ideas.entries()) {
          wrapper.appendChild(renderIdeaCard(set, idea, index));
        }

        const generatedCount = countGeneratedIdeas(set);
        const generateMore = document.createElement("button");
        generateMore.type = "button";
        generateMore.className = "btn";
        generateMore.textContent = generatedCount >= 4 ? "Máximo de 4 ideas IA alcanzado" : "Generar otra idea con esta ruta";
        generateMore.disabled = generatedCount >= 4;
        generateMore.addEventListener("click", () => {
          state.ideationSelection = { ...set.selection };
          generateIdeation();
        });
        wrapper.appendChild(generateMore);
        wrapper.appendChild(renderManualIdeaForm(set));
        return wrapper;
      }

      function renderIdeaCard(set, idea, index) {
        const card = document.createElement("article");
        card.className = "idea-card";
        const head = document.createElement("div");
        head.className = "idea-card-head";
        const title = document.createElement("h3");
        title.textContent = idea.source === "user" ? "Idea usuario " + (index + 1) + ". " + idea.idea : renumberIdeaTitle(idea.idea, index + 1);
        const selector = document.createElement("label");
        selector.className = "idea-select";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(idea.selectedForEvaluation);
        checkbox.addEventListener("change", () => {
          idea.selectedForEvaluation = checkbox.checked;
          persistDraft();
        });
        selector.append(checkbox, document.createTextNode("Evaluar"));
        head.append(title, selector);
        card.appendChild(head);
        appendIdeaField(card, "Supuesto que rompe", cleanAssumptionForDisplay(idea.supuestoQueRompe));
        appendIdeaField(card, "Mecánica concreta", cleanCompactTextForDisplay(idea.mecanicaConcreta, 2));
        if (idea.source !== "user") {
          appendIdeaField(card, "Por qué funciona", cleanCompactTextForDisplay(idea.porQueFunciona, 2));
          appendIdeaField(card, "Caso análogo", idea.casoAnalogo);
          appendIdeaField(card, "Métrica que mueve", idea.metricaQueMueve);
          appendIdeaField(card, "Primer paso ejecutable", idea.primerPasoEjecutable);
          appendIdeaField(card, "Anti-patrones a evitar al ejecutar", idea.antiPatronesAEvitar);
        }
        return card;
      }

      function renderManualIdeaForm(set) {
        const form = document.createElement("form");
        form.className = "manual-idea-form";
        const name = document.createElement("textarea");
        name.placeholder = "Redacta la idea";
        const assumption = document.createElement("textarea");
        assumption.placeholder = "Supuesto que rompe";
        const mechanism = document.createElement("textarea");
        mechanism.placeholder = "Mecánica concreta";
        const button = document.createElement("button");
        button.type = "submit";
        button.className = "btn";
        button.textContent = "Agregar idea propia";
        form.append(name, assumption, mechanism, button);
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          if (!name.value.trim() || !assumption.value.trim() || !mechanism.value.trim()) {
            setIdeationError("Completa idea, supuesto y mecánica para agregarla al set.");
            return;
          }
          set.ideas.push({
            id: set.id + "-user-" + Date.now(),
            routeId: set.route.id,
            source: "user",
            selectedForEvaluation: false,
            idea: name.value.trim(),
            supuestoQueRompe: assumption.value.trim(),
            mecanicaConcreta: mechanism.value.trim()
          });
          setIdeationError("");
          renderIdeationCanvas();
          persistDraft();
        });
        return form;
      }

      function attachCanvasNavigation(frame) {
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let startPan = { x: 0, y: 0 };

        frame.addEventListener("pointerdown", (event) => {
          if (event.target.closest("button, input, textarea, a, label")) return;
          dragging = true;
          startX = event.clientX;
          startY = event.clientY;
          startPan = { ...state.ideationPan };
          frame.classList.add("dragging");
          frame.setPointerCapture(event.pointerId);
        });
        frame.addEventListener("pointermove", (event) => {
          if (!dragging) return;
          state.ideationPan = {
            x: startPan.x + event.clientX - startX,
            y: startPan.y + event.clientY - startY
          };
          const viewport = frame.querySelector(".ideation-flow-viewport");
          if (viewport) applyCanvasTransform(frame, viewport);
        });
        frame.addEventListener("pointerup", (event) => {
          dragging = false;
          frame.classList.remove("dragging");
          try { frame.releasePointerCapture(event.pointerId); } catch {}
          persistDraft();
        });
        frame.addEventListener("wheel", (event) => {
          event.preventDefault();
          const viewport = frame.querySelector(".ideation-flow-viewport");
          if (!viewport) return;
          const previousZoom = state.ideationZoom;
          const nextZoom = Number(Math.min(1.22, Math.max(0.48, previousZoom - event.deltaY * 0.001)).toFixed(2));
          if (nextZoom === previousZoom) return;
          const frameRect = frame.getBoundingClientRect();
          const viewportWidth = viewport.offsetWidth;
          const baseX = Math.max(0, (frame.clientWidth - viewportWidth) / 2);
          const cursorX = event.clientX - frameRect.left;
          const cursorY = event.clientY - frameRect.top;
          const worldX = (cursorX - baseX - state.ideationPan.x) / previousZoom;
          const worldY = (cursorY - 72 - state.ideationPan.y) / previousZoom;
          state.ideationZoom = nextZoom;
          state.ideationPan = {
            x: cursorX - baseX - worldX * nextZoom,
            y: cursorY - 72 - worldY * nextZoom
          };
          applyCanvasTransform(frame, viewport);
          persistDraft();
        }, { passive: false });
      }

      function applyCanvasTransform(frame, viewport) {
        const baseX = Math.max(0, (frame.clientWidth - viewport.offsetWidth) / 2);
        viewport.style.transform = "translate(" + (baseX + state.ideationPan.x) + "px, " + state.ideationPan.y + "px) scale(" + state.ideationZoom + ")";
      }

      function renderFlowControls() {
        const controls = document.createElement("div");
        controls.className = "flow-controls";
        const zoomIn = document.createElement("button");
        zoomIn.type = "button";
        zoomIn.textContent = "+";
        zoomIn.addEventListener("click", () => setIdeationZoom(Math.min(1.18, state.ideationZoom + 0.1)));
        const zoomOut = document.createElement("button");
        zoomOut.type = "button";
        zoomOut.textContent = "−";
        zoomOut.addEventListener("click", () => setIdeationZoom(Math.max(0.52, state.ideationZoom - 0.1)));
        const fit = document.createElement("button");
        fit.type = "button";
        fit.textContent = "⛶";
        fit.addEventListener("click", () => setIdeationZoom(0.88));
        controls.append(zoomIn, zoomOut, fit);
        return controls;
      }

      function setIdeationZoom(value) {
        state.ideationZoom = Number(value.toFixed(2));
        renderIdeationCanvas();
        persistDraft();
      }

      function renderChoiceColumn(title, items, selectionKey, getValue, getTitle, getDescription) {
        const column = document.createElement("div");
        column.className = "choice-column";
        const heading = document.createElement("h3");
        heading.textContent = title;
        column.appendChild(heading);
        for (const item of items || []) {
          const value = getValue(item);
          const button = document.createElement("button");
          button.type = "button";
          button.className = "choice-card" + (state.ideationSelection[selectionKey] === value ? " active" : "");
          button.addEventListener("click", () => {
            state.ideationSelection[selectionKey] = value;
            state.ideation = null;
            $("ideation-result").innerHTML = "";
            renderIdeationCanvas();
            persistDraft();
          });
          const label = document.createElement("strong");
          label.textContent = getTitle(item);
          const description = document.createElement("span");
          description.textContent = getDescription(item);
          button.append(label, description);
          column.appendChild(button);
        }
        return column;
      }

      function buildRouteSummary() {
        const options = state.ideationOptions;
        if (!options || !isIdeationSelectionComplete()) {
          return "Selecciona ruptura, gap e insight para construir la ruta.";
        }
        const route = getSelectedRoute();
        const gap = getSelectedGap();
        const insight = getSelectedInsight();
        return (route?.title || "Ruta") + " para " + (route?.verb || "idear") + " sobre el gap “" + (gap?.title || "") + "”, usando el insight “" + (insight?.title || "") + "”.";
      }

      function buildGenerateIdeaLabel() {
        const set = getCurrentSet();
        const generatedCount = set ? countGeneratedIdeas(set) : 0;
        if (generatedCount >= 4) return "Máximo de 4 ideas IA alcanzado";
        return generatedCount === 0 ? "Generar idea" : "Generar otra idea";
      }

      function isIdeationSelectionComplete() {
        return Boolean(state.ideationSelection.ruptureType && state.ideationSelection.gapTitle && state.ideationSelection.insightTitle);
      }

      function routeSetId(selection) {
        return [
          selection.ruptureType,
          selection.gapTitle,
          selection.insightTitle
        ].map((value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")).join("__");
      }

      function getCurrentSet() {
        if (!isIdeationSelectionComplete()) return null;
        const id = routeSetId(state.ideationSelection);
        return state.ideationSets.find((set) => set.id === id) || null;
      }

      function countGeneratedIdeas(set) {
        return (set.ideas || []).filter((idea) => idea.source !== "user").length;
      }

      function renumberIdeaTitle(title, index) {
        return String(title || "").replace(/^Idea\s+\d+\./i, "Idea " + index + ".");
      }

      function upsertGeneratedIdeationSet(output) {
        const selection = { ...state.ideationSelection };
        const id = routeSetId(selection);
        let set = state.ideationSets.find((item) => item.id === id);
        if (!set) {
          set = {
            id,
            selection,
            route: output.route,
            ideas: []
          };
          state.ideationSets.push(set);
        }
        set.route = output.route;
        const generatedCount = countGeneratedIdeas(set);
        const nextIdeas = (output.ideas || []).slice(0, Math.max(0, 4 - generatedCount)).map((idea, offset) => ({
          ...idea,
          id: set.id + "-ai-" + (generatedCount + offset + 1) + "-" + Date.now(),
          source: "ai",
          selectedForEvaluation: Boolean(idea.selectedForEvaluation)
        }));
        set.ideas.push(...nextIdeas);
        state.ideation = output;
      }

      function getSelectedRoute() {
        return state.ideationOptions?.ruptureTypes?.find((item) => item.id === state.ideationSelection.ruptureType);
      }

      function getSelectedGap() {
        return state.ideationOptions?.gaps?.find((item) => item.title === state.ideationSelection.gapTitle);
      }

      function getSelectedInsight() {
        return state.ideationOptions?.insights?.find((item) => item.title === state.ideationSelection.insightTitle);
      }

      function ruptureCanvasDescription(id, fallback) {
        if (id === "RUPTURA_MODERADA") {
          return "Mejora el sistema actual sin cambiar demasiado roles, tiempos ni operación diaria.";
        }
        if (id === "RUPTURA_FUERTE") {
          return "Transforma reglas, incentivos o formas de decidir para cambiar el comportamiento del sistema.";
        }
        if (id === "RUPTURA_RADICAL_CONTROLADA") {
          return "Busca que el problema pierda relevancia porque el sistema deja de depender del punto débil.";
        }
        return fallback;
      }

      async function generateIdeation() {
        if (!isIdeationSelectionComplete()) {
          setIdeationError("Selecciona ruptura, gap e insight antes de generar ideas.");
          return;
        }
        const currentSet = getCurrentSet();
        if (currentSet && countGeneratedIdeas(currentSet) >= 4) {
          setIdeationError("Esta ruta ya tiene el máximo de 4 ideas generadas por IA.");
          return;
        }
        setLoading(true);
        setIdeationError("");
        try {
          const response = await fetch("/api/ideation/cycles/" + encodeURIComponent(state.cycleId) + "/generate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ selection: state.ideationSelection })
          });
          const data = await parseResponse(response);
          upsertGeneratedIdeationSet(data.ideation.output);
          renderIdeationCanvas();
          addMessage("assistant", "Ideación generó 1 idea para la ruta seleccionada.");
        } catch (error) {
          setIdeationError(error.message || "No se pudo generar Ideación.");
        } finally {
          setLoading(false);
          persistDraft();
        }
      }

      function renderIdeationResult(output) {
        const result = $("ideation-result");
        result.innerHTML = "";
        const route = document.createElement("div");
        route.className = "route-summary";
        const routeTitle = document.createElement("strong");
        routeTitle.textContent = output.route.title;
        const routeText = document.createElement("div");
        routeText.textContent = output.route.purpose;
        route.append(routeTitle, routeText);
        result.appendChild(route);

        for (const idea of output.ideas || []) {
          const card = document.createElement("article");
          card.className = "idea-card";
          const title = document.createElement("h3");
          title.textContent = idea.idea;
          card.appendChild(title);
          appendIdeaField(card, "Supuesto que rompe", cleanAssumptionForDisplay(idea.supuestoQueRompe));
          appendIdeaField(card, "Mecánica concreta", cleanCompactTextForDisplay(idea.mecanicaConcreta, 2));
          appendIdeaField(card, "Por qué funciona", cleanCompactTextForDisplay(idea.porQueFunciona, 2));
          appendIdeaField(card, "Caso análogo", idea.casoAnalogo);
          appendIdeaField(card, "Métrica que mueve", idea.metricaQueMueve);
          appendIdeaField(card, "Primer paso ejecutable", idea.primerPasoEjecutable);
          appendIdeaField(card, "Anti-patrones a evitar al ejecutar", idea.antiPatronesAEvitar);
          result.appendChild(card);
        }
      }

      function appendIdeaField(card, label, value) {
        const field = document.createElement("div");
        field.className = "idea-field";
        const labelNode = document.createElement("span");
        labelNode.textContent = label;
        field.appendChild(labelNode);
        if (Array.isArray(value)) {
          field.appendChild(renderBulletList(value));
        } else {
          const text = document.createElement("div");
          text.textContent = cleanIdeaFieldForDisplay(label, value) || "Sin dato declarado.";
          field.appendChild(text);
        }
        card.appendChild(field);
      }

      function cleanAssumptionForDisplay(value) {
        const cleaned = String(value || "")
          .trim()
          .replace(/^supuesto\\s+que\\s+rompe\\s*:\\s*/i, "")
          .replace(/^[\\s"'“”‘’]*(?:rompe|romper)\\s+[\\s\\S]{0,90}?\\s+de\\s+que\\s+/i, "")
          .replace(/^rompe\\s+(?:el\\s+)?supuesto\\s+de\\s+que\\s+/i, "")
          .replace(/^rompe\\s+(?:la\\s+)?creencia\\s+de\\s+que\\s+/i, "")
          .replace(/^el\\s+supuesto\\s+que\\s+rompe\\s+es\\s+que\\s+/i, "")
          .replace(/^la\\s+creencia\\s+que\\s+rompe\\s+es\\s+que\\s+/i, "");
        return uppercaseFirst(cleanCompactTextForDisplay(cleaned, 1));
      }

      function cleanIdeaFieldForDisplay(label, value) {
        if (label === "Supuesto que rompe") return cleanAssumptionForDisplay(value);
        if (label === "Mecánica concreta") return cleanCompactTextForDisplay(value, 2);
        if (label === "Por qué funciona") return cleanCompactTextForDisplay(value, 2);
        return String(value || "");
      }

      function cleanCompactTextForDisplay(value, maxSentences) {
        const cleaned = String(value || "").replace(/\\s+/g, " ").trim();
        const sentences = cleaned.match(/[^.!?]+[.!?]?/g);
        if (!sentences) return cleaned;
        return sentences.slice(0, maxSentences).join(" ").replace(/\\s+/g, " ").trim();
      }

      function uppercaseFirst(value) {
        const trimmed = String(value || "").trim();
        return trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : trimmed;
      }

      function renderSignalsSources(signals) {
        const internal = signals.internal || {};
        const sources = internal.fuentesConsultadas || [];
        const gaps = internal.vaciosDeEvidencia || [];
        $("signals-sources").innerHTML = "";
        if (!sources.length && !gaps.length) {
          $("signals-sources").textContent = "Sin fuentes o vacíos registrados.";
          return;
        }
        for (const source of sources) {
          const link = document.createElement(source.startsWith("http") ? "a" : "div");
          link.textContent = source;
          if (source.startsWith("http")) {
            link.href = source;
            link.target = "_blank";
            link.rel = "noreferrer";
          }
          $("signals-sources").appendChild(link);
        }
        if (gaps.length) {
          const box = document.createElement("div");
          box.className = "result-item";
          const title = document.createElement("strong");
          title.textContent = "Vacíos de evidencia";
          box.appendChild(title);
          box.appendChild(renderBulletList(gaps));
          $("signals-sources").appendChild(box);
        }
      }

      function renderBulletList(items) {
        const ul = document.createElement("ul");
        for (const item of items) {
          const li = document.createElement("li");
          li.textContent = item;
          ul.appendChild(li);
        }
        return ul;
      }

      function renderCriticalMissing(items) {
        const box = $("critical-missing");
        state.criticalMissing = items || [];
        if (!items || items.length === 0) {
          box.innerHTML = "";
          box.classList.remove("active");
          updateClarifyButtons();
          return;
        }
        box.innerHTML = "<strong>Faltan piezas críticas antes de cerrar</strong><ul>" + items.map((item) => "<li>" + item.key + ": " + item.reason + "</li>").join("") + "</ul>";
        box.classList.add("active");
        updateClarifyButtons();
      }

      function persistDraft() {
        const formDraft = {};
        if (form) {
          for (const element of Array.from(form.elements)) {
            if (element.name) formDraft[element.name] = element.value;
          }
        }

        localStorage.setItem(storageKey, JSON.stringify({
          cycleId: state.cycleId,
          activeStep: state.activeStep,
          registration: state.registration,
          registrationRecord: state.registrationRecord,
          uploadedDocuments: state.uploadedDocuments,
          messages: state.messages,
          diagnosis: state.diagnosis,
          signals: state.signals,
          ideationOptions: state.ideationOptions,
          ideationSelection: state.ideationSelection,
          ideationZoom: state.ideationZoom,
          ideationPan: state.ideationPan,
          ideation: state.ideation,
          ideationSets: state.ideationSets,
          criticalMissing: state.criticalMissing,
          correctedSections: state.correctedSections,
          clarificationTarget: state.clarificationTarget,
          started: state.started,
          formDraft
        }));
      }

      function resetLegacyDemoState() {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith("nucleo-current-cycle-")) {
            localStorage.removeItem(key);
          }
        }
        form.reset();
        $("messages").innerHTML = "";
        $("result").innerHTML = '<p style="color: var(--muted); line-height: 1.6;">Cuando cierres el diagnóstico, aquí aparecerá la lectura diagnóstica.</p>';
        $("signals-result").innerHTML = '<p style="color: var(--muted); line-height: 1.6;">Confirma el diagnóstico para ejecutar Señales.</p>';
        $("ideation-canvas").innerHTML = '<p style="color: var(--muted); line-height: 1.6;">Consulta Señales para cargar rutas, gaps e insights.</p>';
        $("ideation-result").innerHTML = "";
        renderDocumentList();
      }

      async function parseResponse(response) {
        const data = await response.json();
        if (!response.ok) {
          if (data.criticalMissing) renderCriticalMissing(data.criticalMissing);
          throw new Error(data.message || data.error || "Error de API");
        }
        return data;
      }

      function setLoading(active) {
        loading.classList.toggle("active", active);
        $("signals-loading").classList.toggle("active", active);
        $("ideation-loading").classList.toggle("active", active);
        $("send-message").disabled = active;
        $("complete-diagnosis").disabled = active;
        $("confirm-diagnosis-signals").disabled = active || !state.diagnosis || !canAdvanceToSignals() || Boolean(state.clarificationTarget);
        $("go-ideation").disabled = active || !state.signals;
        const generateButton = $("generate-ideation");
        if (generateButton) generateButton.disabled = active || !isIdeationSelectionComplete();
        updateClarifyButtons(active);
      }

      function updateClarifyButtons(forceDisabled = false) {
        document.querySelectorAll("[data-clarify-section]").forEach((button) => {
          button.disabled = forceDisabled || Boolean(state.clarificationTarget);
        });
        $("confirm-diagnosis-signals").disabled = forceDisabled || !state.diagnosis || !canAdvanceToSignals() || Boolean(state.clarificationTarget);
      }

      function canAdvanceToSignals() {
        return !state.criticalMissing || state.criticalMissing.length === 0;
      }

      function setError(message) {
        errorBox.textContent = message;
        errorBox.classList.toggle("active", Boolean(message));
      }

      function setSignalsError(message) {
        $("signals-error").textContent = message;
        $("signals-error").classList.toggle("active", Boolean(message));
      }

      function setIdeationError(message) {
        $("ideation-error").textContent = message;
        $("ideation-error").classList.toggle("active", Boolean(message));
      }

      function slug(value) {
        return value.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
    </script>
  </body>
</html>`;
}
