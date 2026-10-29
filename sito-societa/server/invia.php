<?php
// Modulo contatti di Stadera: riceve il messaggio e lo inoltra per email a info@ e ai due soci.
// Prima dell'uso: creare la casella MITTENTE sul dominio (es. info@stadera.tech) dal pannello Aruba.
declare(strict_types=1);

const DESTINATARI = ['info@stadera.tech', 'cotizelati.emanuele@gmail.com', 'matteomarchi.1988@gmail.com'];
const MITTENTE    = 'info@stadera.tech';   // deve essere una casella del dominio
const OGGETTO     = 'Richiesta di incontro dal sito Stadera';
const MAX_ORARIE  = 5;                     // richieste per indirizzo IP in un'ora
const TEMPO_MIN_S = 3;                     // un modulo compilato in meno di 3 secondi è un robot

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function esito(bool $ok, string $messaggio, int $codice = 200): never {
    http_response_code($codice);
    echo json_encode(['ok' => $ok, 'messaggio' => $messaggio], JSON_UNESCAPED_UNICODE);
    exit;
}
function pulisci(string $v, int $max): string {
    $v = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '');
    return mb_substr($v, 0, $max);
}
function riga(string $v): string {            // niente a capo: impedisce l'iniezione di intestazioni
    return trim(preg_replace('/\s+/u', ' ', $v) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') esito(false, 'Metodo non consentito.', 405);

// Trappola per i robot: il campo "sito" è nascosto, un essere umano non lo compila.
if (!empty($_POST['sito'])) esito(true, 'Richiesta inviata.');

$t = (int)($_POST['t'] ?? 0);
if ($t > 0 && (time() - intdiv($t, 1000)) < TEMPO_MIN_S) esito(true, 'Richiesta inviata.');

// Limite per IP, senza conservare l'indirizzo: ne usiamo solo un'impronta in un file temporaneo.
$ip   = $_SERVER['REMOTE_ADDR'] ?? '';
$file = sys_get_temp_dir() . '/stadera-limite-' . substr(hash('sha256', $ip . date('YmdH')), 0, 24);
$n    = is_file($file) ? (int)file_get_contents($file) : 0;
if ($n >= MAX_ORARIE) esito(false, 'Troppe richieste. Riprovate più tardi.', 429);
@file_put_contents($file, (string)($n + 1), LOCK_EX);

$nome    = riga(pulisci((string)($_POST['nome'] ?? ''), 120));
$email   = riga(pulisci((string)($_POST['email'] ?? ''), 160));
$azienda = riga(pulisci((string)($_POST['azienda'] ?? ''), 160));
$msg     = pulisci((string)($_POST['msg'] ?? ''), 4000);

if ($nome === '') esito(false, 'Indicate nome e cognome.', 422);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) esito(false, 'Indicate un indirizzo email valido per la risposta.', 422);

$corpo = "Nome: $nome\nEmail: $email\nOrganizzazione: " . ($azienda !== '' ? $azienda : '-') .
         "\n\nProcesso su cui intervenire:\n" . ($msg !== '' ? $msg : '-') . "\n";

$intestazioni = [
    'From: Stadera <' . MITTENTE . '>',
    'Reply-To: ' . $nome . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
];
$oggetto = '=?UTF-8?B?' . base64_encode(OGGETTO) . '?=';

$inviata = false;
foreach (DESTINATARI as $a) {
    $inviata = mail($a, $oggetto, $corpo, implode("\r\n", $intestazioni), '-f' . MITTENTE) || $inviata;
}
if (!$inviata) esito(false, 'Invio non riuscito. Riprovate o scriveteci per email.', 500);
esito(true, 'Richiesta inviata. Vi risponderemo a ' . $email . '.');
