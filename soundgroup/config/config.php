<?php
declare(strict_types=1);

const SG_DB_HOST = '127.0.0.1';
const SG_DB_NAME = 'sound_group';
const SG_DB_USER = 'root';
const SG_DB_PASS = '';
const SG_APP_NAME = 'SOUNDGROUP';
const SG_UPLOAD_ROOT = __DIR__ . '/../public/uploads';
const SG_UPLOAD_URL = '../public/uploads';


function app_json_exception(Throwable $e): never {
    error_log('[SOUNDGROUP] ' . $e->getMessage());
    json_response(false, 'Internal server error.', null, 500);
}

function app_boot(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_name('soundgroup_session');
        session_start([
            'cookie_httponly' => true,
            'cookie_samesite' => 'Lax',
        ]);
    }
}

set_exception_handler('app_json_exception');

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $dsn = 'mysql:host=' . SG_DB_HOST . ';dbname=' . SG_DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, SG_DB_USER, SG_DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function json_response(bool $success, string $message = '', mixed $data = null, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data], JSON_UNESCAPED_SLASHES);
    exit;
}

function require_method(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) json_response(false, 'Method not allowed', null, 405);
}


function csrf_token(string $name = 'csrf_token'): string {
    app_boot();
    if (empty($_SESSION[$name])) $_SESSION[$name] = bin2hex(random_bytes(32));
    return (string)$_SESSION[$name];
}

function require_csrf(string $name = 'csrf_token'): void {
    app_boot();
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['_csrf'] ?? '');
    $expected = $_SESSION[$name] ?? '';
    if (!is_string($provided) || $provided === '' || !is_string($expected) || !hash_equals($expected, $provided)) {
        json_response(false, 'Security token expired. Refresh the page and try again.', null, 419);
    }
}

function current_user_id(): ?int {
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

function require_auth(): int {
    app_boot();
    $id = current_user_id();
    if (!$id) json_response(false, 'Authentication required', null, 401);
    $st = db()->prepare('SELECT is_active FROM users WHERE id=? LIMIT 1');
    $st->execute([$id]);
    $user = $st->fetch();
    if (!$user || !(bool)$user['is_active']) {
        unset($_SESSION['user_id'], $_SESSION['user_name'], $_SESSION['user_role']);
        json_response(false, 'Your account is inactive.', null, 403);
    }
    return $id;
}

function request_json(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function safe_name(string $name): string {
    $name = preg_replace('/[^A-Za-z0-9._-]+/', '_', basename($name)) ?? 'file';
    return trim($name, '._') ?: 'file';
}

function media_type(string $mime, string $name): string {
    $mime = strtolower($mime);
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $audioExts = [
        'mp3','mp1','mp2','mpa','mpga','mpeg','mpg','wav','wave','flac','m4a','m4b','aac','adts',
        'ogg','oga','opus','aiff','aif','aifc','wma','amr','awb','caf','au','snd'
    ];
    $videoExts = ['mp4','webm','mkv','mov','m4v','avi','ogv','ogg','3gp','mpeg','mpg','ts','mts','m2ts'];

    // Prefer an explicit audio MIME. For MPEG-family filenames, allow the
    // audio extension fallback when the server reports a generic or ambiguous
    // MPEG MIME; this is important for MPEG audio files on some PHP/fileinfo
    // installations. A clearly video-typed MIME still remains video.
    if (str_starts_with($mime, 'audio/')) return 'audio';
    if (str_starts_with($mime, 'video/')) {
        if (in_array($ext, ['mp1','mp2','mpa','mpga','mpeg','mpg'], true) && in_array($mime, ['video/mpeg','video/mp2t','application/octet-stream'], true)) {
            return 'audio';
        }
        return 'video';
    }

    // When MIME detection is generic/unavailable, use the filename extension.
    if (in_array($ext, $audioExts, true)) return 'audio';
    if (in_array($ext, $videoExts, true)) return 'video';
    return 'other';
}

function video_upload_type(string $mime, string $name): string {
    $mime = strtolower(trim($mime));
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $videoExts = ['mp4','webm','mkv','mov','m4v','avi','ogv','3gp','mpeg','mpg','ts','mts','m2ts'];
    if (str_starts_with($mime, 'video/')) return 'video';
    if (str_starts_with($mime, 'audio/')) return 'other';
    if (in_array($ext, $videoExts, true)) return 'video';
    return 'other';
}

function video_browser_playable(string $mime, string $name): bool {
    $mime = strtolower(trim($mime));
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $playableExts = ['mp4','webm','m4v','ogv','3gp','mov'];
    if (in_array($ext, $playableExts, true)) return true;
    return in_array($mime, ['video/mp4','video/webm','video/ogg','video/quicktime','video/x-m4v','video/3gpp'], true);
}

function ensure_upload_dirs(): void {
    foreach (['audio','video','images','other'] as $dir) {
        $path = SG_UPLOAD_ROOT . DIRECTORY_SEPARATOR . $dir;
        if (!is_dir($path)) mkdir($path, 0775, true);
    }
}
