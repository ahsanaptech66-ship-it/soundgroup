<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';

app_boot();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

function require_admin_api(): array {
    $id = current_user_id();
    if (!$id) json_response(false, 'Admin authentication required.', null, 401);
    $st = db()->prepare('SELECT id,name,email,phone,address,role,is_active,created_at FROM users WHERE id=? LIMIT 1');
    $st->execute([$id]);
    $user = $st->fetch();
    if (!$user || $user['role'] !== 'admin' || !(bool)$user['is_active']) json_response(false, 'Admin access required.', null, 403);
    return $user;
}

if ($action === 'login') {
    require_method('POST');
    $data = request_json();
    $email = strtolower(trim((string)($data['email'] ?? '')));
    $password = (string)($data['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        json_response(false, 'Enter your admin email and password.', null, 422);
    }

    $st = db()->prepare('SELECT id,name,email,password_hash,role,is_active FROM users WHERE email=? LIMIT 1');
    $st->execute([$email]);
    $user = $st->fetch();
    if (!$user || $user['role'] !== 'admin' || !(bool)$user['is_active'] || !password_verify($password, $user['password_hash'])) {
        json_response(false, 'Invalid admin credentials.', null, 401);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_role'] = 'admin';
    unset($user['password_hash']);
    json_response(true, 'Admin login successful.', ['authenticated' => true, 'user' => $user]);
}

if ($action === 'me') {
    $user = require_admin_api();
    json_response(true, 'Admin authenticated.', ['authenticated' => true, 'user' => $user]);
}

if ($action === 'logout') {
    unset($_SESSION['user_id'], $_SESSION['user_name'], $_SESSION['user_role']);
    session_regenerate_id(true);
    json_response(true, 'Admin session ended.');
}

if ($action === 'dashboard') {
    $user = require_admin_api();
    $pdo = db();

    $stats = [];
    $stats['users'] = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $stats['songs'] = (int)$pdo->query("SELECT COUNT(*) FROM media WHERE type='audio'")->fetchColumn();
    $stats['videos'] = (int)$pdo->query("SELECT COUNT(*) FROM media WHERE type='video'")->fetchColumn();
    $stats['playlists'] = (int)$pdo->query('SELECT COUNT(*) FROM playlists')->fetchColumn();
    $stats['favorites'] = (int)$pdo->query('SELECT COUNT(*) FROM favorites')->fetchColumn();
    $stats['history_entries'] = (int)$pdo->query('SELECT COUNT(*) FROM history')->fetchColumn();

    $recentUploads = $pdo->query(
        'SELECT m.id,m.type,m.title,m.artist,m.created_at,u.name AS uploader
         FROM media m INNER JOIN users u ON u.id=m.user_id
         ORDER BY m.created_at DESC LIMIT 8'
    )->fetchAll();

    $recentUsers = $pdo->query(
        'SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC LIMIT 8'
    )->fetchAll();

    $topFavorites = $pdo->query(
        'SELECT m.id,m.title,m.artist,m.type,COUNT(f.user_id) AS favorite_count
         FROM favorites f INNER JOIN media m ON m.id=f.media_id
         GROUP BY m.id,m.title,m.artist,m.type
         ORDER BY favorite_count DESC,m.title ASC LIMIT 8'
    )->fetchAll();

    json_response(true, 'Dashboard data loaded.', [
        'user' => $user,
        'stats' => $stats,
        'recent_uploads' => $recentUploads,
        'recent_users' => $recentUsers,
        'top_favorites' => $topFavorites,
        'generated_at' => date(DATE_ATOM),
    ]);
}

json_response(false, 'Unknown admin action.', null, 400);
