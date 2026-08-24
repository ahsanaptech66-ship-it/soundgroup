/* SOUNDGROUP Phase V — frontend shell prepared for the PHP/MySQL backend.
   No browser database, browser storage, browser-file persistence, or client-side database logic.
   Media is delivered by the PHP API and persisted in MySQL/server storage; browser persistence is intentionally not used. */
(() => {
'use strict';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const slug = s => String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const now = () => Date.now();
const fmtBytes = n => { if(!n) return '0 B'; const u=['B','KB','MB','GB','TB']; const i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),u.length-1); return `${(n/1024**i).toFixed(i?1:0)} ${u[i]}`; };
const fmtTime = s => { if(!Number.isFinite(s)||s<0) return '0:00'; s=Math.floor(s); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), sec=s%60; return h?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`; };
const typeOf = file => { const t=(file.type||'').toLowerCase(), n=file.name.toLowerCase(); if(t.startsWith('audio/')||/\.(mp3|wav|flac|m4a|aac|ogg|oga|opus|aiff|aif|webm)$/.test(n)&&!/\.(mp4|webm|mkv|mov|avi|m4v|ogv)$/.test(n)) return 'audio'; if(t.startsWith('video/')||/\.(mp4|webm|mkv|mov|m4v|avi|ogv|ogg|3gp|mpeg|mpg|ts|mts|m2ts)$/.test(n)) return 'video'; return 'other'; };
const tone = i => ['#9b8cff','#62d7ff','#ff8db9','#63e1aa','#ffb66e','#8fa7ff','#c28cff','#62e7df'][i%8];
const colors = ['#9b8cff','#62d7ff','#ff8db9','#63e1aa','#ffb66e','#8fa7ff','#c28cff','#62e7df','#ffd76b','#7f9dff'];
const themes = [
  ['midnight','#9b8cff','#62d7ff','#07080d'],['arctic','#7cc9ff','#d7f1ff','#071018'],['aurora','#68ffbd','#7f8cff','#06100c'],
  ['sunset','#ff9c78','#ffcf68','#120907'],['ocean','#55b9ff','#72f1ff','#061019'],['violet','#c08cff','#ff7bd7','#0d0713'],
  ['rose','#ff83ad','#ffd1df','#12070d'],['forest','#71e09b','#b5ff76','#07100a'],['ember','#ff7a4d','#ffd15c','#120905'],
  ['pearl','#b9b9c9','#fff','#0b0b0e'],['titanium','#bfc7d8','#7a9cff','#090c12'],['nebula','#a579ff','#ff6fd8','#090511'],
  ['champagne','#e8c98a','#fff2c7','#100e08'],['monochrome','#fff','#aaa','#080808'],['cyber','#62f7ff','#c77dff','#05080d'],
  ['ice','#b4efff','#8bb8ff','#061018'],['deep-space','#7b8cff','#6ce4ff','#03040a'],['coral','#ff7f72','#ffb36c','#120807'],
  ['lavender','#c8a5ff','#9be7ff','#0d0a13'],['graphite','#b9bdc8','#6f7a8e','#0a0b0e']
];
const progressStyles=['Classic','Snake','Car','Liquid','Wave','Ribbon','Pulse','Glow Trail','Comet','Aurora','Orbit','Meteor','Satellite','Spark','Rail','Pulse Dot','Glass','Infinity','Minimal','Soft Trail','Vinyl','Soundwave','Halo','Needle'];
const eqFrequencies=[31,62,125,250,500,1000,2000,4000,8000,16000];
const eqPresets={Flat:[0,0,0,0,0,0,0,0,0,0],'Bass Boost':[5,5,4,3,1,0,-1,-2,-2,-1],'Bass Reducer':[-5,-5,-4,-3,-1,0,1,1,1,1],Vocal:[-2,-1,0,2,4,4,3,2,0,-1],Acoustic:[2,1,0,2,3,2,1,2,3,2],Classical:[3,2,1,0,-1,-2,-2,-1,2,3],Electronic:[4,3,1,0,-1,2,3,4,4,3],'Hip-Hop':[5,4,2,0,-1,1,3,2,4,3],Rock:[3,2,0,-1,1,2,3,2,1,2],Pop:[-1,0,1,2,3,2,1,1,2,2],'R&B':[3,2,1,1,2,1,2,2,2,1],Jazz:[2,1,0,1,2,2,1,2,1,2],Cinematic:[4,2,0,-1,-2,1,2,3,3,4],Night:[-2,-1,0,2,3,2,0,-1,-2,-3],Loudness:[5,3,2,0,0,1,2,3,4,3]};

const BACKEND = Object.freeze({
  enabled: true,
  baseUrl: '../api',
  endpoints: Object.freeze({
    media: 'media.php',
    auth: 'auth.php',
    favorites: 'favorites.php',
    history: 'history.php',
    playlists: 'playlists.php',
    reviews: 'reviews.php',
    settings: 'settings.php'
  })
});

const state = {
  view:'home',
  media:[],
  catalog:[],
  discoverData:{all:{},music:{},videos:{},counts:{total:0,music:0,videos:0}},
  discoverTab:'all',
  favorites:[],
  history:[],
  playlists:[],
  user:{name:'Guest'},
  theme:'midnight',
  accent:'#9b8cff',
  density:'compact',
  glass:'balanced',
  autoplay:true,
  motion:true,
  contrast:false,
  reduceMotion:false,
  speed:1,
  visualizer:'bars',
  progressStyle:'Classic',
  progressIntensity:60,
  progressSpeed:100,
  progressGlow:55,
  eqEnabled:true,
  eqPreset:'Flat',
  eqBands:[0,0,0,0,0,0,0,0,0,0],
  volume:.8,
  muted:false,
  previousVolume:.8,
  current:null,
  queue:[],
  queueIndex:-1,
  videoQueue:[],
  videoIndex:-1,
  currentVideo:null,
  audioUrl:null,
  videoUrl:null,
  importFilter:'all',
  musicFilter:'all',
  musicYear:'all',
  musicLanguage:'all',
  videoFilter:'all',
  videoYear:'all',
  videoLanguage:'all',
  searchOpen:false,
  csrfToken:'',
  site:{site_name:'SOUNDGROUP',site_tagline:'A local-first entertainment space for music and video.',about_text:'SOUNDGROUP brings music, video, discovery and personal media together in one local-first experience.',contact_text:'Use the administrator contact details configured for this installation.'},
  detailMediaId:null,
  reviewSort:'newest',
  reviewLimit:10,
  reviewSummaryCache:new Map()
};

const api = {
  async request(path, options={}) {
    if (!BACKEND.enabled) throw new Error('PHP backend is not connected');
    const response = await fetch(path, {
      credentials:'include',
      headers:{'Accept':'application/json', ...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}), ...(options.headers||{})},
      ...options
    });
    const contentType=response.headers.get('content-type')||'';
    const payload=contentType.includes('application/json') ? await response.json() : await response.text();
    if(!response.ok || (payload && payload.success===false)) {
      const message=payload?.message || payload?.error || `Backend request failed (${response.status})`;
      const error=new Error(message);
      error.status=response.status;
      throw error;
    }
    return payload;
  },
  async loadMedia(){
    const payload=await this.request(`${BACKEND.baseUrl}/${BACKEND.endpoints.media}?action=list`);
    return Array.isArray(payload?.data)?payload.data:[];
  },
  async loadDiscover(){
    const payload=await this.request(`${BACKEND.baseUrl}/${BACKEND.endpoints.media}?action=discover&view=all`);
    return payload?.data && typeof payload.data==='object' ? payload.data : {all:{},music:{},videos:{},counts:{total:0,music:0,videos:0}};
  },
  async auth(action,data={}){ return this.request(`${BACKEND.baseUrl}/${BACKEND.endpoints.auth}?action=${encodeURIComponent(action)}`,{method:action==='me'?'GET':'POST',body:action==='me'?undefined:JSON.stringify(data)}); },
  async favorites(action,data={}){ return this.request(`${BACKEND.baseUrl}/${BACKEND.endpoints.favorites}?action=${encodeURIComponent(action)}`,{method:action==='list'?'GET':'POST',body:action==='list'?undefined:JSON.stringify(data)}); },
  async history(action,data={}){ return this.request(`${BACKEND.baseUrl}/${BACKEND.endpoints.history}?action=${encodeURIComponent(action)}`,{method:action==='list'?'GET':'POST',body:action==='list'?undefined:JSON.stringify(data)}); },
  async playlists(action,data={}){ return this.request(`${BACKEND.baseUrl}/${BACKEND.endpoints.playlists}?action=${encodeURIComponent(action)}`,{method:action==='list'?'GET':'POST',body:action==='list'?undefined:JSON.stringify(data)}); },
  async reviews(action,data={}){
    const getAction=action==='summary'||action==='summary_batch';
    const method=getAction?'GET':'POST';
    const query=action==='summary' ? `&media_id=${encodeURIComponent(String(data.media_id??''))}&limit=${encodeURIComponent(String(data.limit??10))}&sort=${encodeURIComponent(String(data.sort??'newest'))}`
      : action==='summary_batch' ? `&media_ids=${encodeURIComponent((data.media_ids||[]).join(','))}` : '';
    const path=`${BACKEND.baseUrl}/${BACKEND.endpoints.reviews}?action=${encodeURIComponent(action)}${query}`;
    const run=()=>this.request(path,{
      method,
      body:method==='GET'?undefined:JSON.stringify(data),
      headers:method==='GET'?{}:{'X-CSRF-Token':state.csrfToken}
    });
    try {
      return await run();
    } catch(error){
      if(method!=='GET' && error?.status===419){
        try {
          const csrf=await this.auth('csrf');
          state.csrfToken=csrf?.data?.token||'';
          return await run();
        } catch(_) { /* preserve original error below */ }
      }
      throw error;
    }
  },
  async settings(action,data={}){ return this.request(`${BACKEND.baseUrl}/${BACKEND.endpoints.settings}?action=${encodeURIComponent(action)}`,{method:action==='get'?'GET':'POST',body:action==='get'?undefined:JSON.stringify(data)}); },
  async upload(file,meta={}){
    const fd=new FormData(); fd.append('file',file); Object.entries(meta).forEach(([k,v])=>fd.append(k,String(v??'')));
    return this.request(`${BACKEND.baseUrl}/${BACKEND.endpoints.media}?action=upload`,{method:'POST',body:fd});
  },
  async media(action,data={}){
    return this.request(`${BACKEND.baseUrl}/${BACKEND.endpoints.media}?action=${encodeURIComponent(action)}`,{method:'POST',body:JSON.stringify(data)});
  }
};

let settingsSaveTimer=null;
function settingsPayload(){return {
  theme:state.theme,accent:state.accent,density:state.density,glass:state.glass,autoplay:state.autoplay,motion:state.motion,contrast:state.contrast,
  reduceMotion:state.reduceMotion,speed:state.speed,visualizer:state.visualizer,progressStyle:state.progressStyle,progressIntensity:state.progressIntensity,
  progressSpeed:state.progressSpeed,progressGlow:state.progressGlow,eqEnabled:state.eqEnabled,eqPreset:state.eqPreset,eqBands:state.eqBands,
  volume:state.volume,muted:state.muted,previousVolume:state.previousVolume
};
}
function updateAdminLink(){
  const link=$('#admin-link');
  if(!link)return;
  const isAdmin=state.user?.role==='admin';
  link.hidden=!isAdmin;
  link.style.display=isAdmin?'flex':'none';
}

async function loadBackendState(){
  try {
    const auth=await api.auth('me');
    state.user=auth?.data?.user||{name:'Guest'};
    updateAdminLink();
    try { const site=await api.site('get'); if(site?.data&&typeof site.data==='object') state.site={...state.site,...site.data}; } catch(err){ console.warn('SOUNDGROUP site settings:',err); }
    try { const csrf=await api.auth('csrf'); state.csrfToken=csrf?.data?.token||''; } catch(err){ console.warn('SOUNDGROUP csrf:',err); }
    try {
      const [media, catalog] = await Promise.all([api.loadMedia(), api.loadDiscover()]);
      state.media=media; state.media.sort((a,b)=>Number(b.addedAt||0)-Number(a.addedAt||0));
      state.discoverData=catalog;
      state.catalog=Array.isArray(catalog?.items)?catalog.items:[];
      state.catalog.sort((a,b)=>Number(b.addedAt||0)-Number(a.addedAt||0));
    }
    catch(err) { console.warn('SOUNDGROUP media load:',err); }
    if(!auth?.data?.authenticated) return;
    // Load each authenticated library independently so a non-critical failure
    // in favorites/history/settings can never erase a valid playlist response.
    const [favResult,histResult,playlistResult,settingsResult]=await Promise.all([
      api.favorites('list').then(data=>({ok:true,data})).catch(error=>({ok:false,error})),
      api.history('list').then(data=>({ok:true,data})).catch(error=>({ok:false,error})),
      api.playlists('list').then(data=>({ok:true,data})).catch(error=>({ok:false,error})),
      api.settings('get').then(data=>({ok:true,data})).catch(error=>({ok:false,error}))
    ]);
    if(favResult.ok){
      const fav=favResult.data;
      state.favorites=Array.isArray(fav?.data)?fav.data.map(String):[];
    } else console.warn('SOUNDGROUP favorites load:',favResult.error);
    if(histResult.ok){
      const hist=histResult.data;
      state.history=Array.isArray(hist?.data)?hist.data.map(h=>({id:String(h.id),type:h.type,current:Number(h.current||0),duration:Number(h.duration||0),updatedAt:Number(h.updatedAt||0)})):[];
    } else console.warn('SOUNDGROUP history load:',histResult.error);
    if(playlistResult.ok){
      const pls=playlistResult.data;
      state.playlists=Array.isArray(pls?.data)?pls.data.map(p=>({
        id:String(p.id),
        name:p.name,
        items:Array.isArray(p.items)?p.items.map(String):[],
        createdAt:Number(p.createdAt||0),
        updatedAt:Number(p.updatedAt||0)
      })):[];
    } else console.warn('SOUNDGROUP playlists load:',playlistResult.error);
    if(settingsResult.ok){
      const cfg=settingsResult.data?.data;
      if(cfg&&typeof cfg==='object') Object.keys(cfg).forEach(k=>{if(k in state && k!=='media' && k!=='user') state[k]=cfg[k]});
    } else console.warn('SOUNDGROUP settings load:',settingsResult.error);
  } catch(err) { console.warn('SOUNDGROUP state load:',err); }
}


function applyTheme(name, notify=false){
  const t=themes.find(x=>x[0]===name)||themes[0];
  state.theme=t[0]; state.accent=t[1];
  document.documentElement.style.setProperty('--accent',t[1]);
  document.documentElement.style.setProperty('--accent2',t[2]);
  document.documentElement.style.setProperty('--bg',t[3]);
  if(notify){ persistSetting('theme',state.theme); toast('Theme updated'); }
}
function applySettings(){
  applyTheme(state.theme,false);
  document.documentElement.style.setProperty('--glass',state.glass==='minimal'?'.45':state.glass==='rich'?'.82':state.glass==='ultra'?'.9':'.68');
  document.documentElement.style.setProperty('--density',state.density==='spacious'?'1.18':state.density==='comfortable'?'1.07':'.96');
  if(state.contrast) document.documentElement.style.setProperty('--surface','rgba(255,255,255,.09)');
  else document.documentElement.style.setProperty('--surface','rgba(255,255,255,.055)');
  document.body.classList.toggle('reduced-motion',state.reduceMotion||!state.motion);
  $('#accent-color').value=state.accent;
  $('#glass-intensity').value=state.glass;
  $('#density-select').value=state.density;
  $('#autoplay-toggle').checked=state.autoplay;
  $('#motion-toggle').checked=state.motion;
  $('#contrast-toggle').checked=state.contrast;
  $('#reduce-motion').checked=state.reduceMotion;
  $('#speed-select').value=String(state.speed);
  $('#visualizer-select').value=state.visualizer;
  $('#progress-intensity').value=state.progressIntensity;
  $('#progress-speed').value=state.progressSpeed;
  $('#progress-glow').value=state.progressGlow;
  renderThemes(); renderProgressStyles(); applyTimelineVisualSettings(); renderEQBands();
}
async function persistSetting(){
  if(!BACKEND.enabled || !state.user?.id) return;
  clearTimeout(settingsSaveTimer);
  settingsSaveTimer=setTimeout(()=>api.settings('save',settingsPayload()).catch(err=>console.warn('Settings save:',err)),250);
}
function toast(message){
  const wrap=$('#toast-container'); const el=document.createElement('div'); el.className='toast'; el.textContent=message; wrap.appendChild(el);
  setTimeout(()=>el.remove(),2600);
}

async function refreshPlaylistsFromServer(){
  if(!state.user?.id){
    state.playlists=[];
    if(state.view==='playlists') renderPlaylists();
    return false;
  }
  try{
    const pls=await api.playlists('list');
    state.playlists=Array.isArray(pls?.data)?pls.data.map(p=>({
      id:String(p.id),
      name:p.name,
      items:Array.isArray(p.items)?p.items.map(String):[],
      createdAt:Number(p.createdAt||0),
      updatedAt:Number(p.updatedAt||0)
    })):[];
    if(state.view==='playlists') renderPlaylists();
    return true;
  }catch(error){
    if(state.view==='playlists') toast(`Could not load playlists: ${error.message}`);
    console.warn('SOUNDGROUP playlists refresh:',error);
    return false;
  }
}

function setView(view){
  state.view=view;
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));
  $$('.nav-link').forEach(n=>n.classList.toggle('active',n.dataset.view===view));
  window.scrollTo({top:0,behavior:state.reduceMotion?'auto':'smooth'});
  $('#sidebar').classList.remove('open');
  renderView(view);
  if(view==='playlists' && state.user?.id) refreshPlaylistsFromServer();
}
function bindNavigation(){
  $$('[data-view]').forEach(el=>el.addEventListener('click',()=>setView(el.dataset.view)));
}
function renderView(view){
  if(view==='home') renderHome();
  if(view==='discover') renderDiscover();
  if(view==='music') renderMusic();
  if(view==='watch') renderWatch();
  if(view==='artists') renderArtists();
  if(view==='favorites') renderFavorites();
  if(view==='playlists') renderPlaylists();
  if(view==='history') renderHistory();
  if(view==='media') renderMedia();
  if(view==='studio') renderStudio();
  if(view==='analytics') renderAnalytics();
  if(view==='account') renderAccount();
  if(view==='settings') renderSettings();
}

function emptyState(title,copy,actionText='Add media',actionView='media'){
  return `<div class="empty-state"><div><div class="empty-icon">◈</div><h3>${esc(title)}</h3><p>${esc(copy)}</p><button class="btn primary small" data-view="${actionView}">${esc(actionText)}</button></div></div>`;
}
function catalogEmpty(title,copy){ return `<div class="empty-state"><div><div class="empty-icon">◈</div><h3>${esc(title)}</h3><p>${esc(copy)}</p></div></div>`; }
function mediaTone(m){return tone(Math.abs([...String(m.id||'')].reduce((a,c)=>a+c.charCodeAt(0),0)));}
function mediaInitial(m){return (m.title||m.name||'?').slice(0,2).toUpperCase();}
function mediaCard(m,opts={}){
  const video=m.type==='video', favorite=state.favorites.includes(m.id), progress=getProgress(m.id), official=Boolean(opts.official);
  const extra=opts.extra||'';
  const showRating=Boolean(opts.showRating && official);
  const isNew=official&&Number(m.addedAt||0)>Date.now()-7*24*60*60*1000;
  const sourceLabel=official?'SOUNDGROUP Official':(m.artist||m.creator||m.genre||'Local media');
  const reviewEligible = Boolean(m.origin==='official' && m.published);
  const detailsLabel = reviewEligible ? 'Details / reviews' : 'Details';
  const menuButtons = official
    ? `<button data-open="${video?'video':'audio'}" data-target="${esc(m.id)}">Play</button><button data-details="${esc(m.id)}">${detailsLabel}</button><button data-fav="${esc(m.id)}">${favorite?'Remove favorite':'Favorite'}</button><button data-playlist-add="${esc(m.id)}">Add to playlist</button>`
    : `<button data-open="${video?'video':'audio'}" data-target="${esc(m.id)}">Play</button><button data-details="${esc(m.id)}">${detailsLabel}</button><button data-fav="${esc(m.id)}">${favorite?'Remove favorite':'Favorite'}</button><button data-edit="${esc(m.id)}">Edit details</button><button data-playlist-add="${esc(m.id)}">Add to playlist</button><button data-remove="${esc(m.id)}">Remove</button>`;
  return `<article class="media-card ${video?'video-card':''} ${official?'official-card':''}" data-id="${esc(m.id)}">
    <div class="thumb ${video?'video':''}" style="--tone:${mediaTone(m)}" role="button" tabindex="0" data-open="${video?'video':'audio'}">
      ${m.artworkUrl?`<img src="${esc(m.artworkUrl)}" alt="" loading="lazy">`:''}${isNew?'<span class="new-badge">NEW</span>':''}<span class="thumb-mark">${m.artworkUrl?'':esc(mediaInitial(m))}</span>${m.duration?`<span class="duration">${fmtTime(m.duration)}</span>`:''}
      ${progress>0?`<span class="media-progress" style="position:absolute;left:0;right:${100-progress}%;bottom:0;height:3px;background:var(--accent2)"></span>`:''}
      <span class="play-float">${video?'▶':'♫'}</span>
    </div>
    <div class="card-meta"><strong>${esc(m.title)}</strong><small>${esc(sourceLabel)}</small>${official&&m.genre?`<small class="official-meta">${esc(m.genre)}</small>`:''}${showRating?`<span class="media-rating-mini" data-rating-summary-card="${esc(m.id)}">Rating —</span>`:''}</div>
    <div class="card-actions"><button class="mini-icon" data-fav="${esc(m.id)}" aria-label="Favorite">${favorite?'♥':'♡'}</button><button class="mini-icon" data-menu="${esc(m.id)}" aria-label="More">⋯</button></div>
    <div class="card-menu">${menuButtons}</div>
    ${extra}
  </article>`;
}

function getProgress(mediaId){const h=state.history.find(x=>x.id===mediaId);return h&&h.duration?Math.min(100,Math.round(h.current/h.duration*100)):0;}
function mediaById(id){
  const key=String(id);
  const direct=[...state.media,...state.catalog].find(m=>String(m?.id)===key);
  if(direct)return direct;
  const buckets=[
    state.discoverData?.all?.featured,
    state.discoverData?.all?.trendingMusic,
    state.discoverData?.all?.trendingVideos,
    state.discoverData?.all?.newMusic,
    state.discoverData?.all?.latestVideos,
    state.discoverData?.music?.featured,
    state.discoverData?.music?.trending,
    state.discoverData?.music?.newReleases,
    state.discoverData?.videos?.featured,
    state.discoverData?.videos?.trending,
    state.discoverData?.videos?.latest,
  ];
  for(const bucket of buckets){
    if(!Array.isArray(bucket))continue;
    const match=bucket.find(m=>String(m?.id)===key);
    if(match)return match;
  }
  return null;
}

function renderHome(){
  const recent=[...state.media].sort((a,b)=>b.addedAt-a.addedAt).slice(0,12);
  const cont=[...state.history].sort((a,b)=>b.updatedAt-a.updatedAt).map(h=>mediaById(h.id)).filter(Boolean).slice(0,10);
  $('#home-continue').innerHTML=cont.length?cont.map(m=>mediaCard(m)).join(''):emptyState('Your continue row is waiting','Play or watch something and SOUNDGROUP will remember your position.','Explore media','media');
  $('#home-recent').innerHTML=recent.length?recent.map(m=>mediaCard(m)).join(''):emptyState('Your room starts here','Import music or video and the home experience will grow around it.','Add media','media');
  const officialMusic=(state.discoverData?.all?.newMusic||[]).slice(0,5);
  const officialVideos=(state.discoverData?.all?.latestVideos||[]).slice(0,5);
  $('#home-latest-music').innerHTML=officialMusic.length?officialMusic.map(m=>mediaCard(m,{official:true})).join(''):catalogEmpty('No official music yet','Admin-published music will appear here.');
  $('#home-latest-videos').innerHTML=officialVideos.length?officialVideos.map(m=>mediaCard(m,{official:true})).join(''):catalogEmpty('No official videos yet','Admin-published videos will appear here.');
  bindDynamicCards($('#home-latest-music')); bindDynamicCards($('#home-latest-videos'));
  $('#hero-count').textContent=`${state.media.length} media`;
  $('#site-tagline').textContent=state.site.site_tagline||'Your imported media is stored on your local SOUNDGROUP server. No remote media is required.';
  $('#site-about-title').textContent=state.site.site_name||'SOUNDGROUP';
  $('#site-about').textContent=state.site.about_text||state.site.site_tagline||'';
  $('#site-contact').textContent=state.site.contact_text||'';
  bindDynamicCards($('#home-continue')); bindDynamicCards($('#home-recent'));
}
function renderDiscover(){
  const data=state.discoverData||{};
  const all=data.all||{}; const music=data.music||{}; const videos=data.videos||{};
  const count=Number(data.counts?.total||0);
  const musicCount=Number(data.counts?.music||0); const videoCount=Number(data.counts?.videos||0);
  $('#discover-title').textContent=count?`${count} official releases to explore.`:'The official SOUNDGROUP catalog is ready when you are.';
  $('#discover-copy').textContent=count?`${musicCount} music release${musicCount===1?'':'s'} and ${videoCount} video${videoCount===1?'':'s'}, curated and published by SOUNDGROUP.`:'Published SOUNDGROUP music and videos will appear here after the admin publishes the catalog.';
  $('#discover-count').textContent=`${count} release${count===1?'':'s'}`;
  const cardList=(el,items,opts={},emptyTitle='Nothing here yet',emptyCopy='Published SOUNDGROUP content will appear here.')=>{const root=$(el);if(!root)return;root.innerHTML=Array.isArray(items)&&items.length?items.map(m=>mediaCard(m,{official:true,showRating:true,...opts})).join(''):catalogEmpty(emptyTitle,emptyCopy);bindDynamicCards(root);};

  cardList('#discover-all-featured',all.featured,{},'No featured releases yet','Ask the admin to publish featured music or videos.');
  cardList('#discover-all-trending-music',all.trendingMusic,{},'No trending music yet','Published music marked as Trending will appear here.');
  cardList('#discover-all-trending-videos',all.trendingVideos,{},'No trending videos yet','Published videos marked as Trending will appear here.');
  cardList('#discover-all-new-music',all.newMusic,{},'No music releases yet','Official published music will appear here.');
  cardList('#discover-all-latest-videos',all.latestVideos,{},'No videos yet','Official published videos will appear here.');

  cardList('#discover-music-featured',music.featured,{},'No featured music yet','Admin-published featured music will appear here.');
  cardList('#discover-music-trending',music.trending,{},'No trending music yet','Admin-published trending music will appear here.');
  cardList('#discover-music-new',music.newReleases,{},'No music releases yet','Official published music will appear here.');
  const genreRoot=$('#discover-music-genres');
  if(genreRoot){
    const genres=Array.isArray(music.genres)?music.genres:[];
    genreRoot.innerHTML=genres.length?genres.slice(0,12).map(g=>`<button class="mood-card discover-genre-card" type="button" data-discover-genre="${esc(g.name)}" style="--tone:${tone(g.name.length)}"><strong>${esc(g.name)}</strong><small>${g.count} release${g.count===1?'':'s'}</small></button>`).join(''):catalogEmpty('No genres yet','Add genre metadata to official music releases to build this shelf.');
    genreRoot.querySelectorAll('[data-discover-genre]').forEach(btn=>btn.addEventListener('click',()=>{
      const genre=btn.dataset.discoverGenre;
      const source=(music.newReleases||[]).filter(m=>String(m.genre||'').toLowerCase()===genre.toLowerCase());
      cardList('#discover-music-new',source,{},`No ${genre} releases found`,`No official music in ${genre} is currently published.`);
      $('#discover-music-new')?.scrollIntoView({behavior:state.reduceMotion?'auto':'smooth',block:'start'});
    }));
  }

  cardList('#discover-video-featured',videos.featured,{},'No featured videos yet','Admin-published featured videos will appear here.');
  cardList('#discover-video-trending',videos.trending,{},'No trending videos yet','Admin-published trending videos will appear here.');
  cardList('#discover-video-latest',videos.latest,{},'No videos yet','Official published videos will appear here.');

  hydrateDiscoverRatingSummaries();
  $$('#discover-tabs .discover-tab').forEach(tab=>{
    const active=tab.dataset.discoverTab===state.discoverTab;
    tab.classList.toggle('active',active); tab.setAttribute('aria-selected',active?'true':'false');
  });
  $$('.discover-mode').forEach(mode=>{const active=mode.dataset.discoverMode===state.discoverTab;mode.hidden=!active;mode.classList.toggle('active',active);});
}
async function hydrateDiscoverRatingSummaries(){
  const nodes=$$('[data-rating-summary-card]');
  const ids=[...new Set(nodes.map(n=>String(n.dataset.ratingSummaryCard)).filter(Boolean))];
  if(!ids.length)return;
  try{
    const payload=await api.reviews('summary_batch',{media_ids:ids});
    const rows=payload?.data||{};
    ids.forEach(id=>state.reviewSummaryCache.set(id,rows[id]||{average:0,count:0}));
    nodes.forEach(n=>{const d=state.reviewSummaryCache.get(String(n.dataset.ratingSummaryCard))||{average:0,count:0};n.textContent=d.count?`★ ${Number(d.average||0).toFixed(1)} · ${d.count} rating${d.count===1?'':'s'}${d.review_count?` · ${d.review_count} review${d.review_count===1?'':'s'}`:''}`:'No ratings yet';});
  }catch(error){
    nodes.forEach(n=>{n.textContent='Rating unavailable';});
    console.warn('SOUNDGROUP rating summaries:',error);
  }
}

function setupDiscoverTabs(){
  $$('#discover-tabs .discover-tab').forEach(tab=>tab.addEventListener('click',()=>{state.discoverTab=tab.dataset.discoverTab||'all';renderDiscover();}));
}

function renderMusic(){
  const audio=state.media.filter(m=>m.type==='audio');
  const genres=['all',...new Set(audio.map(m=>m.genre).filter(Boolean))];
  $('#music-filters').innerHTML=genres.map(g=>`<button class="filter ${state.musicFilter===g?'active':''}" data-music-filter="${esc(g)}">${g==='all'?'All':esc(g)}</button>`).join('');
  $$('#music-filters .filter').forEach(b=>b.addEventListener('click',()=>{state.musicFilter=b.dataset.musicFilter;renderMusic();}));
  const years=['all',...new Set(audio.map(m=>m.releaseYear).filter(Boolean).map(String))].sort((a,b)=>a==='all'?-1:b==='all'?1:Number(b)-Number(a));
  const langs=['all',...new Set(audio.map(m=>m.language).filter(Boolean))].sort();
  const yearSel=$('#music-year-filter'),langSel=$('#music-language-filter');
  yearSel.innerHTML=years.map(y=>`<option value="${esc(y)}">${y==='all'?'All years':esc(y)}</option>`).join(''); yearSel.value=state.musicYear||'all';
  langSel.innerHTML=langs.map(l=>`<option value="${esc(l)}">${l==='all'?'All languages':esc(l)}</option>`).join(''); langSel.value=state.musicLanguage||'all';
  yearSel.onchange=()=>{state.musicYear=yearSel.value;renderMusic();}; langSel.onchange=()=>{state.musicLanguage=langSel.value;renderMusic();};
  let list=audio.filter(m=>(state.musicFilter==='all'||m.genre===state.musicFilter)&&((state.musicYear||'all')==='all'||String(m.releaseYear||'')===String(state.musicYear))&&((state.musicLanguage||'all')==='all'||String(m.language||'')===String(state.musicLanguage)));
  const sort=$('#music-sort').value;
  list.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='artist'?String(a.artist||'').localeCompare(String(b.artist||'')):sort==='duration'?(a.duration||0)-(b.duration||0):b.addedAt-a.addedAt);
  $('#music-count').textContent=audio.length;
  $('#music-grid').innerHTML=list.length?list.map(m=>mediaCard(m)).join(''):emptyState('No music matches these filters','Adjust year, language or genre and try again.','Add music','media');
  bindDynamicCards($('#music-grid'));
}
function renderWatch(){
  const vids=state.media.filter(m=>m.type==='video');
  const cats=['all',...new Set(vids.map(v=>v.genre).filter(Boolean))];
  $('#video-filters').innerHTML=cats.map(c=>`<button class="filter ${state.videoFilter===c?'active':''}" data-video-filter="${esc(c)}">${c==='all'?'All':esc(c)}</button>`).join('');
  $$('#video-filters .filter').forEach(b=>b.addEventListener('click',()=>{state.videoFilter=b.dataset.videoFilter;renderWatch();}));
  const years=['all',...new Set(vids.map(m=>m.releaseYear).filter(Boolean).map(String))].sort((a,b)=>a==='all'?-1:b==='all'?1:Number(b)-Number(a));
  const langs=['all',...new Set(vids.map(m=>m.language).filter(Boolean))].sort();
  const yearSel=$('#video-year-filter'),langSel=$('#video-language-filter');
  yearSel.innerHTML=years.map(y=>`<option value="${esc(y)}">${y==='all'?'All years':esc(y)}</option>`).join(''); yearSel.value=state.videoYear||'all';
  langSel.innerHTML=langs.map(l=>`<option value="${esc(l)}">${l==='all'?'All languages':esc(l)}</option>`).join(''); langSel.value=state.videoLanguage||'all';
  yearSel.onchange=()=>{state.videoYear=yearSel.value;renderWatch();}; langSel.onchange=()=>{state.videoLanguage=langSel.value;renderWatch();};
  const cont=[...state.history].sort((a,b)=>b.updatedAt-a.updatedAt).map(h=>mediaById(h.id)).filter(m=>m&&m.type==='video').slice(0,8);
  $('#continue-watch-row').innerHTML=cont.length?cont.map(m=>mediaCard(m)).join(''):emptyState('Nothing to continue','Start a video and your progress will appear here.','Add video','media');
  bindDynamicCards($('#continue-watch-row'));
  const list=vids.filter(v=>(state.videoFilter==='all'||v.genre===state.videoFilter)&&((state.videoYear||'all')==='all'||String(v.releaseYear||'')===String(state.videoYear))&&((state.videoLanguage||'all')==='all'||String(v.language||'')===String(state.videoLanguage))).sort((a,b)=>b.addedAt-a.addedAt);
  $('#video-grid').innerHTML=list.length?list.map(m=>mediaCard(m)).join(''):emptyState('No videos match these filters','Adjust year, language or genre and try again.','Add video','media');
  bindDynamicCards($('#video-grid'));
}
function renderArtists(){
  const map=new Map();
  state.media.forEach(m=>{const name=(m.artist||m.creator||'Unknown creator').trim()||'Unknown creator'; if(!map.has(name))map.set(name,{name,count:0,items:[]});map.get(name).count++;map.get(name).items.push(m);});
  const artists=[...map.values()].sort((a,b)=>b.count-a.count);
  $('#artist-grid').innerHTML=artists.length?artists.map((a,i)=>`<button class="artist-card" data-artist="${esc(a.name)}"><div class="artist-avatar" style="background:radial-gradient(circle at 30% 20%,#fff,${tone(i)} 8%,#151225 45%,#08090d 75%)">${esc(a.name.slice(0,2).toUpperCase())}</div><strong>${esc(a.name)}</strong><small>${a.count} item${a.count===1?'':'s'}</small></button>`).join(''):emptyState('No artists yet','Artists are derived from the metadata of your imported files.','Add music','media');
  $$('#artist-grid .artist-card').forEach(b=>b.addEventListener('click',()=>openArtist(b.dataset.artist)));
}
function openArtist(name){
  const items=state.media.filter(m=>(m.artist||m.creator||'Unknown creator')===name);
  showTransientView('artists', `<div class="page-heading"><div><span class="section-kicker">ARTIST</span><h1>${esc(name)}</h1><p>${items.length} item${items.length===1?'':'s'} in your local library.</p></div></div><div class="explore-grid">${items.map(m=>mediaCard(m)).join('')}</div>`);
  bindDynamicCards($('.view.active'));
}
function showTransientView(view,html){setView(view);$('#view-artists').innerHTML=html;}
function renderFavorites(){
  const list=state.favorites.map(id=>mediaById(id)).filter(Boolean);
  $('#favorites-grid').innerHTML=list.length?list.map(m=>mediaCard(m)).join(''):emptyState('Nothing saved yet','Favorite music and videos as you browse to make this page yours.','Discover','discover');
  bindDynamicCards($('#favorites-grid'));
}
function playlistById(id){return state.playlists.find(p=>String(p.id)===String(id))||null;}
function renderPlaylists(){
  const grid=$('#playlist-grid');
  grid.innerHTML=state.playlists.length
    ?state.playlists.map((p,i)=>{const count=Array.isArray(p.items)?p.items.length:0;return `<article class="playlist-card" data-playlist-card="${esc(p.id)}"><button class="playlist-cover playlist-open" data-playlist-open="${esc(p.id)}" style="background:linear-gradient(135deg,${tone(i)},#0b0c12)" aria-label="Open ${esc(p.name)}"><span>${esc(p.name.slice(0,2).toUpperCase())}</span></button><h3>${esc(p.name)}</h3><p>${count} item${count===1?'':'s'}</p><div class="hero-actions"><button class="btn secondary small" data-playlist-open="${esc(p.id)}">Open</button><button class="btn secondary small" data-playlist-play="${esc(p.id)}">Play all</button><button class="btn secondary small" data-playlist-delete="${esc(p.id)}">Delete</button></div></article>`;}).join('')
    :`<div class="empty-state"><div><div class="empty-icon">◈</div><h3>No playlists yet</h3><p>Create a playlist to collect your music. Add tracks, reorder them and play the whole set.</p><button class="btn primary small" id="empty-playlist-create">Create playlist</button><button class="btn secondary small" id="empty-playlist-discover">Discover music</button></div></div>`;
  $$('#playlist-grid [data-playlist-open]').forEach(b=>b.addEventListener('click',()=>openPlaylistDetail(b.dataset.playlistOpen)));
  $$('#playlist-grid [data-playlist-play]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();playPlaylist(b.dataset.playlistPlay)}));
  $$('#playlist-grid [data-playlist-delete]').forEach(b=>b.addEventListener('click',async e=>{e.stopPropagation();if(!confirm('Delete this playlist and all of its track links?'))return;try{await api.playlists('delete',{id:b.dataset.playlistDelete});state.playlists=state.playlists.filter(p=>String(p.id)!==String(b.dataset.playlistDelete));renderPlaylists();toast('Playlist deleted')}catch(e){toast(e.message)}}));
  $('#empty-playlist-create')?.addEventListener('click',()=>$('#playlist-modal').classList.add('open'));
  $('#empty-playlist-discover')?.addEventListener('click',()=>setView('discover'));
}
function renderPlaylistDetail(){
  const pid=$('#playlist-detail-modal').dataset.playlistId;const p=playlistById(pid);if(!p)return;
  $('#playlist-detail-title').textContent=p.name;
  const items=Array.isArray(p.items)?p.items.map(String):[];
  $('#playlist-detail-meta').textContent=`${items.length} item${items.length===1?'':'s'} • personal playlist`;
  $('#playlist-play-all').disabled=!items.some(id=>mediaById(id)?.type==='audio');
  $('#playlist-track-list').innerHTML=items.length?items.map((id,index)=>{const m=mediaById(id);return `<div class="playlist-track-row"><div class="playlist-track-index">${String(index+1).padStart(2,'0')}</div><div class="playlist-track-copy"><strong>${esc(m?.title||'Missing media')}</strong><small>${esc(m?.artist||'Unknown artist')} · ${m?.type==='audio'?'Audio':'Unavailable'}</small></div><div class="playlist-track-actions"><button class="icon-btn" data-playlist-up="${esc(id)}" ${index===0?'disabled':''} aria-label="Move up">↑</button><button class="icon-btn" data-playlist-down="${esc(id)}" ${index===items.length-1?'disabled':''} aria-label="Move down">↓</button><button class="icon-btn" data-playlist-remove="${esc(id)}" aria-label="Remove track">×</button><button class="btn secondary small" data-playlist-track-play="${esc(id)}" ${m?.type!=='audio'?'disabled':''}>Play</button></div></div>`;}).join(''):`<div class="empty-state"><div><div class="empty-icon">♫</div><h3>This playlist is empty</h3><p>Add music from My Media to build the playlist.</p><button class="btn primary small" id="empty-detail-add">Add music</button></div></div>`;
  $$('#playlist-track-list [data-playlist-up]').forEach(b=>b.addEventListener('click',()=>movePlaylistTrack(pid,b.dataset.playlistUp,-1)));
  $$('#playlist-track-list [data-playlist-down]').forEach(b=>b.addEventListener('click',()=>movePlaylistTrack(pid,b.dataset.playlistDown,1)));
  $$('#playlist-track-list [data-playlist-remove]').forEach(b=>b.addEventListener('click',()=>removePlaylistTrack(pid,b.dataset.playlistRemove)));
  $$('#playlist-track-list [data-playlist-track-play]').forEach(b=>b.addEventListener('click',()=>{const m=mediaById(b.dataset.playlistTrack);if(m?.type==='audio')loadAudio(m,true)}));
  $('#empty-detail-add')?.addEventListener('click',()=>openPlaylistTrackPicker(pid));
}
function openPlaylistDetail(pid){if(!playlistById(pid))return;$('#playlist-detail-modal').dataset.playlistId=String(pid);renderPlaylistDetail();$('#playlist-detail-modal').classList.add('open');}
async function renamePlaylist(){const pid=$('#playlist-detail-modal').dataset.playlistId;const p=playlistById(pid);if(!p)return;const name=prompt('Rename playlist',p.name);if(name===null)return;const value=name.trim();if(!value){toast('Playlist name is required');return}try{const r=await api.playlists('rename',{id:pid,name:value});state.playlists=state.playlists.map(x=>String(x.id)===String(pid)?{...x,name:value,...(r.data||{})}:x);renderPlaylists();renderPlaylistDetail();toast('Playlist renamed')}catch(e){toast(e.message)}}
async function movePlaylistTrack(pid,mediaId,direction){const p=playlistById(pid);if(!p)return;const items=[...p.items];const i=items.findIndex(x=>String(x)===String(mediaId));const j=i+direction;if(i<0||j<0||j>=items.length)return;[items[i],items[j]]=[items[j],items[i]];try{await api.playlists('reorder',{id:pid,items});p.items=items;renderPlaylistDetail();toast('Playlist order updated')}catch(e){toast(e.message)}}
async function removePlaylistTrack(pid,mediaId){if(!confirm('Remove this track from the playlist?'))return;try{await api.playlists('remove',{playlistId:pid,mediaId});const p=playlistById(pid);if(p)p.items=p.items.filter(x=>String(x)!==String(mediaId));renderPlaylistDetail();toast('Track removed from playlist')}catch(e){toast(e.message)}}
function updatePlaylistPickerSelectionState(){
  const items=$$('#playlist-picker-list [data-playlist-picker-media]');
  const selected=items.filter(b=>b.dataset.selected==='1');
  const selectAll=$('#playlist-picker-select-all');
  const addSelected=$('#playlist-picker-add-selected');
  if(selectAll){
    selectAll.checked=items.length>0&&selected.length===items.length;
    selectAll.indeterminate=selected.length>0&&selected.length<items.length;
  }
  if(addSelected){
    addSelected.disabled=selected.length===0;
    addSelected.textContent=selected.length?`Add selected (${selected.length})`:'Add selected';
  }
  items.forEach(b=>b.classList.toggle('selected',b.dataset.selected==='1'));
}
function openPlaylistTrackPicker(pid){
  const p=playlistById(pid);if(!p)return;
  const existing=new Set((p.items||[]).map(String));
  const available=state.media.filter(m=>m.type==='audio'&&!existing.has(String(m.id)));
  $('#playlist-picker-modal').dataset.playlistId=String(pid);
  $('#playlist-picker-modal').dataset.mediaId='';
  $('#playlist-picker-kicker').textContent='ADD MUSIC';
  $('#playlist-picker-title').textContent=`Add music to ${p.name}`;
  const list=$('#playlist-picker-list');
  list.innerHTML=available.length?available.map(m=>`<button type="button" class="playlist-picker-item" data-playlist-picker-media="${esc(m.id)}" data-selected="0" aria-pressed="false"><span class="playlist-picker-check" aria-hidden="true">✓</span><span class="playlist-picker-icon">♫</span><span><strong>${esc(m.title||'Untitled')}</strong><small>${esc(m.artist||'Unknown artist')}</small></span><span class="playlist-picker-item-action">＋</span></button>`).join(''):`<div class="playlist-picker-empty"><strong>No music available to add</strong><small>Upload an audio file in My Media first, then return here to add it to this playlist.</small><button class="btn primary small" id="playlist-picker-go-media">Open My Media</button></div>`;
  const toolbar=$('#playlist-picker-toolbar');
  if(toolbar) toolbar.hidden=!available.length;
  $$('#playlist-picker-list [data-playlist-picker-media]').forEach(b=>b.addEventListener('click',()=>{
    const next=b.dataset.selected!=='1';
    b.dataset.selected=next?'1':'0';
    b.setAttribute('aria-pressed',next?'true':'false');
    updatePlaylistPickerSelectionState();
  }));
  $('#playlist-picker-select-all')?.addEventListener('change',e=>{
    const checked=Boolean(e.target.checked);
    $$('#playlist-picker-list [data-playlist-picker-media]').forEach(b=>{
      b.dataset.selected=checked?'1':'0';
      b.setAttribute('aria-pressed',checked?'true':'false');
    });
    updatePlaylistPickerSelectionState();
  });
  $('#playlist-picker-add-selected')?.addEventListener('click',()=>addSelectedTracksFromPicker(pid));
  $('#playlist-picker-go-media')?.addEventListener('click',()=>{$('#playlist-picker-modal').classList.remove('open');setView('media');});
  updatePlaylistPickerSelectionState();
  $('#playlist-picker-modal').classList.add('open');
}
async function addTrackFromPicker(pid,mediaId){return addSelectedTrackIds(pid,[String(mediaId)]);}
async function addSelectedTracksFromPicker(pid){
  const ids=$$('#playlist-picker-list [data-playlist-picker-media]').filter(b=>b.dataset.selected==='1').map(b=>String(b.dataset.playlistPickerMedia));
  if(!ids.length){toast('Select at least one track.');return;}
  await addSelectedTrackIds(pid,ids);
}
async function addSelectedTrackIds(pid,mediaIds){
  const p=playlistById(pid);if(!p)return;
  let added=0;const failed=[];
  for(const mediaId of mediaIds){
    try{
      await api.playlists('add',{playlistId:pid,mediaId});
      if(!p.items.some(x=>String(x)===String(mediaId)))p.items.push(String(mediaId));
      added++;
    }catch(e){failed.push({mediaId,message:e.message});}
  }
  if(added) renderPlaylistDetail();
  renderPlaylists();
  openPlaylistTrackPicker(pid);
  if(added&&failed.length) toast(`${added} track${added===1?'':'s'} added; ${failed.length} failed.`);
  else if(added) toast(`${added} track${added===1?'':'s'} added to playlist.`);
  else if(failed.length) toast(failed[0].message);
}
function renderHistory(){
  const list=[...state.history].sort((a,b)=>b.updatedAt-a.updatedAt).map(h=>mediaById(h.id)).filter(Boolean);
  $('#history-grid').innerHTML=list.length?list.map(m=>mediaCard(m)).join(''):emptyState('Your history is clear','Play music or watch a video and SOUNDGROUP will remember your place.','Discover','discover');
  bindDynamicCards($('#history-grid'));
}
function renderMedia(){
  const filters=['all','audio','video','other'];
  $('#media-filters').innerHTML=filters.map(f=>`<button class="filter ${state.importFilter===f?'active':''}" data-media-filter="${f}">${f==='all'?'All':f[0].toUpperCase()+f.slice(1)}</button>`).join('');
  $$('#media-filters .filter').forEach(b=>b.addEventListener('click',()=>{state.importFilter=b.dataset.mediaFilter;renderMedia()}));
  const list=state.media.filter(m=>state.importFilter==='all'||m.type===state.importFilter).sort((a,b)=>b.addedAt-a.addedAt);
  $('#media-grid').innerHTML=list.length?list.map(m=>mediaCard(m)).join(''):emptyState('Your media vault is empty','Upload media after signing in to build your server library.','Refresh catalog','media');
  bindDynamicCards($('#media-grid'));
  updateStorageStats();
}
function renderStudio(){
  $('#studio-media-count').textContent=`${state.media.length} item${state.media.length===1?'':'s'}`;
  $('#studio-media-copy').textContent=state.media.length?'Your creator room is connected to the current PHP media catalog.':'Your creator room is ready for the PHP media catalog.';
  $('#studio-bars').innerHTML=[...Array(8)].map((_,i)=>`<i style="--h:${20+(state.media.length?Math.min(70,state.media.length*5+i*6):i*5)}%"></i>`).join('');
}
function renderAnalytics(){
  const plays=state.history.filter(h=>h.type==='audio').length, watches=state.history.filter(h=>h.type==='video').length;
  const totalTime=state.history.reduce((n,h)=>n+(h.current||0),0);
  const favs=state.favorites.length;
  $('#analytics-stats').innerHTML=[['Listening / watch sessions',state.history.length],['Audio history',plays],['Video history',watches],['Saved items',favs]].map(x=>`<div><small>${esc(x[0])}</small><strong>${x[1]}</strong></div>`).join('');
  $('#activity-bars').innerHTML=[...Array(10)].map((_,i)=>`<i style="--h:${Math.max(8,Math.min(100,8+(state.history.length*7)+(i%3)*12))}%"></i>`).join('');
}
function renderAccount(){
  const name=state.user?.name||'Guest';
  $('#account-name').textContent=name;$('#side-name').textContent=name;$('.top-avatar').textContent=name.slice(0,1).toUpperCase();
  const authBtn=$('#auth-open');
  if(authBtn) authBtn.textContent=state.user?.id?'Log out':'Log in / Sign up';
}
function renderSettings(){applySettings();$('#settings-storage').textContent=`${state.media.length} items • ${fmtBytes(state.media.reduce((n,m)=>n+m.size,0))}`;}

function renderThemes(){
  $('#theme-selector').innerHTML=themes.map(t=>`<button class="theme-swatch ${state.theme===t[0]?'active':''}" data-theme="${t[0]}" style="background:radial-gradient(circle at 25% 20%,#fff3,transparent 4%),linear-gradient(135deg,${t[1]},${t[2]} 55%,${t[3]})"><span>${esc(t[0])}</span></button>`).join('');
  $$('#theme-selector .theme-swatch').forEach(b=>b.addEventListener('click',()=>applyTheme(b.dataset.theme,true)));
}
function timelineBars(){return ['#track-bar','#full-track-bar'].map(sel=>$(sel)).filter(Boolean)}
function setTimelinePlaybackState({hasTrack=Boolean(state.current),playing=false}={}){
  timelineBars().forEach(bar=>{
    bar.classList.toggle('has-track',Boolean(hasTrack));
    bar.classList.toggle('is-playing',Boolean(hasTrack&&playing));
  });
}
function timelineSpeedDuration(value){
  const speed=Math.max(20,Math.min(180,Number(value)||100));
  return (2.4-((speed-20)/160)*2).toFixed(2)+'s';
}
function applyTimelineVisualSettings(){
  const intensity=Math.max(0,Math.min(100,Number(state.progressIntensity)||0));
  const glow=Math.max(0,Math.min(100,Number(state.progressGlow)||0));
  if(!progressStyles.includes(state.progressStyle)) state.progressStyle=progressStyles[0];
  const opacity=(0.58+(intensity/100)*0.42).toFixed(3);
  const glowPx=Math.round((glow/100)*24)+'px';
  const glowSoftPx=Math.max(0,Math.round((glow/100)*6))+'px';
  const duration=timelineSpeedDuration(state.progressSpeed);
  timelineBars().forEach(bar=>{
    bar.dataset.progressStyle=state.progressStyle;
    bar.style.setProperty('--timeline-intensity',String(intensity/100));
    bar.style.setProperty('--timeline-opacity',opacity);
    bar.style.setProperty('--timeline-glow',glowPx);
    bar.style.setProperty('--timeline-glow-soft',glowSoftPx);
    bar.style.setProperty('--timeline-duration',duration);
  });
  setTimelinePlaybackState({hasTrack:Boolean(state.current),playing:!audio?.paused&&Boolean(state.current)});
}
function updateTimelinePosition(currentTime,duration){
  const d=Number.isFinite(duration)?duration:0;
  const current=Number.isFinite(currentTime)?Math.max(0,currentTime):0;
  const pct=d>0?Math.max(0,Math.min(100,(current/d)*100)):0;
  const value=`${pct}%`;
  const track=$('#track-bar'), full=$('#full-track-bar');
  track?.style.setProperty('--progress',value);
  full?.style.setProperty('--progress',value);
  track?.setAttribute('aria-valuenow',pct.toFixed(1));
  full?.setAttribute('aria-valuenow',pct.toFixed(1));
  track?.setAttribute('aria-valuetext',`${fmtTime(current)} of ${fmtTime(d)}`);
  full?.setAttribute('aria-valuetext',`${fmtTime(current)} of ${fmtTime(d)}`);
  $('#curr-time').textContent=fmtTime(current);
  $('#tot-time').textContent=fmtTime(d);
  $('#full-curr-time').textContent=fmtTime(current);
  $('#full-tot-time').textContent=fmtTime(d);
}
function renderProgressStyles(){
  $('#progress-style-grid').innerHTML=progressStyles.map(p=>`<button class="progress-style ${state.progressStyle===p?'active':''}" data-progress="${esc(p)}" aria-label="Use ${esc(p)} playback progress style"><span class="style-preview style-${slug(p)}"></span><b>${esc(p)}</b></button>`).join('');
  $$('#progress-style-grid button').forEach(b=>b.addEventListener('click',()=>{state.progressStyle=b.dataset.progress;persistSetting('sg_progress_style',state.progressStyle);renderProgressStyles();applyTimelineVisualSettings();toast('Timeline updated')}));
  applyTimelineVisualSettings();
}

function bindDynamicCards(root){
  if(!root)return;
  $$('[data-view]',root).forEach(el=>{if(!el.dataset.navBound) {el.dataset.navBound='1';el.addEventListener('click',()=>setView(el.dataset.view));}});
  $$('[data-open]',root).forEach(el=>el.addEventListener('click',()=>{const target=el.dataset.target||el.closest('.media-card')?.dataset.id;if(!target)return; const m=mediaById(target); if(m?.type==='video')openVideo(m); else if(m?.type==='audio')loadAudio(m,true); else if(m) toast('This file is stored but is not browser-playable.')}));
  $$('[data-fav]',root).forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();toggleFavorite(el.dataset.fav)}));
  $$('[data-menu]',root).forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();const card=el.closest('.media-card');const menu=card?.querySelector('.card-menu');if(!menu)return;$$('.card-menu.open').forEach(x=>x!==menu&&x.classList.remove('open'));menu.classList.toggle('open')}));
  $$('[data-target]',root).forEach(el=>{ if(el.dataset.open) return; el.addEventListener('click',()=>{const m=mediaById(el.dataset.target); if(m?.type==='video')openVideo(m);else if(m?.type==='audio')loadAudio(m,true);else if(m)toast('This file is stored but is not browser-playable.');});});
  $$('[data-edit]',root).forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();openEditMedia(el.dataset.edit)}));
  $$('[data-remove]',root).forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();removeMedia(el.dataset.remove)}));
  $$('[data-playlist-add]',root).forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();openMediaPlaylistPicker(el.dataset.playlistAdd)}));
}

function toggleFavorite(mediaId){
  const active=state.favorites.includes(String(mediaId));
  if(active) state.favorites=state.favorites.filter(x=>String(x)!==String(mediaId));
  else state.favorites=[...state.favorites,String(mediaId)];
  updateFavCount(); renderView(state.view); updatePlayerFavorite(); toast(active?'Removed from Favorites':'Added to Favorites');
  if(BACKEND.enabled && state.user?.id) api.favorites('toggle',{mediaId:String(mediaId)}).catch(err=>toast(err.message));
}
function updateFavCount(){$('#fav-count').textContent=state.favorites.length}
function updatePlayerFavorite(){if(!state.current)return;$('#heart-player').classList.toggle('active',state.favorites.includes(state.current.id));$('#heart-player').textContent=state.favorites.includes(state.current.id)?'♥':'♡'}

const historyThrottle=new Map();
function saveHistory(media,current,duration){
  const cleanCurrent=Number.isFinite(current)?current:0, cleanDuration=Number.isFinite(duration)?duration:media.duration||0;
  const item={id:String(media.id),type:media.type,current:cleanCurrent,duration:cleanDuration,updatedAt:now()};
  state.history=[item,...state.history.filter(h=>String(h.id)!==String(media.id))].slice(0,100);
  if(!BACKEND.enabled || !state.user?.id)return;
  const key=String(media.id); const last=historyThrottle.get(key)||0; const ts=Date.now(); if(ts-last<4000 && cleanCurrent<cleanDuration)return; historyThrottle.set(key,ts);
  api.history('save',{mediaId:key,type:media.type,current:cleanCurrent,duration:cleanDuration}).catch(()=>{}); trackAnalytics('history',media.id,cleanCurrent);
}
const analyticsSent=new Set();
function trackAnalytics(eventType,mediaId,value=null,meta=null){
  if(!BACKEND.enabled)return;
  const key=`${eventType}:${mediaId||0}:${Math.floor(Date.now()/15000)}`; if(analyticsSent.has(key))return; analyticsSent.add(key);
  api.analytics('track',{eventType,mediaId:mediaId?String(mediaId):null,value,meta}).catch(()=>{});
}
async function resolveMediaDuration(media){
  if(!media) return null;
  const known=Number(media.duration);
  if(Number.isFinite(known) && known>0) return known;

  const historyItem=state.history.find(h=>String(h.id)===String(media.id));
  const historyDuration=Number(historyItem?.duration);
  if(Number.isFinite(historyDuration) && historyDuration>0) return historyDuration;

  if(state.current && String(state.current.id)===String(media.id) && Number.isFinite(audio.duration) && audio.duration>0){
    return audio.duration;
  }
  if(state.currentVideo && String(state.currentVideo.id)===String(media.id) && typeof video!=='undefined' && Number.isFinite(video.duration) && video.duration>0){
    return video.duration;
  }

  const source=media.mediaUrl||media.streamUrl||media.url;
  if(!source) return null;
  return new Promise(resolve=>{
    const element=document.createElement(media.type==='video'?'video':'audio');
    element.preload='metadata';
    element.muted=true;
    element.playsInline=true;
    element.src=source;
    let settled=false;
    const finish=value=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      element.removeAttribute('src');
      try{element.load();}catch{}
      resolve(Number.isFinite(value)&&value>0?value:null);
    };
    const timer=setTimeout(()=>finish(null),10000);
    element.addEventListener('loadedmetadata',()=>finish(element.duration),{once:true});
    element.addEventListener('durationchange',()=>{ if(Number.isFinite(element.duration)&&element.duration>0) finish(element.duration); },{once:false});
    element.addEventListener('error',()=>finish(null),{once:true});
  });
}

async function openMediaDetails(id){
  const m=mediaById(id);
  if(!m){ toast('Release details are unavailable.'); return; }
  state.detailMediaId=String(id);
  state.reviewLimit=10;
  const modal=$('#media-detail-modal');
  const root=$('#media-detail-content');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  const reviewEligible=Boolean(m.origin==='official' && m.published);
  const source=m.origin==='official'?'SOUNDGROUP Official':'My Media';
  root.innerHTML=`<span class="section-kicker">MEDIA DETAILS</span><h2 class="detail-title">${esc(m.title||'Untitled release')}</h2><p class="detail-subline">${esc(m.artist||m.creator||'Unknown creator')} · ${esc(m.type||'media')}</p><div class="detail-meta-grid"><div><small>Album</small><strong>${esc(m.album||'—')}</strong></div><div><small>Genre</small><strong>${esc(m.genre||'—')}</strong></div><div><small>Year</small><strong>${esc(m.releaseYear||'—')}</strong></div><div><small>Language</small><strong>${esc(m.language||'—')}</strong></div><div><small>Duration</small><strong id="media-detail-duration">${Number(m.duration)>0?esc(fmtTime(Number(m.duration))):'Loading…'}</strong></div><div><small>Source</small><strong>${esc(source)}</strong></div></div>${reviewEligible?`<section class="detail-community"><div class="detail-rating"><div><span class="section-kicker">COMMUNITY RATING</span><div class="rating-overview"><strong id="media-rating-average">—</strong><span id="media-rating-count">No ratings yet</span></div><div class="rating-distribution" id="media-rating-distribution"></div></div><div><small class="detail-your-rating">Your rating</small><div class="rating-stars" id="media-rating-stars" aria-label="Rate this media"></div></div></div><div class="review-section"><div class="section-head"><div><span class="section-kicker">COMMUNITY</span><h3>Reviews</h3></div><div class="review-toolbar"><span class="review-count" id="media-review-count">0 reviews</span><select id="media-review-sort" aria-label="Sort reviews"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="helpful">Most helpful</option></select></div></div><div id="media-review-list"></div><button type="button" class="btn secondary small review-load-more" id="media-review-more" hidden>Load more reviews</button></div><div class="review-compose"><span class="section-kicker">YOUR REVIEW</span><textarea id="media-review-input" maxlength="2000" placeholder="Share what you think about this SOUNDGROUP release…"></textarea><div class="review-compose-actions"><span class="muted" id="media-review-status"></span><button class="btn primary small" id="media-review-save" type="button">Save review</button></div></div></section>`:`<section class="detail-community detail-community-private"><span class="section-kicker">COMMUNITY REVIEWS</span><p class="muted">Community ratings and reviews are available for published SOUNDGROUP releases in Discover.</p></section>`}`;

  const duration=Number(m.duration)>0?Number(m.duration):await resolveMediaDuration(m);
  const durationNode=$('#media-detail-duration');
  if(duration && duration>0){ m.duration=duration; if(durationNode)durationNode.textContent=fmtTime(duration); }
  else if(durationNode) durationNode.textContent='Unavailable';
  if(!reviewEligible)return;

  const renderReviewRows=(rows, userId)=>rows.length?rows.map(r=>`<article class="review-item"><div class="review-meta"><strong>${esc(r.user_name||'SOUNDGROUP User')}</strong><span>${new Date(String(r.created_at).replace(' ','T')).toLocaleDateString()}</span></div><p>${esc(r.body)}</p><div class="review-actions"><span class="muted">${r.helpful_count?`${r.helpful_count} helpful`:''}</span><div>${state.user?.id&&String(r.user_id)===String(userId)?`<span class="muted">Your review</span><button class="text-btn" data-review-delete="${esc(r.id)}">Delete</button>`:''}<button class="text-btn review-helpful-btn" data-review-helpful="${esc(r.id)}" aria-pressed="${r.viewer_helpful?'true':'false'}">${r.viewer_helpful?'Helpful ✓':'Helpful'}</button></div></div></article>`).join(''):'<p class="muted">No reviews yet. Be the first to share your thoughts.</p>';

  const loadSummary=async()=>{
    const data=await api.reviews('summary',{media_id:id,limit:state.reviewLimit,sort:state.reviewSort});
    const d=data?.data||{};
    const average=Number(d.average||0), count=Number(d.count||0), reviewCount=Number(d.review_count||0);
    $('#media-rating-average').textContent=count?average.toFixed(1):'—';
    $('#media-rating-count').textContent=count?`${count} rating${count===1?'':'s'}`:'No ratings yet';
    const dist=d.distribution||{};
    $('#media-rating-distribution').innerHTML=[5,4,3,2,1].map(n=>{const c=Number(dist[n]||0),pct=count?Math.round(c/count*100):0;return `<div class="rating-dist-row"><span>${n}★</span><span class="rating-dist-track"><i style="width:${pct}%"></i></span><small>${c}</small></div>`}).join('');
    const stars=$('#media-rating-stars');
    stars.innerHTML=[1,2,3,4,5].map(n=>`<button type="button" class="${Number(d.myRating||0)>=n?'active':''}" data-rating="${n}" aria-label="Rate ${n} out of 5">★</button>`).join('');
    const isGuest=!state.user?.id;
    $('#media-review-input').value=d.myReview?.body||'';
    $('#media-review-input').disabled=isGuest;
    $('#media-review-input').placeholder=isGuest?'Log in to write a review.':'Share what you think about this SOUNDGROUP release…';
    $('#media-review-save').textContent=d.myReview?.body?'Update review':'Save review';
    $('#media-review-save').disabled=isGuest;
    $('#media-review-status').textContent=isGuest?'Log in to rate or review this release.':(d.myReview?'Editing your existing review.':'You can edit your review later.');
    $('#media-review-count').textContent=`${reviewCount} review${reviewCount===1?'':'s'}`;
    $('#media-review-list').innerHTML=renderReviewRows(Array.isArray(d.reviews)?d.reviews:[],state.user?.id||0);
    $('#media-review-more').hidden=!Boolean(d.has_more);
    bindReviewInteractions();
  };

  const bindReviewInteractions=()=>{
    const stars=$('#media-rating-stars');
    stars.querySelectorAll('[data-rating]').forEach(b=>b.addEventListener('click',async()=>{
      if(!state.user?.id){$('#auth-modal')?.classList.add('open');return;}
      const selected=Number(b.dataset.rating), buttons=[...stars.querySelectorAll('[data-rating]')];
      buttons.forEach(btn=>btn.disabled=true);stars.setAttribute('aria-busy','true');
      try{await api.reviews('rate',{mediaId:id,rating:selected}); await loadSummary(); toast('Rating saved');}
      catch(e){toast(e.message);buttons.forEach(btn=>btn.disabled=false);stars.setAttribute('aria-busy','false');}
    }));
    $('#media-review-sort').value=state.reviewSort;
    $('#media-review-sort').onchange=async()=>{state.reviewSort=$('#media-review-sort').value;state.reviewLimit=10;await loadSummary();};
    $('#media-review-more').onclick=async()=>{state.reviewLimit+=10;await loadSummary();};
    $('#media-review-save').onclick=async()=>{if(!state.user?.id){$('#auth-modal')?.classList.add('open');return;}const body=$('#media-review-input').value.trim();if(!body){toast('Write a review first');return;}const wasEditing=Boolean((await api.reviews('summary',{media_id:id,limit:1})).data?.myReview);try{await api.reviews('review',{mediaId:id,body});toast(wasEditing?'Review updated':'Review saved');await loadSummary();}catch(e){toast(e.message);}};
    $('#media-review-list').querySelectorAll('[data-review-delete]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Delete your review?'))return;try{await api.reviews('delete_review',{id:b.dataset.reviewDelete});toast('Review removed');await loadSummary();}catch(e){toast(e.message);}}));
    $('#media-review-list').querySelectorAll('[data-review-helpful]').forEach(b=>b.addEventListener('click',async()=>{if(!state.user?.id){$('#auth-modal')?.classList.add('open');return;}b.disabled=true;try{await api.reviews('helpful',{review_id:b.dataset.reviewHelpful});await loadSummary();}catch(e){b.disabled=false;toast(e.message);}}));
  };

  try{await loadSummary();}
  catch(error){
    $('#media-rating-average').textContent='Unavailable';
    $('#media-rating-count').textContent='Ratings unavailable';
    $('#media-review-count').textContent='Reviews unavailable';
    $('#media-review-list').innerHTML='<p class="muted">Community reviews could not be loaded right now.</p>';
    console.warn('SOUNDGROUP reviews:',error);
  }
}

function clearHistoryProgress(mediaId){state.history=state.history.filter(h=>String(h.id)!==String(mediaId)); if(BACKEND.enabled && state.user?.id)api.history('clear',{mediaId:String(mediaId)}).catch(()=>{});}

const audio=$('#audio-engine');
let audioCtx=null, eqSource=null, eqFilters=[], eqGain=null, eqAnalyser=null;
function ensureAudioGraph(){
  if(audioCtx) return audioCtx;
  try{
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    eqSource=audioCtx.createMediaElementSource(audio);
    eqFilters=eqFrequencies.map((f,i)=>{const filter=audioCtx.createBiquadFilter();filter.type='peaking';filter.frequency.value=f;filter.Q.value=.9;filter.gain.value=Number(state.eqBands[i]||0);return filter;});
    eqGain=audioCtx.createGain(); eqAnalyser=audioCtx.createAnalyser(); eqAnalyser.fftSize=256;
    let node=eqSource; eqFilters.forEach(f=>{node.connect(f);node=f}); node.connect(eqGain);eqGain.connect(eqAnalyser);eqAnalyser.connect(audioCtx.destination);
    applyEQ();
  }catch(err){audioCtx=null;console.warn('Web Audio EQ unavailable',err)}
  return audioCtx;
}
function applyEQ(){
  if(!eqFilters.length)return;
  eqFilters.forEach((f,i)=>f.gain.value=state.eqEnabled?Number(state.eqBands[i]||0):0);
  if(eqGain)eqGain.gain.value=1;
}
function setEQBand(i,v){state.eqBands[i]=Math.max(-12,Math.min(12,Number(v)||0));state.eqPreset='Custom';persistSetting('sg_eq_bands',JSON.stringify(state.eqBands));persistSetting('sg_eq_preset',state.eqPreset);ensureAudioGraph();applyEQ();renderEQBands();}
function setEQPreset(name){const vals=eqPresets[name]||state.eqBands;state.eqPreset=name;state.eqBands=[...vals];persistSetting('sg_eq_preset',name);persistSetting('sg_eq_bands',JSON.stringify(state.eqBands));ensureAudioGraph();applyEQ();renderEQBands();}
function renderEQBands(){
  const html=eqFrequencies.map((f,i)=>`<label class="eq-band"><span>${f>=1000?`${f/1000}k`:f}</span><input type="range" min="-12" max="12" step="0.5" value="${state.eqBands[i]||0}" data-eq-band="${i}" orient="vertical"><b>${Number(state.eqBands[i]||0).toFixed(1)} dB</b></label>`).join('');
  ['#eq-bands','#settings-eq-bands'].forEach(sel=>{const el=$(sel);if(el)el.innerHTML=html;});
  $$('.eq-band input').forEach(r=>r.addEventListener('input',e=>setEQBand(Number(e.target.dataset.eqBand),e.target.value)));
  const ep=$('#eq-preset'), sp=$('#eq-settings-preset'); if(ep)ep.value=state.eqPreset;if(sp)sp.value=state.eqPreset;
  const en=$('#eq-enabled'), se=$('#eq-settings-enabled'); if(en)en.checked=state.eqEnabled;if(se)se.value=state.eqEnabled?'on':'off';
}
function setEQEnabled(on){state.eqEnabled=!!on;persistSetting('sg_eq_enabled',state.eqEnabled);ensureAudioGraph();applyEQ();renderEQBands();}
function revokeAudioUrl(){state.audioUrl=null}
function setPlayerArtwork(m){
  const c=$('#player-cover');c.style.setProperty('--tone',mediaTone(m));c.innerHTML=`<span>${esc(mediaInitial(m))}</span>`;
  $('#full-art').textContent=mediaInitial(m);$('#full-art').style.background=`linear-gradient(145deg,${mediaTone(m)},#0b0c12 72%)`;
}
function loadAudio(m,autoplay=false){
  if(!m||m.type!=='audio')return;
  ensureAudioGraph(); if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume().catch(()=>{}); revokeAudioUrl();state.current=m;state.queue=state.queue.length?state.queue:state.media.filter(x=>x.type==='audio');state.queueIndex=Math.max(0,state.queue.findIndex(x=>x.id===m.id));
  state.audioUrl=m.mediaUrl||m.streamUrl||m.url||'';
  if(!state.audioUrl){audio.removeAttribute('src');audio.load();setTimelinePlaybackState({hasTrack:false,playing:false});toast(BACKEND.enabled?'This track has no playable media URL':'Connect the PHP backend to load playable media');return}
  audio.src=state.audioUrl;audio.playbackRate=state.speed;audio.volume=state.volume;audio.muted=state.muted;setTimelinePlaybackState({hasTrack:true,playing:false});
  const h=state.history.find(x=>x.id===m.id);
  const knownDuration=Number(m.duration||h?.duration||0);
  const startTime=h?.current?Math.min(h.current,Math.max(0,knownDuration-.1)):0;
  if(startTime>0)audio.currentTime=startTime;
  updateTimelinePosition(startTime,knownDuration);
  $('#player-title').textContent=m.title;$('#player-artist').textContent=m.artist||'Local artist';$('#player-tech').textContent=BACKEND.enabled?'PHP / MYSQL MEDIA':'BACKEND READY';setPlayerArtwork(m);updatePlayerFavorite();$('#player').classList.add('has-track');
  $('#full-title').textContent=m.title;$('#full-artist').textContent=m.artist||'Local artist';$('#full-desc').textContent=[m.album,m.genre].filter(Boolean).join(' • ')||'Imported local media';
  updateVolumeUI();
  if(autoplay) audio.play().catch(()=>{});
}
audio.addEventListener('play',()=>{$('#master-play').textContent='Ⅱ';$('#master-play').setAttribute('aria-label','Pause');$('#full-play').textContent='Pause';setTimelinePlaybackState({hasTrack:true,playing:true});ensureAudioGraph();if(audioCtx?.state==='suspended')audioCtx.resume().catch(()=>{})});
audio.addEventListener('pause',()=>{$('#master-play').textContent='▶';$('#master-play').setAttribute('aria-label','Play');$('#full-play').textContent='Play';setTimelinePlaybackState({hasTrack:Boolean(state.current),playing:false})});
audio.addEventListener('timeupdate',()=>{
  const d=Number.isFinite(audio.duration)?audio.duration:state.current?.duration||0;
  updateTimelinePosition(audio.currentTime,d);
  if(state.current&&Math.floor(audio.currentTime)%5===0)saveHistory(state.current,audio.currentTime,d);
});
audio.addEventListener('loadedmetadata',()=>{if(state.current){state.current.duration=audio.duration;updateTimelinePosition(audio.currentTime,audio.duration)}});
audio.addEventListener('play',()=>{ if(state.current) trackAnalytics('play',state.current.id); }); audio.addEventListener('ended',()=>{setTimelinePlaybackState({hasTrack:Boolean(state.current),playing:false});if(state.current)saveHistory(state.current,audio.duration,audio.duration);if(state.autoplay)nextTrack();});
audio.addEventListener('error',()=>{if(state.current)toast('Unable to play this track');});
function nextTrack(){if(!state.queue.length)return;state.queueIndex=(state.queueIndex+1)%state.queue.length;loadAudio(state.queue[state.queueIndex],true)}
function prevTrack(){if(audio.currentTime>4){audio.currentTime=0;return}if(!state.queue.length)return;state.queueIndex=(state.queueIndex-1+state.queue.length)%state.queue.length;loadAudio(state.queue[state.queueIndex],true)}
function updateVolumeUI(){
  audio.volume=state.volume;audio.muted=state.muted;$('#volume').value=state.muted?0:state.volume;
  $('#volume-toggle').textContent=state.muted||state.volume===0?'⌁':state.volume<.35?'◔':state.volume<.7?'◑':'◕';
  $('#volume-toggle').setAttribute('aria-label',state.muted?'Unmute':'Mute');
}
function setVolume(v){state.volume=Math.max(0,Math.min(1,Number(v)||0));if(state.volume>0)state.previousVolume=state.volume;state.muted=state.volume===0;persistSetting('sg_volume',state.volume);persistSetting('sg_previous_volume',state.previousVolume);persistSetting('sg_muted',state.muted);updateVolumeUI()}
function toggleMute(){if(state.muted||audio.volume===0){state.volume=state.previousVolume||.8;state.muted=false}else{state.previousVolume=state.volume;state.muted=true}persistSetting('sg_volume',state.volume);persistSetting('sg_previous_volume',state.previousVolume);persistSetting('sg_muted',state.muted);updateVolumeUI()}
function seekAudio(clientX,bar=$('#track-bar')){
  const r=bar.getBoundingClientRect();
  if(!r.width || !Number.isFinite(audio.duration))return;
  const p=Math.max(0,Math.min(1,(clientX-r.left)/r.width));
  const nextTime=p*audio.duration;
  audio.currentTime=nextTime;
  updateTimelinePosition(nextTime,audio.duration);
}
function openFullPlayer(){$('#full-player').classList.add('open');if(state.current)setPlayerArtwork(state.current)}
function closeFullPlayer(){$('#full-player').classList.remove('open')}
function renderQueue(){
  $('#queue-list').innerHTML=state.queue.length?state.queue.map((m,i)=>`<div class="queue-item"><div class="cover-wrap" style="--tone:${mediaTone(m)}">${esc(mediaInitial(m))}</div><div class="queue-copy"><strong>${esc(m.title)}</strong><small>${esc(m.artist||'Local')}</small></div><button class="mini-icon" data-q="${i}">${i===state.queueIndex?'▶':'＋'}</button></div>`).join(''):`<div class="empty-state"><div><div class="empty-icon">☷</div><h3>Your queue is empty</h3><p>Play music to build your queue.</p></div></div>`;
  $$('#queue-list [data-q]').forEach(b=>b.addEventListener('click',()=>{state.queueIndex=Number(b.dataset.q);loadAudio(state.queue[state.queueIndex],true)}));
}

