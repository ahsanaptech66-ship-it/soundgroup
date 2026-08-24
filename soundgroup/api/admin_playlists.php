<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';
app_boot();
$action=$_GET['action']??$_POST['action']??'';
function require_admin_playlist_api(): array {
  $id=current_user_id(); if(!$id) json_response(false,'Admin authentication required.',null,401);
  $st=db()->prepare('SELECT id,name,email,role FROM users WHERE id=? LIMIT 1');$st->execute([$id]);$user=$st->fetch();
  if(!$user||$user['role']!=='admin')json_response(false,'Admin access required.',null,403);return $user;
}
require_admin_playlist_api();$pdo=db();
if($action==='list'){
  require_method('GET');
  $q=$pdo->query('SELECT p.id,p.name,p.created_at,p.updated_at,u.id user_id,u.name user_name,u.email user_email,COUNT(pi.media_id) item_count FROM playlists p INNER JOIN users u ON u.id=p.user_id LEFT JOIN playlist_items pi ON pi.playlist_id=p.id GROUP BY p.id,p.name,p.created_at,p.updated_at,u.id,u.name,u.email ORDER BY p.updated_at DESC,p.id DESC');
  json_response(true,'Playlists loaded.',$q->fetchAll());
}
if($action==='delete'){
  require_method('POST');require_csrf('admin_csrf');$d=request_json();$id=(int)($d['id']??0);
  if($id<1)json_response(false,'Playlist id is required.',null,422);
  $st=$pdo->prepare('DELETE FROM playlists WHERE id=?');$st->execute([$id]);if($st->rowCount()===0)json_response(false,'Playlist not found.',null,404);
  json_response(true,'Playlist deleted.');
}
json_response(false,'Unknown admin playlist action.',null,400);
