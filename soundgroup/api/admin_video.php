<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';

app_boot();

function require_admin_video(): array {
    $id = current_user_id();
    if (!$id) json_response(false, 'Admin authentication required.', null, 401);
    $st = db()->prepare('SELECT id,name,email,role,is_active,created_at FROM users WHERE id=? LIMIT 1');
    $st->execute([$id]);
    $user = $st->fetch();
    if (!$user || $user['role'] !== 'admin' || !(bool)$user['is_active']) json_response(false, 'Admin access required.', null, 403);
    return $user;
}
function require_admin_video_mutation(): array {
    $user = require_admin_video(); require_method('POST'); require_csrf('admin_csrf'); return $user;
}
function video_mime(string $tmp, string $fallback=''): string {
    $mime='application/octet-stream';
    if (class_exists('finfo')) { $f=new finfo(FILEINFO_MIME_TYPE); $det=$f->file($tmp); if ($det) $mime=strtolower($det); }
    elseif ($fallback!=='') $mime=strtolower($fallback);
    return $mime;
}
function video_row(array $r): array {
    $path=SG_UPLOAD_URL . '/video/' . rawurlencode((string)$r['stored_name']);
    $artwork=null;
    if (!empty($r['artwork_path'])) $artwork=SG_UPLOAD_URL . '/' . implode('/', array_map('rawurlencode', explode('/', trim((string)$r['artwork_path'],'/'))));
    return [
        'id'=>(string)$r['id'],'origin'=>(string)($r['origin'] ?? 'official'),'type'=>'video','title'=>(string)$r['title'],'artist'=>$r['artist'],'album'=>$r['album'],'genre'=>$r['genre'],'releaseYear'=>$r['release_year']!==null?(int)$r['release_year']:null,'language'=>$r['language']!==null?(string)$r['language']:null,'description'=>$r['description'],
        'filename'=>(string)$r['filename'],'mimeType'=>$r['mime_type'],'size'=>(int)$r['size_bytes'],'duration'=>$r['duration']!==null?(float)$r['duration']:null,
        'browserPlayable'=>(bool)$r['browser_playable'],'artworkUrl'=>$artwork,'published'=>(bool)$r['is_published'],'featured'=>(bool)$r['is_featured'],'trending'=>(bool)$r['is_trending'],
        'createdAt'=>$r['created_at'],'updatedAt'=>$r['updated_at'],'uploader'=>['id'=>(string)$r['user_id'],'name'=>(string)($r['uploader_name']??''),'email'=>(string)($r['uploader_email']??'')],
        'mediaUrl'=>$path,'streamUrl'=>$path,'_relativePath'=>(string)$r['relative_path'],'_artworkPath'=>$r['artwork_path']?(string)$r['artwork_path']:null,
    ];
}
function select_videos(PDO $pdo,string $where,array $params,string $order,int $limit,int $offset): array {
    $sql="SELECT m.*,u.name AS uploader_name,u.email AS uploader_email FROM media m INNER JOIN users u ON u.id=m.user_id WHERE m.type='video'";
    if ($where!=='') $sql.=' AND '.$where;
    $sql.=' ORDER BY '.$order.' LIMIT '.(int)$limit.' OFFSET '.(int)$offset;
    $st=$pdo->prepare($sql); $st->execute($params); return array_map('video_row',$st->fetchAll());
}
$action=$_GET['action']??$_POST['action']??'';

if ($action==='list') {
    require_admin_video(); $pdo=db();
    $q=trim((string)($_GET['q']??'')); $sort=(string)($_GET['sort']??'created'); $dir=strtolower((string)($_GET['dir']??'desc'))==='asc'?'ASC':'DESC';
    $status=(string)($_GET['status']??'all'); $flag=(string)($_GET['flag']??'all'); $page=max(1,(int)($_GET['page']??1)); $perPage=min(50,max(10,(int)($_GET['perPage']??25)));
    $allowed=['created'=>'m.created_at','updated'=>'m.updated_at','title'=>'m.title','artist'=>'m.artist','genre'=>'m.genre','year'=>'m.release_year','language'=>'m.language','size'=>'m.size_bytes','duration'=>'m.duration'];
    $order=($allowed[$sort]??$allowed['created']).' '.$dir.', m.id DESC'; $conditions=[];$params=[];
    if($q!==''){ $needle='%'.$q.'%'; $conditions[]='(m.title LIKE ? OR m.artist LIKE ? OR m.album LIKE ? OR m.genre LIKE ? OR CAST(m.release_year AS CHAR) LIKE ? OR m.language LIKE ? OR m.filename LIKE ?)'; $params=[$needle,$needle,$needle,$needle,$needle,$needle,$needle]; }
    if($status==='published')$conditions[]='m.is_published=1'; if($status==='draft')$conditions[]='m.is_published=0'; if($flag==='featured')$conditions[]='m.is_featured=1'; if($flag==='trending')$conditions[]='m.is_trending=1';
    $where=implode(' AND ',$conditions); $count=$pdo->prepare("SELECT COUNT(*) FROM media m WHERE m.type='video'".($where?' AND '.$where:'')); $count->execute($params); $total=(int)$count->fetchColumn();
    $pages=max(1,(int)ceil($total/$perPage)); $page=min($page,$pages); $offset=($page-1)*$perPage; $items=select_videos($pdo,$where,$params,$order,$perPage,$offset);
    foreach($items as &$item){unset($item['_relativePath'],$item['_artworkPath']);} unset($item);
    json_response(true,'Video catalog loaded.',['items'=>$items,'pagination'=>['page'=>$page,'perPage'=>$perPage,'total'=>$total,'pages'=>$pages]]);
}

