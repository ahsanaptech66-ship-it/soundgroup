<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';
app_boot();
function require_admin_site(): array { $id=current_user_id(); if(!$id)json_response(false,'Admin authentication required.',null,401); $st=db()->prepare('SELECT id,name,email,role,is_active FROM users WHERE id=?');$st->execute([$id]);$u=$st->fetch();if(!$u||$u['role']!=='admin'||!(int)$u['is_active'])json_response(false,'Admin access required.',null,403);return $u; }
$action=$_GET['action']??$_POST['action']??'';
if($action==='get'){
  $rows=db()->query('SELECT setting_key,setting_value FROM site_settings ORDER BY setting_key')->fetchAll();$out=[];foreach($rows as $r)$out[$r['setting_key']]=$r['setting_value'];json_response(true,'Site settings',$out);
}
if($action==='save'){
  require_admin_site();require_method('POST');require_csrf('admin_csrf');$d=request_json();$allowed=['site_name','site_tagline','about_text','contact_text'];$pdo=db();$st=$pdo->prepare('INSERT INTO site_settings(setting_key,setting_value) VALUES(?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),updated_at=CURRENT_TIMESTAMP');foreach($allowed as $k){if(array_key_exists($k,$d)){ $v=trim((string)$d[$k]); if($k==='site_name'&&$v==='')json_response(false,'Site name is required.',null,422);$st->execute([$k,$v]); }}json_response(true,'Site information saved.');
}
json_response(false,'Unknown site action.',null,400);
