<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/guard.php';
$user = require_admin_page();
$csrf = csrf_token();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#0b0b0f">
  <title>SOUNDGROUP — User Upload Monitoring</title>
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="admin-body">
  <div class="admin-app" data-admin-user-id="<?= (int)$user['id'] ?>" data-csrf-token="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
    <aside class="admin-sidebar" id="admin-sidebar">
      <div class="admin-sidebar-top">
        <a href="index.php" class="admin-brand"><span class="admin-brand-mark">◈</span><span>SOUNDGROUP</span><em>ADMIN</em></a>
        <button class="admin-icon-btn admin-mobile-close" id="admin-sidebar-close" aria-label="Close navigation">×</button>
      </div>
      <nav class="admin-nav" aria-label="Admin navigation">
        <span class="admin-nav-label">Workspace</span>
        <a class="admin-nav-link" href="index.php"><span>⌂</span>Overview</a>
        <a class="admin-nav-link" href="analytics.php"><span>⌁</span>Analytics</a>
        <span class="admin-nav-label">Content</span>
        <a class="admin-nav-link" href="media.php"><span>♫</span>Add Music</a>
        <a class="admin-nav-link" href="videos.php"><span>▶</span>Add Video</a>
        
        <a class="admin-nav-link" href="playlists.php"><span>☷</span>Playlists</a><a class="admin-nav-link" href="reviews.php"><span>☆</span>Reviews</a>
        <span class="admin-nav-label">Platform</span>
        <a class="admin-nav-link active" href="user-uploads.php"><span>◎</span>User Monitoring</a>
        <a class="admin-nav-link" href="users.php"><span>◉</span>Users</a>
        <a class="admin-nav-link" href="settings.php"><span>⚙</span>Website &amp; Catalog</a>
      </nav>
      <div class="admin-sidebar-bottom">
        <div class="admin-user-mini"><span class="admin-avatar" id="admin-avatar">A</span><div><strong id="admin-user-name"><?= htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8') ?></strong><small>Administrator</small></div></div>
        <button class="admin-logout-btn" id="admin-logout">Log out <span>↗</span></button>
      </div>
    </aside>

    <div class="admin-main-wrap">
      <header class="admin-topbar">
        <div class="admin-topbar-left"><button class="admin-icon-btn admin-mobile-menu" id="admin-sidebar-open" aria-label="Open navigation">☰</button><div><span class="eyebrow">SOUNDGROUP CONTROL ROOM</span><h2>User Monitoring</h2></div></div>
        <div class="admin-topbar-actions"><button class="admin-btn admin-btn-ghost" id="monitor-refresh">Refresh <span>↻</span></button><a class="admin-btn admin-btn-ghost" href="../public/">View site <span>↗</span></a></div>
      </header>

      <main class="admin-main admin-monitor-main">
        <section class="admin-welcome">
          <div><span class="eyebrow">PHASE 5</span><h1>Monitor user uploads.</h1><p>Personal audio and video remain owner-specific. This room gives administrators visibility without turning uploads into official Discover content.</p></div>
          <div class="admin-live-status"><i></i><span>Owner-only library model</span><small id="monitor-last-updated">Loading…</small></div>
        </section>

        <section class="admin-stat-grid admin-monitor-stat-grid" aria-label="User upload statistics">
          <article class="admin-stat-card glass-card"><span>User uploads</span><strong id="monitor-total">—</strong><small>Audio + video</small></article>
          <article class="admin-stat-card glass-card"><span>Audio</span><strong id="monitor-audio">—</strong><small>User music</small></article>
          <article class="admin-stat-card glass-card"><span>Videos</span><strong id="monitor-video">—</strong><small>User videos</small></article>
          <article class="admin-stat-card glass-card"><span>Contributors</span><strong id="monitor-users">—</strong><small>Accounts with uploads</small></article>
        </section>

        <section class="admin-panel glass-card admin-monitor-panel">
          <div class="admin-panel-head"><div><span class="eyebrow">USER CONTENT</span><h2>Uploads</h2><small class="admin-panel-subtitle">No approval workflow. Monitor, open, or remove personal uploads when necessary.</small></div></div>
          <div class="admin-monitor-toolbar">
            <label class="admin-search-field"><span>⌕</span><input id="monitor-search" type="search" placeholder="Search title, filename, user or email…" autocomplete="off"></label>
            <select class="admin-select" id="monitor-type"><option value="all">All media</option><option value="audio">Music</option><option value="video">Videos</option></select>
            <select class="admin-select" id="monitor-sort"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="title">Title</option><option value="largest">Largest</option></select>
            <button class="admin-btn admin-btn-ghost" id="monitor-clear">Clear</button>
          </div>
          <div class="admin-bulkbar glass-card hidden" id="monitor-bulkbar">
            <div><strong><span id="monitor-selected-count">0</span> selected</strong><small>Only user-origin uploads can be removed here.</small></div>
            <div class="admin-bulk-actions"><button class="admin-btn admin-btn-danger" id="monitor-bulk-delete">Delete selected</button></div>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table admin-user-media-table">
              <thead><tr><th class="admin-check-col"><input type="checkbox" id="monitor-select-all" aria-label="Select visible user uploads"></th><th>Upload</th><th>User</th><th>Type</th><th>Size</th><th>Added</th><th>Actions</th></tr></thead>
              <tbody id="monitor-table-body"><tr><td colspan="7" class="admin-empty">Loading user uploads…</td></tr></tbody>
            </table>
          </div>
          <div class="admin-pagination"><button class="admin-btn admin-btn-ghost" id="monitor-prev">← Previous</button><span id="monitor-page-info">Page 1 of 1</span><button class="admin-btn admin-btn-ghost" id="monitor-next">Next →</button></div>
        </section>
      </main>
    </div>
  </div>
  <div class="admin-toast" id="admin-toast" role="status" aria-live="polite"></div>
  <script src="assets/admin.js" defer></script>
  <script src="assets/admin-user-uploads.js" defer></script>
</body>
</html>
