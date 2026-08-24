<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config/config.php';
app_boot();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$userId = current_user_id();

function media_row(array $r): array {
    return [
        'id'=>(string)$r['id'], 'origin'=>(string)($r['origin'] ?? 'user'), 'type'=>$r['type'], 'title'=>$r['title'], 'artist'=>$r['artist'], 'album'=>$r['album'],
        'genre'=>$r['genre'], 'releaseYear'=>$r['release_year']!==null?(int)$r['release_year']:null, 'language'=>$r['language']!==null?(string)$r['language']:null, 'description'=>$r['description'], 'filename'=>$r['filename'], 'mimeType'=>$r['mime_type'],
        'size'=>(int)$r['size_bytes'], 'duration'=>$r['duration']!==null?(float)$r['duration']:null,
        'browserPlayable'=>(bool)$r['browser_playable'],
        'artworkUrl'=>!empty($r['artwork_path']) ? SG_UPLOAD_URL . '/' . implode('/', array_map('rawurlencode', explode('/', trim((string)$r['artwork_path'], '/')))) : null,
        'published'=>(bool)($r['is_published'] ?? 0), 'featured'=>(bool)($r['is_featured'] ?? 0), 'trending'=>(bool)($r['is_trending'] ?? 0),
        'addedAt'=>strtotime($r['created_at'])*1000,
        'updatedAt'=>strtotime($r['updated_at'])*1000, 'mediaUrl'=>SG_UPLOAD_URL . '/' . $r['type'] . '/' . rawurlencode($r['stored_name']),
        'streamUrl'=>SG_UPLOAD_URL . '/' . $r['type'] . '/' . rawurlencode($r['stored_name']),
    ];
}

