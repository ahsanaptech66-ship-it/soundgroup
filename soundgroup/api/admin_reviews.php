<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';
app_boot();
function require_admin_reviews(): array { $id=current_user_id();if(!$id)json_response(false,'Admin authentication required.',null,401);$st=db()->prepare('SELECT id,role,is_active FROM users WHERE id=?');$st->execute([$id]);$u=$st->fetch();if(!$u||$u['role']!=='admin'||!(int)$u['is_active'])json_response(false,'Admin access required.',null,403);return $u; }
$action=$_GET['action']??$_POST['action']??'';
if($action==='list'){require_admin_reviews();$q=trim((string)($_GET['q']??''));$where='1=1';$params=[];if($q!==''){$where='(r.body LIKE ? OR u.name LIKE ? OR m.title LIKE ?)';$n='%'.$q.'%';$params=[$n,$n,$n];}$st=db()->prepare("SELECT r.id,r.body,r.created_at,r.updated_at,u.id user_id,u.name user_name,u.email user_email,m.id media_id,m.title media_title FROM reviews r INNER JOIN users u ON u.id=r.user_id INNER JOIN media m ON m.id=r.media_id WHERE {$where} ORDER BY r.created_at DESC LIMIT 200");$st->execute($params);json_response(true,'Reviews loaded.',$st->fetchAll());}
if($action==='delete'){require_admin_reviews();require_method('POST');require_csrf('admin_csrf');$d=request_json();$id=(int)($d['id']??0);if($id<1)json_response(false,'Invalid review.',null,422);$st=db()->prepare('DELETE FROM reviews WHERE id=?');$st->execute([$id]);json_response(true,'Review removed.',['count'=>$st->rowCount()]);}
json_response(false,'Unknown admin review action.',null,400);
