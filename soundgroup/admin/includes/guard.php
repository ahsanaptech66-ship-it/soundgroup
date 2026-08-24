<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config/config.php';

app_boot();

function admin_session_user(): ?array {
    $id = current_user_id();
    if (!$id) return null;
    $st = db()->prepare('SELECT id,name,email,role,is_active,created_at FROM users WHERE id=? LIMIT 1');
    $st->execute([$id]);
    $user = $st->fetch();
    if (!$user || $user['role'] !== 'admin' || !(bool)$user['is_active']) return null;
    return $user;
}

function require_admin_page(): array {
    $user = admin_session_user();
    if (!$user) {
        header('Location: login.php');
        exit;
    }
    return $user;
}
