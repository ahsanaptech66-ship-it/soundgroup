<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';
app_boot();
function require_admin_content(): array { $id=current_user_id();if(!$id)json_response(false,'Admin authentication required.',null,401);$st=db()->prepare('SELECT id,role,is_active FROM users WHERE id=?');$st->execute([$id]);$u=$st->fetch();if(!$u||$u['role']!=='admin'||!(int)$u['is_active'])json_response(false,'Admin access required.',null,403);return $u; }
$action=$_GET['action']??$_POST['action']??'';
if($action==='list'){
 require_admin_content();$type=(string)($_GET['type']??'genre');if(!in_array($type,['genre','language','year','artist','album'],true))$type='genre';$st=db()->prepare('SELECT id,category_type,name,created_at FROM categories WHERE category_type=? ORDER BY name COLLATE utf8mb4_unicode_ci ASC');$st->execute([$type]);json_response(true,'Categories loaded.', $st->fetchAll());
}
if($action==='all'){
 require_admin_content();$rows=db()->query('SELECT id,category_type,name,created_at FROM categories ORDER BY category_type,name COLLATE utf8mb4_unicode_ci')->fetchAll();json_response(true,'All categories loaded.',$rows);
}
if($action==='save'){
 require_admin_content();require_method('POST');require_csrf('admin_csrf');$d=request_json();$type=(string)($d['type']??'');$name=trim((string)($d['name']??''));if(!in_array($type,['genre','language','year','artist','album'],true))json_response(false,'Invalid category type.',null,422);if($name==='')json_response(false,'Category name is required.',null,422);if($type==='year'&&!preg_match('/^\d{4}$/',$name))json_response(false,'Year must be four digits.',null,422);$st=db()->prepare('INSERT INTO categories(category_type,name) VALUES(?,?)');try{$st->execute([$type,$name]);}catch(PDOException $e){if((int)$e->errorInfo[1]===1062)json_response(false,'That category already exists.',null,409);throw $e;}json_response(true,'Category created.',['id'=>(int)db()->lastInsertId(),'type'=>$type,'name'=>$name]);
}
if($action==='delete'){
 require_admin_content();require_method('POST');require_csrf('admin_csrf');$d=request_json();$id=(int)($d['id']??0);if($id<1)json_response(false,'Invalid category id.',null,422);db()->prepare('DELETE FROM categories WHERE id=?')->execute([$id]);json_response(true,'Category removed.',['id'=>$id]);
}
json_response(false,'Unknown content action.',null,400);
