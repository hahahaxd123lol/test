(()=>{
'use strict';
if(window.__f2wV160Bootstrap)return;window.__f2wV160Bootstrap=true;
const URL='https://viqufxlcxwgboyxbdhjb.supabase.co';
const KEY='sb_publishable_zdfvnwwgL9LI3yTK0-1Sbg_RsYRvNge';

window.__f2wGlobalPresenceAuthorityV210=true;
window.__f2wGlobalPresenceAuthorityV224=true;

const PRESENCE_HEARTBEAT_MS=30000;
const PRESENCE_LEADER_RENEW_MS=10000;
const PRESENCE_LEADER_LEASE_MS=45000;
const PRESENCE_LEADER_KEY='f2w_presence_leader_v224';
const PRESENCE_SESSION_KEY='f2w_presence_browser_session_v224';

let presenceTimer=null;
let presenceLeaderTimer=null;
let presenceClient=null;
let presenceSessionId='';
let presenceBusy=false;
let presenceLastSentAt=0;

const presenceTabId=(()=>{
  try{
    let id=sessionStorage.getItem('f2w_presence_tab_v224')||'';
    if(!id){
      id=crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('f2w_presence_tab_v224',id);
    }
    return id;
  }catch{
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
})();

function getPresenceSessionId(){
  if(presenceSessionId)return presenceSessionId;
  try{
    presenceSessionId=localStorage.getItem(PRESENCE_SESSION_KEY)||'';
    if(!presenceSessionId){
      presenceSessionId=crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(PRESENCE_SESSION_KEY,presenceSessionId);
    }
  }catch{
    presenceSessionId=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return presenceSessionId;
}

function readPresenceLeader(){
  try{
    const row=JSON.parse(localStorage.getItem(PRESENCE_LEADER_KEY)||'null');
    return row&&row.id?row:null;
  }catch{return null}
}

function writePresenceLeader(){
  try{
    localStorage.setItem(PRESENCE_LEADER_KEY,JSON.stringify({
      id:presenceTabId,
      expires:Date.now()+PRESENCE_LEADER_LEASE_MS
    }));
    return true;
  }catch{return true}
}

function isPresenceLeader(){
  const row=readPresenceLeader();
  return Boolean(row&&row.id===presenceTabId&&Number(row.expires||0)>Date.now());
}

function claimPresenceLeadership(){
  if(document.visibilityState!=='visible')return false;
  const row=readPresenceLeader();
  const expired=!row||Number(row.expires||0)<=Date.now();
  if(expired||row.id===presenceTabId){
    writePresenceLeader();
    return true;
  }
  return false;
}

function releasePresenceLeadership(){
  try{
    const row=readPresenceLeader();
    if(row?.id===presenceTabId)localStorage.removeItem(PRESENCE_LEADER_KEY);
  }catch{}
}

async function touchSitePresence({force=false}={}){
  if(presenceBusy||document.visibilityState!=='visible')return;
  if(!claimPresenceLeadership()&&!isPresenceLeader())return;
  const now=Date.now();
  if(!force && now-presenceLastSentAt<PRESENCE_HEARTBEAT_MS-1500)return;
  const client=presenceClient||window.f2wSupabase||window.chatSupabase||window.supabaseClient;
  if(!client?.auth?.getSession||!client?.rpc)return;
  presenceBusy=true;
  try{
    const {data}=await client.auth.getSession();
    const session=data?.session||null;
    if(!session?.user)return;
    const sid=getPresenceSessionId();
    const {error}=await client.rpc('touch_presence_v203',{p_session_id:sid});
    if(error){
      try{await client.rpc('touch_presence_v17',{p_session_id:sid});}catch{}
    }else{
      presenceLastSentAt=Date.now();
    }
  }catch{}finally{
    presenceBusy=false;
  }
}

function schedulePresenceHeartbeat(){
  if(presenceTimer)clearInterval(presenceTimer);
  presenceTimer=setInterval(()=>{
    if(document.visibilityState==='visible'&&isPresenceLeader()){
      void touchSitePresence();
    }
  },PRESENCE_HEARTBEAT_MS);
  if(presenceLeaderTimer)clearInterval(presenceLeaderTimer);
  presenceLeaderTimer=setInterval(()=>{
    if(document.visibilityState!=='visible'){
      if(isPresenceLeader())releasePresenceLeadership();
      return;
    }
    if(claimPresenceLeadership()){
      writePresenceLeader();
      if(Date.now()-presenceLastSentAt>PRESENCE_HEARTBEAT_MS-1500){
        void touchSitePresence();
      }
    }
  },PRESENCE_LEADER_RENEW_MS);
}

function startSitePresence(client){
  if(client)presenceClient=client;
  schedulePresenceHeartbeat();
  if(claimPresenceLeadership())void touchSitePresence({force:true});
  window.__f2wTouchSitePresenceV210=()=>touchSitePresence({force:true});
  window.__f2wTouchSitePresenceV224=()=>touchSitePresence({force:true});
}

function stopSitePresence(){
  if(presenceTimer){clearInterval(presenceTimer);presenceTimer=null;}
  if(presenceLeaderTimer){clearInterval(presenceLeaderTimer);presenceLeaderTimer=null;}
  releasePresenceLeadership();
}

function bindPresenceAuth(client){
  if(!client?.auth||client.__f2wV224PresenceBound)return;
  client.__f2wV224PresenceBound=true;
  presenceClient=client;
  try{
    client.auth.onAuthStateChange((event,session)=>{
      if(session?.user){
        startSitePresence(client);
      }else if(event==='SIGNED_OUT'){
        stopSitePresence();
      }
    });
  }catch{}
  startSitePresence(client);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      if(claimPresenceLeadership())void touchSitePresence({force:true});
    }else if(isPresenceLeader()){
      releasePresenceLeadership();
    }
  },{passive:true});
  window.addEventListener('focus',()=>{
    if(claimPresenceLeadership())void touchSitePresence({force:true});
  },{passive:true});
  window.addEventListener('pageshow',()=>{
    if(claimPresenceLeadership())void touchSitePresence({force:true});
  },{passive:true});
  window.addEventListener('pagehide',()=>{
    releasePresenceLeadership();
  },{passive:true});
  window.addEventListener('storage',event=>{
    if(event.key!==PRESENCE_LEADER_KEY||document.visibilityState!=='visible')return;
    const row=readPresenceLeader();
    if(!row||Number(row.expires||0)<=Date.now()){
      if(claimPresenceLeadership())void touchSitePresence({force:true});
    }
  });
}

function install(){
  if(!window.supabase?.createClient)return false;
  if(window.__f2wOriginalCreateClient){
    const existing=window.f2wSupabase||window.chatSupabase||window.supabaseClient||null;
    if(existing)bindPresenceAuth(existing);
    return true;
  }
  const original=window.supabase.createClient.bind(window.supabase);
  window.__f2wOriginalCreateClient=original;
  let singleton=window.f2wSupabase||window.chatSupabase||window.supabaseClient||null;
  if(!singleton){
    try{singleton=original(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}catch{}
  }
  if(singleton){
    window.f2wSupabase=singleton;window.chatSupabase=singleton;window.supabaseClient=singleton;window.__supabaseClient=singleton;
    bindPresenceAuth(singleton);
  }
  window.supabase.createClient=function(url,key,opts){
    if(String(url||'').replace(/\/$/,'')===URL && String(key||'')===KEY){
      if(singleton){bindPresenceAuth(singleton);return singleton;}
      singleton=original(url,key,{...(opts||{}),auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,...((opts||{}).auth||{})}});
      window.f2wSupabase=window.chatSupabase=window.supabaseClient=window.__supabaseClient=singleton;
      bindPresenceAuth(singleton);
      return singleton;
    }
    return original(url,key,opts);
  };
  try{singleton?.auth?.getSession?.().then(({data})=>window.dispatchEvent(new CustomEvent('f2w:v160-session',{detail:data?.session||null}))).catch(()=>{})}catch{}
  return true;
}
if(!install()){
  let tries=0;const t=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(t)},25);
}
})();