const video=$('#video-player');
let videoHideTimer;
function openVideo(m){ trackAnalytics('view',m?.id);
  if(!m||m.type!=='video')return;
  if(!m.browserPlayable){toast('This video format may not be supported by your browser');}
  if(state.videoUrl)URL.revokeObjectURL(state.videoUrl);
  state.currentVideo=m;state.videoUrl=m.mediaUrl||m.streamUrl||m.url||'';
  if(!state.videoUrl){video.removeAttribute('src');video.load();$('#video-modal').classList.add('open');$('#video-error-copy').textContent=BACKEND.enabled?'This video has no playable media URL':'Connect the PHP backend to load playable media';$('#video-error').classList.add('show');return}
  video.src=state.videoUrl;video.playbackRate=state.speed;
  state.videoQueue=state.media.filter(x=>x.type==='video');state.videoIndex=Math.max(0,state.videoQueue.findIndex(x=>x.id===m.id));
  const h=state.history.find(x=>x.id===m.id);video.onloadedmetadata=()=>{if(h?.current)video.currentTime=Math.min(h.current,Math.max(0,video.duration-.1));renderVideoMeta(m);};
  renderVideoMeta(m);$('#video-modal').classList.add('open');$('#video-stage').classList.remove('controls-hidden');showVideoControls();video.play().catch(()=>{});
}
function renderVideoMeta(m){
  $('#vgenre').textContent=(m.genre||'VIDEO').toUpperCase();$('#vtitle').textContent=m.title;$('#vartist').textContent=m.artist||m.creator||'Local creator';$('#vmeta-title').textContent=m.title;$('#vmeta-desc').textContent=m.description||`${m.artist||m.creator||'Local media'} • ${m.genre||'Video'}`;
}
function closeVideo(){video.pause();state.videoUrl=null;$('#video-modal').classList.remove('open');state.currentVideo=null}
function nextVideo(){if(!state.videoQueue.length)return;state.videoIndex=(state.videoIndex+1)%state.videoQueue.length;openVideo(state.videoQueue[state.videoIndex])}
function prevVideo(){if(!state.videoQueue.length)return;state.videoIndex=(state.videoIndex-1+state.videoQueue.length)%state.videoQueue.length;openVideo(state.videoQueue[state.videoIndex])}
function showVideoControls(){clearTimeout(videoHideTimer);$('#video-stage').classList.remove('controls-hidden');videoHideTimer=setTimeout(()=>{if(!video.paused)$('#video-stage').classList.add('controls-hidden')},2200)}
video.addEventListener('timeupdate',()=>{const d=Number.isFinite(video.duration)?video.duration:0,p=d?video.currentTime/d:0;$('#vtime').textContent=`${fmtTime(video.currentTime)} / ${fmtTime(d)}`;$('#vfill').style.width=`${p*100}%`;if(state.currentVideo&&Math.floor(video.currentTime)%5===0)saveHistory(state.currentVideo,video.currentTime,d)});
video.addEventListener('ended',()=>{if(state.currentVideo)saveHistory(state.currentVideo,video.duration,video.duration);if(state.autoplay)nextVideo()});
video.addEventListener('error',()=>{$('#video-error-copy').textContent='This file may use a codec your browser cannot play.';$('#video-error').classList.add('show')});
video.addEventListener('play',()=>{$('#vplay').textContent='Ⅱ';showVideoControls()});video.addEventListener('pause',()=>$('#vplay').textContent='▶');
function seekVideo(e){const r=$('#video-seek').getBoundingClientRect();video.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*video.duration}
function openMediaPlaylistPicker(mediaId){
  if(!state.playlists.length){toast('Create a playlist first');setView('playlists');return;}
  $('#playlist-picker-modal').dataset.mediaId=String(mediaId);
  $('#playlist-picker-modal').dataset.playlistId='';
  $('#playlist-picker-kicker').textContent='ADD TO PLAYLIST';
  $('#playlist-picker-title').textContent='Choose a playlist';
  const existingId=new Set(state.playlists.filter(p=>(p.items||[]).some(id=>String(id)===String(mediaId))).map(p=>String(p.id)));
  $('#playlist-picker-list').innerHTML=state.playlists.map(p=>`<button class="playlist-picker-item" data-playlist-target="${esc(p.id)}"><span class="playlist-picker-icon">☷</span><span><strong>${esc(p.name)}</strong><small>${p.items?.length||0} items${existingId.has(String(p.id))?' · already added':''}</small></span><span>${existingId.has(String(p.id))?'✓':'＋'}</span></button>`).join('');
  $$('#playlist-picker-list [data-playlist-target]').forEach(b=>b.addEventListener('click',()=>addMediaToPlaylistFromPicker(b.dataset.playlistTarget,mediaId,existingId.has(String(b.dataset.playlistTarget)))));
  $('#playlist-picker-modal').classList.add('open');
}
async function addMediaToPlaylistFromPicker(pid,mediaId,alreadyAdded){
  if(alreadyAdded){toast('Track is already in that playlist');return;}
  try{await api.playlists('add',{playlistId:pid,mediaId:String(mediaId)});const p=playlistById(pid);if(p&&!p.items.some(x=>String(x)===String(mediaId)))p.items.push(String(mediaId));$('#playlist-picker-modal').classList.remove('open');renderPlaylists();toast('Added to playlist')}catch(e){toast(e.message)}
}
function playPlaylist(pid){
  const p=playlistById(pid);if(!p)return;
  const list=(p.items||[]).map(mediaById).filter(m=>m?.type==='audio');
  if(!list.length){toast('This playlist has no playable audio in your library');return}
  state.queue=list;state.queueIndex=0;loadAudio(list[0],true);
}
async function openEditMedia(mediaId){
  const m=mediaById(mediaId); if(!m)return; const modal=$('#edit-media-modal');
  modal.dataset.mediaId=String(mediaId); $('#edit-title').value=m.title||''; $('#edit-artist').value=m.artist||''; $('#edit-album').value=m.album||''; $('#edit-genre').value=m.genre||''; $('#edit-year').value=m.releaseYear||''; $('#edit-language').value=m.language||''; $('#edit-description').value=m.description||'';
  $('#edit-media-preview').innerHTML=`<strong>${esc(m.title)}</strong><small>${esc(m.filename||'')}</small>`; modal.classList.add('open');
}
async function removeMedia(mediaId){
  const m=mediaById(mediaId); if(!m||!confirm(`Remove “${m.title}” from your library?`))return;
  try{await api.media('delete',{id:String(mediaId)});state.media=state.media.filter(x=>String(x.id)!==String(mediaId)); state.catalog=state.catalog.filter(x=>String(x.id)!==String(mediaId));state.favorites=state.favorites.filter(x=>String(x)!==String(mediaId));state.history=state.history.filter(x=>String(x.id)!==String(mediaId));state.playlists.forEach(p=>p.items=p.items.filter(x=>String(x)!==String(mediaId)));if(state.current&&String(state.current.id)===String(mediaId)){audio.pause();state.current=null;audio.removeAttribute('src');audio.load();setTimelinePlaybackState({hasTrack:false,playing:false});updateTimelinePosition(0,0);$('#player-title').textContent='Nothing playing';$('#player-artist').textContent='Choose something to listen to';}renderView(state.view);updateFavCount();updateStorageStats();toast('Media removed')}catch(e){toast(e.message)}
}