if ($action === 'discover') {
    // Discover is the official SOUNDGROUP catalog only.
    // Admin-published media is included; user uploads are excluded by role join.
    $pdo = db();
    $st = $pdo->query("SELECT m.*
        FROM media m
        INNER JOIN users u ON u.id = m.user_id
        WHERE m.type IN ('audio','video')
          AND m.is_published = 1
          AND m.origin = 'official'
        ORDER BY m.is_featured DESC, m.is_trending DESC, m.created_at DESC, m.id DESC");
    $catalogRows = array_map('media_row', $st->fetchAll());
    $music = array_values(array_filter($catalogRows, static fn(array $m): bool => $m['type'] === 'audio'));
    $videos = array_values(array_filter($catalogRows, static fn(array $m): bool => $m['type'] === 'video'));
    $featured = array_values(array_filter($catalogRows, static fn(array $m): bool => $m['featured']));
    $trendingMusic = array_values(array_filter($music, static fn(array $m): bool => $m['trending']));
    $trendingVideos = array_values(array_filter($videos, static fn(array $m): bool => $m['trending']));
    $genres = [];
    foreach ($music as $item) {
        $genre = trim((string)($item['genre'] ?? ''));
        if ($genre !== '') $genres[$genre] = ($genres[$genre] ?? 0) + 1;
    }
    arsort($genres);
    $genreList = [];
    foreach ($genres as $name => $count) $genreList[] = ['name'=>$name,'count'=>(int)$count];
    $view = strtolower((string)($_GET['view'] ?? 'all'));
    if (!in_array($view, ['all','music','videos'], true)) $view = 'all';
    json_response(true, 'Published SOUNDGROUP catalog', [
        'view' => $view,
        'items' => $catalogRows,
        'all' => [
            'featured' => array_slice($featured, 0, 8),
            'trendingMusic' => array_slice($trendingMusic, 0, 12),
            'trendingVideos' => array_slice($trendingVideos, 0, 12),
            'newMusic' => array_slice($music, 0, 12),
            'latestVideos' => array_slice($videos, 0, 12),
        ],
        'music' => [
            'featured' => array_slice(array_values(array_filter($featured, static fn(array $m): bool => $m['type'] === 'audio')), 0, 8),
            'trending' => array_slice($trendingMusic, 0, 12),
            'newReleases' => array_slice($music, 0, 24),
            'genres' => $genreList,
        ],
        'videos' => [
            'featured' => array_slice(array_values(array_filter($featured, static fn(array $m): bool => $m['type'] === 'video')), 0, 8),
            'trending' => array_slice($trendingVideos, 0, 12),
            'latest' => array_slice($videos, 0, 24),
        ],
        'counts' => ['total'=>count($catalogRows),'music'=>count($music),'videos'=>count($videos)],
    ]);
}

if ($action === 'list') {
    // Public Music / Watch are user-library views only.
    // Admin uploads stay out of these views and are surfaced through Discover.
    if ($userId) {
        $st = db()->prepare("SELECT m.*
            FROM media m
            INNER JOIN users u ON u.id = m.user_id
            WHERE m.user_id = ? AND m.origin = 'user'
            ORDER BY m.created_at DESC, m.id DESC");
        $st->execute([$userId]);
    } else {
        $st = db()->query("SELECT * FROM media WHERE 1=0");
    }
    json_response(true,'User media library',array_map('media_row',$st->fetchAll()));
}

if ($action === 'upload') {
    $userId = require_auth();
    require_method('POST'); ensure_upload_dirs();
    if (empty($_FILES['file']) || !is_array($_FILES['file'])) json_response(false,'No file uploaded.',null,422);
    $file=$_FILES['file'];
    if ($file['error']!==UPLOAD_ERR_OK) json_response(false,'Upload failed.',null,400);
    $max=512*1024*1024;
    if ((int)$file['size']>$max) json_response(false,'File exceeds the 512 MB upload limit.',null,413);
    $original=safe_name((string)$file['name']);
    $mime='application/octet-stream';
    if (class_exists('finfo')) {
      $finfo=new finfo(FILEINFO_MIME_TYPE);
      $detected=$finfo->file($file['tmp_name']);
      if ($detected) $mime=$detected;
    } elseif (!empty($file['type'])) {
      $mime=(string)$file['type'];
    }
    $type=media_type($mime,$original);

    $title=trim((string)($_POST['title'] ?? pathinfo($original,PATHINFO_FILENAME))) ?: 'Untitled';
    $artist=trim((string)($_POST['artist'] ?? '')) ?: null;
    $album=trim((string)($_POST['album'] ?? '')) ?: null;
    $genre=trim((string)($_POST['genre'] ?? '')) ?: null;
    $releaseYear=trim((string)($_POST['release_year'] ?? ''));
    $releaseYear=$releaseYear!==''&&preg_match('/^\d{4}$/',$releaseYear)?(int)$releaseYear:null;
    $language=trim((string)($_POST['language'] ?? '')) ?: null;
    $description=trim((string)($_POST['description'] ?? '')) ?: null;
    $duration=isset($_POST['duration']) && $_POST['duration']!=='' ? max(0,(float)$_POST['duration']) : null;
    $stored=bin2hex(random_bytes(12)) . '_' . $original;
    $target=SG_UPLOAD_ROOT . DIRECTORY_SEPARATOR . $type . DIRECTORY_SEPARATOR . $stored;
    if (!move_uploaded_file($file['tmp_name'],$target)) json_response(false,'Could not store the uploaded file.',null,500);
    $rel=$type.'/'.$stored;
    $pdo=db();
    try {
      $st=$pdo->prepare('INSERT INTO media (user_id,origin,type,title,artist,album,genre,release_year,language,description,filename,stored_name,relative_path,mime_type,size_bytes,duration) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
      $st->execute([$userId,'user',$type,$title,$artist,$album,$genre,$releaseYear,$language,$description,$original,$stored,$rel,$mime,(int)$file['size'],$duration]);
      $id=(int)$pdo->lastInsertId();
      $pdo->prepare("INSERT INTO analytics_events(event_type,user_id,media_id) VALUES('upload',?,?)")->execute([$userId,$id]);
      $q=$pdo->prepare("SELECT * FROM media WHERE id=? AND user_id=? AND origin='user'"); $q->execute([$id,$userId]);
      json_response(true,'Media uploaded',media_row($q->fetch()),201);
    } catch(Throwable $e){ @unlink($target); json_response(false,'Database error while saving the media.',null,500); }
}

if ($action === 'update') {
    $userId = require_auth();
    require_method('POST'); $data=request_json(); $id=(int)($data['id'] ?? 0); if(!$id) json_response(false,'Invalid media id.',null,422);
    $allowed=['title','artist','album','genre','release_year','language','description','duration']; $sets=[];$vals=[];
    foreach($allowed as $key){ if(array_key_exists($key,$data)){ $sets[] = "$key = ?"; $vals[] = $data[$key] === '' ? null : $data[$key]; }}
    if(!$sets) json_response(false,'Nothing to update.',null,422); $vals[]=$id; $vals[]=$userId;
    $st=db()->prepare("UPDATE media SET ".implode(',',$sets)." WHERE id=? AND user_id=? AND origin='user'"); $st->execute($vals);
    $q=db()->prepare("SELECT * FROM media WHERE id=? AND user_id=? AND origin='user'"); $q->execute([$id,$userId]); $row=$q->fetch(); if(!$row)json_response(false,'Media not found.',null,404);
    json_response(true,'Media updated',media_row($row));
}

if ($action === 'delete') {
    $userId = require_auth();
    require_method('POST'); $data=request_json(); $id=(int)($data['id'] ?? 0); if(!$id)json_response(false,'Invalid media id.',null,422);
    $pdo=db(); $q=$pdo->prepare("SELECT * FROM media WHERE id=? AND user_id=? AND origin='user'");$q->execute([$id,$userId]);$row=$q->fetch();if(!$row)json_response(false,'Media not found.',null,404);
    $pdo->prepare("DELETE FROM media WHERE id=? AND user_id=? AND origin='user'")->execute([$id,$userId]); @unlink(SG_UPLOAD_ROOT.'/'.$row['relative_path']);
    json_response(true,'Media removed');
}

if ($action === 'clear') {
    $userId = require_auth();
    require_method('POST'); $pdo=db();$q=$pdo->prepare("SELECT relative_path FROM media WHERE user_id=? AND origin='user'");$q->execute([$userId]);$files=$q->fetchAll();
    $pdo->prepare("DELETE FROM media WHERE user_id=? AND origin='user'")->execute([$userId]); foreach($files as $f) @unlink(SG_UPLOAD_ROOT.'/'.$f['relative_path']); json_response(true,'Media library cleared');
}

json_response(false,'Unknown media action.',null,400);
