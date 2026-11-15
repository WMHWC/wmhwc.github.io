/* WMHWC 공통 잠금 (홈 · 명찰 · 결과보고 그래프가 같이 써요)
   - 한 번 맞히면 같은 창(탭)에서는 다시 안 물어봐요.
   - 5분 동안 아무것도 안 하면 화면을 가려요. 하던 작업은 그대로 남아 있어요.
   - 5번 틀리면 10분 잠김 (localStorage 'mc_lock')
   들어가면 window 에 'wmhwc-unlock' 이벤트가 생겨요. */
(function(){
  var PW_SUM=2085881774, IDLE=5*60*1000;
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
  function hide(){if(gate){gate.remove();gate=null}document.documentElement.classList.remove('wm-locked');
    try{window.dispatchEvent(new Event('wmhwc-unlock'))}catch(e){}}
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

  // 도구 바꾸기 줄: 홈을 안 거치고 바로 다른 도구로 가요. 새 도구가 생기면 TOOLS 에 한 줄만 더해요.
  var TOOLS=[['/','🏠 홈'],['/nameplate/','🏷️ 명찰 만들기'],['/report/','📊 결과보고 그래프']];
  function nav(){
    var here=location.pathname.replace(/index\.html$/,'');if(here==='/'||document.getElementById('wmNav'))return;
    var n=document.createElement('nav');n.id='wmNav';
    n.innerHTML=TOOLS.map(function(t){return t[0]===here?'<b>'+t[1]+'</b>':'<a href="'+t[0]+'">'+t[1]+'</a>'}).join('');
    document.body.insertBefore(n,document.body.firstChild);
  }
  st.textContent+='#wmNav{display:flex;gap:6px;align-items:center;padding:6px 14px;background:#1d2733;font:700 14px "WandoCleansea","Malgun Gothic","맑은 고딕",sans-serif}'+
   '#wmNav a,#wmNav b{padding:5px 12px;border-radius:8px;color:#cfd8e3;text-decoration:none}#wmNav a:hover{background:#33414f;color:#fff}#wmNav b{background:#fff;color:#1d2733}'+
   '@media print{#wmNav{display:none!important}}';
  if(document.body)nav();else document.addEventListener('DOMContentLoaded',nav);

  window.WMHWC={unlocked:function(){return !gate&&isOk()}};
  if(isOk()){ss('wmhwc_t',String(Date.now()))}else{ss('wmhwc_ok',null);show('')}
})();
