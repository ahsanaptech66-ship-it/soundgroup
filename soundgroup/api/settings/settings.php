<?php
declare(strict_types=1); require_once __DIR__.'/../../config/config.php'; app_boot(); $userId=require_auth(); $action=$_GET['action']??$_POST['action']??''; $pdo=db();
if($action==='get'){ $st=$pdo->prepare('SELECT settings_json FROM settings WHERE user_id=?');$st->execute([$userId]);$row=$st->fetch();$data=$row?json_decode($row['settings_json'],true):[];json_response(true,'Settings',is_array($data)?$data:[]); }
if($action==='save'){ require_method('POST');$d=request_json();$json=json_encode($d,JSON_UNESCAPED_SLASHES);$st=$pdo->prepare('INSERT INTO settings(user_id,settings_json) VALUES(?,?) ON DUPLICATE KEY UPDATE settings_json=VALUES(settings_json),updated_at=CURRENT_TIMESTAMP');$st->execute([$userId,$json]);json_response(true,'Settings saved',$d); }
json_response(false,'Unknown settings action.',null,400);
