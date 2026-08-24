<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';
app_boot();

function require_admin_users(): array {
    $id = current_user_id();
    if (!$id) json_response(false, 'Admin authentication required.', null, 401);
    $st = db()->prepare('SELECT id,name,email,phone,address,role,is_active,created_at,updated_at FROM users WHERE id=? LIMIT 1');
    $st->execute([$id]);
    $user = $st->fetch();
    if (!$user || $user['role'] !== 'admin') json_response(false, 'Admin access required.', null, 403);
    return $user;
}

function clean_user_row(array $r): array {
    return [
        'id'=>(int)$r['id'], 'name'=>(string)$r['name'], 'email'=>(string)$r['email'],
        'phone'=>$r['phone'] !== null ? (string)$r['phone'] : '', 'address'=>$r['address'] !== null ? (string)$r['address'] : '',
        'role'=>(string)$r['role'], 'active'=>(bool)$r['is_active'],
        'createdAt'=>strtotime((string)$r['created_at'])*1000, 'updatedAt'=>strtotime((string)$r['updated_at'])*1000,
    ];
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
if ($action === 'list') {
    require_admin_users(); $pdo=db();
    $q=trim((string)($_GET['q']??'')); $role=(string)($_GET['role']??'all'); $status=(string)($_GET['status']??'all');
    if(!in_array($role,['all','user','admin'],true))$role='all'; if(!in_array($status,['all','active','inactive'],true))$status='all';
    $where=['1=1'];$params=[];
    if($q!==''){ $where[]='(name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?)';$n='%'.$q.'%';array_push($params,$n,$n,$n,$n); }
    if($role!=='all'){ $where[]='role=?';$params[]=$role; }
    if($status!=='all'){ $where[]='is_active=?';$params[]=$status==='active'?1:0; }
    $sql='SELECT id,name,email,phone,address,role,is_active,created_at,updated_at FROM users WHERE '.implode(' AND ',$where).' ORDER BY created_at DESC,id DESC';
    $st=$pdo->prepare($sql);$st->execute($params);json_response(true,'Users loaded.',array_map('clean_user_row',$st->fetchAll()));
}
if ($action === 'update') {
    $admin=require_admin_users();require_method('POST');require_csrf('admin_csrf');$d=request_json();$id=(int)($d['id']??0);if($id<1)json_response(false,'Invalid user id.',null,422);
    $name=trim((string)($d['name']??''));$email=strtolower(trim((string)($d['email']??'')));$phone=trim((string)($d['phone']??''));$address=trim((string)($d['address']??''));$role=(string)($d['role']??'user');$active=filter_var($d['active']??true,FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
    if($name==='')json_response(false,'Name is required.',null,422); if(!filter_var($email,FILTER_VALIDATE_EMAIL))json_response(false,'A valid email is required.',null,422); if(!in_array($role,['user','admin'],true))json_response(false,'Invalid role.',null,422); if($active===null)json_response(false,'Invalid account status.',null,422);
    if($id===$admin['id'] && ($role!=='admin' || !$active))json_response(false,'You cannot remove your own administrator access.',null,409);
    $st=db()->prepare('UPDATE users SET name=?,email=?,phone=?,address=?,role=?,is_active=? WHERE id=?');
    try{$st->execute([$name,$email,$phone!==''?$phone:null,$address!==''?$address:null,$role,$active?1:0,$id]);}catch(PDOException $e){if((int)$e->errorInfo[1]===1062)json_response(false,'That email address is already in use.',null,409);throw $e;}
    $q=db()->prepare('SELECT id,name,email,phone,address,role,is_active,created_at,updated_at FROM users WHERE id=?');$q->execute([$id]);$row=$q->fetch();if(!$row)json_response(false,'User not found.',null,404);json_response(true,'User updated.',clean_user_row($row));
}
if ($action === 'delete') {
    $admin=require_admin_users();require_method('POST');require_csrf('admin_csrf');$d=request_json();$id=(int)($d['id']??0);if($id<1)json_response(false,'Invalid user id.',null,422);if($id===$admin['id'])json_response(false,'You cannot delete your own admin account.',null,409);
    $pdo=db(); $st=$pdo->prepare('SELECT id FROM users WHERE id=? LIMIT 1');$st->execute([$id]);if(!$st->fetch())json_response(false,'User not found.',null,404);
    $mediaSt=$pdo->prepare("SELECT relative_path,artwork_path FROM media WHERE user_id=?");$mediaSt->execute([$id]);$files=$mediaSt->fetchAll();
    $pdo->beginTransaction(); try{$pdo->prepare('DELETE FROM users WHERE id=?')->execute([$id]);$pdo->commit();}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
    foreach($files as $f){if(!empty($f['relative_path']))@unlink(SG_UPLOAD_ROOT.'/'.$f['relative_path']);if(!empty($f['artwork_path']))@unlink(SG_UPLOAD_ROOT.'/'.$f['artwork_path']);}
    json_response(true,'User deleted.',['id'=>$id]);
}
json_response(false,'Unknown admin user action.',null,400);