if ($action==='upload') {
    require_admin_video_mutation(); ensure_upload_dirs();
    if(empty($_FILES['file'])||!is_array($_FILES['file'])){
        // If the browser sent a body but PHP dropped it, the file exceeded
        // post_max_size and PHP clears $_POST/$_FILES before we ever see them.
        $contentLength=(int)($_SERVER['CONTENT_LENGTH']??0);
        if($contentLength>0 && empty($_POST)) json_response(false,'The video is larger than this server currently allows (post_max_size). Ask your host to raise upload_max_filesize/post_max_size, or upload a smaller file.',null,413);
        json_response(false,'No video file uploaded.',null,422);
    }
    $file=$_FILES['file'];
    $uploadErr=(int)($file['error']??UPLOAD_ERR_NO_FILE);
    if($uploadErr!==UPLOAD_ERR_OK){
        $errorMessages=[
            UPLOAD_ERR_INI_SIZE=>'The video exceeds this server\'s upload_max_filesize setting. Ask your host to raise it or upload a smaller file.',
            UPLOAD_ERR_FORM_SIZE=>'The video exceeds the maximum upload size allowed by the form.',
            UPLOAD_ERR_PARTIAL=>'The video was only partially uploaded. Please try again.',
            UPLOAD_ERR_NO_FILE=>'No video file uploaded.',
            UPLOAD_ERR_NO_TMP_DIR=>'Server is missing a temporary folder for uploads.',
            UPLOAD_ERR_CANT_WRITE=>'Server failed to write the uploaded video to disk.',
            UPLOAD_ERR_EXTENSION=>'A server extension blocked this upload.',
        ];
        json_response(false,$errorMessages[$uploadErr]??'Upload failed.',null,$uploadErr===UPLOAD_ERR_INI_SIZE||$uploadErr===UPLOAD_ERR_FORM_SIZE?413:400);
    }
    if((int)$file['size']>1024*1024*1024)json_response(false,'Video file exceeds the 1 GB limit.',null,413);
    $original=safe_name((string)$file['name']); $mime=video_mime((string)$file['tmp_name'],(string)($file['type']??'')); $type=video_upload_type($mime,$original);
    if($type!=='video')json_response(false,'This file is not recognized as a supported video.',null,415);
    $title=trim((string)($_POST['title']??pathinfo($original,PATHINFO_FILENAME)))?:'Untitled'; $artist=trim((string)($_POST['artist']??''))?:null; $album=trim((string)($_POST['album']??''))?:null; $genre=trim((string)($_POST['genre']??''))?:null;
    $releaseYear=trim((string)($_POST['release_year']??''));$releaseYear=$releaseYear!==''&&preg_match('/^\d{4}$/',$releaseYear)?(int)$releaseYear:null;
    $language=trim((string)($_POST['language']??''))?:null; $description=trim((string)($_POST['description']??''))?:null;
    $duration=isset($_POST['duration'])&&$_POST['duration']!==''?max(0,(float)$_POST['duration']):null; $published=!empty($_POST['published'])?1:0; $featured=!empty($_POST['featured'])?1:0; $trending=!empty($_POST['trending'])?1:0;
    $stored=bin2hex(random_bytes(12)).'_'.$original; $target=SG_UPLOAD_ROOT.'/video/'.$stored; if(!move_uploaded_file($file['tmp_name'],$target))json_response(false,'Could not store the uploaded video file.',null,500);
    $artworkPath=null;
    try{
        if(!empty($_FILES['artwork'])&&is_array($_FILES['artwork'])&&($_FILES['artwork']['error']??UPLOAD_ERR_NO_FILE)===UPLOAD_ERR_OK){
            $art=$_FILES['artwork']; if((int)$art['size']>10*1024*1024)throw new RuntimeException('Artwork exceeds the 10 MB limit.');
            $am=video_mime((string)$art['tmp_name'],(string)($art['type']??'')); $allowed=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'];
            if(!isset($allowed[$am]))throw new RuntimeException('Thumbnail must be JPG, PNG, WEBP or GIF.');
            $as=bin2hex(random_bytes(12)).'.'.$allowed[$am]; $at=SG_UPLOAD_ROOT.'/images/'.$as; if(!move_uploaded_file($art['tmp_name'],$at))throw new RuntimeException('Could not store the thumbnail.'); $artworkPath='images/'.$as;
        }
        $pdo=db(); $st=$pdo->prepare('INSERT INTO media (user_id,origin,type,title,artist,album,genre,release_year,language,description,filename,stored_name,relative_path,mime_type,size_bytes,duration,browser_playable,artwork_path,is_published,is_featured,is_trending) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $st->execute([current_user_id(),'official','video',$title,$artist,$album,$genre,$releaseYear,$language,$description,$original,$stored,'video/'.$stored,$mime,(int)$file['size'],$duration,video_browser_playable($mime,$original)?1:0,$artworkPath,$published,$featured,$trending]);
        $id=(int)$pdo->lastInsertId(); $pdo->prepare("INSERT INTO analytics_events(event_type,user_id,media_id) VALUES('upload',?,?)")->execute([current_user_id(),$id]); $q=$pdo->prepare('SELECT m.*,u.name AS uploader_name,u.email AS uploader_email FROM media m INNER JOIN users u ON u.id=m.user_id WHERE m.id=? LIMIT 1');$q->execute([$id]);$row=$q->fetch();$out=video_row($row);unset($out['_relativePath'],$out['_artworkPath']); json_response(true,'Video uploaded.',$out,201);
    }catch(Throwable $e){@unlink($target);if($artworkPath)@unlink(SG_UPLOAD_ROOT.'/'.$artworkPath);if($e instanceof PDOException)json_response(false,'Database error while saving the video.',null,500);json_response(false,$e->getMessage(),null,422);}
}

if ($action==='update') {
    require_admin_video_mutation(); $d=request_json(); $id=(int)($d['id']??0); if(!$id)json_response(false,'Invalid video id.',null,422);
    $allowed=['title'=>fn($v)=>trim((string)$v)?:'Untitled','artist'=>fn($v)=>trim((string)$v)?:null,'album'=>fn($v)=>trim((string)$v)?:null,'genre'=>fn($v)=>trim((string)$v)?:null,'release_year'=>fn($v)=>($v!==''&&preg_match('/^\d{4}$/',(string)$v))?(int)$v:null,'language'=>fn($v)=>trim((string)$v)?:null,'description'=>fn($v)=>trim((string)$v)?:null,'duration'=>fn($v)=>$v===''||$v===null?null:max(0,(float)$v),'is_published'=>fn($v)=>!empty($v)?1:0,'is_featured'=>fn($v)=>!empty($v)?1:0,'is_trending'=>fn($v)=>!empty($v)?1:0];
    $sets=[];$vals=[]; foreach($allowed as $k=>$norm){if(array_key_exists($k,$d)){$sets[]=$k.'=?';$vals[]=$norm($d[$k]);}} if(!$sets)json_response(false,'Nothing to update.',null,422);$vals[]=$id;
    $st=db()->prepare("UPDATE media SET ".implode(',',$sets)." WHERE id=? AND type='video'");$st->execute($vals);$q=db()->prepare("SELECT m.*,u.name AS uploader_name,u.email AS uploader_email FROM media m INNER JOIN users u ON u.id=m.user_id WHERE m.id=? AND m.type='video' LIMIT 1");$q->execute([$id]);$row=$q->fetch();if(!$row)json_response(false,'Video not found.',null,404);$out=video_row($row);unset($out['_relativePath'],$out['_artworkPath']);json_response(true,'Video updated.',$out);
}

if ($action==='update_artwork') {
    require_admin_video_mutation(); $id=(int)($_POST['id']??0); if(!$id)json_response(false,'Invalid video id.',null,422);$pdo=db();$q=$pdo->prepare("SELECT artwork_path FROM media WHERE id=? AND type='video' LIMIT 1");$q->execute([$id]);$row=$q->fetch();if(!$row)json_response(false,'Video not found.',null,404);
    $old=$row['artwork_path']?(string)$row['artwork_path']:null;$remove=!empty($_POST['remove']);$new=null;
    if(!$remove&&!empty($_FILES['artwork'])&&is_array($_FILES['artwork'])&&($_FILES['artwork']['error']??UPLOAD_ERR_NO_FILE)===UPLOAD_ERR_OK){$art=$_FILES['artwork'];if((int)$art['size']>10*1024*1024)json_response(false,'Thumbnail exceeds the 10 MB limit.',null,413);$am=video_mime((string)$art['tmp_name'],(string)($art['type']??''));$allowed=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'];if(!isset($allowed[$am]))json_response(false,'Thumbnail must be JPG, PNG, WEBP or GIF.',null,415);$as=bin2hex(random_bytes(12)).'.'.$allowed[$am];$at=SG_UPLOAD_ROOT.'/images/'.$as;if(!move_uploaded_file($art['tmp_name'],$at))json_response(false,'Could not store the thumbnail.',null,500);$new='images/'.$as;}
    $next=$new??($remove?null:$old);try{$pdo->prepare("UPDATE media SET artwork_path=? WHERE id=? AND type='video'")->execute([$next,$id]);if($old&&($new||$remove))@unlink(SG_UPLOAD_ROOT.'/'.$old);}catch(Throwable $e){if($new)@unlink(SG_UPLOAD_ROOT.'/'.$new);json_response(false,'Could not update thumbnail.',null,500);}json_response(true,'Thumbnail updated.',['artworkPath'=>$next]);
}

if ($action==='delete') {
    require_admin_video_mutation();$d=request_json();$id=(int)($d['id']??0);if(!$id)json_response(false,'Invalid video id.',null,422);$pdo=db();$q=$pdo->prepare("SELECT relative_path,artwork_path FROM media WHERE id=? AND type='video' LIMIT 1");$q->execute([$id]);$row=$q->fetch();if(!$row)json_response(false,'Video not found.',null,404);$pdo->prepare("DELETE FROM media WHERE id=? AND type='video'")->execute([$id]);@unlink(SG_UPLOAD_ROOT.'/'.$row['relative_path']);if(!empty($row['artwork_path']))@unlink(SG_UPLOAD_ROOT.'/'.$row['artwork_path']);json_response(true,'Video removed.',['id'=>(string)$id]);
}

if ($action==='bulk_edit') {
    require_admin_video_mutation();
    $d=request_json();
    $ids=array_values(array_unique(array_filter(array_map('intval',(array)($d['ids']??[])),fn($id)=>$id>0)));
    if(count($ids)<2)json_response(false,'Select at least two videos for bulk edit.',null,422);
    $sets=[];$vals=[];$fieldMap=['is_published'=>'is_published','is_featured'=>'is_featured','is_trending'=>'is_trending'];
    foreach($fieldMap as $key=>$column){
        if(array_key_exists($key,$d)&&$d[$key]!==null&&$d[$key]!==''){
            $value=filter_var($d[$key],FILTER_VALIDATE_INT,['options'=>['min_range'=>0,'max_range'=>1]]);
            if($value===false)json_response(false,'Bulk edit values must be 0 or 1.',null,422);
            $sets[]=$column.'=?';$vals[]=$value;
        }
    }
    if(!$sets)json_response(false,'Choose at least one field to change.',null,422);
    $ph=implode(',',array_fill(0,count($ids),'?'));
    $pdo=db();
    $st=$pdo->prepare("UPDATE media SET ".implode(',',$sets)." WHERE type='video' AND id IN (".$ph.")");
    $st->execute(array_merge($vals,$ids));
    json_response(true,'Bulk edit complete.',['count'=>$st->rowCount()]);
}

if ($action==='bulk') {
    require_admin_video_mutation();$d=request_json();$ids=array_values(array_filter(array_map('intval',(array)($d['ids']??[])),fn($id)=>$id>0));$op=(string)($d['operation']??'');if(!$ids)json_response(false,'Select at least one video.',null,422);$ops=['publish'=>['is_published',1],'unpublish'=>['is_published',0],'feature'=>['is_featured',1],'unfeature'=>['is_featured',0],'trend'=>['is_trending',1],'untrend'=>['is_trending',0]];$pdo=db();$ph=implode(',',array_fill(0,count($ids),'?'));
    if(isset($ops[$op])){[$col,$val]=$ops[$op];$st=$pdo->prepare("UPDATE media SET {$col}=? WHERE type='video' AND id IN ({$ph})");$st->execute(array_merge([$val],$ids));json_response(true,'Bulk update complete.',['count'=>$st->rowCount()]);}
    if($op==='delete'){ $st=$pdo->prepare("SELECT id,relative_path,artwork_path FROM media WHERE type='video' AND id IN ({$ph})");$st->execute($ids);$rows=$st->fetchAll();$del=$pdo->prepare("DELETE FROM media WHERE type='video' AND id IN ({$ph})");$del->execute($ids);foreach($rows as $r){@unlink(SG_UPLOAD_ROOT.'/'.$r['relative_path']);if(!empty($r['artwork_path']))@unlink(SG_UPLOAD_ROOT.'/'.$r['artwork_path']);}json_response(true,'Selected videos removed.',['count'=>$del->rowCount()]);}
    json_response(false,'Unsupported bulk operation.',null,422);
}
json_response(false,'Unknown admin video action.',null,400);
