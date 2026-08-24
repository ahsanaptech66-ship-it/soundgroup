<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';
app_boot();

$id = current_user_id();
if ($id) {
    $st = db()->prepare('SELECT role FROM users WHERE id=? LIMIT 1');
    $st->execute([$id]);
    if (($st->fetchColumn() ?: '') === 'admin') {
        header('Location: index.php');
        exit;
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#0b0b0f">
  <title>SOUNDGROUP — Admin Login</title>
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="admin-body admin-login-body">
  <main class="admin-login-shell">
    <section class="admin-login-card glass-card">
      <div class="admin-brand"><span class="admin-brand-mark">◈</span><span>SOUNDGROUP</span><em>ADMIN</em></div>
      <div class="admin-login-copy">
        <span class="eyebrow">SECURE CONTROL ROOM</span>
        <h1>Welcome back.</h1>
        <p>Sign in with an administrator account to manage the SOUNDGROUP platform.</p>
      </div>
      <form id="admin-login-form" novalidate>
        <label>Email<input id="admin-email" name="email" type="email" autocomplete="username" placeholder="admin@example.com" required></label>
        <label>Password<input id="admin-password" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required></label>
        <button class="admin-btn admin-btn-primary admin-btn-wide" type="submit">Enter dashboard <span>→</span></button>
        <p class="admin-form-status" id="admin-login-status" role="status" aria-live="polite"></p>
      </form>
      <a class="admin-back-link" href="../public/">← Back to SOUNDGROUP</a>
    </section>
  </main>
  <script src="assets/admin.js" defer></script>
</body>
</html>
