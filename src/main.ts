import { createHash, createHmac, randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import makeWASocket, {
  DisconnectReason,
  downloadMediaMessage,
  useMultiFileAuthState,
  type WAMessage,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { isPrivateChat, isStickerCommand, toSticker } from './sticker.ts';
import { createUsageLimit } from './usage-limit.ts';

const logger = pino({ level: 'warn' });
const sessionDir = process.env.SESSION_DIR ?? './data/session';
const RECONNECT_DELAY_MS = 5_000;
const MAX_MESSAGE_AGE_MS = 5 * 60_000;
const RECONNECT_SETTLE_MS = 90_000;
const startedAtSeconds = Math.floor(Date.now() / 1000);
const usageLimit = createUsageLimit();
const processedFile = join(sessionDir, 'processed-requests.log');
mkdirSync(sessionDir, { recursive: true });
const processedRequests = new Set(
  existsSync(processedFile) ? readFileSync(processedFile, 'utf8').split('\n').filter(Boolean) : [],
);
const logKey = randomBytes(32);
let acceptAfter = Infinity;

function requestToken(chatId: string, messageId: string): string {
  return createHmac('sha256', logKey).update(chatId).update(':').update(messageId).digest('hex').slice(0, 12);
}

function isRecent(message: WAMessage): boolean {
  const value = message.messageTimestamp;
  const seconds = typeof value === 'number' ? value : value?.toNumber();
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return false;
  const ageMs = Date.now() - seconds * 1000;
  return seconds > startedAtSeconds && ageMs >= 0 && ageMs < MAX_MESSAGE_AGE_MS;
}

async function connect(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const socket = makeWASocket({
    auth: state,
    logger,
    emitOwnEvents: true,
    maxMsgRetryCount: 0,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    shouldIgnoreJid: (jid) => !isPrivateChat(jid),
  });

  socket.ev.on('creds.update', saveCreds);
  socket.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.info('Abra WhatsApp > Aparelhos conectados > Conectar aparelho e leia o QR Code:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      acceptAfter = Date.now() + RECONNECT_SETTLE_MS;
      console.info('WhatsApp conectado. Aguardando mensagens pendentes antes de aceitar /sticker.');
      setTimeout(() => {
        if (Date.now() >= acceptAfter) console.info('WhatsApp conectado. Pronto para /sticker.');
      }, RECONNECT_SETTLE_MS);
    }
    if (connection === 'close') {
      acceptAfter = Infinity;
      const status = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
      if (status === DisconnectReason.loggedOut) {
        console.error('Sessão desconectada pelo WhatsApp. Verifique a sessão antes de vincular novamente.');
        process.exit(0);
      }
      console.warn('Conexão encerrada; tentando reconectar em 5 segundos.');
      setTimeout(() => void connect().catch((error: unknown) => {
        console.error('Falha ao reconectar', error);
        process.exit(1);
      }), RECONNECT_DELAY_MS);
    }
  });

  socket.ev.on('messages.upsert', ({ messages, type }) => {
    for (const message of messages) {
      if (!isStickerCommand(message)) continue;
      const chatId = message.key.remoteJid!;
      const messageId = message.key.id;
      if (!messageId) continue;
      const request = createHash('sha256').update(chatId).update(':').update(messageId).digest('hex');
      if (processedRequests.has(request)) continue;
      try {
        appendFileSync(processedFile, `${request}\n`, { mode: 0o600 });
        processedRequests.add(request);
      } catch (error) {
        console.error('Falha ao registrar pedido /sticker', error);
        continue;
      }
      const value = message.messageTimestamp;
      const seconds = typeof value === 'number' ? value : value?.toNumber();
      console.info('Pedido /sticker observado', {
        type,
        ageSeconds: typeof seconds === 'number' ? Math.round(Date.now() / 1000 - seconds) : null,
        sinceStartSeconds: typeof seconds === 'number' ? seconds - startedAtSeconds : null,
        fromMe: message.key.fromMe === true,
        request: requestToken(chatId, messageId),
        ready: Date.now() >= acceptAfter,
      });
      if (type !== 'notify' || !isRecent(message) || Date.now() < acceptAfter ||
          seconds === undefined || seconds * 1000 < acceptAfter) continue;
      if (!usageLimit.tryAcquire(chatId)) continue;
      void (async () => {
        try {
          const image = await downloadMediaMessage(message, 'buffer', {}, {
            logger,
            reuploadRequest: socket.updateMediaMessage,
          });
          const sticker = await toSticker(image);
          await socket.sendMessage(chatId, { sticker }, { quoted: message });
          console.info('Figurinha enviada.');
        } catch (error) {
          console.error('Falha ao gerar figurinha', error);
        } finally {
          usageLimit.release();
        }
      })();
    }
  });
}

void connect().catch((error: unknown) => {
  console.error('Falha ao iniciar o bot', error);
  process.exit(1);
});
