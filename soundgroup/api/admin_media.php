<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';

app_boot();

function require_admin_media(): array {
    $id = current_user_id();
    if (!$id) json_response(false, 'Admin authentication required.', null, 401);
    $st = db()->prepare('SELECT id,name,email,role,is_active,created_at FROM users WHERE id=? LIMIT 1');
    $st->execute([$id]);
    $user = $st->fetch();
    if (!$user || $user['role'] !== 'admin' || !(bool)$user['is_active']) json_response(false, 'Admin access required.', null, 403);
    return $user;
}

function require_admin_media_mutation(): array {
    $user = require_admin_media();
    require_method('POST');
    require_csrf('admin_csrf');
    return $user;
}

function media_upload_mime(string $tmpPath, string $fallback = ''): string {
    $mime = 'application/octet-stream';
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detected = $finfo->file($tmpPath);
        if ($detected) $mime = $detected;
    } elseif ($fallback !== '') {
        $mime = $fallback;
    }
    return strtolower($mime);
}

function admin_media_row(array $r): array {
    $type = (string)$r['type'];
    $stored = (string)$r['stored_name'];
    $path = SG_UPLOAD_URL . '/' . $type . '/' . rawurlencode($stored);
    $artworkUrl = null;
    if (!empty($r['artwork_path'])) {
        $artworkUrl = SG_UPLOAD_URL . '/' . implode('/', array_map('rawurlencode', explode('/', trim((string)$r['artwork_path'], '/'))));
    }
    return [
        'id' => (string)$r['id'],
        'origin' => (string)($r['origin'] ?? 'official'),
        'type' => $type,
        'title' => (string)$r['title'],
        'artist' => $r['artist'],
        'album' => $r['album'],
        'genre' => $r['genre'], 'releaseYear' => $r['release_year'] !== null ? (int)$r['release_year'] : null, 'language' => $r['language'] !== null ? (string)$r['language'] : null,
        'description' => $r['description'],
        'filename' => (string)$r['filename'],
        'mimeType' => $r['mime_type'],
        'size' => (int)$r['size_bytes'],
        'duration' => $r['duration'] !== null ? (float)$r['duration'] : null,
        'browserPlayable' => (bool)$r['browser_playable'],
        'artworkUrl' => $artworkUrl,
        'published' => (bool)$r['is_published'],
        'featured' => (bool)$r['is_featured'],
        'trending' => (bool)$r['is_trending'],
        'createdAt' => $r['created_at'],
        'updatedAt' => $r['updated_at'],
        'uploader' => [
            'id' => (string)$r['user_id'],
            'name' => (string)($r['uploader_name'] ?? ''),
            'email' => (string)($r['uploader_email'] ?? ''),
        ],
        'mediaUrl' => $path,
        'streamUrl' => $path,
        '_relativePath' => (string)$r['relative_path'],
        '_artworkPath' => $r['artwork_path'] ? (string)$r['artwork_path'] : null,
    ];
}

