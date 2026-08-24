<?php
declare(strict_types=1);
require_once __DIR__.'/../../config/config.php';
app_boot();
$userId=require_auth();
$action=$_GET['action']??$_POST['action']??'';
$pdo=db();

if($action==='list'){
  $st=$pdo->prepare('SELECT id,name,UNIX_TIMESTAMP(created_at)*1000 createdAt,UNIX_TIMESTAMP(updated_at)*1000 updatedAt FROM playlists WHERE user_id=? ORDER BY updated_at DESC,id DESC');
  $st->execute([$userId]);
  $rows=$st->fetchAll();
  foreach($rows as &$p){
    $q=$pdo->prepare('SELECT media_id FROM playlist_items WHERE playlist_id=? ORDER BY position,media_id');
    $q->execute([$p['id']]);
    $p['id']=(string)$p['id'];
    $p['items']=array_map(fn($r)=>(string)$r['media_id'],$q->fetchAll());
  }
  json_response(true,'Playlists',array_values($rows));
}
if($action==='create'){
  require_method('POST');
  $d=request_json();$name=trim((string)($d['name']??''));
  if($name==='')json_response(false,'Playlist name is required.',null,422);
  if(mb_strlen($name)>180)json_response(false,'Playlist name is too long.',null,422);
  $st=$pdo->prepare('INSERT INTO playlists(user_id,name) VALUES(?,?)');$st->execute([$userId,$name]);
  json_response(true,'Playlist created',['id'=>(string)$pdo->lastInsertId(),'name'=>$name,'items'=>[],'createdAt'=>time()*1000],201);
}
if($action==='rename'){
  require_method('POST');
  $d=request_json();$id=(int)($d['id']??0);$name=trim((string)($d['name']??''));
  if($id<1||$name==='')json_response(false,'Playlist id and name are required.',null,422);
  if(mb_strlen($name)>180)json_response(false,'Playlist name is too long.',null,422);
  $st=$pdo->prepare('UPDATE playlists SET name=? WHERE id=? AND user_id=?');$st->execute([$name,$id,$userId]);
  if($st->rowCount()===0)json_response(false,'Playlist not found.',null,404);
  json_response(true,'Playlist renamed',['id'=>(string)$id,'name'=>$name]);
}
if($action==='delete'){
  require_method('POST');
  $d=request_json();$id=(int)($d['id']??0);
  if($id<1)json_response(false,'Playlist id is required.',null,422);
  $st=$pdo->prepare('DELETE FROM playlists WHERE id=? AND user_id=?');$st->execute([$id,$userId]);
  if($st->rowCount()===0)json_response(false,'Playlist not found.',null,404);
  json_response(true,'Playlist deleted');
}
if($action==='add'){
  require_method('POST');
  $d=request_json();$pid=(int)($d['playlistId']??0);$mid=(int)($d['mediaId']??0);
  if($pid<1||$mid<1)json_response(false,'Playlist and media ids are required.',null,422);
  $q=$pdo->prepare('SELECT 1 FROM playlists WHERE id=? AND user_id=?');$q->execute([$pid,$userId]);if(!$q->fetch())json_response(false,'Playlist not found.',null,404);
  $m=$pdo->prepare("SELECT id FROM media WHERE id=? AND type='audio' AND ((origin='official' AND is_published=1) OR (origin='user' AND user_id=?)) LIMIT 1");$m->execute([$mid,$userId]);if(!$m->fetch())json_response(false,'This audio is not available to add to your playlist.',null,403);
  $exists=$pdo->prepare('SELECT 1 FROM playlist_items WHERE playlist_id=? AND media_id=?');$exists->execute([$pid,$mid]);if($exists->fetch())json_response(false,'Track is already in this playlist.',null,409);
  $pos=$pdo->prepare('SELECT COALESCE(MAX(position),-1)+1 p FROM playlist_items WHERE playlist_id=?');$pos->execute([$pid]);$position=(int)$pos->fetch()['p'];
  $st=$pdo->prepare('INSERT INTO playlist_items(playlist_id,media_id,position) VALUES(?,?,?)');$st->execute([$pid,$mid,$position]);
  $pdo->prepare('UPDATE playlists SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?')->execute([$pid,$userId]);
  json_response(true,'Added to playlist');
}
if($action==='remove'){
  require_method('POST');
  $d=request_json();$pid=(int)($d['playlistId']??0);$mid=(int)($d['mediaId']??0);
  if($pid<1||$mid<1)json_response(false,'Playlist and media ids are required.',null,422);
  $st=$pdo->prepare('DELETE pi FROM playlist_items pi INNER JOIN playlists p ON p.id=pi.playlist_id WHERE pi.playlist_id=? AND pi.media_id=? AND p.user_id=?');$st->execute([$pid,$mid,$userId]);
  if($st->rowCount()===0)json_response(false,'Track was not found in this playlist.',null,404);
  $pdo->prepare('UPDATE playlists SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?')->execute([$pid,$userId]);
  json_response(true,'Track removed');
}
if($action==='reorder'){
  require_method('POST');
  $d=request_json();$pid=(int)($d['id']??0);$items=$d['items']??[];
  if($pid<1||!is_array($items))json_response(false,'Playlist id and item order are required.',null,422);
  $q=$pdo->prepare('SELECT pi.media_id FROM playlist_items pi INNER JOIN playlists p ON p.id=pi.playlist_id WHERE pi.playlist_id=? AND p.user_id=? ORDER BY pi.position,pi.media_id');$q->execute([$pid,$userId]);$existing=array_map(fn($r)=>(string)$r['media_id'],$q->fetchAll());
  $normalized=array_values(array_map('strval',$items));
  if(count($normalized)!==count($existing)||count(array_unique($normalized))!==count($normalized)||array_diff($existing,$normalized)||array_diff($normalized,$existing))json_response(false,'Playlist order does not match its current tracks.',null,422);
  $pdo->beginTransaction();
  try{
    $st=$pdo->prepare('UPDATE playlist_items SET position=? WHERE playlist_id=? AND media_id=?');
    foreach($normalized as $position=>$mid)$st->execute([$position,$pid,(int)$mid]);
    $pdo->prepare('UPDATE playlists SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?')->execute([$pid,$userId]);
    $pdo->commit();
  }catch(Throwable $e){$pdo->rollBack();throw $e;}
  json_response(true,'Playlist order updated');
}
json_response(false,'Unknown playlist action.',null,400);
