/* WMHWC 공통 잠금 (홈 · 명찰 · 결과보고 그래프가 같이 써요)
   - 한 번 맞히면 같은 창(탭)에서는 다시 안 물어봐요.
   - 5분 동안 아무것도 안 하면 화면을 가려요. 하던 작업은 그대로 남아 있어요.
   - 5번 틀리면 10분 잠김 (localStorage 'mc_lock')
   들어가면 window 에 'wmhwc-unlock' 이벤트가 생겨요. */
(function(){
  var PW_SUM=2085881774, IDLE=5*60*1000;
  /* 관리자만 여는 화면 (관리자 비밀번호는 홈 '🔒 관리자'와 같아요) */
  var ADM='3ba447072b1bcb90321f2ed1d549832955a19dacb57c4c068f9f6367c6387ff0', ADMIN_PAGES=['/report/'];
  var needAdmin=ADMIN_PAGES.indexOf(location.pathname.replace(/index\.html$/,''))>=0;
  function h(s){var x=5381;for(var i=0;i<s.length;i++)x=((x*33)^s.charCodeAt(i))>>>0;return x}
  function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){return null}}
  var lock={f:0,u:0};try{lock=JSON.parse(localStorage.getItem('mc_lock'))||lock}catch(e){}
  function saveLock(){try{localStorage.setItem('mc_lock',JSON.stringify(lock))}catch(e){}}
  function last(){return +ss('wmhwc_t')||0}
  function isOk(){return ss('wmhwc_ok')==='1'&&Date.now()-last()<IDLE}

  var css='html.wm-locked body>*:not(#wmGate){visibility:hidden!important}'+
   '#wmGate{position:fixed;inset:0;z-index:2147483000;background:#e9edf1;display:grid;place-items:center;padding:16px;font-family:"WandoCleansea","Malgun Gothic","맑은 고딕",sans-serif;color:#1d2733}'+
   '#wmGate .gf{background:#fff;border-radius:14px;padding:28px 24px;width:min(340px,100%);display:flex;flex-direction:column;gap:14px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.18)}'+
   '#wmGate h2{margin:0;font-size:20px}#wmGate label{font-size:14px;color:#5d6b7a}'+
   '#wmGate input{font:inherit;text-align:center;font-size:30px;letter-spacing:.5em;padding:12px;border:1.5px solid #d3dae2;border-radius:10px;width:100%;box-sizing:border-box}'+
   '#wmGate input:focus{outline:none;border-color:#1f5fa8}#wmGate input:disabled{opacity:.5}'+
   '#wmGate .err{color:#c0392b;font-size:14px;min-height:1.2em;margin:0}#wmGate .why{color:#1f5fa8;font-size:14px;margin:0}';
  var st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);

  var gate=null,pw,err,timer=null,tickT=null;
  function show(why){
    if(gate)return;document.documentElement.classList.add('wm-locked');
    gate=document.createElement('div');gate.id='wmGate';
    gate.innerHTML='<div class="gf"><h2>🔒 비밀번호</h2>'+(why?'<p class="why">'+why+'</p>':'')+
      '<input type="password" id="wmPw" aria-label="비밀번호" inputmode="numeric" maxlength="4" autocomplete="off"><p class="err" id="wmErr"></p></div>';
    var put=function(){document.body.appendChild(gate);pw=gate.querySelector('#wmPw');err=gate.querySelector('#wmErr');
      pw.addEventListener('input',function(){pw.value=pw.value.replace(/\D/g,'');if(pw.value.length===4)tryPw()});
      lockTick();setTimeout(function(){pw&&pw.focus()},30)};
    if(document.body)put();else document.addEventListener('DOMContentLoaded',put);
  }
  function isAdm(){return ss('wmhwc_admin')==='1'}
  function hide(){if(gate){gate.remove();gate=null}
    if(needAdmin&&!isAdm()){showAdm();return}
    document.documentElement.classList.remove('wm-locked');
    try{window.dispatchEvent(new Event('wmhwc-unlock'))}catch(e){}}
  function sha(t){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return ('0'+x.toString(16)).slice(-2)}).join('')})}
  function showAdm(){
    if(gate)return;document.documentElement.classList.add('wm-locked');
    gate=document.createElement('div');gate.id='wmGate';
    gate.innerHTML='<div class="gf"><h2>🔒 관리자 비밀번호</h2><p class="why">이 도구는 아직 관리자만 쓸 수 있어요.</p>'+
      '<input type="password" id="wmPw" aria-label="관리자 비밀번호" inputmode="numeric" maxlength="4" autocomplete="off"><p class="err" id="wmErr"></p><a href="/" style="color:#1f5fa8;font-size:15px">← 홈으로</a></div>';
    var put=function(){document.body.appendChild(gate);pw=gate.querySelector('#wmPw');err=gate.querySelector('#wmErr');
      pw.addEventListener('input',function(){pw.value=pw.value.replace(/\D/g,'');if(pw.value.length===4){var v=pw.value;
        sha(v).then(function(x){if(x===ADM){ss('wmhwc_admin','1');gate.remove();gate=null;hide()}else{pw.value='';err.textContent='관리자 비밀번호가 달라요.';pw.focus()}})}});
      setTimeout(function(){pw&&pw.focus()},30)};
    if(document.body)put();else document.addEventListener('DOMContentLoaded',put);
  }
  function lockTick(){clearTimeout(tickT);if(!gate)return;var left=lock.u-Date.now();
    if(left>0){pw.disabled=true;var m=Math.floor(left/60000),s=Math.ceil(left%60000/1000);
      err.textContent='5번 틀려서 잠겼어요. '+m+'분 '+String(s===60?0:s).padStart(2,'0')+'초 뒤에 다시 해주세요.';tickT=setTimeout(lockTick,1000)}
    else if(pw.disabled){pw.disabled=false;err.textContent='';pw.focus()}}
  function tryPw(){if(lock.u>Date.now())return;var v=pw.value.trim();
    if(h(v)===PW_SUM){lock={f:0,u:0};saveLock();ss('wmhwc_ok','1');ss('wmhwc_t',String(Date.now()));hide();return}
    lock.f++;pw.value='';
    if(lock.f>=5){lock={f:0,u:Date.now()+10*60*1000};saveLock();lockTick();return}
    saveLock();err.textContent='비밀번호가 달라요. ('+lock.f+'/5번 틀림)';pw.focus()}

  // 쓰는 동안은 시간을 계속 늘려줘요
  var lastSave=0;
  function active(){if(gate)return;var n=Date.now();if(n-lastSave>5000){lastSave=n;ss('wmhwc_t',String(n))}}
  ['pointerdown','keydown','wheel','touchstart','mousemove','input'].forEach(function(t){window.addEventListener(t,active,{passive:true,capture:true})});
  function check(){if(!gate&&!isOk()){ss('wmhwc_ok',null);show('5분 동안 안 써서 잠겼어요. 하던 작업은 그대로 있어요.')}}
  setInterval(check,10000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)check()});
  window.addEventListener('focus',check);

  /* ── 위쪽 머리줄(로고 · 도구 탭 · 다크모드) ── 새 도구가 생기면 TOOLS 에 한 줄만 더해요. */
  var IC={home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    tag:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M5.8 16c.7-1.6 5.7-1.6 6.4 0M15 10h3.5M15 14h3.5"/>',
    chart:'<path d="M4 20V4M4 20h16"/><rect x="7.5" y="11" width="3" height="6"/><rect x="12.5" y="7" width="3" height="10"/><rect x="17.5" y="13" width="2.5" height="4"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>'};
  function svg(n){return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>'}
  var TOOLS=[['/','home','홈'],['/nameplate/','tag','명찰'],['/report/','chart','그래프']];
  var LOGO='/nameplate/images/logo_bottom.png',SITE='완도군 정신건강복지센터';
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
  var root=document.documentElement;
  function setTheme(t){root.setAttribute('data-theme',t);var b=document.getElementById('wmTheme');if(b){b.innerHTML=svg(t==='dark'?'moon':'sun');b.title=t==='dark'?'밝은 화면으로':'어두운 화면으로'}}
  setTheme(ls('wmhwc_theme')==='dark'?'dark':'light');
  st.textContent+=
   /* 어두운 화면: 화면에서만 (인쇄는 항상 밝게) */
   '@media screen{html[data-theme=dark]{--bg:#0a0f18;--panel:#121a26;--ink:#e8eef6;--muted:#8fa0b5;--line:#273346;--accent:#4d94e8;--soft:#182233;color-scheme:dark}'+
   'html[data-theme=dark] body{background:#0a0f18;color:#e8eef6}'+
   'html[data-theme=dark] input:not([type=color]),html[data-theme=dark] textarea,html[data-theme=dark] select{background:#182233;color:#e8eef6;border-color:#273346}'+
   'html[data-theme=dark] #wmGate{background:#0a0f18;color:#e8eef6}html[data-theme=dark] #wmGate .gf{background:#121a26}'+
   'html[data-theme=dark] #wmNav{--nb:#0d131d;--nl:#1f2a3a;--nt:#a7b4c5;--nh:#18212f;--na:#1e2a3c;--ni:#fff}}'+
   '#wmNav{position:sticky;top:0;z-index:1000;--nb:#fff;--nl:#d9e0e8;--nt:#3f4b59;--nh:#f1f4f7;--na:#e6ebf1;--ni:#1d2733;background:var(--nb);border-bottom:1px solid var(--nl);padding:12px max(16px,calc((100vw - 1180px)/2)) 10px;font-family:"WandoCleansea","Malgun Gothic","맑은 고딕",sans-serif}'+
   '#wmNav .r1{display:flex;align-items:center;gap:10px;margin-bottom:10px}#wmNav .r1 img{height:34px;width:auto}#wmNav .r1 a{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ni);font-weight:700;font-size:20px;letter-spacing:-.01em}'+
   '#wmTheme{display:grid;place-items:center;width:42px;height:42px;border-radius:10px;border:1px solid var(--nl);background:transparent;color:var(--nt);cursor:pointer;padding:0}#wmTheme:hover{background:var(--nh);color:var(--ni)}'+
   '#wmNav .r2{display:flex;gap:6px;flex-wrap:wrap}#wmNav .r2 a{display:flex;align-items:center;gap:7px;padding:11px 22px;border-radius:12px;color:var(--nt);text-decoration:none;font-weight:700;font-size:19px}'+
   '#wmNav.mini{padding-top:8px;padding-bottom:8px}#wmNav.mini .r1{display:none}'+
   '#wmNav .r2 a:hover{background:var(--nh);color:var(--ni)}#wmNav .r2 a.on{background:var(--na);color:var(--ni)}'+
   '#wmSplash{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;background:#e9edf1;color:#1d2733;transition:opacity .35s;font-family:"WandoCleansea","Malgun Gothic","맑은 고딕",sans-serif}'+
   'html[data-theme=dark] #wmSplash{background:#0a0f18;color:#e8eef6}#wmSplash.out{opacity:0;pointer-events:none}'+
   '#wmSplash div{display:flex;flex-direction:column;align-items:center;gap:14px;font-weight:700;font-size:17px}#wmSplash img{height:96px;animation:wmPulse 1.1s ease-in-out infinite}#wmSplash small{font-weight:400;font-size:14px;opacity:.65}'+
   '@keyframes wmPulse{50%{transform:scale(1.07)}}'+
   '@media print{#wmNav,#wmSplash{display:none!important}}';
  function shell(){
    if(document.getElementById('wmNav'))return;
    var here=location.pathname.replace(/index\.html$/,'');
    // 브라우저 탭 이름 통일: '도구이름 | 완도군 정신건강복지센터'
    TOOLS.forEach(function(t){if(t[0]===here)document.title=t[2]+' | '+SITE});
    var n=document.createElement('nav');n.id='wmNav';
    n.innerHTML='<div class="r1"><a href="/"><img src="'+LOGO+'" alt="">'+SITE+'</a><button type="button" id="wmTheme" aria-label="화면 밝기 바꾸기"></button></div><div class="r2">'+
      TOOLS.map(function(t){return '<a href="'+t[0]+'"'+(t[0]===here?' class="on" aria-current="page"':'')+'>'+svg(t[1])+t[2]+'</a>'}).join('')+'</div>';
    document.body.insertBefore(n,document.body.firstChild);
    setTheme(root.getAttribute('data-theme'));
    // 아래로 내려도 탭이 보이게: 위에 붙어 있고, 내리면 로고 줄을 접어요
    var setH=function(){root.style.setProperty('--wmNavH',n.offsetHeight+'px')};
    var onScroll=function(){var y=window.scrollY;if(!n.classList.contains('mini')&&y>90){n.classList.add('mini');setH()}else if(n.classList.contains('mini')&&y<20){n.classList.remove('mini');setH()}};
    window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',setH);setH();onScroll();
    document.getElementById('wmTheme').addEventListener('click',function(){var t=root.getAttribute('data-theme')==='dark'?'light':'dark';ls('wmhwc_theme',t);setTheme(t)});
    // 로딩 화면: 로고를 잠깐 보여주고, 화면이 다 준비되면 사라져요
    if(!gate&&document.readyState!=='complete'){
      var sp=document.createElement('div');sp.id='wmSplash';sp.innerHTML='<div><img src="'+LOGO+'" alt=""><span>'+SITE+'</span><small>로딩중..</small></div>';
      document.body.appendChild(sp);var t0=Date.now();
      var done=function(){setTimeout(function(){sp.classList.add('out');setTimeout(function(){sp.remove()},400)},Math.max(0,450-(Date.now()-t0)))};
      window.addEventListener('load',done);setTimeout(done,4000);
    }
  }
  if(document.body)shell();else{var mo=new MutationObserver(function(){if(document.body){mo.disconnect();shell()}});mo.observe(root,{childList:true})}

  window.WMHWC={unlocked:function(){return !gate&&isOk()&&(!needAdmin||isAdm())}};
  if(isOk()){ss('wmhwc_t',String(Date.now()));if(needAdmin&&!isAdm())showAdm()}else{ss('wmhwc_ok',null);show('')}
})();
