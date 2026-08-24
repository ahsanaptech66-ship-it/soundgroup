<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';
app_boot();
function require_analytics_admin(): array { $id=current_user_id();if(!$id)json_response(false,'Admin authentication required.',null,401);$st=db()->prepare('SELECT id,name,email,role,is_active FROM users WHERE id=?');$st->execute([$id]);$u=$st->fetch();if(!$u||$u['role']!=='admin'||!(int)$u['is_active'])json_response(false,'Admin access required.',null,403);return $u; }
$action=$_GET['action']??$_POST['action']??'';
if($action==='track'){
 require_method('POST');$d=request_json();$type=(string)($d['eventType']??'');$allowed=['play','view','favorite_add','favorite_remove','upload','history'];if(!in_array($type,$allowed,true))json_response(false,'Unsupported analytics event.',null,422);$userId=current_user_id();$mediaId=isset($d['mediaId'])?(int)$d['mediaId']:null;$value=isset($d['value'])?max(0,(float)$d['value']):null;$meta=isset($d['meta'])&&is_array($d['meta'])?json_encode($d['meta'],JSON_UNESCAPED_SLASHES):null;if($mediaId){$st=db()->prepare('SELECT id FROM media WHERE id=? LIMIT 1');$st->execute([$mediaId]);if(!$st->fetch())$mediaId=null;}db()->prepare('INSERT INTO analytics_events(event_type,user_id,media_id,value,meta_json) VALUES(?,?,?,?,?)')->execute([$type,$userId,$mediaId,$value,$meta]);json_response(true,'Event tracked.');
}
if($action==='summary'){
 require_analytics_admin();$pdo=db();$days=max(1,min(365,(int)($_GET['days']??30)));$from=(new DateTimeImmutable('today'))->modify('-'.($days-1).' days')->format('Y-m-d 00:00:00');
 $events=$pdo->prepare('SELECT event_type,COUNT(*) c FROM analytics_events WHERE created_at>=? GROUP BY event_type ORDER BY c DESC');$events->execute([$from]);$totals=[];foreach($events->fetchAll() as $r)$totals[$r['event_type']]=(int)$r['c'];
 $daily=$pdo->prepare("SELECT DATE(created_at) day, SUM(event_type='play') plays, SUM(event_type='view') views, SUM(event_type='favorite_add') favorites, SUM(event_type='upload') uploads FROM analytics_events WHERE created_at>=? GROUP BY DATE(created_at) ORDER BY day ASC");$daily->execute([$from]);
 $top=$pdo->prepare("SELECT m.id,m.title,m.artist,m.type,COUNT(e.id) events FROM analytics_events e INNER JOIN media m ON m.id=e.media_id WHERE e.created_at>=? AND e.event_type IN ('play','view') GROUP BY m.id,m.title,m.artist,m.type ORDER BY events DESC,m.title ASC LIMIT 10");$top->execute([$from]);
 $users=(int)$pdo->query("SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE created_at>=CURDATE() AND user_id IS NOT NULL")->fetchColumn();
 json_response(true,'Analytics summary',['days'=>$days,'totals'=>$totals,'daily'=>$daily->fetchAll(),'top_content'=>$top->fetchAll(),'active_users_today'=>$users]);
}
json_response(false,'Unknown analytics action.',null,400);
