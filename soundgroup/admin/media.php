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
  <title>SOUNDGROUP — Music Management</title>
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
        <a class="admin-nav-link active" href="media.php"><span>♫</span>Add Music</a>
        <a class="admin-nav-link" href="videos.php"><span>▶</span>Add Video</a>
        
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
        <div class="admin-topbar-left"><button class="admin-icon-btn admin-mobile-menu" id="admin-sidebar-open" aria-label="Open navigation">☰</button><div><span class="eyebrow">CONTENT CONTROL</span><h2>Music Management</h2></div></div>
        <div class="admin-topbar-actions"><button class="admin-btn admin-btn-ghost" id="media-refresh">Refresh <span>↻</span></button><a class="admin-btn admin-btn-ghost" href="../public/">View site <span>↗</span></a></div>
      </header>

      <main class="admin-main admin-media-main">
        <section class="admin-welcome admin-media-head">
          <div><span class="eyebrow">PHASE 3</span><h1>Shape the music catalog.</h1><p>Upload, edit, publish and curate audio without touching the public site structure.</p></div>
          <div class="admin-media-head-actions"><button class="admin-btn admin-btn-primary" id="open-upload">＋ Add music</button><button class="admin-btn admin-btn-ghost" id="open-bulk-help">Bulk actions <span>↓</span></button></div>
        </section>

        <section class="admin-media-toolbar glass-card">
          <div class="admin-search-field"><span>⌕</span><input id="media-search" type="search" placeholder="Search title, artist, album, genre, year, language…" autocomplete="off"></div>
          <select id="media-sort" class="admin-select"><option value="created:desc">Newest</option><option value="created:asc">Oldest</option><option value="title:asc">Title A–Z</option><option value="title:desc">Title Z–A</option><option value="artist:asc">Artist A–Z</option><option value="genre:asc">Genre A–Z</option><option value="size:desc">Largest</option></select><select id="media-status" class="admin-select"><option value="all">All status</option><option value="published">Published</option><option value="draft">Draft</option></select><select id="media-flag" class="admin-select"><option value="all">All flags</option><option value="featured">Featured</option><option value="trending">Trending</option></select>
          <button class="admin-btn admin-btn-ghost" id="clear-media-search">Clear</button>
        </section>

        <section class="admin-bulkbar glass-card" id="bulk-bar" hidden>
          <div><strong><span id="selected-count">0</span> selected</strong><small>Apply an action to the selected audio.</small></div>
          <div class="admin-bulk-actions">
            <button data-bulk="publish" class="admin-btn admin-btn-ghost">Publish</button>
            <button data-bulk="unpublish" class="admin-btn admin-btn-ghost">Unpublish</button>
            <button data-bulk="feature" class="admin-btn admin-btn-ghost">Feature</button>
            <button data-bulk="trend" class="admin-btn admin-btn-ghost">Trending</button>
          </div>
        </section>

        <section class="admin-panel glass-card admin-upload-panel" id="upload">
          <div class="admin-panel-head"><div><span class="eyebrow">MUSIC UPLOAD</span><h2>Add music to SOUNDGROUP</h2></div><button type="button" class="admin-btn admin-btn-ghost" id="close-upload">Collapse</button></div>
          <form id="music-upload-form" class="admin-upload-grid" enctype="multipart/form-data">
            <label class="admin-field admin-field-wide"><span>Audio files</span><div class="admin-dropzone" id="music-dropzone" tabindex="0"><input id="music-files" type="file" accept="audio/*,.mp3,.mp2,.mpa,.mpga,.wav,.wave,.flac,.m4a,.m4b,.aac,.adts,.ogg,.oga,.opus,.aiff,.aif,.aifc,.wma,.amr,.awb,.caf,.au,.snd,.mpeg" multiple hidden><b>Drop audio here</b><small>or choose files • up to 512 MB each</small><small class="admin-format-note">MP3, MPEG audio (MP1/MP2/MP3/MPA/MPGA/MPEG/MPG), WAV, FLAC, M4A/M4B, AAC, OGG/OGA, OPUS, AIFF, WMA, AMR and other common audio containers</small><button type="button" class="admin-btn admin-btn-ghost" id="choose-music">Choose files</button></div><div class="admin-upload-files" id="upload-file-list"><span>No files selected.</span></div></label>
            <label class="admin-field"><span>Artist</span><input id="upload-artist" name="artist" type="text" maxlength="255" placeholder="Artist name"></label>
            <label class="admin-field"><span>Album / release</span><input id="upload-album" name="album" type="text" maxlength="255" placeholder="Album or release"></label>
            <label class="admin-field"><span>Genre</span><input id="upload-genre" name="genre" type="text" maxlength="120" placeholder="Electronic, Chill, House…"></label><label class="admin-field"><span>Release year</span><input id="upload-year" name="release_year" inputmode="numeric" maxlength="4" placeholder="2026"></label><label class="admin-field"><span>Language</span><input id="upload-language" name="language" maxlength="80" placeholder="English"></label>
            <label class="admin-field"><span>Artwork</span><input id="upload-artwork" name="artwork" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label>
            <label class="admin-field"><span>Publish on upload</span><select id="upload-published"><option value="1">Published</option><option value="0">Draft</option></select></label>
            <label class="admin-field"><span>Featured</span><select id="upload-featured"><option value="0">No</option><option value="1">Yes</option></select></label>
            <label class="admin-field"><span>Trending</span><select id="upload-trending"><option value="0">No</option><option value="1">Yes</option></select></label>
            <label class="admin-field admin-field-wide"><span>Description</span><textarea id="upload-description" name="description" rows="3" maxlength="5000" placeholder="Short editorial description…"></textarea></label>
            <div class="admin-upload-actions admin-field-wide"><button class="admin-btn admin-btn-primary" type="submit" id="upload-submit">Upload selected music</button><span id="upload-status" aria-live="polite"></span></div>
          </form>
        </section>

        <section class="admin-panel glass-card">
          <div class="admin-panel-head"><div><span class="eyebrow">MUSIC LIBRARY</span><h2>Published + draft audio</h2></div><span class="admin-panel-meta" id="media-summary">Loading…</span></div>
          <div class="admin-table-wrap">
            <table class="admin-table admin-media-table"><thead><tr><th><input type="checkbox" id="select-all" aria-label="Select all visible music"></th><th>Music</th><th>Artist</th><th>Genre</th><th>Status</th><th>Flags</th><th>Added</th><th>Actions</th></tr></thead><tbody id="music-table-body"><tr><td colspan="8" class="admin-empty">Loading music…</td></tr></tbody><tfoot id="music-bulk-footer" hidden><tr><td colspan="8" class="admin-bulk-footer-cell"><div class="admin-bulk-footer-actions"><button type="button" class="admin-btn admin-btn-ghost admin-bulk-edit-btn" id="bulk-edit-selected">Edit selected <span id="bulk-edit-count">0</span></button><button type="button" class="admin-btn admin-btn-danger admin-bulk-delete-btn" id="bulk-delete-selected">Delete selected <span id="bulk-delete-count">0</span></button><span class="admin-bulk-footer-note">Edit applies only to status flags. Delete permanently removes the selected music files and artwork.</span></div></td></tr></tfoot></table>
          </div>
          <div class="admin-pagination"><button class="admin-btn admin-btn-ghost" id="page-prev">← Previous</button><span id="page-label">Page 1</span><button class="admin-btn admin-btn-ghost" id="page-next">Next →</button></div>
        </section>
      </main>
    </div>
  </div>

  <div class="admin-modal" id="edit-modal" aria-hidden="true">
    <div class="admin-modal-backdrop" data-close-modal></div>
    <div class="admin-modal-card glass-card" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
      <div class="admin-panel-head"><div><span class="eyebrow">EDIT MUSIC</span><h2 id="edit-modal-title">Update track</h2></div><button class="admin-icon-btn" data-close-modal aria-label="Close">×</button></div>
      <form id="edit-form" class="admin-edit-grid">
        <input type="hidden" id="edit-id">
        <label class="admin-field"><span>Title</span><input id="edit-title" maxlength="255" required></label>
        <label class="admin-field"><span>Artist</span><input id="edit-artist" maxlength="255"></label>
        <label class="admin-field"><span>Album / release</span><input id="edit-album" maxlength="255"></label>
        <label class="admin-field"><span>Genre</span><input id="edit-genre" maxlength="120"></label><label class="admin-field"><span>Release year</span><input id="edit-year" inputmode="numeric" maxlength="4"></label><label class="admin-field"><span>Language</span><input id="edit-language" maxlength="80"></label>
        <label class="admin-field"><span>Published</span><select id="edit-published"><option value="1">Published</option><option value="0">Draft</option></select></label>
        <label class="admin-field"><span>Featured</span><select id="edit-featured"><option value="0">No</option><option value="1">Yes</option></select></label>
        <label class="admin-field"><span>Trending</span><select id="edit-trending"><option value="0">No</option><option value="1">Yes</option></select></label><label class="admin-field"><span>Artwork</span><input id="edit-artwork" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><small class="admin-field-note">Optional replacement. Leave empty to keep current.</small></label>
        <label class="admin-field admin-field-wide"><span>Description</span><textarea id="edit-description" rows="5" maxlength="5000"></textarea></label>
        <div class="admin-artwork-remove admin-field-wide"><label><input id="edit-remove-artwork" type="checkbox"> Remove current artwork</label></div><div class="admin-upload-actions admin-field-wide"><button type="button" class="admin-btn admin-btn-ghost" data-close-modal>Cancel</button><button type="submit" class="admin-btn admin-btn-primary">Save changes</button></div>
      </form>
    </div>
  </div>

  <div class="admin-modal" id="bulk-edit-modal" aria-hidden="true">
    <div class="admin-modal-backdrop" data-close-bulk-edit></div>
    <div class="admin-modal-card glass-card admin-bulk-edit-modal-card" role="dialog" aria-modal="true" aria-labelledby="bulk-edit-modal-title">
      <div class="admin-panel-head"><div><span class="eyebrow">BULK EDIT</span><h2 id="bulk-edit-modal-title">Edit selected music</h2><p class="admin-modal-subtext"><span id="bulk-edit-selected-count">0</span> items selected. Only status flags will be changed.</p></div><button class="admin-icon-btn" data-close-bulk-edit aria-label="Close">×</button></div>
      <form id="bulk-edit-form" class="admin-edit-grid">
        <label class="admin-field"><span>Published</span><select id="bulk-edit-published"><option value="">No change</option><option value="1">Published</option><option value="0">Draft</option></select></label>
        <label class="admin-field"><span>Featured</span><select id="bulk-edit-featured"><option value="">No change</option><option value="1">Yes</option><option value="0">No</option></select></label>
        <label class="admin-field"><span>Trending</span><select id="bulk-edit-trending"><option value="">No change</option><option value="1">Yes</option><option value="0">No</option></select></label>
        <div class="admin-field admin-field-wide admin-bulk-edit-hint">Title, artist, album, genre, description and artwork are intentionally excluded from bulk editing.</div>
        <div class="admin-upload-actions admin-field-wide"><button type="button" class="admin-btn admin-btn-ghost" data-close-bulk-edit>Cancel</button><button type="submit" class="admin-btn admin-btn-primary" id="bulk-edit-apply">Apply changes</button></div>
      </form>
    </div>
  </div>

  <div class="admin-toast" id="admin-toast" role="status" aria-live="polite"></div>
  <script src="assets/admin-media.js" defer></script>
</body>
</html>
