<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';

app_boot();

function require_phase5_admin(): array {
    $id = current_user_id();
    if (!$id) json_response(false, 'Admin authentication required.', null, 401);
    $st = db()->prepare('SELECT id,name,email,role,is_active,created_at FROM users WHERE id=? LIMIT 1');
    $st->execute([$id]);
    $user = $st->fetch();
    if (!$user || $user['role'] !== 'admin' || !(bool)$user['is_active']) json_response(false, 'Admin access required.', null, 403);
    return $user;
}

function monitored_media_row(array $r): array {
    return [
        'id' => (string)$r['id'],
        'type' => (string)$r['type'],
        'title' => (string)($r['title'] ?? 'Untitled'),
        'artist' => $r['artist'] !== null ? (string)$r['artist'] : null,
        'filename' => (string)($r['filename'] ?? ''),
        'mimeType' => (string)($r['mime_type'] ?? ''),
        'size' => (int)($r['size_bytes'] ?? 0),
        'duration' => $r['duration'] !== null ? (float)$r['duration'] : null,
        'browserPlayable' => (bool)($r['browser_playable'] ?? 0),
        'artworkUrl' => !empty($r['artwork_path'])
            ? SG_UPLOAD_URL . '/' . implode('/', array_map('rawurlencode', explode('/', trim((string)$r['artwork_path'], '/'))))
            : null,
        'mediaUrl' => SG_UPLOAD_URL . '/' . (string)$r['type'] . '/' . rawurlencode((string)$r['stored_name']),
        'published' => (bool)($r['is_published'] ?? 0),
        'createdAt' => strtotime((string)$r['created_at']) * 1000,
        'updatedAt' => strtotime((string)$r['updated_at']) * 1000,
        'uploader' => [
            'id' => (string)$r['user_id'],
            'name' => (string)($r['uploader_name'] ?? 'Unknown user'),
            'email' => (string)($r['uploader_email'] ?? ''),
            'role' => (string)($r['uploader_role'] ?? 'user'),
        ],
    ];
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'list') {
    require_phase5_admin();
    $pdo = db();
    $q = trim((string)($_GET['q'] ?? ''));
    $type = strtolower(trim((string)($_GET['type'] ?? 'all')));
    if (!in_array($type, ['all', 'audio', 'video'], true)) $type = 'all';
    $sort = strtolower(trim((string)($_GET['sort'] ?? 'newest')));
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 20)));

    $where = ["m.origin='user'", "m.type IN ('audio','video')"];
    $params = [];
    if ($type !== 'all') {
        $where[] = 'm.type=?';
        $params[] = $type;
    }
    if ($q !== '') {
        $where[] = '(m.title LIKE ? OR m.artist LIKE ? OR m.filename LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
        $needle = '%' . $q . '%';
        array_push($params, $needle, $needle, $needle, $needle, $needle);
    }
    $whereSql = implode(' AND ', $where);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM media m INNER JOIN users u ON u.id=m.user_id WHERE {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();
    $pages = max(1, (int)ceil($total / $perPage));
    $page = min($page, $pages);
    $offset = ($page - 1) * $perPage;

    $order = match ($sort) {
        'oldest' => 'm.created_at ASC, m.id ASC',
        'title' => 'm.title ASC, m.id DESC',
        'largest' => 'm.size_bytes DESC, m.id DESC',
        default => 'm.created_at DESC, m.id DESC',
    };

    $sql = "SELECT m.id,m.user_id,m.origin,m.type,m.title,m.artist,m.filename,m.stored_name,m.mime_type,m.size_bytes,
                   m.duration,m.browser_playable,m.artwork_path,m.is_published,m.created_at,m.updated_at,
                   u.name AS uploader_name,u.email AS uploader_email,u.role AS uploader_role
            FROM media m
            INNER JOIN users u ON u.id=m.user_id
            WHERE {$whereSql}
            ORDER BY {$order}
            LIMIT {$perPage} OFFSET {$offset}";
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $items = array_map('monitored_media_row', $st->fetchAll());

    json_response(true, 'User uploads loaded.', [
        'items' => $items,
        'pagination' => ['page'=>$page,'pages'=>$pages,'perPage'=>$perPage,'total'=>$total],
        'filters' => ['q'=>$q,'type'=>$type,'sort'=>$sort],
    ]);
}