function updateStorageStats(){
  const audioCount=state.media.filter(m=>m.type==='audio').length, videoCount=state.media.filter(m=>m.type==='video').length, other=state.media.filter(m=>m.type==='other').length, bytes=state.media.reduce((n,m)=>n+Number(m.size||0),0);
  $('#storage-count').textContent=state.media.length;$('#storage-size').textContent=fmtBytes(bytes);$('#vault-audio').textContent=audioCount;$('#vault-video').textContent=videoCount;$('#vault-other').textContent=other;$('#settings-storage').textContent=`${state.media.length} items • ${fmtBytes(bytes)}`;
  $('#hero-count').textContent=`${state.media.length} media`;
  $('#site-tagline').textContent=state.site.site_tagline||'Your imported media is stored on your local SOUNDGROUP server. No remote media is required.';
  $('#site-about-title').textContent=state.site.site_name||'SOUNDGROUP';
  $('#site-about').textContent=state.site.about_text||state.site.site_tagline||'';
  $('#site-contact').textContent=state.site.contact_text||'';
}

function setupImport(){
  const zone=$('#drop-zone'), input=$('#file-input'), folder=$('#folder-input'); if(!zone)return;
  const run=files=>uploadFiles(files);
  $('#browse-files')?.addEventListener('click',e=>{e.preventDefault();input?.click()});
  $('#browse-folder')?.addEventListener('click',e=>{e.preventDefault();folder?.click()});
  input?.addEventListener('change',()=>{run(input.files);input.value=''});
  folder?.addEventListener('change',()=>{run(folder.files);folder.value=''});
  ['dragenter','dragover'].forEach(type=>zone.addEventListener(type,e=>{e.preventDefault();e.stopPropagation();zone.classList.add('dragover')}));
  ['dragleave','drop'].forEach(type=>zone.addEventListener(type,e=>{e.preventDefault();e.stopPropagation();if(type==='dragleave'&&!zone.contains(e.relatedTarget))zone.classList.remove('dragover');if(type==='drop'){zone.classList.remove('dragover');run(e.dataTransfer.files)}}));
  zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input?.click()}});
  $('#clear-media')?.addEventListener('click',async()=>{if(!state.media.length){toast('Your library is already empty');return}if(!confirm('Clear your entire server media library?'))return;try{await api.media('clear');state.media=[];state.favorites=[];state.history=[];state.playlists=state.playlists.map(p=>({...p,items:[]}));renderView('media');updateFavCount();updateStorageStats();toast('Media library cleared')}catch(e){toast(e.message)}});
}
async function uploadFiles(fileList){
  const list=[...fileList||[]]; if(!list.length){toast('No files selected');return;}
  $('#import-queue')?.classList.remove('hidden'); $('#import-list').innerHTML=''; $('#import-progress').style.width='0%'; $('#import-progress-label').textContent=`0 / ${list.length}`;
  let done=0;
  for(const file of list){
    const row=document.createElement('div');row.className='import-row';row.innerHTML=`<span>${esc(file.name)}</span><small>${fmtBytes(file.size)}</small><span class="state">Uploading…</span>`;$('#import-list').appendChild(row);
    try{const result=await api.upload(file,{title:file.name.replace(/\.[^.]+$/,''),type:typeOf(file),duration:''}); const media=result?.data;if(media){state.media.unshift(media); row.querySelector('.state').textContent='Uploaded';}}
    catch(err){row.querySelector('.state').textContent=err.message||'Failed';}
    done++; $('#import-progress').style.width=`${done/list.length*100}%`; $('#import-progress-label').textContent=`${done} / ${list.length}`;
  }
  $('#import-queue')?.classList.add('hidden'); updateStorageStats(); renderView(state.view==='media'?'media':state.view); toast('Import complete');
}

