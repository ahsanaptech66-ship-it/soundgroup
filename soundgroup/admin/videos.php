<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/guard.php';
$user = require_admin_page();
$csrf = csrf_token('admin_csrf');
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#0b0b0f">
  <title>SOUNDGROUP — Video Management</title>
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="admin-body">
  <div class="admin-app" data-admin-user-id="<?= (int)$user['id'] ?>" data-admin-csrf="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
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
        <a class="admin-nav-link active" href="videos.php"><span>▶</span>Add Video</a>
        
        <a class="admin-nav-link" href="playlists.php"><span>☷</span>Playlists</a><a class="admin-nav-link" href="reviews.php"><span>☆</span>Reviews</a>
        <span class="admin-nav-label">Platform</span>
        <a class="admin-nav-link" href="user-uploads.php"><span>◎</span>User Monitoring</a>
        <a class="admin-nav-link" href="users.php"><span>◉</span>Users</a>
        <a class="admin-nav-link" href="settings.php"><span>⚙</span>Website &amp; Catalog</a>
      </nav>
      <div class="admin-sidebar-bottom">
        <div class="admin-user-mini"><span class="admin-avatar" id="admin-avatar"><?= htmlspecialchars(strtoupper(substr($user['name'],0,1)), ENT_QUOTES, 'UTF-8') ?></span><div><strong><?= htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8') ?></strong><small>Administrator</small></div></div>
        <button class="admin-logout-btn" id="admin-logout">Log out <span>↗</span></button>
      </div>
    </aside>

    <div class="admin-main-wrap">
      <header class="admin-topbar">
        <div class="admin-topbar-left"><button class="admin-icon-btn admin-mobile-menu" id="admin-sidebar-open" aria-label="Open navigation">☰</button><div><span class="eyebrow">CONTENT CONTROL</span><h2>Video Management</h2></div></div>
        <div class="admin-topbar-actions"><button class="admin-btn admin-btn-ghost" id="video-refresh">Refresh <span>↻</span></button><a class="admin-btn admin-btn-ghost" href="../public/">View site <span>↗</span></a></div>
      </header>

      <main class="admin-main admin-video-main">
        <section class="admin-welcome admin-video-head">
          <div><span class="eyebrow">PHASE 4</span><h1>Shape the video catalog.</h1><p>Upload, edit, publish and curate video without touching the public site structure.</p></div>
          <div class="admin-video-head-actions"><button class="admin-btn admin-btn-primary" id="open-video-upload">＋ Upload video</button><button class="admin-btn admin-btn-ghost" id="open-video-bulk-help">Bulk actions <span>↓</span></button></div>
        </section>

        <section class="admin-video-toolbar glass-card">
          <div class="admin-search-field"><span>⌕</span><input id="video-search" type="search" placeholder="Search title, artist, album, genre, year, language…" autocomplete="off"></div>
          <select id="video-sort" class="admin-select"><option value="created:desc">Newest</option><option value="created:asc">Oldest</option><option value="title:asc">Title A–Z</option><option value="title:desc">Title Z–A</option><option value="artist:asc">Artist A–Z</option><option value="genre:asc">Genre A–Z</option><option value="size:desc">Largest</option></select><select id="video-status" class="admin-select"><option value="all">All status</option><option value="published">Published</option><option value="draft">Draft</option></select><select id="video-flag" class="admin-select"><option value="all">All flags</option><option value="featured">Featured</option><option value="trending">Trending</option></select>
          <button class="admin-btn admin-btn-ghost" id="clear-video-search">Clear</button>
        </section>

        <section class="admin-bulkbar glass-card" id="video-bulk-bar" hidden>
          <div><strong><span id="selected-video-count">0</span> selected</strong><small>Apply an action to the selected video.</small></div>
          <div class="admin-bulk-actions">
            <button data-bulk="publish" class="admin-btn admin-btn-ghost">Publish</button>
            <button data-bulk="unpublish" class="admin-btn admin-btn-ghost">Unpublish</button>
            <button data-bulk="feature" class="admin-btn admin-btn-ghost">Feature</button>
            <button data-bulk="trend" class="admin-btn admin-btn-ghost">Trending</button>
          </div>
        </section>

        <section class="admin-panel glass-card admin-upload-panel" id="upload">
          <div class="admin-panel-head"><div><span class="eyebrow">UPLOAD CENTER</span><h2>Add video to SOUNDGROUP</h2></div><button type="button" class="admin-btn admin-btn-ghost" id="close-video-upload">Collapse</button></div>
          <form id="video-upload-form" class="admin-upload-grid" enctype="multipart/form-data">
            <label class="admin-field admin-field-wide"><span>Video files</span><div class="admin-dropzone" id="video-dropzone" tabindex="0"><input id="video-files" type="file" accept="video/*,.mp4,.webm,.mkv,.mov,.m4v,.avi,.ogv,.3gp,.mpeg,.mpg,.ts,.mts,.m2ts" multiple hidden><b>Drop video here</b><small>or choose files • up to 1 GB each</small><small class="admin-format-note">MP4, WebM, MKV, MOV, M4V, AVI, OGV, 3GP, MPEG/MPG and transport-stream video formats</small><button type="button" class="admin-btn admin-btn-ghost" id="choose-video">Choose files</button></div><div class="admin-upload-files" id="video-upload-file-list"><span>No files selected.</span></div></label>
            <label class="admin-field"><span>Creator / artist</span><input id="upload-artist" name="artist" type="text" maxlength="255" placeholder="Creator, artist or channel"></label>
            <label class="admin-field"><span>Release / series</span><input id="upload-album" name="album" type="text" maxlength="255" placeholder="Release or series"></label>
            <label class="admin-field"><span>Genre / category</span><input id="upload-genre" name="genre" type="text" maxlength="120" placeholder="Music video, Documentary…"></label><label class="admin-field"><span>Release year</span><input id="upload-year" name="release_year" inputmode="numeric" maxlength="4" placeholder="2026"></label><label class="admin-field"><span>Language</span><input id="upload-language" name="language" maxlength="80" placeholder="English"></label>
            <label class="admin-field"><span>Thumbnail</span><input id="upload-artwork" name="artwork" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label>
            <label class="admin-field"><span>Publish on upload</span><select id="upload-published"><option value="1">Published</option><option value="0">Draft</option></select></label>
            <label class="admin-field"><span>Featured</span><select id="upload-featured"><option value="0">No</option><option value="1">Yes</option></select></label>
            <label class="admin-field"><span>Trending</span><select id="upload-trending"><option value="0">No</option><option value="1">Yes</option></select></label>
            <label class="admin-field admin-field-wide"><span>Description</span><textarea id="upload-description" rows="3" maxlength="5000" placeholder="Short editorial description…"></textarea></label>
            <div class="admin-upload-actions admin-field-wide"><button class="admin-btn admin-btn-primary" type="submit" id="video-upload-submit">Upload selected video</button><span id="video-upload-status" aria-live="polite"></span></div>
          </form>
        </section>

        <section class="admin-panel glass-card">
          <div class="admin-panel-head"><div><span class="eyebrow">VIDEO LIBRARY</span><h2>Published + draft video</h2></div><span class="admin-panel-meta" id="video-summary">Loading…</span></div>
          <div class="admin-table-wrap">
            <table class="admin-table admin-video-table"><thead><tr><th><input type="checkbox" id="select-all-videos" aria-label="Select all visible videos"></th><th>Video</th><th>Artist</th><th>Genre</th><th>Status</th><th>Flags</th><th>Added</th><th>Actions</th></tr></thead><tbody id="video-table-body"><tr><td colspan="8" class="admin-empty">Loading video…</td></tr></tbody><tfoot id="video-bulk-footer" hidden><tr><td colspan="8" class="admin-bulk-footer-cell"><div class="admin-bulk-footer-actions"><button type="button" class="admin-btn admin-btn-ghost admin-bulk-edit-btn" id="video-bulk-edit-selected">Edit selected <span id="video-bulk-edit-count">0</span></button><button type="button" class="admin-btn admin-btn-danger admin-bulk-delete-btn" id="video-bulk-delete-selected">Delete selected <span id="video-bulk-delete-count">0</span></button><span class="admin-bulk-footer-note">Edit applies only to status flags. Delete permanently removes the selected video files and thumbnails.</span></div></td></tr></tfoot></table>
          </div>
          <div class="admin-pagination"><button class="admin-btn admin-btn-ghost" id="page-prev">← Previous</button><span id="page-label">Page 1</span><button class="admin-btn admin-btn-ghost" id="page-next">Next →</button></div>
        </section>
      </main>
    </div>
  </div>

  <div class="admin-modal" id="edit-video-modal" aria-hidden="true">
    <div class="admin-modal-backdrop" data-close-modal></div>
    <div class="admin-modal-card glass-card" role="dialog" aria-modal="true" aria-labelledby="edit-video-modal-title">
      <div class="admin-panel-head"><div><span class="eyebrow">EDIT VIDEO</span><h2 id="edit-video-modal-title">Update video</h2></div><button class="admin-icon-btn" data-close-modal aria-label="Close">×</button></div>
      <form id="edit-video-form" class="admin-edit-grid">
        <input type="hidden" id="edit-video-id">
        <label class="admin-field"><span>Title</span><input id="edit-video-title" maxlength="255" required></label>
        <label class="admin-field"><span>Artist</span><input id="edit-video-artist" maxlength="255"></label>
        <label class="admin-field"><span>Album / release</span><input id="edit-video-album" maxlength="255"></label>
        <label class="admin-field"><span>Genre</span><input id="edit-video-genre" maxlength="120"></label><label class="admin-field"><span>Release year</span><input id="edit-video-year" inputmode="numeric" maxlength="4"></label><label class="admin-field"><span>Language</span><input id="edit-video-language" maxlength="80"></label>
        <label class="admin-field"><span>Published</span><select id="edit-video-published"><option value="1">Published</option><option value="0">Draft</option></select></label>
        <label class="admin-field"><span>Featured</span><select id="edit-video-featured"><option value="0">No</option><option value="1">Yes</option></select></label>
        <label class="admin-field"><span>Trending</span><select id="edit-video-trending"><option value="0">No</option><option value="1">Yes</option></select></label><label class="admin-field"><span>Artwork</span><input id="edit-video-artwork" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><small class="admin-field-note">Optional replacement. Leave empty to keep current.</small></label>
        <label class="admin-field admin-field-wide"><span>Description</span><textarea id="edit-video-description" rows="5" maxlength="5000"></textarea></label>
        <div class="admin-artwork-remove admin-field-wide"><label><input id="edit-video-remove-artwork" type="checkbox"> Remove current artwork</label></div><div class="admin-upload-actions admin-field-wide"><button type="button" class="admin-btn admin-btn-ghost" data-close-modal>Cancel</button><button type="submit" class="admin-btn admin-btn-primary">Save changes</button></div>
      </form>
    </div>
  </div>

  <div class="admin-modal" id="video-bulk-edit-modal" aria-hidden="true">
    <div class="admin-modal-backdrop" data-close-video-bulk-edit></div>
    <div class="admin-modal-card glass-card admin-bulk-edit-modal-card" role="dialog" aria-modal="true" aria-labelledby="video-bulk-edit-modal-title">
      <div class="admin-panel-head"><div><span class="eyebrow">BULK EDIT</span><h2 id="video-bulk-edit-modal-title">Edit selected videos</h2><p class="admin-modal-subtext"><span id="video-bulk-edit-selected-count">0</span> items selected. Only status flags will be changed.</p></div><button class="admin-icon-btn" data-close-video-bulk-edit aria-label="Close">×</button></div>
      <form id="video-bulk-edit-form" class="admin-edit-grid">
        <label class="admin-field"><span>Published</span><select id="video-bulk-edit-published"><option value="">No change</option><option value="1">Published</option><option value="0">Draft</option></select></label>
        <label class="admin-field"><span>Featured</span><select id="video-bulk-edit-featured"><option value="">No change</option><option value="1">Yes</option><option value="0">No</option></select></label>
        <label class="admin-field"><span>Trending</span><select id="video-bulk-edit-trending"><option value="">No change</option><option value="1">Yes</option><option value="0">No</option></select></label>
        <div class="admin-field admin-field-wide admin-bulk-edit-hint">Title, artist, album, genre, description and thumbnail are intentionally excluded from bulk editing.</div>
        <div class="admin-upload-actions admin-field-wide"><button type="button" class="admin-btn admin-btn-ghost" data-close-video-bulk-edit>Cancel</button><button type="submit" class="admin-btn admin-btn-primary" id="video-bulk-edit-apply">Apply changes</button></div>
      </form>
    </div>
  </div>

  <div class="admin-toast" id="admin-toast" role="status" aria-live="polite"></div>
  <script src="assets/admin-video.js" defer></script>
</body>
</html>
