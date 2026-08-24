(() => {
  'use strict';

  const root = document.querySelector('.admin-app');
  const API = '../api/admin_media.php';
  const ADMIN_API = '../api/admin.php';
  const csrf = root?.dataset.adminCsrf || '';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const state = { page: 1, pages: 1, total: 0, q: '', sort: 'created', dir: 'desc', status: 'all', flag: 'all', perPage: 25, items: [], selected: new Set(), files: [] };
  let searchTimer = null;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const bytes = n => { n = Number(n) || 0; if (!n) return '0 B'; const u = ['B','KB','MB','GB','TB']; const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), u.length - 1); return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`; };
  const date = value => { const d = new Date(String(value || '').replace(' ', 'T')); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}); };

  function toast(message, type = 'info') {
    const el = $('#admin-toast'); if (!el) return;
    el.textContent = message; el.dataset.type = type; el.classList.add('show');
    clearTimeout(window.__adminToastTimer); window.__adminToastTimer = setTimeout(() => el.classList.remove('show'), 3400);
  }

  async function request(action, options = {}, api = API) {
    const headers = {'Accept':'application/json', ...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}), ...(options.headers || {})};
    if (options.method && options.method !== 'GET' && csrf) headers['X-CSRF-Token'] = csrf;
    const response = await fetch(`${api}?action=${encodeURIComponent(action)}`, {credentials:'same-origin', headers, ...options});
    let payload;
    try { payload = await response.json(); } catch { throw new Error(`Server returned ${response.status}.`); }
    if (!response.ok || payload.success === false) {
      if (response.status === 401 || response.status === 403) window.location.href = 'login.php';
      throw new Error(payload.message || 'Request failed.');
    }
    return payload;
  }

  function renderTable() {
    const body = $('#music-table-body');
    $('#media-summary').textContent = `${state.total.toLocaleString()} total • page ${state.page}/${state.pages}`;
    $('#page-label').textContent = `Page ${state.page} of ${state.pages}`;
    $('#page-prev').disabled = state.page <= 1; $('#page-next').disabled = state.page >= state.pages;
    if (!state.items.length) { body.innerHTML = `<tr><td colspan="8" class="admin-empty">${state.q ? 'No music matched your search.' : 'No music has been uploaded yet.'}</td></tr>`; syncBulkBar(); return; }
    body.innerHTML = state.items.map(item => {
      const id = esc(item.id); const checked = state.selected.has(String(item.id)) ? ' checked' : '';
      const art = item.artworkUrl ? `<img class="admin-media-thumb" src="${esc(item.artworkUrl)}" alt="">` : `<span class="admin-media-thumb admin-media-thumb-placeholder">♫</span>`;
      const flags = [item.featured ? '<b>Featured</b>' : '', item.trending ? '<b>Trending</b>' : ''].filter(Boolean).join('');
      return `<tr data-id="${id}">
        <td><input class="media-check" type="checkbox" data-id="${id}"${checked} aria-label="Select ${esc(item.title)}"></td>
        <td><div class="admin-media-cell">${art}<div><strong>${esc(item.title)}</strong><small>${esc(item.filename)}</small></div></div></td>
        <td>${esc(item.artist || '—')}</td>
        <td>${esc(item.genre || '—')}</td>
        <td><span class="admin-status-pill ${item.published ? 'published' : 'draft'}">${item.published ? 'Published' : 'Draft'}</span></td>
        <td><div class="admin-flag-pills">${flags || '<span>—</span>'}</div></td>
        <td>${esc(date(item.createdAt))}</td>
        <td><div class="admin-row-actions"><button class="admin-mini-btn" data-edit="${id}">Edit</button><a class="admin-mini-btn" href="${esc(item.mediaUrl)}" target="_blank" rel="noopener">Open</a><button class="admin-mini-btn danger" data-delete="${id}">Delete</button></div></td>
      </tr>`;
    }).join('');
    syncBulkBar();
  }

  function syncBulkBar() {
    const count = state.selected.size; $('#selected-count').textContent = String(count); $('#bulk-bar').hidden = count === 0;
    $('#music-bulk-footer').hidden = count < 2;
    $('#bulk-edit-selected').hidden = count < 3;
    $('#bulk-delete-count').textContent = String(count);
    $('#bulk-edit-count').textContent = String(count);
    $('#bulk-edit-selected-count').textContent = String(count);
    const visibleIds = state.items.map(i => String(i.id));
    $('#select-all').checked = visibleIds.length > 0 && visibleIds.every(id => state.selected.has(id));
    $('#select-all').indeterminate = visibleIds.some(id => state.selected.has(id)) && !$('#select-all').checked;
  }

  async function load() {
    const [sort, dir] = $('#media-sort').value.split(':'); state.sort = sort; state.dir = dir;
    const params = new URLSearchParams({q:state.q, sort:state.sort, dir:state.dir, status:state.status, flag:state.flag, page:String(state.page), perPage:String(state.perPage)});
    try {
      const response = await fetch(`${API}?action=list&${params.toString()}`, {credentials:'same-origin', headers:{Accept:'application/json'}});
      const payload = await response.json();
      if (!response.ok || payload.success === false) {
        if (response.status === 401 || response.status === 403) { window.location.href = 'login.php'; return; }
        throw new Error(payload.message || 'Unable to load music.');
      }
      state.items = payload.data?.items || []; state.total = Number(payload.data?.pagination?.total || 0); state.pages = Number(payload.data?.pagination?.pages || 1); state.page = Number(payload.data?.pagination?.page || 1);
      renderTable();
    } catch (error) { toast(error.message, 'error'); }
  }

  function openModal(item) {
    $('#edit-id').value = item.id; $('#edit-title').value = item.title || ''; $('#edit-artist').value = item.artist || ''; $('#edit-album').value = item.album || ''; $('#edit-genre').value = item.genre || ''; $('#edit-year').value = item.releaseYear || ''; $('#edit-language').value = item.language || ''; $('#edit-description').value = item.description || '';
    $('#edit-published').value = item.published ? '1' : '0'; $('#edit-featured').value = item.featured ? '1' : '0'; $('#edit-trending').value = item.trending ? '1' : '0'; $('#edit-artwork').value=''; $('#edit-remove-artwork').checked=false;
    $('#edit-modal').classList.add('open'); $('#edit-modal').setAttribute('aria-hidden','false'); $('#edit-title').focus();
  }
  function closeModal() { $('#edit-modal').classList.remove('open'); $('#edit-modal').setAttribute('aria-hidden','true'); }

  function updateFileList() {
    const el = $('#upload-file-list'); if (!state.files.length) { el.innerHTML = '<span>No files selected.</span>'; return; }
    el.innerHTML = state.files.map(f => `<span>${esc(f.name)} <small>${bytes(f.size)}</small></span>`).join('');
  }

  async function uploadFiles() {
    if (!state.files.length) { toast('Choose at least one audio file.', 'error'); return; }
    const submit = $('#upload-submit'); submit.disabled = true;
    const status = $('#upload-status');
    let success = 0, failed = 0;
    for (const file of state.files) {
      const fd = new FormData(); fd.append('file', file); fd.append('title', file.name.replace(/\.[^.]+$/, '')); fd.append('artist', $('#upload-artist').value.trim()); fd.append('album', $('#upload-album').value.trim()); fd.append('genre', $('#upload-genre').value.trim()); fd.append('release_year', $('#upload-year').value.trim()); fd.append('language', $('#upload-language').value.trim()); fd.append('description', $('#upload-description').value.trim()); fd.append('published', $('#upload-published').value); fd.append('featured', $('#upload-featured').value); fd.append('trending', $('#upload-trending').value);
      const art = $('#upload-artwork').files?.[0]; if (art) fd.append('artwork', art);
      status.textContent = `Uploading ${file.name}…`;
      try { await request('upload', {method:'POST', body:fd}); success++; } catch (error) { failed++; toast(`${file.name}: ${error.message}`, 'error'); }
    }
    submit.disabled = false; status.textContent = `${success} uploaded${failed ? ` • ${failed} failed` : ''}.`;
    if (success) { state.page = 1; await load(); }
  }

  async function saveEdit(event) {
    event.preventDefault();
    const payload = {id:$('#edit-id').value, title:$('#edit-title').value, artist:$('#edit-artist').value, album:$('#edit-album').value, genre:$('#edit-genre').value, release_year:$('#edit-year').value, language:$('#edit-language').value, description:$('#edit-description').value, is_published:Number($('#edit-published').value), is_featured:Number($('#edit-featured').value), is_trending:Number($('#edit-trending').value)};
    try { await request('update', {method:'POST', body:JSON.stringify(payload)});
      const artFile=$('#edit-artwork').files?.[0]; const removeArt=$('#edit-remove-artwork').checked;
      if(artFile || removeArt){ const fd=new FormData(); fd.append('id',payload.id); if(artFile) fd.append('artwork',artFile); if(removeArt) fd.append('remove','1'); await request('update_artwork',{method:'POST',body:fd}); }
      closeModal(); await load(); toast('Music updated.'); } catch (error) { toast(error.message, 'error'); }
  }

  async function deleteOne(id) {
    const idKey = String(id);
    const item = state.items.find(x => String(x.id) === idKey);
    if (!item) return;
    if (!confirm(`Delete “${item.title}” permanently? This also removes its uploaded audio/artwork.`)) return;
    try {
      await request('delete', {method:'POST', body:JSON.stringify({id: idKey})});
      state.selected.delete(idKey);
      await load();
      toast('Music removed.');
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  function openBulkEditModal() {
    if (state.selected.size < 3) {
      toast('Select at least three music items to use bulk edit.', 'error');
      return;
    }
    $('#bulk-edit-published').value = '';
    $('#bulk-edit-featured').value = '';
    $('#bulk-edit-trending').value = '';
    $('#bulk-edit-selected-count').textContent = String(state.selected.size);
    $('#bulk-edit-modal').classList.add('open');
    $('#bulk-edit-modal').setAttribute('aria-hidden', 'false');
    $('#bulk-edit-published').focus();
  }

  function closeBulkEditModal() {
    $('#bulk-edit-modal').classList.remove('open');
    $('#bulk-edit-modal').setAttribute('aria-hidden', 'true');
  }

  async function saveBulkEdit(event) {
    event.preventDefault();
    const ids = [...state.selected];
    if (ids.length < 3) {
      closeBulkEditModal();
      toast('Select at least three music items to use bulk edit.', 'error');
      return;
    }
    const published = $('#bulk-edit-published').value;
    const featured = $('#bulk-edit-featured').value;
    const trending = $('#bulk-edit-trending').value;
    if (published === '' && featured === '' && trending === '') {
      toast('Choose at least one field to change.', 'error');
      return;
    }
    const apply = $('#bulk-edit-apply');
    apply.disabled = true;
    try {
      const response = await request('bulk_edit', {
        method: 'POST',
        body: JSON.stringify({
          ids,
          is_published: published === '' ? null : Number(published),
          is_featured: featured === '' ? null : Number(featured),
          is_trending: trending === '' ? null : Number(trending)
        })
      });
      const count = Number(response?.data?.count || ids.length);
      state.selected.clear();
      closeBulkEditModal();
      await load();
      toast(`${count} music item(s) updated.`);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      apply.disabled = false;
    }
  }

  async function bulk(operation) {
    const ids = [...state.selected];
    if (!ids.length) {
      toast('Select at least one music item first.', 'error');
      return;
    }
    const labels = {publish:'publish',unpublish:'unpublish',feature:'feature',trend:'mark as trending',delete:'permanently delete'};
    const label = labels[operation] || operation;
    const confirmText = operation === 'delete'
      ? `Delete ${ids.length} selected music item(s)? Their stored audio/artwork will also be removed.`
      : `Confirm: ${label} ${ids.length} selected item(s)?`;
    if (!confirm(confirmText)) return;
    try {
      const response = await request('bulk', {method:'POST', body:JSON.stringify({ids,operation})});
      const count = Number(response?.data?.count || ids.length);
      state.selected.clear();
      await load();
      toast(operation === 'delete' ? `${count} music item(s) removed.` : 'Bulk action complete.');
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  function setupNav() {
    const sidebar = $('#admin-sidebar'); $('#admin-sidebar-open')?.addEventListener('click', () => sidebar?.classList.add('open')); $('#admin-sidebar-close')?.addEventListener('click', () => sidebar?.classList.remove('open'));
    $$('.admin-nav-link.disabled').forEach(link => link.addEventListener('click', e => { e.preventDefault(); toast('This module unlocks in a later admin phase.'); }));
    $('#admin-logout')?.addEventListener('click', async () => { try { await request('logout', {method:'POST', body:JSON.stringify({})}, ADMIN_API); window.location.href='login.php'; } catch (error) { toast(error.message,'error'); } });
  }

  function setupUpload() {
    const zone = $('#music-dropzone'), input = $('#music-files'); $('#choose-music').addEventListener('click', () => input.click());
    const isSupportedAudioFile = f => f.type.startsWith('audio/') || /\.(mp3|mp1|mp2|mpa|mpga|mpeg|mpg|wav|wave|flac|m4a|m4b|aac|adts|ogg|oga|opus|aiff|aif|aifc|wma|amr|awb|caf|au|snd)$/i.test(f.name);
    input.addEventListener('change', () => { state.files = [...input.files].filter(isSupportedAudioFile); updateFileList(); });
    ['dragenter','dragover'].forEach(type => zone.addEventListener(type, e => { e.preventDefault(); zone.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(type => zone.addEventListener(type, e => { e.preventDefault(); if (type === 'drop') { zone.classList.remove('dragover'); state.files = [...e.dataTransfer.files].filter(isSupportedAudioFile); updateFileList(); } else zone.classList.remove('dragover'); }));
    zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    $('#music-upload-form').addEventListener('submit', e => { e.preventDefault(); uploadFiles(); });
    $('#open-upload').addEventListener('click', () => { $('#upload').classList.remove('collapsed'); $('#upload').scrollIntoView({behavior:'smooth', block:'start'}); });
    $('#open-bulk-help').addEventListener('click', () => { if (state.selected.size) $('#bulk-bar').scrollIntoView({behavior:'smooth', block:'center'}); else toast('Select music rows to enable bulk actions.'); });
    $('#close-upload').addEventListener('click', () => { $('#upload').classList.toggle('collapsed'); $('#close-upload').textContent = $('#upload').classList.contains('collapsed') ? 'Show' : 'Collapse'; });
    if (location.hash === '#upload') $('#upload').scrollIntoView({behavior:'instant', block:'start'});
  }

  function setupTable() {
    $('#select-all').addEventListener('change', e => { const visible = state.items.map(i => String(i.id)); visible.forEach(id => e.target.checked ? state.selected.add(id) : state.selected.delete(id)); renderTable(); });
    $('#music-table-body').addEventListener('click', e => { const edit = e.target.closest('[data-edit]'); const del = e.target.closest('[data-delete]'); if (edit) { const item = state.items.find(x => String(x.id) === String(edit.dataset.edit)); if (item) openModal(item); } if (del) deleteOne(del.dataset.delete); });
    $('#music-table-body').addEventListener('change', e => { const box = e.target.closest('.media-check'); if (!box) return; const id=String(box.dataset.id); box.checked ? state.selected.add(id) : state.selected.delete(id); syncBulkBar(); });
    $('#bulk-delete-selected').addEventListener('click', () => bulk('delete'));
    $('#bulk-edit-selected').addEventListener('click', openBulkEditModal);
    $('#media-search').addEventListener('input', e => { clearTimeout(searchTimer); searchTimer=setTimeout(() => { state.q=e.target.value.trim(); state.page=1; load(); }, 250); });
    $('#media-sort').addEventListener('change', () => { state.page=1; load(); });
    $('#media-status').addEventListener('change', e => { state.status=e.target.value; state.page=1; load(); });
    $('#media-flag').addEventListener('change', e => { state.flag=e.target.value; state.page=1; load(); });
    $('#clear-media-search').addEventListener('click', () => { $('#media-search').value=''; state.q=''; state.page=1; load(); });
    $('#page-prev').addEventListener('click', () => { if (state.page>1) { state.page--; load(); } });
    $('#page-next').addEventListener('click', () => { if (state.page<state.pages) { state.page++; load(); } });
    $$('#bulk-bar [data-bulk]').forEach(button => button.addEventListener('click', () => bulk(button.dataset.bulk)));
    $('#music-table-body').addEventListener('change', e => { if (e.target.matches('.media-check')) syncBulkBar(); });
  }

  function setupModal() {
    $$('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
    $$('[data-close-bulk-edit]').forEach(el => el.addEventListener('click', closeBulkEditModal));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeBulkEditModal(); } });
    $('#edit-form').addEventListener('submit', saveEdit);
    $('#bulk-edit-form').addEventListener('submit', saveBulkEdit);
  }

  document.addEventListener('DOMContentLoaded', () => { setupNav(); setupUpload(); setupTable(); setupModal(); $('#media-refresh').addEventListener('click', load); load(); });
})();