function setupPlayer(){
  const togglePlayback=()=>{if(!state.current){const first=state.media.find(m=>m.type==='audio');if(first)loadAudio(first,true);else{toast('Add music to start listening');setView('media')}return}ensureAudioGraph();audio.paused?audio.play().catch(()=>toast('Unable to play this track')):audio.pause()};
  $('#master-play').addEventListener('click',togglePlayback);
  $('#prev-btn').addEventListener('click',prevTrack);$('#next-btn').addEventListener('click',nextTrack);$('#volume').addEventListener('input',e=>setVolume(e.target.value));$('#volume-toggle').addEventListener('click',toggleMute);
  const bindTimeline=bar=>{
    const seekFromKey=e=>{
      if(!Number.isFinite(audio.duration))return;
      if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
        e.preventDefault();
        const step=Math.max(5,audio.duration/100);
        let target=audio.currentTime;
        if(e.key==='ArrowLeft')target-=step;
        if(e.key==='ArrowRight')target+=step;
        if(e.key==='Home')target=0;
        if(e.key==='End')target=audio.duration;
        audio.currentTime=Math.max(0,Math.min(audio.duration,target));
        updateTimelinePosition(audio.currentTime,audio.duration);
      }
    };
    bar.addEventListener('pointerdown',e=>{e.preventDefault();bar.setPointerCapture?.(e.pointerId);seekAudio(e.clientX,bar);const move=x=>seekAudio(x.clientX,bar);const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up)};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up)});
    bar.addEventListener('keydown',seekFromKey);
  };
  bindTimeline($('#track-bar'));
  bindTimeline($('#full-track-bar'));
  $('#queue-btn').addEventListener('click',()=>{$('#queue-panel').classList.add('open');renderQueue()});$('#queue-close').addEventListener('click',()=>$('#queue-panel').classList.remove('open'));$('#heart-player').addEventListener('click',()=>state.current&&toggleFavorite(state.current.id));$('#player-expand').addEventListener('click',openFullPlayer);$('#full-close').addEventListener('click',closeFullPlayer);$('#full-play').addEventListener('click',togglePlayback);$('#full-favorite').addEventListener('click',()=>state.current&&toggleFavorite(state.current.id));$('#eq-open').addEventListener('click',()=>$('#eq-panel').classList.toggle('open'));$('#eq-reset').addEventListener('click',()=>setEQPreset('Flat'));$('#eq-preset').addEventListener('change',e=>setEQPreset(e.target.value));$('#eq-enabled').addEventListener('change',e=>setEQEnabled(e.target.checked));
  renderEQBands(); updateVolumeUI();
}
function setupVideo(){
  $('#video-close').addEventListener('click',closeVideo);$('#vplay').addEventListener('click',()=>video.paused?video.play():video.pause());video.addEventListener('play',()=>{$('#vplay').textContent='Ⅱ';$('#vplay').setAttribute('aria-label','Pause')});video.addEventListener('pause',()=>{$('#vplay').textContent='▶';$('#vplay').setAttribute('aria-label','Play')});$('#vprev').addEventListener('click',prevVideo);$('#vnext').addEventListener('click',nextVideo);$('#video-seek').addEventListener('click',seekVideo);$('#video-stage').addEventListener('mousemove',showVideoControls);$('#video-stage').addEventListener('touchstart',showVideoControls,{passive:true});$('#vmute').addEventListener('click',()=>{video.muted=!video.muted;$('#vmute').textContent=video.muted?'◌':'⌁';$('#vmute').setAttribute('aria-label',video.muted?'Unmute':'Mute')});$('#vspeed').addEventListener('click',()=>{const speeds=[.75,1,1.25,1.5,2],i=speeds.indexOf(video.playbackRate),next=speeds[(i+1)%speeds.length];video.playbackRate=next;$('#vspeed').textContent=`${next}×`});$('#vpip').addEventListener('click',async()=>{try{if(document.pictureInPictureElement)await document.exitPictureInPicture();else if(document.pictureInPictureEnabled)await video.requestPictureInPicture();else toast('Picture-in-picture is not available here')}catch{toast('Picture-in-picture is not available here')}});$('#vfull').addEventListener('click',async()=>{try{await $('#video-stage').requestFullscreen()}catch{toast('Fullscreen is not available here')}});$('#vtheater').addEventListener('click',()=>$('#video-stage').classList.toggle('theater'));$('#video-retry').addEventListener('click',()=>{if(state.currentVideo)openVideo(state.currentVideo)});$('#vfav').addEventListener('click',()=>state.currentVideo&&toggleFavorite(state.currentVideo.id));$('#vqueue').addEventListener('click',()=>{if(!state.currentVideo)return;state.videoQueue=[...state.videoQueue.filter(x=>x.id!==state.currentVideo.id),state.currentVideo];toast('Added to video queue')});
}
function setupSearch(){
  const input=$('#search'),dropdown=$('#search-dropdown');
  const doSearch=q=>{
    q=q.trim().toLowerCase();if(!q){dropdown.classList.remove('open');return}
    const pool=[...state.catalog,...state.media]; const seen=new Set(); const results=pool.filter(m=>{const k=String(m.id);if(seen.has(k))return false;seen.add(k);return `${m.title} ${m.artist||m.creator||''} ${m.album||''} ${m.genre||''} ${m.releaseYear||''} ${m.language||''} ${m.name}`.toLowerCase().includes(q)}).slice(0,12);
    dropdown.innerHTML=results.length?results.map(m=>`<button class="search-result" data-search-id="${esc(m.id)}"><span class="thumb" style="--tone:${mediaTone(m)}"><span class="thumb-mark">${esc(mediaInitial(m))}</span></span><span><strong>${esc(m.title)}</strong><small>${esc(m.artist||m.creator||m.type)}</small></span></button>`).join(''):`<div class="empty-state" style="min-height:130px"><div><h3>No matches</h3><p>Try a title, artist, album, year, genre or language.</p></div></div>`;
    dropdown.classList.add('open');
    $$('#search-dropdown [data-search-id]').forEach(b=>b.addEventListener('click',()=>{const m=mediaById(b.dataset.searchId);dropdown.classList.remove('open');input.value='';if(m?.type==='video')openVideo(m);else if(m?.type==='audio')loadAudio(m,true);else if(m)toast('This file is stored but is not browser-playable.')}));
  };
  input.addEventListener('input',()=>doSearch(input.value));input.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=$('#search-dropdown [data-search-id]');if(first)first.click();else setView('discover')}});
}
function setupCommand(){
  const open=()=>{$('#command-overlay').classList.add('open');$('#command-input').focus();renderCommands('')};
  $('#command-btn').addEventListener('click',open);$('#command-overlay').addEventListener('click',e=>{if(e.target===$('#command-overlay'))$('#command-overlay').classList.remove('open')});
  $('#command-input').addEventListener('input',e=>renderCommands(e.target.value));$('#command-input').addEventListener('keydown',e=>{if(e.key==='Escape')$('#command-overlay').classList.remove('open')});
  $('#search').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open()}});
  window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open()}if(e.key==='Escape'){closeVideo();closeFullPlayer();$('#command-overlay').classList.remove('open');$('.overlay-modal.open')?.classList.remove('open')}});
}
function renderCommands(q){
  const items=[['home','Home'],['discover','Discover'],['music','Music'],['watch','Watch'],['artists','Artists'],['favorites','Favorites'],['playlists','Playlists'],['history','History'],['media','My Media'],['studio','Creator Studio'],['settings','Settings']];
  const filtered=items.filter(x=>x[1].toLowerCase().includes(q.toLowerCase()));
  $('#command-list').innerHTML=filtered.map(x=>`<button class="command-item" data-command-view="${x[0]}"><span>${x[1]}</span><span>→</span></button>`).join('');
  $$('#command-list [data-command-view]').forEach(b=>b.addEventListener('click',()=>{$('#command-overlay').classList.remove('open');setView(b.dataset.commandView)}));
}