/* V250 — Discord + Live Sports nav */
(()=>{
  'use strict';
  if(window.__f2wDiscordEveryPageV250)return;
  window.__f2wDiscordEveryPageV250=true;
  const ID='f2w-discord-join-v250';
  const INVITE='https://discord.gg/q5k46TpxUk';
  function ensureStyle(){
    if(document.getElementById('f2w-discord-nav-v250-css'))return;
    const s=document.createElement('style');
    s.id='f2w-discord-nav-v250-css';
    s.textContent=`#${ID}{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;height:34px!important;padding:0 10px!important;margin:0 0 0 7px!important;border:1px solid rgba(88,101,242,.72)!important;border-radius:8px!important;background:rgba(88,101,242,.12)!important;color:#fff!important;text-decoration:none!important;font-size:9px!important;font-weight:800!important;cursor:pointer!important;pointer-events:auto!important;z-index:2147483000!important}#${ID}:hover{background:rgba(88,101,242,.27)!important}`;
    (document.head||document.documentElement).appendChild(s);
  }
  function make(){
    const a=document.createElement('a');
    a.id=ID;a.className='f2w-nav-link f2w-discord-nav-link';a.href=INVITE;a.target='_blank';a.rel='noopener noreferrer';
    a.innerHTML='<span>Join Discord</span>';
    return a;
  }
  function install(){
    ensureStyle();
    const nav=document.querySelector('header .f2w-primary-nav');
    if(!nav)return false;
    const leaderboard=nav.querySelector('#f2w-nav-leaderboard')||[...nav.querySelectorAll('a')].find(el=>/leaderboard/i.test(el.textContent||''));
    nav.querySelectorAll('a,button,[role="link"]').forEach(el=>{
      const label=String(el.textContent||el.getAttribute('aria-label')||el.title||'').replace(/\s+/g,' ').trim();
      const href=String(el.getAttribute('href')||'').replace(/\/$/,'');
      if(/live\s*[- ]?sports/i.test(label)||href==='/live'||href.startsWith('/live/'))el.remove();
    });
    let a=document.getElementById(ID);if(!a)a=make();
    if(leaderboard){
      if(a.previousElementSibling!==leaderboard)leaderboard.insertAdjacentElement('afterend',a);
    }else if(!a.parentElement){
      nav.appendChild(a);
    }
    return true;
  }
  function start(){
    install();
    new MutationObserver(()=>install()).observe(document.documentElement,{childList:true,subtree:true});
    let tries=0;const t=setInterval(()=>{install();if(++tries>40)clearInterval(t);},200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* FORCE211 loaders — unique query strings bust Cloudflare */
(()=>{function load(src,flag){if(flag&&window[flag])return;const s=document.createElement('script');s.src=src;s.defer=true;(document.head||document.documentElement).appendChild(s);}load('/v260-password-reset.js?v=force211','__f2wPasswordResetV269');load('/f2w-oauth-fix-v1.js?v=force211','__f2wOauthFixV1');load('/f2w-halloween-v3.js?v=force211','__f2wHalloweenV3');load('/f2w-continue-watching-v1.js?v=force211','__f2wContinueWatchingV5');})();

/* f2w-force-bust:211-oct11-2026-a7f3c9e2 */
/* cache-bust-line-1: xk9m2p */
/* cache-bust-line-2: qw8n4r */
/* cache-bust-line-3: zt1v6b */
/* cache-bust-line-4: rnd_9f2a8c */
