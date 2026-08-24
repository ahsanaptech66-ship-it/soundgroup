(() => {
  'use strict';
  const API = '../api/admin_user_media.php';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
  const root = document.querySelector('.admin-app');
  const csrf = root?.dataset.csrfToken || '';
  const state = { items: [], selected: new Set(), q: '', type: 'all', sort: 'newest', page: 1, pages: 1, total: 0 };
  let searchTimer = null;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const bytes = n => { n=Number(n||0); if(!n) return '0 B'; const units=['B','KB','MB','GB','TB']; const i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),units.length-1); return `${(n/1024**i).toFixed(i?1:0)} ${units[i]}`; };
  const date = ms => { const d=new Date(Number(ms||0)); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(); };
  const duration = s => { s=Number(s||0); if(!Number.isFinite(s)||s<0) return '—'; const m=Math.floor(s/60), sec=Math.floor(s%60); return `${m}:${String(sec).padStart(2,'0')}`; };

  function toast(message, type='info') {
    const el=$('#admin-toast'); if(!el)return; el.textContent=message; el.dataset.type=type; el.classList.add('show'); clearTimeout(window.__monitorToast); window.__monitorToast=setTimeout(()=>el.classList.remove('show'),3200);
  }

  async function request(action, options={}) {
    const query = options.query || null;
    const fetchOptions = {...options};
    delete fetchOptions.query;
    let url = `${API}?action=${encodeURIComponent(action)}`;
    if (query) url += `&${new URLSearchParams(query).toString()}`;
    const config = {...fetchOptions, headers:{...(fetchOptions.headers||{})}};
    if (options.body && typeof options.body === 'string') config.headers['Content-Type']='application/json';
    if ((options.method||'GET').toUpperCase() !== 'GET') config.headers['X-CSRF-Token']=csrf;
    const response = await fetch(url, config);
    let payload=null; try{payload=await response.json();}catch{throw new Error('Server returned an invalid response.');}
    if (!response.ok || !payload.success) throw new Error(payload.message || `Request failed (${response.status})`);
    return payload;
  }

  function syncBulk() {
    const count=state.selected.size;
    $('#monitor-selected-count').textContent=String(count);
    $('#monitor-bulkbar').classList.toggle('hidden', count<2);
    const allVisible=state.items.length>0 && state.items.every(item=>state.selected.has(String(item.id)));
    $('#monitor-select-all').checked=allVisible;
    $('#monitor-select-all').indeterminate=!allVisible && state.items.some(item=>state.selected.has(String(item.id)));
  }

  function render() {
    const body=$('#monitor-table-body');
    if(!state.items.length){ body.innerHTML='<tr><td colspan="7" class="admin-empty">No user uploads match the current filters.</td></tr>'; syncBulk(); return; }
    body.innerHTML=state.items.map(item=>{
      const id=String(item.id), video=item.type==='video', name=item.uploader?.name||'Unknown user';
      const thumb=item.artworkUrl ? `<img class="admin-user-media-thumb" src="${esc(item.artworkUrl)}" alt="" loading="lazy">` : `<span class="admin-user-media-thumb admin-user-media-thumb-placeholder">${video?'▶':'♫'}</span>`;
      return `<tr>
        <td class="admin-check-col"><input class="monitor-check" type="checkbox" data-id="${esc(id)}" ${state.selected.has(id)?'checked':''} aria-label="Select ${esc(item.title)}"></td>
        <td><div class="admin-media-cell"><a href="${esc(item.mediaUrl)}" target="_blank" rel="noopener" class="admin-user-media-thumb-link">${thumb}</a><div><strong>${esc(item.title)}</strong><small>${esc(item.filename)}${item.duration?` · ${duration(item.duration)}`:''}</small></div></div></td>
        <td><div class="admin-user-cell"><strong>${esc(name)}</strong><small>${esc(item.uploader?.email||'')}</small></div></td>
        <td><span class="admin-type-pill ${video?'video':'audio'}">${video?'Video':'Music'}</span></td>
        <td>${esc(bytes(item.size))}</td>
        <td><time datetime="${new Date(Number(item.createdAt||0)).toISOString()}" title="${esc(date(item.createdAt))}">${esc(date(item.createdAt))}</time></td>
        <td><div class="admin-row-actions"><a class="admin-mini-btn" href="${esc(item.mediaUrl)}" target="_blank" rel="noopener">Open</a><button class="admin-mini-btn danger" data-monitor-delete="${esc(id)}">Delete</button></div></td>
      </tr>`;
    }).join('');
    $('#monitor-page-info').textContent=`Page ${state.page} of ${state.pages} · ${state.total} uploads`;
    $('#monitor-prev').disabled=state.page<=1; $('#monitor-next').disabled=state.page>=state.pages; syncBulk();
  }

  async function load() {
    try {
      const payload=await request('list',{query:{q:state.q,type:state.type,sort:state.sort,page:String(state.page),per_page:'20'}});
      state.items=payload.data?.items||[]; state.total=Number(payload.data?.pagination?.total||0); state.pages=Number(payload.data?.pagination?.pages||1); state.page=Number(payload.data?.pagination?.page||1);
      state.selected=new Set([...state.selected].filter(id=>state.items.some(item=>String(item.id)===id)));
      render();
    } catch(error){toast(error.message,'error');}
  }

  async function loadStats() {
    try {
      const payload=await request('stats'); const s=payload.data||{};
      $('#monitor-total').textContent=String(s.total||0); $('#monitor-audio').textContent=String(s.audio||0); $('#monitor-video').textContent=String(s.video||0); $('#monitor-users').textContent=String(s.users||0); $('#monitor-last-updated').textContent=s.latest?`Latest upload ${date(s.latest)}`:'No user uploads yet';
    } catch(error){toast(error.message,'error');}
  }

  async function deleteOne(id) {
    const item=state.items.find(x=>String(x.id)===String(id)); if(!item)return;
    if(!confirm(`Delete “${item.title}” uploaded by ${item.uploader?.name||'this user'}? This permanently removes the stored file.`))return;
    try { await request('delete',{method:'POST',body:JSON.stringify({id:String(id)})}); state.selected.delete(String(id)); await Promise.all([load(),loadStats()]); toast('User upload removed.'); }
    catch(error){toast(error.message,'error');}
  }

  async function bulkDelete() {
    const ids=[...state.selected]; if(ids.length<2){toast('Select at least two uploads first.','error');return;}
    if(!confirm(`Delete ${ids.length} selected user uploads permanently?`))return;
    try { const payload=await request('bulk_delete',{method:'POST',body:JSON.stringify({ids})}); const count=Number(payload.data?.count||ids.length); state.selected.clear(); await Promise.all([load(),loadStats()]); toast(`${count} user upload(s) removed.`); }
    catch(error){toast(error.message,'error');}
  }

  function setupNav(){
    const sidebar=$('#admin-sidebar'); $('#admin-sidebar-open')?.addEventListener('click',()=>sidebar?.classList.add('open')); $('#admin-sidebar-close')?.addEventListener('click',()=>sidebar?.classList.remove('open'));
    $$('.admin-nav-link.disabled').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();toast('This module unlocks in a later admin phase.');}));
    $('#admin-logout')?.addEventListener('click',async()=>{try{await fetch('../api/admin.php?action=logout',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:'{}'});window.location.href='login.php';}catch{window.location.href='login.php';}});
  }

  function setupTable(){
    $('#monitor-select-all').addEventListener('change',e=>{const checked=e.target.checked; state.items.forEach(item=>{const id=String(item.id); if(checked)state.selected.add(id);else state.selected.delete(id);});render();});
    $('#monitor-table-body').addEventListener('change',e=>{const box=e.target.closest('.monitor-check');if(!box)return;const id=String(box.dataset.id);box.checked?state.selected.add(id):state.selected.delete(id);syncBulk();});
    $('#monitor-table-body').addEventListener('click',e=>{const button=e.target.closest('[data-monitor-delete]');if(button)deleteOne(button.dataset.monitorDelete);});
    $('#monitor-bulk-delete').addEventListener('click',bulkDelete);
    $('#monitor-search').addEventListener('input',e=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.q=e.target.value.trim();state.page=1;load();},250);});
    $('#monitor-type').addEventListener('change',e=>{state.type=e.target.value;state.page=1;load();});
    $('#monitor-sort').addEventListener('change',e=>{state.sort=e.target.value;state.page=1;load();});
    $('#monitor-clear').addEventListener('click',()=>{ $('#monitor-search').value=''; state.q=''; state.type='all';state.sort='newest';$('#monitor-type').value='all';$('#monitor-sort').value='newest';state.page=1;load(); });
    $('#monitor-prev').addEventListener('click',()=>{if(state.page>1){state.page--;load();}});
    $('#monitor-next').addEventListener('click',()=>{if(state.page<state.pages){state.page++;load();}});
    $('#monitor-refresh').addEventListener('click',()=>{Promise.all([load(),loadStats()]);});
  }

  document.addEventListener('DOMContentLoaded',()=>{setupNav();setupTable();load();loadStats();});
})();