function setupSettings(){
  $('#accent-color').addEventListener('input',e=>{state.accent=e.target.value;document.documentElement.style.setProperty('--accent',state.accent);persistSetting('sg_accent',state.accent)});
  $('#accent-color').addEventListener('change',()=>toast('Accent updated'));
  $('#glass-intensity').addEventListener('change',e=>{state.glass=e.target.value;persistSetting('sg_glass',state.glass);applySettings();toast('Glass updated')});
  $('#density-select').addEventListener('change',e=>{state.density=e.target.value;persistSetting('sg_density',state.density);applySettings();toast('Density updated')});
  $('#autoplay-toggle').addEventListener('change',e=>{state.autoplay=e.target.checked;persistSetting('sg_autoplay',state.autoplay);toast('Autoplay updated')});
  $('#motion-toggle').addEventListener('change',e=>{state.motion=e.target.checked;persistSetting('sg_motion',state.motion);applySettings();toast('Motion updated')});
  $('#contrast-toggle').addEventListener('change',e=>{state.contrast=e.target.checked;persistSetting('sg_contrast',state.contrast);applySettings();toast('Contrast updated')});
  $('#reduce-motion').addEventListener('change',e=>{state.reduceMotion=e.target.checked;persistSetting('sg_reduce_motion',state.reduceMotion);applySettings();toast('Motion preference updated')});
  $('#speed-select').addEventListener('change',e=>{state.speed=Number(e.target.value);persistSetting('sg_speed',state.speed);audio.playbackRate=state.speed;if(state.currentVideo)video.playbackRate=state.speed;toast('Playback speed updated')});
  $('#visualizer-select').addEventListener('change',e=>{state.visualizer=e.target.value;persistSetting('sg_visualizer',state.visualizer);toast('Visualizer updated')});
  ['progress-intensity','progress-speed','progress-glow'].forEach(k=>$('#'+k).addEventListener('input',e=>{const map={'progress-intensity':'progressIntensity','progress-speed':'progressSpeed','progress-glow':'progressGlow'};state[map[k]]=Number(e.target.value);persistSetting('sg_'+map[k].replace(/[A-Z]/g,m=>'_'+m.toLowerCase()),state[map[k]]);applyTimelineVisualSettings()}));
  $('#eq-settings-preset').addEventListener('change',e=>setEQPreset(e.target.value));$('#eq-settings-enabled').addEventListener('change',e=>setEQEnabled(e.target.value==='on'));
}
function setupAuth(){
  $('#auth-open').addEventListener('click',async()=>{if(state.user?.id){try{await api.auth('logout');state.user={name:'Guest'};updateAdminLink();state.favorites=[];state.history=[];state.playlists=[];await loadBackendState();renderAccount();renderView(state.view);updateFavCount();updateStorageStats();toast('Logged out')}catch(e){toast(e.message)}}else $('#auth-modal').classList.add('open')});$('#profile-btn').addEventListener('click',()=>setView('account'));$('#top-profile').addEventListener('click',()=>setView('account'));$('#auth-close').addEventListener('click',()=>$('#auth-modal').classList.remove('open'));
  $$('.auth-tabs button').forEach(b=>b.addEventListener('click',()=>{$$('.auth-tabs button').forEach(x=>x.classList.toggle('active',x===b));$('#auth-login').classList.toggle('hidden',b.dataset.auth!=='login');$('#auth-register').classList.toggle('hidden',b.dataset.auth!=='register')}));
  $('#guest-login').addEventListener('click',async()=>{state.user={name:'Guest'};updateAdminLink();state.favorites=[];state.history=[];state.playlists=[];await loadBackendState();$('#auth-modal').classList.remove('open');renderAccount();toast('Guest session started')});
  $('#login-submit').addEventListener('click',async()=>{const email=$('#login-email').value.trim(),password=$('#login-password').value;if(!email||!password){toast('Enter your email and password');return}try{const r=await api.auth('login',{email,password});state.user=r.data.user;state.favorites=[];state.history=[];state.playlists=[];await loadBackendState();$('#auth-modal').classList.remove('open');renderAccount();renderView(state.view);updateFavCount();toast('Logged in')}catch(e){toast(e.message)}});
  $('#register-submit').addEventListener('click',async()=>{const name=$('#reg-name').value.trim(),phone=$('#reg-phone').value.trim(),address=$('#reg-address').value.trim(),email=$('#reg-email').value.trim(),password=$('#reg-password').value,terms=$('#terms').checked;if(!name||!phone||!address||!email||password.length<6||!terms){toast('Complete your name, phone, address, email, password and terms');return}try{const r=await api.auth('register',{name,phone,address,email,password});state.user=r.data.user;await loadBackendState();$('#auth-modal').classList.remove('open');renderAccount();renderView(state.view);toast('Account created')}catch(e){toast(e.message)}});
  $('#reg-password').addEventListener('input',e=>{$('#strength-fill').style.width=`${Math.min(100,e.target.value.length/10*100)}%`});
}

