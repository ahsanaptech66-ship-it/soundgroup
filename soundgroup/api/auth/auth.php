<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config/config.php';
app_boot();

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'csrf') {
    json_response(true, 'CSRF token', ['token' => csrf_token('public_csrf')]);
}

if ($action === 'me') {
    $id = current_user_id();
    if (!$id) json_response(true, 'Guest session', ['authenticated'=>false, 'user'=>['name'=>'Guest']]);
    $st = db()->prepare('SELECT id,name,email,phone,address,role,is_active,created_at FROM users WHERE id=?');
    $st->execute([$id]);
    $user = $st->fetch();
    if (!$user) { unset($_SESSION['user_id']); json_response(true, 'Guest session', ['authenticated'=>false, 'user'=>['name'=>'Guest']]); }
    json_response(true, 'Authenticated', ['authenticated'=>true, 'user'=>$user]);
}

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time()-42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    json_response(true, 'Logged out');
}

if ($action === 'register') {
    require_method('POST');
    $data = request_json();
    $name = trim((string)($data['name'] ?? ''));
    $phone = trim((string)($data['phone'] ?? ''));
    $address = trim((string)($data['address'] ?? ''));
    $email = strtolower(trim((string)($data['email'] ?? '')));
    $password = (string)($data['password'] ?? '');
    if ($name === '' || $phone === '' || $address === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) json_response(false, 'Provide your name, phone, address, a valid email and a password of at least 6 characters.', null, 422);
    $pdo = db();
    try {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $st = $pdo->prepare('INSERT INTO users (name,email,phone,address,password_hash) VALUES (?,?,?,?,?)');
        $st->execute([$name,$email,$phone,$address,$hash]);
        $_SESSION['user_id'] = (int)$pdo->lastInsertId();
        $_SESSION['user_name'] = $name;
        $_SESSION['user_role'] = 'user';
        json_response(true, 'Account created', ['authenticated'=>true,'user'=>['id'=>$_SESSION['user_id'],'name'=>$name,'email'=>$email,'phone'=>$phone,'address'=>$address,'role'=>'user']]);
    } catch (PDOException $e) {
        if ((int)$e->errorInfo[1] === 1062) json_response(false, 'An account with that email already exists.', null, 409);
        json_response(false, 'Could not create the account.', null, 500);
    }
}

if ($action === 'login') {
    require_method('POST');
    $data = request_json();
    $email = strtolower(trim((string)($data['email'] ?? '')));
    $password = (string)($data['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') json_response(false, 'Enter your email and password.', null, 422);
    $st = db()->prepare('SELECT id,name,email,phone,address,password_hash,role,is_active FROM users WHERE email=? LIMIT 1');
    $st->execute([$email]);
    $user = $st->fetch();
    if (!$user || !$user['is_active'] || !password_verify($password, $user['password_hash'])) json_response(false, 'Invalid email or password.', null, 401);
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_role'] = $user['role'];
    unset($user['password_hash']);
    json_response(true, 'Logged in', ['authenticated'=>true,'user'=>$user]);
}

json_response(false, 'Unknown auth action.', null, 400);
