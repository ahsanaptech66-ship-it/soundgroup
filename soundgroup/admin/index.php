<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/guard.php';
$user = require_admin_page();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#0b0b0f">
  <title>SOUNDGROUP — Admin Dashboard</title>
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="admin-body">
  <div class="admin-app" data-admin-user-id="<?= (int)$user['id'] ?>">
    <aside class="admin-sidebar" id="admin-sidebar">
      <div class="admin-sidebar-top">
        <a href="index.php" class="admin-brand"><span class="admin-brand-mark">◈</span><span>SOUNDGROUP</span><em>ADMIN</em></a>
        <button class="admin-icon-btn admin-mobile-close" id="admin-sidebar-close" aria-label="Close navigation">×</button>
      </div>
      <nav class="admin-nav" aria-label="Admin navigation">
        <span class="admin-nav-label">Workspace</span>
        <a class="admin-nav-link active" href="index.php"><span>⌂</span>Overview</a>
        <a class="admin-nav-link" href="analytics.php"><span>⌁</span>Analytics</a>
        <span class="admin-nav-label">Content</span>
        <a class="admin-nav-link" href="media.php"><span>♫</span>Add Music</a>
        <a class="admin-nav-link" href="videos.php"><span>▶</span>Add Video</a>
        
        <a class="admin-nav-link" href="playlists.php"><span>☷</span>Playlists</a><a class="admin-nav-link" href="reviews.php"><span>☆</span>Reviews</a>
        <span class="admin-nav-label">Platform</span>
        <a class="admin-nav-link" href="user-uploads.php"><span>◎</span>User Monitoring</a>
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
        <div class="admin-topbar-left"><button class="admin-icon-btn admin-mobile-menu" id="admin-sidebar-open" aria-label="Open navigation">☰</button><div><span class="eyebrow">SOUNDGROUP CONTROL ROOM</span><h2>Dashboard</h2></div></div>
        <div class="admin-topbar-actions"><button class="admin-btn admin-btn-ghost" id="admin-refresh">Refresh <span>↻</span></button><a class="admin-btn admin-btn-ghost" href="../public/">View site <span>↗</span></a></div>
      </header>

      <main class="admin-main">
        <section class="admin-welcome">
          <div><span class="eyebrow">OVERVIEW</span><h1>Good to see you, <span id="admin-welcome-name"><?= htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8') ?></span>.</h1><p>One calm view of the SOUNDGROUP platform. Content management modules will unlock phase by phase.</p></div>
          <div class="admin-live-status"><i></i><span>Backend connected</span><small id="admin-last-updated">Loading…</small></div>
        </section>

        <section class="admin-stat-grid" aria-label="Platform statistics">
          <article class="admin-stat-card glass-card"><span>Users</span><strong id="stat-users">—</strong><small>Registered accounts</small></article>
          <article class="admin-stat-card glass-card"><span>Music</span><strong id="stat-songs">—</strong><small>Audio items</small></article>
          <article class="admin-stat-card glass-card"><span>Videos</span><strong id="stat-videos">—</strong><small>Video items</small></article>
          <article class="admin-stat-card glass-card"><span>Playlists</span><strong id="stat-playlists">—</strong><small>Created playlists</small></article>
          <article class="admin-stat-card glass-card"><span>Favorites</span><strong id="stat-favorites">—</strong><small>Saved media entries</small></article>
          <article class="admin-stat-card glass-card"><span>History</span><strong id="stat-history">—</strong><small>Playback history entries</small></article>
        </section>

        <section class="admin-grid-two">
          <article class="admin-panel glass-card">
            <div class="admin-panel-head"><div><span class="eyebrow">CONTENT</span><h2>Recent uploads</h2></div><span class="admin-panel-meta">Latest 8</span></div>
            <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Content</th><th>Type</th><th>Uploader</th><th>Added</th></tr></thead><tbody id="recent-uploads"><tr><td colspan="4" class="admin-empty">Loading recent uploads…</td></tr></tbody></table></div>
          </article>
          <article class="admin-panel glass-card">
            <div class="admin-panel-head"><div><span class="eyebrow">PEOPLE</span><h2>Recent users</h2></div><span class="admin-panel-meta">Latest 8</span></div>
            <div class="admin-user-list" id="recent-users"><div class="admin-empty">Loading users…</div></div>
          </article>
        </section>

        <section class="admin-grid-two">
          <article class="admin-panel glass-card">
            <div class="admin-panel-head"><div><span class="eyebrow">SIGNALS</span><h2>Most favorited</h2></div><span class="admin-panel-meta">Top 8</span></div>
            <div class="admin-ranking-list" id="top-favorites"><div class="admin-empty">Loading favorites…</div></div>
          </article>
          <article class="admin-panel admin-next-panel glass-card">
            <div class="admin-panel-head"><div><span class="eyebrow">ROADMAP</span><h2>Admin modules</h2></div><span class="admin-panel-meta">Phased</span></div>
            <div class="admin-roadmap"><div><b>01</b><span>Authentication + Dashboard</span><em class="done">Complete</em></div><div><b>02</b><span>Music Management</span><em class="done">Complete</em></div><div><b>03</b><span>Video Management + Discover</span><em class="done">Complete</em></div><div><b>04</b><span>User Upload Monitoring</span><em class="active">Active</em></div></div><a class="admin-btn admin-btn-ghost admin-monitor-shortcut" href="user-uploads.php">Open user monitoring <span>→</span></a>
          </article>
        </section>
      </main>
    </div>
  </div>
  <div class="admin-toast" id="admin-toast" role="status" aria-live="polite"></div>
  <script src="assets/admin.js" defer></script>
</body>
</html>