let tooltipTimer=null, tooltipEl=null, tooltipTarget=null;
function tooltipText(el){return el.dataset.tooltip||el.getAttribute('aria-label')||el.getAttribute('title')||((el.classList.contains('progress-style')?`Use ${el.dataset.progress} playback progress style`:''));}
function hideTooltip(){if(tooltipTimer)clearTimeout(tooltipTimer);tooltipTimer=null;if(tooltipEl){tooltipEl.remove();tooltipEl=null}tooltipTarget=null}
function showTooltip(el){hideTooltip();const text=tooltipText(el);if(!text)return;tooltipTarget=el;tooltipTimer=setTimeout(()=>{if(!tooltipTarget)return;tooltipEl=document.createElement('div');tooltipEl.className='sg-tooltip';tooltipEl.textContent=text;document.body.appendChild(tooltipEl);const r=el.getBoundingClientRect(),tr=tooltipEl.getBoundingClientRect();let left=r.left+r.width/2-tr.width/2,top=r.top-tr.height-10;if(left<8)left=8;if(left+tr.width>innerWidth-8)left=innerWidth-tr.width-8;if(top<8)top=r.bottom+10;tooltipEl.style.left=`${left}px`;tooltipEl.style.top=`${top}px`;requestAnimationFrame(()=>tooltipEl?.classList.add('show'))},1800)}
function setupTooltips(){const target=e=>e.target.closest('button,[aria-label],select,input[type=range]');document.addEventListener('pointerover',e=>{const el=target(e);if(el&&tooltipText(el)&&!el.closest('.sg-tooltip'))showTooltip(el)});document.addEventListener('pointerout',e=>{const el=target(e);if(el&&(!e.relatedTarget||!el.contains(e.relatedTarget)))hideTooltip()});document.addEventListener('focusin',e=>{const el=target(e);if(el)showTooltip(el)});document.addEventListener('focusout',hideTooltip);document.addEventListener('click',hideTooltip)}

