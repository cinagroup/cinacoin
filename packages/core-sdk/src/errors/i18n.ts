/**
 * Internationalization for Cinacoin SDK error messages.
 *
 * Supports: en, zh, ja, ko, es, fr, de
 */

export type SupportedLocale = 'en' | 'zh' | 'ja' | 'ko' | 'es' | 'fr' | 'de';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de'];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

// ============================================================================
// Message templates keyed by [code][locale]
// ============================================================================

interface Messages {
  [code: number]: { [locale in SupportedLocale]?: string };
}

const MESSAGES: Messages = {
  // --- CONNECTION (1000-1099) ---
  1000: {
    en: 'Connection was refused by the remote endpoint.',
    zh: '远程端点拒绝了连接。',
    ja: 'リモートエンドポイントにより接続が拒否されました。',
    ko: '원격 엔드포인트에서 연결이 거부되었습니다.',
    es: 'La conexión fue rechazada por el endpoint remoto.',
    fr: 'La connexion a été refusée par le point de terminaison distant.',
    de: 'Die Verbindung wurde vom entfernten Endpunkt abgelehnt.',
  },
  1001: {
    en: 'Connection attempt timed out. Please check your network.',
    zh: '连接尝试超时，请检查您的网络。',
    ja: '接続試行がタイムアウトしました。ネットワークを確認してください。',
    ko: '연결 시도가 시간 초과되었습니다. 네트워크를 확인하세요.',
    es: 'El intento de conexión agotó el tiempo. Verifique su red.',
    fr: "La tentative de connexion a expiré. Vérifiez votre réseau.",
    de: 'Verbindungsversuch abgelaufen. Bitte überprüfen Sie Ihre Netzwerkverbindung.',
  },
  1002: {
    en: 'Connection was unexpectedly lost.',
    zh: '连接意外中断。',
    ja: '接続が予期せず失われました。',
    ko: '연결이 예기치 않게 끊어졌습니다.',
    es: 'La conexión se perdió inesperadamente.',
    fr: 'La connexion a été perdue de manière inattendue.',
    de: 'Die Verbindung wurde unerwartet getrennt.',
  },
  1003: {
    en: 'Connection rejected. Check CORS, firewall, or authentication settings.',
    zh: '连接被拒绝。请检查 CORS、防火墙或身份验证设置。',
    ja: '接続が拒否されました。CORS、ファイアウォール、認証設定を確認してください。',
    ko: '연결이 거부되었습니다. CORS, 방화벽 또는 인증 설정을 확인하세요.',
    es: 'Conexión rechazada. Verifique la configuración de CORS, firewall o autenticación.',
    fr: 'Connexion rejetée. Vérifiez les paramètres CORS, pare-feu ou d\'authentification.',
    de: 'Verbindung abgelehnt. Überprüfen Sie CORS-, Firewall- oder Authentifizierungseinstellungen.',
  },
  1004: {
    en: 'Maximum retry attempts exceeded.',
    zh: '已达到最大重试次数。',
    ja: '最大リトライ回数を超えました。',
    ko: '최대 재시도 횟수를 초과했습니다.',
    es: 'Se excedió el número máximo de reintentos.',
    fr: 'Nombre maximal de tentatives dépassé.',
    de: 'Maximale Wiederholungsversuche überschritten.',
  },
  1005: {
    en: 'Failed to resolve the hostname.',
    zh: '无法解析主机名。',
    ja: 'ホスト名の解決に失敗しました。',
    ko: '호스트 이름을 확인하지 못했습니다.',
    es: 'No se pudo resolver el nombre del host.',
    fr: "Échec de la résolution du nom d'hôte.",
    de: 'Hostname konnte nicht aufgelöst werden.',
  },
  1006: {
    en: 'A low-level socket error occurred.',
    zh: '发生底层套接字错误。',
    ja: '低レベルのソケットエラーが発生しました。',
    ko: '로우 레벨 소켓 오류가 발생했습니다.',
    es: 'Ocurrió un error de socket de bajo nivel.',
    fr: "Une erreur de socket de bas niveau s'est produite.",
    de: 'Ein Low-Level-Socket-Fehler ist aufgetreten.',
  },
  1007: {
    en: 'TLS/SSL handshake failed. The connection may be insecure.',
    zh: 'TLS/SSL 握手失败。连接可能不安全。',
    ja: 'TLS/SSL ハンドシェイクに失敗しました。接続が安全でない可能性があります。',
    ko: 'TLS/SSL 핸드셰이크에 실패했습니다. 연결이 안전하지 않을 수 있습니다.',
    es: 'El handshake TLS/SSL falló. La conexión puede no ser segura.',
    fr: 'La poignée de main TLS/SSL a échoué. La connexion peut être non sécurisée.',
    de: 'TLS/SSL-Handshake fehlgeschlagen. Die Verbindung möglicherweise unsicher.',
  },
  1008: {
    en: 'Connection was reset by the peer.',
    zh: '连接被对端重置。',
    ja: '接続がピアによってリセットされました。',
    ko: '피어에 의해 연결이 재설정되었습니다.',
    es: 'La conexión fue reiniciada por el par.',
    fr: 'La connexion a été réinitialisée par le pair.',
    de: 'Die Verbindung wurde vom Peer zurückgesetzt.',
  },

  // --- AUTHENTICATION (2000-2099) ---
  2000: {
    en: 'Sign-In With Ethereum signature verification failed.',
    zh: '以太坊登录签名验证失败。',
    ja: 'Sign-In With Ethereum の署名検証に失敗しました。',
    ko: 'Sign-In With Ethereum 서명 검증에 실패했습니다.',
    es: 'La verificación de firma de Sign-In With Ethereum falló.',
    fr: 'La vérification de la signature Sign-In With Ethereum a échoué.',
    de: 'Die Signaturprüfung von Sign-In With Ethereum ist fehlgeschlagen.',
  },
  2001: {
    en: 'The provided cryptographic signature is invalid.',
    zh: '提供的加密签名无效。',
    ja: '提供された暗号署名が無効です。',
    ko: '제공된 암호화 서명이 유효하지 않습니다.',
    es: 'La firma criptográfica proporcionada no es válida.',
    fr: 'La signature cryptographique fournie est invalide.',
    de: 'Die angegebene kryptografische Signatur ist ungültig.',
  },
  2002: {
    en: 'Your authentication session has expired. Please sign in again.',
    zh: '您的身份验证会话已过期，请重新登录。',
    ja: '認証セッションの有効期限が切れました。再度サインインしてください。',
    ko: '인증 세션이 만료되었습니다. 다시 로그인하세요.',
    es: 'Su sesión de autenticación ha expirado. Inicie sesión nuevamente.',
    fr: 'Votre session d\'authentification a expiré. Veuillez vous reconnecter.',
    de: 'Ihre Authentifizierungssitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
  },
  2003: {
    en: 'The access token has been revoked.',
    zh: '访问令牌已被撤销。',
    ja: 'アクセストークンが無効化されました。',
    ko: '액세스 토큰이 취소되었습니다.',
    es: 'El token de acceso ha sido revocado.',
    fr: "Le jeton d'accès a été révoqué.",
    de: 'Das Zugriffstoken wurde widerrufen.',
  },
  2004: {
    en: 'Unauthorized. Please provide valid authentication credentials.',
    zh: '未授权。请提供有效的身份验证凭据。',
    ja: '未認証です。有効な認証資格情報を提供してください。',
    ko: '권한이 없습니다. 유효한 인증 자격 증명을 제공하세요.',
    es: 'No autorizado. Proporcione credenciales válidas.',
    fr: 'Non autorisé. Veuillez fournir des identifiants valides.',
    de: 'Nicht autorisiert. Bitte geben Sie gültige Anmeldedaten an.',
  },
  2005: {
    en: 'Insufficient permissions for this operation.',
    zh: '权限不足，无法执行此操作。',
    ja: 'この操作には権限が不足しています。',
    ko: '이 작업에 대한 권한이 부족합니다.',
    es: 'Permisos insuficientes para esta operación.',
    fr: 'Permissions insuffisantes pour cette opération.',
    de: 'Unzureichende Berechtigungen für diesen Vorgang.',
  },
  2006: {
    en: 'The authentication challenge has expired. Please try again.',
    zh: '身份验证质询已过期，请重试。',
    ja: '認証チャレンジの有効期限が切れました。もう一度お試しください。',
    ko: '인증 도전이 만료되었습니다. 다시 시도하세요.',
    es: 'El desafío de autenticación ha expirado. Intente nuevamente.',
    fr: "Le défi d'authentification a expiré. Veuillez réessayer.",
    de: 'Die Authentifizierungs-Challenge ist abgelaufen. Bitte versuchen Sie es erneut.',
  },
  2007: {
    en: 'The signed message does not match the original challenge. Possible tampering detected.',
    zh: '签名消息与原始质询不匹配。检测到可能的篡改。',
    ja: '署名されたメッセージが元のチャレンジと一致しません。改ざんの可能性があります。',
    ko: '서명된 메시지가 원래 도전과 일치하지 않습니다. 변조가 감지되었습니다.',
    es: 'El mensaje firmado no coincide con el desafío original. Posible manipulación detectada.',
    fr: 'Le message signé ne correspond pas au défi original. Altération potentielle détectée.',
    de: 'Die signierte Nachricht stimmt nicht mit der ursprünglichen Challenge überein. Mögliche Manipulation erkannt.',
  },

  // --- CHAIN (3000-3099) ---
  3000: {
    en: 'This chain is not supported by the Cinacoin SDK.',
    zh: 'Cinacoin SDK 不支持此链。',
    ja: 'このチェーンは Cinacoin SDK でサポートされていません。',
    ko: '이 체인은 Cinacoin SDK에서 지원하지 않습니다.',
    es: 'Esta cadena no es compatible con el SDK de Cinacoin.',
    fr: "Cette chaîne n'est pas prise en charge par le SDK Cinacoin.",
    de: 'Diese Kette wird vom Cinacoin SDK nicht unterstützt.',
  },
  3001: {
    en: 'An RPC call to the blockchain failed.',
    zh: '区块链 RPC 调用失败。',
    ja: 'ブロックチェーンへの RPC 呼び出しに失敗しました。',
    ko: '블록체인 RPC 호출이 실패했습니다.',
    es: 'Una llamada RPC a la blockchain falló.',
    fr: "Un appel RPC à la blockchain a échoué.",
    de: 'Ein RPC-Aufruf zur Blockchain ist fehlgeschlagen.',
  },
  3002: {
    en: 'Failed to switch to the requested chain.',
    zh: '无法切换到请求的链。',
    ja: 'リクエストされたチェーンへの切り替えに失敗しました。',
    ko: '요청한 체인으로 전환하지 못했습니다.',
    es: 'No se pudo cambiar a la cadena solicitada.',
    fr: 'Impossible de basculer vers la chaîne demandée.',
    de: 'Wechsel zur angeforderten Kette fehlgeschlagen.',
  },
  3003: {
    en: 'The chain has not been configured in the SDK.',
    zh: '该链尚未在 SDK 中配置。',
    ja: 'チェーンが SDK で構成されていません。',
    ko: '체인이 SDK에서 구성되지 않았습니다.',
    es: 'La cadena no ha sido configurada en el SDK.',
    fr: "La chaîne n'a pas été configurée dans le SDK.",
    de: 'Die Kette wurde im SDK nicht konfiguriert.',
  },
  3004: {
    en: 'The provided chain ID is invalid or unknown.',
    zh: '提供的链 ID 无效或未知。',
    ja: '提供されたチェーン ID が無効または不明です。',
    ko: '제공된 체인 ID가 유효하지 않거나 알 수 없습니다.',
    es: 'El ID de cadena proporcionado no es válido o desconocido.',
    fr: "L'ID de chaîne fourni est invalide ou inconnu.",
    de: 'Die angegebene Chain-ID ist ungültig oder unbekannt.',
  },
  3005: {
    en: 'RPC provider rate limit exceeded. Please wait and try again.',
    zh: 'RPC 提供商速率限制已超出，请稍后重试。',
    ja: 'RPC プロバイダーのレート制限を超えました。待ってから再度お試しください。',
    ko: 'RPC 제공자의 속도 제한을 초과했습니다. 잠시 후 다시 시도하세요.',
    es: 'Límite de tasa del proveedor RPC excedido. Espere e intente de nuevo.',
    fr: 'Limite de débit du fournisseur RPC dépassée. Veuillez patienter et réessayer.',
    de: 'RPC-Anbieter-Ratenlimit überschritten. Bitte warten und erneut versuchen.',
  },
  3006: {
    en: 'No chain configuration found for the given ID.',
    zh: '找不到给定 ID 的链配置。',
    ja: '指定された ID のチェーン設定が見つかりません。',
    ko: '지정된 ID에 대한 체인 설정을 찾을 수 없습니다.',
    es: 'No se encontró configuración de cadena para el ID dado.',
    fr: 'Aucune configuration de chaîne trouvée pour l\'ID donné.',
    de: 'Keine Kettenkonfiguration für die angegebene ID gefunden.',
  },
  3007: {
    en: 'The requested block does not exist on this chain.',
    zh: '请求的区块在此链上不存在。',
    ja: 'リクエストされたブロックはこのチェーン上に存在しません。',
    ko: '요청한 블록이 이 체인에 존재하지 않습니다.',
    es: 'El bloque solicitado no existe en esta cadena.',
    fr: 'Le bloc demandé n\'existe pas sur cette chaîne.',
    de: 'Der angeforderte Block existiert auf dieser Kette nicht.',
  },

  // --- TRANSACTION (4000-4099) ---
  4000: {
    en: 'Failed to estimate gas for this transaction.',
    zh: '无法估算此交易的 gas。',
    ja: 'この取引のガスの見積もりに失敗しました。',
    ko: '이 거래의 가스 추정에 실패했습니다.',
    es: 'No se pudo estimar el gas para esta transacción.',
    fr: "Impossible d'estimer le gaz pour cette transaction.",
    de: 'Gasschätzung für diese Transaktion fehlgeschlagen.',
  },
  4001: {
    en: 'Insufficient balance. Add more funds to your wallet.',
    zh: '余额不足。请向钱包添加资金。',
    ja: '残高が不足しています。ウォレットに資金を追加してください。',
    ko: '잔액이 부족합니다. 지갑에 자금을 추가하세요.',
    es: 'Saldo insuficiente. Agregue más fondos a su billetera.',
    fr: 'Solde insuffisant. Ajoutez des fonds à votre portefeuille.',
    de: 'Unzureichendes Guthaben. Fügen Sie mehr Geld hinzu.',
  },
  4002: {
    en: 'Transaction was reverted on-chain. Check the contract logic.',
    zh: '交易在链上被回退。请检查合约逻辑。',
    ja: 'トランザクションはチェーン上で取り消されました。コントラクトのロジックを確認してください。',
    ko: '트랜잭션이 온체인에서 되돌려졌습니다. 컨트랙트 로직을 확인하세요.',
    es: 'La transacción fue revertida en la cadena. Verifique la lógica del contrato.',
    fr: 'La transaction a été annulée sur la chaîne. Vérifiez la logique du contrat.',
    de: 'Transaktion wurde auf der Chain zurückgesetzt. Überprüfen Sie die Vertragslogik.',
  },
  4003: {
    en: 'Transaction nonce is too low.',
    zh: '交易 nonce 过低。',
    ja: 'トランザクションのナンスが低すぎます。',
    ko: '트랜잭션 논스가 너무 낮습니다.',
    es: 'El nonce de la transacción es demasiado bajo.',
    fr: 'Le nonce de la transaction est trop bas.',
    de: 'Transaktions-Nonce ist zu niedrig.',
  },
  4004: {
    en: 'Transaction nonce is too high.',
    zh: '交易 nonce 过高。',
    ja: 'トランザクションのナンスが高すぎます。',
    ko: '트랜잭션 논스가 너무 높습니다.',
    es: 'El nonce de la transacción es demasiado alto.',
    fr: 'Le nonce de la transaction est trop élevé.',
    de: 'Transaktions-Nonce ist zu hoch.',
  },
  4005: {
    en: 'Gas price is below the current network minimum.',
    zh: 'Gas 价格低于当前网络最低要求。',
    ja: 'ガス価格が現在のネットワークの最低価格を下回っています。',
    ko: '가스 가격이 현재 네트워크 최소값보다 낮습니다.',
    es: 'El precio del gas está por debajo del mínimo actual de la red.',
    fr: 'Le prix du gaz est inférieur au minimum actuel du réseau.',
    de: 'Gaspreis liegt unter dem aktuellen Netzwerkminimum.',
  },
  4006: {
    en: 'Transaction confirmation timed out.',
    zh: '交易确认超时。',
    ja: 'トランザクションの確認がタイムアウトしました。',
    ko: '트랜잭션 확인이 시간 초과되었습니다.',
    es: 'La confirmación de la transacción agotó el tiempo.',
    fr: "La confirmation de la transaction a expiré.",
    de: 'Transaktionsbestätigung abgelaufen.',
  },
  4007: {
    en: 'Transaction was replaced by one with a higher fee.',
    zh: '交易被更高费用的交易取代。',
    ja: 'トランザクションはより高い手数料のトランザクションに置き換えられました。',
    ko: '트랜잭션이 더 높은 수수료로 대체되었습니다.',
    es: 'La transacción fue reemplazada por una con tarifa más alta.',
    fr: 'La transaction a été remplacée par une avec des frais plus élevés.',
    de: 'Transaktion wurde durch eine mit höherer Gebühr ersetzt.',
  },
  4008: {
    en: 'Transaction was dropped from the mempool.',
    zh: '交易已从内存池中移除。',
    ja: 'トランザクションはメモリプールから削除されました。',
    ko: '트랜잭션이 메모리 풀에서 제거되었습니다.',
    es: 'La transacción fue eliminada del mempool.',
    fr: 'La transaction a été supprimée du mempool.',
    de: 'Transaktion wurde aus dem Mempool entfernt.',
  },
  4009: {
    en: 'Transaction simulation failed before broadcast.',
    zh: '交易在广播前模拟失败。',
    ja: 'トランザクションのブロードキャスト前のシミュレーションに失敗しました。',
    ko: '트랜잭션 시뮬레이션이 브로드캐스트 전에 실패했습니다.',
    es: 'La simulación de la transacción falló antes del envío.',
    fr: "La simulation de la transaction a échoué avant la diffusion.",
    de: 'Transaktionssimulation vor dem Broadcast fehlgeschlagen.',
  },

  // --- WALLET_CONNECT (5000-5099) ---
  5000: {
    en: 'Cinacoin pairing could not be established.',
    zh: '无法建立 Cinacoin 配对。',
    ja: 'Cinacoin ペアリングを確立できませんでした。',
    ko: 'Cinacoin 페어링을 설정할 수 없습니다.',
    es: 'No se pudo establecer el emparejamiento de Cinacoin.',
    fr: "Le pairing Cinacoin n'a pas pu être établi.",
    de: 'Cinacoin-Pairing konnte nicht hergestellt werden.',
  },
  5001: {
    en: 'The wallet rejected the session proposal.',
    zh: '钱包拒绝了会话提议。',
    ja: 'ウォレットがセッション提案を拒否しました。',
    ko: '지갑이 세션 제안을 거부했습니다.',
    es: 'La billetera rechazó la propuesta de sesión.',
    fr: 'Le portefeuille a rejeté la proposition de session.',
    de: 'Das Wallet hat den Sitzungsvorschlag abgelehnt.',
  },
  5002: {
    en: 'The Cinacoin session has expired. Please reconnect.',
    zh: 'Cinacoin 会话已过期。请重新连接。',
    ja: 'Cinacoin セッションの有効期限が切れました。再接続してください。',
    ko: 'Cinacoin 세션이 만료되었습니다. 다시 연결하세요.',
    es: 'La sesión de Cinacoin ha expirado. Vuelva a conectar.',
    fr: 'La session Cinacoin a expiré. Veuillez vous reconnecter.',
    de: 'Die Cinacoin-Sitzung ist abgelaufen. Bitte verbinden Sie erneut.',
  },
  5003: {
    en: 'The pairing URI is malformed.',
    zh: '配对 URI 格式错误。',
    ja: 'ペアリング URI の形式が正しくありません。',
    ko: '페어링 URI 형식이 잘못되었습니다.',
    es: 'El URI de emparejamiento tiene un formato incorrecto.',
    fr: "L'URI de pairing est mal formé.",
    de: 'Die Pairing-URI ist fehlerhaft.',
  },
  5004: {
    en: 'No active session found for the given topic.',
    zh: '找不到给定主题的活跃会话。',
    ja: '指定されたトピックのアクティブなセッションが見つかりません。',
    ko: '지정된 주제에 대한 활성 세션을 찾을 수 없습니다.',
    es: 'No se encontró una sesión activa para el tema dado.',
    fr: 'Aucune session active trouvée pour le sujet donné.',
    de: 'Keine aktive Sitzung für das angegebene Thema gefunden.',
  },
  5005: {
    en: 'Requested methods are not supported by the connected wallet.',
    zh: '连接的钱包不支持请求的方法。',
    ja: 'リクエストされたメソッドは接続されたウォレットでサポートされていません。',
    ko: '요청한 메서드가 연결된 지갑에서 지원되지 않습니다.',
    es: 'Los métodos solicitados no son compatibles con la billetera conectada.',
    fr: 'Les méthodes demandées ne sont pas prises en charge par le portefeuille connecté.',
    de: 'Angeforderte Methoden werden vom verbundenen Wallet nicht unterstützt.',
  },
  5006: {
    en: 'A Cinacoin protocol-level error occurred.',
    zh: '发生 Cinacoin 协议级错误。',
    ja: 'Cinacoin プロトコルレベルのエラーが発生しました。',
    ko: 'Cinacoin 프로토콜 수준 오류가 발생했습니다.',
    es: 'Ocurrió un error a nivel de protocolo Cinacoin.',
    fr: "Une erreur au niveau du protocole Cinacoin s'est produite.",
    de: 'Ein Cinacoin-Protokollfehler ist aufgetreten.',
  },
  5007: {
    en: 'The Cinacoin relay connection was lost.',
    zh: 'Cinacoin 中继连接已断开。',
    ja: 'Cinacoin リレー接続が失われました。',
    ko: 'Cinacoin 릴레이 연결이 끊어졌습니다.',
    es: 'Se perdió la conexión del relay de Cinacoin.',
    fr: 'La connexion au relay Cinacoin a été perdue.',
    de: 'Die Cinacoin-Relay-Verbindung wurde getrennt.',
  },
  5008: {
    en: 'Cinacoin request timed out.',
    zh: 'Cinacoin 请求超时。',
    ja: 'Cinacoin リクエストがタイムアウトしました。',
    ko: 'Cinacoin 요청이 시간 초과되었습니다.',
    es: 'La solicitud de Cinacoin agotó el tiempo.',
    fr: "La demande Cinacoin a expiré.",
    de: 'Cinacoin-Anfrage abgelaufen.',
  },

  // --- SIGNING (6000-6099) ---
  6000: {
    en: 'You rejected the signing request in your wallet.',
    zh: '您在钱包中拒绝了签名请求。',
    ja: 'ウォレットで署名リクエストを拒否しました。',
    ko: '지갑에서 서명 요청을 거부했습니다.',
    es: 'Rechazó la solicitud de firma en su billetera.',
    fr: 'Vous avez rejeté la demande de signature dans votre portefeuille.',
    de: 'Sie haben die Signaturanfrage in Ihrem Wallet abgelehnt.',
  },
  6001: {
    en: 'The signing operation failed for an unknown reason.',
    zh: '签名操作因未知原因失败。',
    ja: '署名操作が不明な理由で失敗しました。',
    ko: '알 수 없는 이유로 서명 작업이 실패했습니다.',
    es: 'La operación de firma falló por una razón desconocida.',
    fr: "L'opération de signature a échoué pour une raison inconnue.",
    de: 'Der Signiervorgang ist aus unbekanntem Grund fehlgeschlagen.',
  },
  6002: {
    en: 'The message to be signed is malformed or empty.',
    zh: '要签名的消息格式错误或为空。',
    ja: '署名するメッセージの形式が正しくないか空です。',
    ko: '서명할 메시지의 형식이 잘못되었거나 비어 있습니다.',
    es: 'El mensaje a firmar tiene un formato incorrecto o está vacío.',
    fr: 'Le message à signer est mal formé ou vide.',
    de: 'Die zu signierende Nachricht ist fehlerhaft oder leer.',
  },
  6003: {
    en: 'The requested signing method is not supported.',
    zh: '不支持请求的签名方法。',
    ja: 'リクエストされた署名方法はサポートされていません。',
    ko: '요청한 서명 방법이 지원되지 않습니다.',
    es: 'El método de firma solicitado no es compatible.',
    fr: "La méthode de signature demandée n'est pas prise en charge.",
    de: 'Die angeforderte Signiermethode wird nicht unterstützt.',
  },
  6004: {
    en: 'The message exceeds the maximum size allowed for signing.',
    zh: '消息超过了签名允许的最大大小。',
    ja: 'メッセージが署名に許可されている最大サイズを超えています。',
    ko: '메시지가 서명에 허용된 최대 크기를 초과합니다.',
    es: 'El mensaje excede el tamaño máximo permitido para firmar.',
    fr: 'Le message dépasse la taille maximale autorisée pour la signature.',
    de: 'Die Nachricht überschreitet die maximale Größe zum Signieren.',
  },
  6005: {
    en: 'The EIP-712 typed data structure is invalid.',
    zh: 'EIP-712 类型数据结构无效。',
    ja: 'EIP-712 タイプ付きデータ構造が無効です。',
    ko: 'EIP-712 타입 데이터 구조가 유효하지 않습니다.',
    es: 'La estructura de datos tipados EIP-712 no es válida.',
    fr: "La structure de données typées EIP-712 est invalide.",
    de: 'Die EIP-712 typisierte Datenstruktur ist ungültig.',
  },
  6006: {
    en: 'Signing request timed out waiting for user action.',
    zh: '签名请求等待用户操作超时。',
    ja: '署名リクエストがユーザー操作を待ってタイムアウトしました。',
    ko: '서명 요청이 사용자 작업을 기다리는 동안 시간 초과되었습니다.',
    es: 'La solicitud de firma agotó el tiempo esperando la acción del usuario.',
    fr: "La demande de signature a expiré en attendant l'action de l'utilisateur.",
    de: 'Signieranfrage abgelaufen beim Warten auf Benutzeraktion.',
  },

  // --- NETWORK (7000-7099) ---
  7000: {
    en: 'No network connectivity detected. Please check your internet connection.',
    zh: '未检测到网络连接。请检查您的互联网连接。',
    ja: 'ネットワーク接続が検出されませんでした。インターネット接続を確認してください。',
    ko: '네트워크 연결이 감지되지 않았습니다. 인터넷 연결을 확인하세요.',
    es: 'No se detectó conectividad de red. Verifique su conexión a internet.',
    fr: 'Aucune connectivité réseau détectée. Vérifiez votre connexion Internet.',
    de: 'Keine Netzwerkverbindung erkannt. Bitte überprüfen Sie Ihre Internetverbindung.',
  },
  7001: {
    en: 'The RPC endpoint is unreachable.',
    zh: 'RPC 端点无法访问。',
    ja: 'RPC エンドポイントに到達できません。',
    ko: 'RPC 엔드포인트에 연결할 수 없습니다.',
    es: 'El endpoint RPC no es accesible.',
    fr: "Le point de terminaison RPC est inaccessible.",
    de: 'Der RPC-Endpunkt ist nicht erreichbar.',
  },
  7002: {
    en: 'Network provider rate limit exceeded. Please wait.',
    zh: '网络提供商速率限制已超出。请等待。',
    ja: 'ネットワークプロバイダーのレート制限を超えました。お待ちください。',
    ko: '네트워크 제공자의 속도 제한을 초과했습니다. 기다려 주세요.',
    es: 'Límite de tasa del proveedor de red excedido. Por favor espere.',
    fr: 'Limite de débit du fournisseur réseau dépassée. Veuillez patienter.',
    de: 'Ratenlimit des Netzwerkanbieters überschritten. Bitte warten.',
  },
  7003: {
    en: 'An unexpected HTTP error occurred.',
    zh: '发生意外 HTTP 错误。',
    ja: '予期しない HTTP エラーが発生しました。',
    ko: '예기치 않은 HTTP 오류가 발생했습니다.',
    es: 'Ocurrió un error HTTP inesperado.',
    fr: "Une erreur HTTP inattendue s'est produite.",
    de: 'Ein unerwarteter HTTP-Fehler ist aufgetreten.',
  },
  7004: {
    en: 'The network response could not be parsed.',
    zh: '无法解析网络响应。',
    ja: 'ネットワーク応答を解析できませんでした。',
    ko: '네트워크 응답을 구문 분석할 수 없습니다.',
    es: 'No se pudo analizar la respuesta de red.',
    fr: "La réponse réseau n'a pas pu être analysée.",
    de: 'Die Netzwerkantwort konnte nicht verarbeitet werden.',
  },
  7005: {
    en: 'Network request exceeded the configured timeout.',
    zh: '网络请求超过配置的超时时间。',
    ja: 'ネットワークリクエストが設定されたタイムアウトを超えました。',
    ko: '네트워크 요청이 구성된 시간 초과를 초과했습니다.',
    es: 'La solicitud de red excedió el tiempo de espera configurado.',
    fr: 'La demande réseau a dépassé le délai configuré.',
    de: 'Netzwerkanfrage überschreitet das konfigurierte Timeout.',
  },
  7006: {
    en: 'Network connectivity is intermittent.',
    zh: '网络连接不稳定。',
    ja: 'ネットワーク接続が断続的です。',
    ko: '네트워크 연결이 불안정합니다.',
    es: 'La conectividad de red es intermitente.',
    fr: 'La connectivité réseau est intermittente.',
    de: 'Die Netzwerkverbindung ist instabil.',
  },

  // --- SDK (8000-8099) ---
  8000: {
    en: 'The SDK has not been initialized. Please call initialize() first.',
    zh: 'SDK 尚未初始化。请先调用 initialize()。',
    ja: 'SDK が初期化されていません。最初に initialize() を呼び出してください。',
    ko: 'SDK가 초기화되지 않았습니다. 먼저 initialize()를 호출하세요.',
    es: 'El SDK no ha sido inicializado. Llame a initialize() primero.',
    fr: 'Le SDK n\'a pas été initialisé. Veuillez appeler initialize() d\'abord.',
    de: 'Das SDK wurde nicht initialisiert. Bitte rufen Sie zuerst initialize() auf.',
  },
  8001: {
    en: 'The SDK is already initialized. Call reset() before re-initializing.',
    zh: 'SDK 已初始化。重新初始化前请先调用 reset()。',
    ja: 'SDK はすでに初期化されています。再初期化する前に reset() を呼び出してください。',
    ko: 'SDK가 이미 초기화되었습니다. 다시 초기화하기 전에 reset()를 호출하세요.',
    es: 'El SDK ya está inicializado. Llame a reset() antes de reinicializar.',
    fr: 'Le SDK est déjà initialisé. Appelez reset() avant de réinitialiser.',
    de: 'Das SDK ist bereits initialisiert. Rufen Sie reset() vor der Neuinitialisierung auf.',
  },
  8002: {
    en: 'The SDK configuration is invalid or incomplete.',
    zh: 'SDK 配置无效或不完整。',
    ja: 'SDK の構成が無効または不完全です。',
    ko: 'SDK 구성이 유효하지 않거나 불완전합니다.',
    es: 'La configuración del SDK no es válida o está incompleta.',
    fr: 'La configuration du SDK est invalide ou incomplète.',
    de: 'Die SDK-Konfiguration ist ungültig oder unvollständig.',
  },
  8003: {
    en: 'SDK version is incompatible with the expected version.',
    zh: 'SDK 版本与预期版本不兼容。',
    ja: 'SDK バージョンが期待バージョンと互換性がありません。',
    ko: 'SDK 버전이 예상 버전과 호환되지 않습니다.',
    es: 'La versión del SDK no es compatible con la versión esperada.',
    fr: 'La version du SDK est incompatible avec la version attendue.',
    de: 'SDK-Version ist inkompatibel mit der erwarteten Version.',
  },
  8004: {
    en: 'A required dependency is missing from the environment.',
    zh: '环境中缺少必需的依赖项。',
    ja: '必要な依存関係が環境にありません。',
    ko: '환경에 필요한 종속성이 누락되었습니다.',
    es: 'Falta una dependencia requerida en el entorno.',
    fr: 'Une dépendance requise est manquante dans l\'environnement.',
    de: 'Eine erforderliche Abhängigkeit fehlt in der Umgebung.',
  },
  8005: {
    en: 'The called method has not been implemented.',
    zh: '调用的方法尚未实现。',
    ja: '呼び出されたメソッドは実装されていません。',
    ko: '호출된 메서드가 구현되지 않았습니다.',
    es: 'El método llamado no ha sido implementado.',
    fr: 'La méthode appelée n\'a pas été implémentée.',
    de: 'Die aufgerufene Methode wurde nicht implementiert.',
  },
  8006: {
    en: 'An invalid argument was passed to the SDK method.',
    zh: '向 SDK 方法传递了无效参数。',
    ja: 'SDK メソッドに無効な引数が渡されました。',
    ko: 'SDK 메서드에 잘못된 인수가 전달되었습니다.',
    es: 'Se pasó un argumento no válido al método del SDK.',
    fr: 'Un argument invalide a été passé à la méthode du SDK.',
    de: 'Ein ungültiges Argument wurde an die SDK-Methode übergeben.',
  },
  8007: {
    en: 'Failed to read or write SDK persistent storage.',
    zh: '无法读取或写入 SDK 持久化存储。',
    ja: 'SDK 永続ストレージの読み取りまたは書き込みに失敗しました。',
    ko: 'SDK 영구 저장소를 읽거나 쓰지 못했습니다.',
    es: 'No se pudo leer o escribir el almacenamiento persistente del SDK.',
    fr: 'Impossible de lire ou d\'écrire le stockage persistant du SDK.',
    de: 'Lesen oder Schreiben des SDK-Persistenzspeichers fehlgeschlagen.',
  },
  8008: {
    en: 'This API is deprecated and will be removed in a future version.',
    zh: '此 API 已弃用，将在未来版本中移除。',
    ja: 'この API は非推奨であり、将来のバージョンで削除されます。',
    ko: '이 API는 더 이상 사용되지 않으며 미래 버전에서 제거됩니다.',
    es: 'Esta API está obsoleta y será eliminada en una versión futura.',
    fr: 'Cette API est obsolète et sera supprimée dans une version future.',
    de: 'Diese API ist veraltet und wird in einer zukünftigen Version entfernt.',
  },

  // --- SECURITY (9000-9099) ---
  9000: {
    en: 'Session hijacking detected. Your session has been terminated for your security.',
    zh: '检测到会话劫持。出于安全考虑，您的会话已终止。',
    ja: 'セッションハイジャックが検出されました。セキュリティのためセッションは終了しました。',
    ko: '세션 하이재킹이 감지되었습니다. 보안을 위해 세션이 종료되었습니다.',
    es: 'Secuestro de sesión detectado. Su sesión ha sido terminada por su seguridad.',
    fr: 'Piratage de session détecté. Votre session a été terminée pour votre sécurité.',
    de: 'Session-Hijacking erkannt. Ihre Sitzung wurde zu Ihrer Sicherheit beendet.',
  },
  9001: {
    en: 'Potential man-in-the-middle attack detected. Connection terminated.',
    zh: '检测到潜在的中间人攻击。连接已终止。',
    ja: '中間者攻撃の可能性があります。接続は終了しました。',
    ko: '잠재적 중간자 공격이 감지되었습니다. 연결이 종료되었습니다.',
    es: 'Posible ataque de intermediario detectado. Conexión terminada.',
    fr: 'Potentielle attaque de l\'homme du milieu détectée. Connexion terminée.',
    de: 'Möglicher Man-in-the-Middle-Angriff erkannt. Verbindung beendet.',
  },
  9002: {
    en: 'Data integrity check failed. Data may have been tampered with.',
    zh: '数据完整性检查失败。数据可能已被篡改。',
    ja: 'データ整合性チェックに失敗しました。データが改ざんされた可能性があります。',
    ko: '데이터 무결성 검사에 실패했습니다. 데이터가 변조되었을 수 있습니다.',
    es: 'La verificación de integridad de datos falló. Los datos pueden haber sido manipulados.',
    fr: 'Le contrôle d\'intégrité des données a échoué. Les données ont pu être altérées.',
    de: 'Datenintegritätsprüfung fehlgeschlagen. Daten mögen manipuliert worden sein.',
  },
  9003: {
    en: 'Request origin does not match the registered origin.',
    zh: '请求来源与注册的来源不匹配。',
    ja: 'リクエストのオリジンが登録されたオリジンと一致しません。',
    ko: '요청 출처가 등록된 출처와 일치하지 않습니다.',
    es: 'El origen de la solicitud no coincide con el origen registrado.',
    fr: "L'origine de la requête ne correspond pas à l'origine enregistrée.",
    de: 'Anfrageherkunft stimmt nicht mit der registrierten Herkunft überein.',
  },
  9004: {
    en: 'Unusual activity pattern detected on this session.',
    zh: '在此会话上检测到异常活动模式。',
    ja: 'このセッションで異常なアクティビティパターンが検出されました。',
    ko: '이 세션에서 비정상적인 활동 패턴이 감지되었습니다.',
    es: 'Patrón de actividad inusual detectado en esta sesión.',
    fr: "Modèle d'activité inhabituel détecté sur cette session.",
    de: 'Ungewöhnliches Aktivitätsmuster in dieser Sitzung erkannt.',
  },
  9005: {
    en: 'Server certificate does not match the pinned certificate.',
    zh: '服务器证书与固定证书不匹配。',
    ja: 'サーバー証明書がピン留めされた証明書と一致しません。',
    ko: '서버 인증서가 고정된 인증서와 일치하지 않습니다.',
    es: 'El certificado del servidor no coincide con el certificado fijado.',
    fr: 'Le certificat du serveur ne correspond pas au certificat épinglé.',
    de: 'Serverzertifikat stimmt nicht mit dem gepinnten Zertifikat überein.',
  },
  9006: {
    en: 'A replayed message or transaction was detected.',
    zh: '检测到重放的消息或交易。',
    ja: '再生されたメッセージまたはトランザクションが検出されました。',
    ko: '재생된 메시지 또는 트랜잭션이 감지되었습니다.',
    es: 'Se detectó un mensaje o transacción repetida.',
    fr: 'Un message ou une transaction rejoué(e) a été détecté(e).',
    de: 'Eine wiedergegebene Nachricht oder Transaktion wurde erkannt.',
  },
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Resolve whether a locale is supported.
 */
export function isLocaleSupported(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Return the best available locale for a requested locale string.
 * Falls back to DEFAULT_LOCALE ('en') if not supported.
 */
export function resolveLocale(requested: string): SupportedLocale {
  if (isLocaleSupported(requested)) return requested;
  // Try prefix matching (e.g., "zh-CN" → "zh")
  const prefix = requested.split('-')[0].toLowerCase();
  if (isLocaleSupported(prefix)) return prefix;
  return DEFAULT_LOCALE;
}

/**
 * Get the user-facing message for an error code in a given locale.
 * Falls back to English, then to the numeric code if no message exists.
 */
export function getMessage(code: number, locale: string = DEFAULT_LOCALE): string {
  const resolved = resolveLocale(locale);
  const entry = MESSAGES[code];
  if (!entry) {
    return `Unknown error (code: ${code})`;
  }
  return entry[resolved] ?? entry[DEFAULT_LOCALE] ?? `Error ${code}`;
}

/**
 * Get all available translations for a given error code.
 */
export function getAllTranslations(code: number): Partial<Record<SupportedLocale, string>> {
  return MESSAGES[code] ?? {};
}