function select_admin_audio(PDO $pdo, string $where = '', array $params = [], string $order = 'm.created_at DESC', int $limit = 50, int $offset = 0): array {
    $sql = 'SELECT m.*, u.name AS uploader_name, u.email AS uploader_email FROM media m INNER JOIN users u ON u.id=m.user_id WHERE m.type=\'audio\'';
    if ($where !== '') $sql .= ' AND ' . $where;
    $sql .= ' ORDER BY ' . $order . ' LIMIT ' . (int)$limit . ' OFFSET ' . (int)$offset;
    $st = $pdo->prepare($sql);
    $st->execute($params);
    return array_map('admin_media_row', $st->fetchAll());
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'list') {
    require_admin_media();
    $pdo = db();
    $q = trim((string)($_GET['q'] ?? ''));
    $sort = (string)($_GET['sort'] ?? 'created');
    $dir = strtolower((string)($_GET['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';
    $status = (string)($_GET['status'] ?? 'all');
    $flag = (string)($_GET['flag'] ?? 'all');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(10, (int)($_GET['perPage'] ?? 25)));
    $allowedSorts = [
        'created' => 'm.created_at',
        'updated' => 'm.updated_at',
        'title' => 'm.title',
        'artist' => 'm.artist',
        'album' => 'm.album',
        'genre' => 'm.genre',
        'year' => 'm.release_year',
        'language' => 'm.language',
        'size' => 'm.size_bytes',
        'duration' => 'm.duration',
    ];
    $order = ($allowedSorts[$sort] ?? $allowedSorts['created']) . ' ' . $dir . ', m.id DESC';
    $where = '';
    $params = [];
    $conditions = [];
    if ($q !== '') {
        $where = '(m.title LIKE ? OR m.artist LIKE ? OR m.album LIKE ? OR m.genre LIKE ? OR CAST(m.release_year AS CHAR) LIKE ? OR m.language LIKE ? OR m.filename LIKE ?)';
        $needle = '%' . $q . '%';
        $params = [$needle, $needle, $needle, $needle, $needle, $needle, $needle];
        $conditions[] = $where;
    }
    if ($status === 'published') $conditions[] = 'm.is_published=1';
    if ($status === 'draft') $conditions[] = 'm.is_published=0';
    if ($flag === 'featured') $conditions[] = 'm.is_featured=1';
    if ($flag === 'trending') $conditions[] = 'm.is_trending=1';
    $where = implode(' AND ', $conditions);
    $countSql = 'SELECT COUNT(*) FROM media m WHERE m.type=\'audio\'' . ($where ? ' AND ' . $where : '');
    $st = $pdo->prepare($countSql);
    $st->execute($params);
    $total = (int)$st->fetchColumn();
    $pages = max(1, (int)ceil($total / $perPage));
    $page = min($page, $pages);
    $offset = ($page - 1) * $perPage;
    $items = select_admin_audio($pdo, $where, $params, $order, $perPage, $offset);
    foreach ($items as &$item) unset($item['_relativePath'], $item['_artworkPath']);
    unset($item);
    json_response(true, 'Music catalog loaded.', [
        'items' => $items,
        'pagination' => ['page'=>$page,'perPage'=>$perPage,'total'=>$total,'pages'=>$pages],
    ]);
}

if ($action === 'upload') {
    require_admin_media_mutation();
    ensure_upload_dirs();
    if (empty($_FILES['file']) || !is_array($_FILES['file'])) json_response(false, 'No audio file uploaded.', null, 422);
    $file = $_FILES['file'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) json_response(false, 'Upload failed.', null, 400);
    $maxAudio = 512 * 1024 * 1024;
    if ((int)$file['size'] > $maxAudio) json_response(false, 'Audio file exceeds the 512 MB limit.', null, 413);
    $original = safe_name((string)$file['name']);
    $mime = media_upload_mime((string)$file['tmp_name'], (string)($file['type'] ?? ''));
    $type = media_type($mime, $original);
    if ($type !== 'audio') json_response(false, 'Phase 3 Music Management accepts audio files only.', null, 415);

    $title = trim((string)($_POST['title'] ?? pathinfo($original, PATHINFO_FILENAME))) ?: 'Untitled';
    $artist = trim((string)($_POST['artist'] ?? '')) ?: null;
    $album = trim((string)($_POST['album'] ?? '')) ?: null;
    $genre = trim((string)($_POST['genre'] ?? '')) ?: null;
    $releaseYear = trim((string)($_POST['release_year'] ?? ''));
    $releaseYear = $releaseYear !== '' && preg_match('/^\d{4}$/', $releaseYear) ? (int)$releaseYear : null;
    $language = trim((string)($_POST['language'] ?? '')) ?: null;
    $description = trim((string)($_POST['description'] ?? '')) ?: null;
    $duration = isset($_POST['duration']) && $_POST['duration'] !== '' ? max(0, (float)$_POST['duration']) : null;
    $published = !empty($_POST['published']) ? 1 : 0;
    $featured = !empty($_POST['featured']) ? 1 : 0;
    $trending = !empty($_POST['trending']) ? 1 : 0;

    $stored = bin2hex(random_bytes(12)) . '_' . $original;
    $target = SG_UPLOAD_ROOT . DIRECTORY_SEPARATOR . 'audio' . DIRECTORY_SEPARATOR . $stored;
    if (!move_uploaded_file($file['tmp_name'], $target)) json_response(false, 'Could not store the uploaded audio file.', null, 500);

    $artworkPath = null;
    try {
        if (!empty($_FILES['artwork']) && is_array($_FILES['artwork']) && ($_FILES['artwork']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            $art = $_FILES['artwork'];
            if ((int)$art['size'] > 10 * 1024 * 1024) throw new RuntimeException('Artwork exceeds the 10 MB limit.');
            $artMime = media_upload_mime((string)$art['tmp_name'], (string)($art['type'] ?? ''));
            $allowedArtwork = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'];
            if (!isset($allowedArtwork[$artMime])) throw new RuntimeException('Artwork must be JPG, PNG, WEBP or GIF.');
            $artStored = bin2hex(random_bytes(12)) . '.' . $allowedArtwork[$artMime];
            $artTarget = SG_UPLOAD_ROOT . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . $artStored;
            if (!move_uploaded_file($art['tmp_name'], $artTarget)) throw new RuntimeException('Could not store the artwork.');
            $artworkPath = 'images/' . $artStored;
        }

        $pdo = db();
        $st = $pdo->prepare('INSERT INTO media (user_id,origin,type,title,artist,album,genre,release_year,language,description,filename,stored_name,relative_path,mime_type,size_bytes,duration,artwork_path,is_published,is_featured,is_trending) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $st->execute([current_user_id(), 'official', 'audio', $title, $artist, $album, $genre, $releaseYear, $language, $description, $original, $stored, 'audio/'.$stored, $mime, (int)$file['size'], $duration, $artworkPath, $published, $featured, $trending]);
        $id = (int)$pdo->lastInsertId();
        $pdo->prepare("INSERT INTO analytics_events(event_type,user_id,media_id) VALUES('upload',?,?)")->execute([current_user_id(),$id]);
        $q = $pdo->prepare('SELECT m.*,u.name AS uploader_name,u.email AS uploader_email FROM media m INNER JOIN users u ON u.id=m.user_id WHERE m.id=? LIMIT 1');
        $q->execute([$id]);
        $row = $q->fetch();
        $out = admin_media_row($row);
        unset($out['_relativePath'], $out['_artworkPath']);
        json_response(true, 'Music uploaded.', $out, 201);
    } catch (Throwable $e) {
        @unlink($target);
        if ($artworkPath) @unlink(SG_UPLOAD_ROOT . '/' . $artworkPath);
        if ($e instanceof PDOException) json_response(false, 'Database error while saving the music.', null, 500);
        json_response(false, $e->getMessage(), null, 422);
    }
}

if ($action === 'update') {
    require_admin_media_mutation();
    $data = request_json();
    $id = (int)($data['id'] ?? 0);
    if (!$id) json_response(false, 'Invalid media id.', null, 422);
    $allowed = [
        'title' => static fn($v) => trim((string)$v) ?: 'Untitled',
        'artist' => static fn($v) => trim((string)$v) ?: null,
        'album' => static fn($v) => trim((string)$v) ?: null,
        'genre' => static fn($v) => trim((string)$v) ?: null,
        'release_year' => static fn($v) => ($v!==''&&preg_match('/^\d{4}$/',(string)$v)) ? (int)$v : null,
        'language' => static fn($v) => trim((string)$v) ?: null,
        'description' => static fn($v) => trim((string)$v) ?: null,
        'duration' => static fn($v) => $v === '' || $v === null ? null : max(0, (float)$v),
        'is_published' => static fn($v) => !empty($v) ? 1 : 0,
        'is_featured' => static fn($v) => !empty($v) ? 1 : 0,
        'is_trending' => static fn($v) => !empty($v) ? 1 : 0,
    ];
    $sets=[]; $vals=[];
    foreach ($allowed as $key=>$normalizer) {
        if (array_key_exists($key,$data)) { $sets[] = $key . '=?'; $vals[] = $normalizer($data[$key]); }
    }
    if (!$sets) json_response(false, 'Nothing to update.', null, 422);
    $vals[] = $id;
    $st = db()->prepare('UPDATE media SET ' . implode(',', $sets) . ' WHERE id=? AND type=\'audio\'');
    $st->execute($vals);
    $q = db()->prepare('SELECT m.*,u.name AS uploader_name,u.email AS uploader_email FROM media m INNER JOIN users u ON u.id=m.user_id WHERE m.id=? AND m.type=\'audio\' LIMIT 1');
    $q->execute([$id]);
    $row=$q->fetch(); if(!$row) json_response(false,'Music item not found.',null,404);
    $out=admin_media_row($row); unset($out['_relativePath'],$out['_artworkPath']);
    json_response(true,'Music updated.',$out);
}


if ($action === 'update_artwork') {
    require_admin_media_mutation();
    $id = (int)($_POST['id'] ?? 0);
    if (!$id) json_response(false, 'Invalid media id.', null, 422);
    $pdo = db();
    $q = $pdo->prepare("SELECT artwork_path FROM media WHERE id=? AND type='audio' LIMIT 1");
    $q->execute([$id]);
    $row = $q->fetch();
    if (!$row) json_response(false, 'Music item not found.', null, 404);

    $oldArtwork = !empty($row['artwork_path']) ? (string)$row['artwork_path'] : null;
    $remove = !empty($_POST['remove']);
    $newArtwork = null;

    if (!$remove && !empty($_FILES['artwork']) && is_array($_FILES['artwork']) && ($_FILES['artwork']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
        $art = $_FILES['artwork'];
        if ((int)$art['size'] > 10 * 1024 * 1024) json_response(false, 'Artwork exceeds the 10 MB limit.', null, 413);
        $artMime = media_upload_mime((string)$art['tmp_name'], (string)($art['type'] ?? ''));
        $allowedArtwork = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'];
        if (!isset($allowedArtwork[$artMime])) json_response(false, 'Artwork must be JPG, PNG, WEBP or GIF.', null, 415);
        $artStored = bin2hex(random_bytes(12)) . '.' . $allowedArtwork[$artMime];
        $artTarget = SG_UPLOAD_ROOT . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . $artStored;
        if (!move_uploaded_file($art['tmp_name'], $artTarget)) json_response(false, 'Could not store the artwork.', null, 500);
        $newArtwork = 'images/' . $artStored;
    }

    $nextArtwork = $newArtwork ?? ($remove ? null : $oldArtwork);
    try {
        $st = $pdo->prepare("UPDATE media SET artwork_path=? WHERE id=? AND type='audio'");
        $st->execute([$nextArtwork, $id]);
        if ($newArtwork && $oldArtwork) @unlink(SG_UPLOAD_ROOT . '/' . $oldArtwork);
        if ($remove && $oldArtwork) @unlink(SG_UPLOAD_ROOT . '/' . $oldArtwork);
    } catch (Throwable $e) {
        if ($newArtwork) @unlink(SG_UPLOAD_ROOT . '/' . $newArtwork);
        json_response(false, 'Could not update artwork.', null, 500);
    }
    json_response(true, 'Artwork updated.', ['artworkPath'=>$nextArtwork]);
}

if ($action === 'delete') {
    require_admin_media_mutation();
    $data = request_json();
    $id = (int)($data['id'] ?? 0);
    if (!$id) json_response(false,'Invalid media id.',null,422);
    $pdo=db(); $q=$pdo->prepare('SELECT relative_path,artwork_path FROM media WHERE id=? AND type=\'audio\' LIMIT 1'); $q->execute([$id]); $row=$q->fetch(); if(!$row) json_response(false,'Music item not found.',null,404);
    $pdo->prepare('DELETE FROM media WHERE id=? AND type=\'audio\'')->execute([$id]);
    @unlink(SG_UPLOAD_ROOT . '/' . $row['relative_path']);
    if (!empty($row['artwork_path'])) @unlink(SG_UPLOAD_ROOT . '/' . $row['artwork_path']);
    json_response(true,'Music removed.',['id'=>(string)$id]);
}

if ($action === 'bulk_edit') {
    require_admin_media_mutation();
    $data = request_json();
    $ids = array_values(array_unique(array_filter(array_map('intval', (array)($data['ids'] ?? [])), static fn($id) => $id > 0)));
    if (count($ids) < 3) json_response(false, 'Select at least three music items for bulk edit.', null, 422);

    $sets = [];
    $values = [];
    $fieldMap = [
        'is_published' => 'is_published',
        'is_featured' => 'is_featured',
        'is_trending' => 'is_trending',
    ];
    foreach ($fieldMap as $key => $column) {
        if (array_key_exists($key, $data) && $data[$key] !== null && $data[$key] !== '') {
            $value = filter_var($data[$key], FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 1]]);
            if ($value === false) json_response(false, 'Bulk edit values must be 0 or 1.', null, 422);
            $sets[] = $column . '=?';
            $values[] = $value;
        }
    }
    if (!$sets) json_response(false, 'Choose at least one field to change.', null, 422);

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $pdo = db();
    $st = $pdo->prepare('UPDATE media SET ' . implode(',', $sets) . ' WHERE type=\'audio\' AND id IN (' . $placeholders . ')');
    $st->execute(array_merge($values, $ids));
    json_response(true, 'Bulk edit complete.', ['count' => $st->rowCount()]);
}

if ($action === 'bulk') {
    require_admin_media_mutation();
    $data = request_json();
    $ids = array_values(array_filter(array_map('intval', (array)($data['ids'] ?? [])), static fn($id) => $id > 0));
    $operation = (string)($data['operation'] ?? '');
    if (!$ids) json_response(false,'Select at least one music item.',null,422);
    $operations = [
        'publish' => ['is_published',1], 'unpublish'=>['is_published',0],
        'feature'=>['is_featured',1], 'unfeature'=>['is_featured',0],
        'trend'=>['is_trending',1], 'untrend'=>['is_trending',0],
    ];
    $pdo=db();
    if (isset($operations[$operation])) {
        [$column,$value]=$operations[$operation];
        $placeholders=implode(',',array_fill(0,count($ids),'?'));
        $st=$pdo->prepare("UPDATE media SET {$column}=? WHERE type='audio' AND id IN ({$placeholders})");
        $st->execute(array_merge([$value],$ids));
        json_response(true,'Bulk update complete.',['count'=>$st->rowCount()]);
    }
    if ($operation === 'delete') {
        $placeholders=implode(',',array_fill(0,count($ids),'?'));
        $st=$pdo->prepare("SELECT id,relative_path,artwork_path FROM media WHERE type='audio' AND id IN ({$placeholders})"); $st->execute($ids); $rows=$st->fetchAll();
        $del=$pdo->prepare("DELETE FROM media WHERE type='audio' AND id IN ({$placeholders})"); $del->execute($ids);
        foreach($rows as $row){ @unlink(SG_UPLOAD_ROOT . '/' . $row['relative_path']); if(!empty($row['artwork_path'])) @unlink(SG_UPLOAD_ROOT . '/' . $row['artwork_path']); }
        json_response(true,'Selected music removed.',['count'=>$del->rowCount()]);
    }
    json_response(false,'Unsupported bulk operation.',null,422);
}

json_response(false,'Unknown admin media action.',null,400);