function setupGlobal(){
  bindNavigation();
  setupTooltips();
  setupDiscoverTabs();
  $('#mobile-menu').addEventListener('click',()=>$('#sidebar').classList.add('open'));$('#mobile-close').addEventListener('click',()=>$('#sidebar').classList.remove('open'));
  $('#notify-btn').addEventListener('click',()=>$('#notifications').classList.add('open'));$('#notification-close').addEventListener('click',()=>$('#notifications').classList.remove('open'));
  $('#new-playlist').addEventListener('click',()=>$('#playlist-modal').classList.add('open'));
  $('#playlist-close').addEventListener('click',()=>$('#playlist-modal').classList.remove('open'));
  $('#playlist-detail-close').addEventListener('click',()=>$('#playlist-detail-modal').classList.remove('open'));
  $('#playlist-picker-close').addEventListener('click',()=>$('#playlist-picker-modal').classList.remove('open'));
  $('#media-detail-close')?.addEventListener('click',()=>{const modal=$('#media-detail-modal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');});
  $('#playlist-rename').addEventListener('click',renamePlaylist);
  $('#playlist-add-track').addEventListener('click',()=>openPlaylistTrackPicker($('#playlist-detail-modal').dataset.playlistId));
  $('#playlist-play-all').addEventListener('click',()=>playPlaylist($('#playlist-detail-modal').dataset.playlistId));
  $('#playlist-create').addEventListener('click',async()=>{const name=$('#playlist-name').value.trim();if(!name){toast('Name your playlist');return}try{const r=await api.playlists('create',{name});state.playlists.push(r.data);$('#playlist-name').value='';$('#playlist-modal').classList.remove('open');renderPlaylists();toast('Playlist created')}catch(e){toast(e.message)}});
  $('#edit-media-close')?.addEventListener('click',()=>$('#edit-media-modal').classList.remove('open'));
  $('#edit-save')?.addEventListener('click',async()=>{const id=$('#edit-media-modal').dataset.mediaId;if(!id)return;const payload={id,title:$('#edit-title').value.trim(),artist:$('#edit-artist').value.trim(),album:$('#edit-album').value.trim(),genre:$('#edit-genre').value.trim(),release_year:$('#edit-year').value.trim(),language:$('#edit-language').value.trim(),description:$('#edit-description').value.trim()};try{const r=await api.media('update',payload);const i=state.media.findIndex(m=>String(m.id)===String(id));if(i>=0)state.media[i]=r.data;$('#edit-media-modal').classList.remove('open');renderView(state.view);toast('Media details updated')}catch(e){toast(e.message)}});
    $('#surprise-btn').addEventListener('click',()=>{const list=[...(state.discoverData?.all?.featured||[]),...(state.discoverData?.all?.trendingMusic||[]),...(state.discoverData?.all?.trendingVideos||[]),...(state.discoverData?.all?.newMusic||[]),...(state.discoverData?.all?.latestVideos||[])];const seen=new Set();const pool=list.filter(m=>{const k=String(m.id);if(seen.has(k))return false;seen.add(k);return true;});if(!pool.length){toast('No official releases to discover yet');return}const m=pool[Math.floor(Math.random()*pool.length)];m.type==='video'?openVideo(m):loadAudio(m,true)});
  $('#watch-random').addEventListener('click',()=>{const v=state.media.filter(m=>m.type==='video');if(v.length)openVideo(v[Math.floor(Math.random()*v.length)]);else{toast('Add a video first');setView('media')}});
  $('#music-sort').addEventListener('change',renderMusic);
  window.addEventListener('beforeunload',()=>{revokeAudioUrl();state.videoUrl=null});
  document.addEventListener('click',e=>{
    const detailButton=e.target.closest?.('[data-details]');
    if(detailButton){
      e.preventDefault();
      e.stopPropagation();
      const id=detailButton.dataset.details || detailButton.closest('.media-card')?.dataset.id;
      if(id) openMediaDetails(id);
      return;
    }
    $$('.card-menu.open').forEach(menu=>{if(!menu.parentElement.contains(e.target))menu.classList.remove('open')});
  });
}

async function init(){
  try{
    await loadBackendState();
  }catch(err){
    console.error('SOUNDGROUP API:',err);
    toast('PHP backend could not load. Check XAMPP, MySQL and database setup.');
  }
  applySettings();setupGlobal();setupImport();setupPlayer();setupVideo();setupSearch();setupCommand();setupSettings();setupAuth();
  updateFavCount();updateStorageStats();renderAccount();renderView('home');
}
init();
})();