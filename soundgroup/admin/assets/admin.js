(() => {
  'use strict';

  const API = '../api/admin.php';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function toast(message, type = 'info') {
    const el = $('#admin-toast');
    if (!el) return;
    el.textContent = message;
    el.dataset.type = type;
    el.classList.add('show');
    clearTimeout(window.__adminToastTimer);
    window.__adminToastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  async function request(action, options = {}) {
    const response = await fetch(`${API}?action=${encodeURIComponent(action)}`, {
      credentials: 'same-origin',
      headers: {'Accept': 'application/json', ...(options.body ? {'Content-Type': 'application/json'} : {})},
      ...options,
    });
    let payload = null;
    try { payload = await response.json(); } catch { throw new Error(`Server returned ${response.status}.`); }
    if (!response.ok || payload.success === false) throw new Error(payload.message || 'Request failed.');
    return payload;
  }

  function formatNumber(value) { return new Intl.NumberFormat().format(Number(value || 0)); }
  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value.replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
  }

  function renderStats(stats) {
    $('#stat-users').textContent = formatNumber(stats.users);
    $('#stat-songs').textContent = formatNumber(stats.songs);
    $('#stat-videos').textContent = formatNumber(stats.videos);
    $('#stat-playlists').textContent = formatNumber(stats.playlists);
    $('#stat-favorites').textContent = formatNumber(stats.favorites);
    $('#stat-history').textContent = formatNumber(stats.history_entries);
  }

  function renderUploads(items) {
    const el = $('#recent-uploads');
    if (!items.length) { el.innerHTML = '<tr><td colspan="4" class="admin-empty">No media uploaded yet.</td></tr>'; return; }
    el.innerHTML = items.map(item => `<tr><td><div class="admin-content-cell"><span class="admin-content-icon ${escapeHtml(item.type)}">${item.type === 'audio' ? '♫' : item.type === 'video' ? '▶' : '•'}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.artist || 'Untitled artist')}</small></div></div></td><td><span class="admin-type-pill">${escapeHtml(item.type)}</span></td><td>${escapeHtml(item.uploader)}</td><td>${escapeHtml(formatDate(item.created_at))}</td></tr>`).join('');
  }

  function renderUsers(items) {
    const el = $('#recent-users');
    if (!items.length) { el.innerHTML = '<div class="admin-empty">No users yet.</div>'; return; }
    el.innerHTML = items.map(item => `<div class="admin-user-row"><span class="admin-avatar">${escapeHtml((item.name || '?').charAt(0).toUpperCase())}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.email)}</small></div><span class="admin-role-pill ${item.role === 'admin' ? 'admin' : ''}">${escapeHtml(item.role)}</span></div>`).join('');
  }

  function renderFavorites(items) {
    const el = $('#top-favorites');
    if (!items.length) { el.innerHTML = '<div class="admin-empty">No favorites yet.</div>'; return; }
    el.innerHTML = items.map((item, i) => `<div class="admin-rank-row"><b>${String(i + 1).padStart(2, '0')}</b><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.artist || 'Unknown artist')} · ${escapeHtml(item.type)}</small></div><span>${formatNumber(item.favorite_count)}</span></div>`).join('');
  }

  async function loadDashboard() {
    try {
      const result = await request('dashboard');
      const data = result.data || {};
      renderStats(data.stats || {});
      renderUploads(data.recent_uploads || []);
      renderUsers(data.recent_users || []);
      renderFavorites(data.top_favorites || []);
      const name = data.user?.name || 'Administrator';
      if ($('#admin-user-name')) $('#admin-user-name').textContent = name;
      if ($('#admin-welcome-name')) $('#admin-welcome-name').textContent = name;
      if ($('#admin-avatar')) $('#admin-avatar').textContent = name.charAt(0).toUpperCase();
      if ($('#admin-last-updated')) $('#admin-last-updated').textContent = `Updated ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
    } catch (error) {
      toast(error.message, 'error');
      if (error.message.toLowerCase().includes('admin access') || error.message.toLowerCase().includes('authentication')) window.location.href = 'login.php';
    }
  }

  async function logout() {
    try { await request('logout', {method:'POST', body:JSON.stringify({})}); window.location.href = 'login.php'; }
    catch (error) { toast(error.message, 'error'); }
  }

  function setupSidebar() {
    const sidebar = $('#admin-sidebar');
    $('#admin-sidebar-open')?.addEventListener('click', () => sidebar?.classList.add('open'));
    $('#admin-sidebar-close')?.addEventListener('click', () => sidebar?.classList.remove('open'));
    $$('.admin-nav-link.disabled').forEach(link => link.addEventListener('click', e => { e.preventDefault(); toast('This module unlocks in a later admin phase.'); }));
  }

  function initLogin() {
    const form = $('#admin-login-form');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = $('#admin-email').value.trim();
      const password = $('#admin-password').value;
      const status = $('#admin-login-status');
      if (!email || !password) { status.textContent = 'Enter your administrator email and password.'; status.dataset.type = 'error'; return; }
      status.textContent = 'Signing in…';
      status.dataset.type = 'info';
      try {
        const result = await request('login', {method:'POST', body:JSON.stringify({email,password})});
        if (result.data?.user?.role !== 'admin') throw new Error('This account is not an administrator.');
        window.location.href = 'index.php';
      } catch (error) {
        status.textContent = error.message;
        status.dataset.type = 'error';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    if ($('#recent-uploads')) {
      setupSidebar();
      $('#admin-refresh')?.addEventListener('click', loadDashboard);
      $('#admin-logout')?.addEventListener('click', logout);
      loadDashboard();
    }
  });
})();
