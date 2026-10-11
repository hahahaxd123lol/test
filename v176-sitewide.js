(()=>{
'use strict';
if(window.__f2wV176Sitewide)return;window.__f2wV176Sitewide=true;

const now=()=>Date.now();
const RATE_WINDOW=30000, RATE_MAX=2;
const NAV_WORDS=/^(home|movies|tv shows|leaderboard|genres|chat|favorites|profile|support|account|notifications|login|log in|sign up|create account)$/i;
const EXCLUDE=/^(close|cancel|back|next|previous|prev|refresh|retry|understood|support)$/i;
const ACTION_HINT=/(send|post|save|update|delete|remove|dismiss|resolve|ban|mute|suspend|unsuspend|unban|follow|unfollow|report|submit|apply|grant|give|revoke|mark all read|create|login|log in|sign up|change|clear all restrictions)/i;
function normText(el){return String(el?.getAttribute?.('aria-label')||el?.title||el?.textContent||'').replace(/\s+/g,' ').trim()}
function actionKey(el){
  const txt=normText(el).toLowerCase().slice(0,90);
  const id=String(el?.id||'').toLowerCase();
  const form=el?.closest?.('form')?.id||'';
  return `f2w:v176:rate:${location.pathname}:${id||form||txt||el?.name||'action'}`;
}
function isNetworkAction(el){
  if(!el)return false;
  if(el.matches?.('.f2w-oauth-btn,[onclick*="signInWithOAuth"],[onclick*="OAuth"],.f2w-auth-top-btn,.f2w-forgot-pw-btn'))return false;
  if(/google|discord/i.test(normText(el)) && /sign\s*(in|up)|continue/i.test(normText(el)))return false;
  if(el.matches?.('a[href]')&&!el.matches?.('[role="button"]'))return false;
  const txt=normText(el);
  if(EXCLUDE.test(txt)||NAV_WORDS.test(txt))return false;
  if(el.matches?.('[data-f2w-no-rate],.chat-close,.account-close,.f2w-chat-page-close,[data-close],[aria-label*="close" i],[role="tab"],.account-tab,.v17-chat-mode'))return false;
  if(el.matches?.('button[type="submit"],input[type="submit"],[data-action],[data-command],[data-staff-action]'))return true;
  return ACTION_HINT.test(txt);
}
function readTimes(k){try{return JSON.parse(localStorage.getItem(k)||'[]').filter(t=>now()-Number(t)<RATE_WINDOW)}catch{return[]}}
function allowAction(el){
  const k=actionKey(el), arr=readTimes(k);
  if(arr.length>=RATE_MAX){
    const wait=Math.max(1,Math.ceil((RATE_WINDOW-(now()-arr[0]))/1000));
    try{window.showToast?.(`Please wait ${wait}s before trying that again.`,true)}catch{}
    el?.setAttribute?.('data-f2w-rate-wait',String(wait));
    return false;
  }
  arr.push(now());try{localStorage.setItem(k,JSON.stringify(arr))}catch{}
  return true;
}
document.addEventListener('click',e=>{
  const n=e.target.closest?.('#notification-btn,[data-notifications-link],a[href="/notifications/"]');
  if(n && !location.pathname.startsWith('/notifications')){
    e.preventDefault();e.stopImmediatePropagation();location.href='/notifications/';return;
  }
  const a=e.target.closest?.('button,input[type="submit"],[role="button"]');
  if(isNetworkAction(a) && !allowAction(a)){e.preventDefault();e.stopImmediatePropagation();}
},true);

function ensureNav(){
  document.querySelectorAll('.f2w-primary-nav').forEach(nav=>{
    const genre=nav.querySelector('.f2w-genre-wrap');
    let lb=nav.querySelector('#f2w-nav-leaderboard,a[href="/leaderboard/"],a[href="/leaderboard"]');
    if(!lb){
      lb=document.createElement('a');
      lb.id='f2w-nav-leaderboard';
      lb.className='f2w-nav-link';
      lb.href='/leaderboard/';
      lb.innerHTML='<i class="fa-solid fa-trophy"></i> Leaderboard';
      if(genre) genre.insertAdjacentElement('afterend', lb);
      else nav.appendChild(lb);
    } else if(genre && lb.previousElementSibling!==genre){
      genre.insertAdjacentElement('afterend', lb);
    }
    nav.querySelectorAll('a,button,[role="link"]').forEach(el=>{
      const label=String(el.textContent||el.getAttribute('aria-label')||el.title||'').replace(/\s+/g,' ').trim();
      const href=String(el.getAttribute('href')||'').replace(/\/$/,'');
      if(/live\s*[- ]?sports/i.test(label)||href==='/live'||href.startsWith('/live/'))el.remove();
    });
    const discord=nav.querySelector('#f2w-discord-join-v250,.f2w-discord-nav-link');
    if(discord && discord.previousElementSibling!==lb) lb.insertAdjacentElement('afterend', discord);
  });
}
function bootNav(){
  ensureNav();
  const mo=new MutationObserver(()=>ensureNav());
  mo.observe(document.documentElement,{childList:true,subtree:true});
  let tries=0;
  const t=setInterval(()=>{ensureNav();if(++tries>40)clearInterval(t);},200);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bootNav,{once:true});
else bootNav();

function f2wLoadScript(src, flag){
  if(flag && window[flag])return;
  const s=document.createElement('script');
  s.src=src;
  s.defer=true;
  (document.head||document.documentElement).appendChild(s);
}
f2wLoadScript('/v260-password-reset.js?v=force211');
f2wLoadScript('/f2w-halloween-v3.js?v=force218', '__f2wHalloweenV3');
f2wLoadScript('/f2w-oauth-fix-v1.js?v=force211', '__f2wOauthFixV1');
f2wLoadScript('/f2w-continue-watching-v1.js?v=force219-restore', '__f2wContinueWatchingV5');
})();

/* f2w-force-bust:219-continue-watching-restore */
/* cache-bust-line-1: xk9m2p */
/* cache-bust-line-2: qw8n4r */
/* cache-bust-line-3: zt1v6b */
/* cache-bust-line-4: rnd_v176_force211 */