if ($action === 'stats') {
    require_phase5_admin();
    $pdo = db();
    $total = (int)$pdo->query("SELECT COUNT(*) FROM media WHERE origin='user' AND type IN ('audio','video')")->fetchColumn();
    $audio = (int)$pdo->query("SELECT COUNT(*) FROM media WHERE origin='user' AND type='audio'")->fetchColumn();
    $video = (int)$pdo->query("SELECT COUNT(*) FROM media WHERE origin='user' AND type='video'")->fetchColumn();
    $users = (int)$pdo->query("SELECT COUNT(DISTINCT user_id) FROM media WHERE origin='user' AND type IN ('audio','video')")->fetchColumn();
    $latest = $pdo->query("SELECT MAX(created_at) FROM media WHERE origin='user' AND type IN ('audio','video')")->fetchColumn();
    json_response(true, 'User upload stats loaded.', [
        'total'=>$total,
        'audio'=>$audio,
        'video'=>$video,
        'users'=>$users,
        'latest'=>$latest ? strtotime((string)$latest)*1000 : null,
    ]);
}

if ($action === 'delete') {
    require_phase5_admin();
    require_method('POST');
    require_csrf();
    $data = request_json();
    $id = (int)($data['id'] ?? 0);
    if (!$id) json_response(false, 'Invalid media id.', null, 422);

    $pdo = db();
    $q = $pdo->prepare("SELECT id,relative_path,artwork_path FROM media WHERE id=? AND origin='user' AND type IN ('audio','video') LIMIT 1");
    $q->execute([$id]);
    $row = $q->fetch();
    if (!$row) json_response(false, 'User upload not found.', null, 404);

    $pdo->beginTransaction();
    try {
        $del = $pdo->prepare("DELETE FROM media WHERE id=? AND origin='user' AND type IN ('audio','video')");
        $del->execute([$id]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    @unlink(SG_UPLOAD_ROOT . '/' . $row['relative_path']);
    if (!empty($row['artwork_path'])) @unlink(SG_UPLOAD_ROOT . '/' . $row['artwork_path']);
    json_response(true, 'User upload removed.', ['id'=>(string)$id]);
}

if ($action === 'bulk_delete') {
    require_phase5_admin();
    require_method('POST');
    require_csrf();
    $data = request_json();
    $ids = array_values(array_filter(array_map('intval', (array)($data['ids'] ?? [])), static fn($id) => $id > 0));
    if (!$ids) json_response(false, 'Select at least one upload.', null, 422);

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $pdo = db();
    $q = $pdo->prepare("SELECT id,relative_path,artwork_path FROM media WHERE origin='user' AND type IN ('audio','video') AND id IN ({$placeholders})");
    $q->execute($ids);
    $rows = $q->fetchAll();
    if (!$rows) json_response(false, 'No matching user uploads were found.', null, 404);

    $pdo->beginTransaction();
    try {
        $del = $pdo->prepare("DELETE FROM media WHERE origin='user' AND type IN ('audio','video') AND id IN ({$placeholders})");
        $del->execute($ids);
        $count = $del->rowCount();
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    foreach ($rows as $row) {
        @unlink(SG_UPLOAD_ROOT . '/' . $row['relative_path']);
        if (!empty($row['artwork_path'])) @unlink(SG_UPLOAD_ROOT . '/' . $row['artwork_path']);
    }
    json_response(true, 'Selected user uploads removed.', ['count'=>$count]);
}

json_response(false, 'Unknown user media action.', null, 400);
