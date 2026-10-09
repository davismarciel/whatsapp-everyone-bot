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
const usageLimit = createUsageLimit();

function isRecent(message: WAMessage): boolean {
  const value = message.messageTimestamp;
  const seconds = typeof value === 'number' ? value : value?.toNumber();
  return seconds === undefined || Math.abs(Date.now() - seconds * 1000) < 5 * 60_000;
}

async function connect(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const socket = makeWASocket({
    auth: state,
    logger,
    emitOwnEvents: true,
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
    if (connection === 'open') console.info('WhatsApp conectado. Pronto para /sticker.');
    if (connection === 'close') {
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

  socket.ev.on('messages.upsert', ({ messages }) => {
    for (const message of messages) {
      if (!isRecent(message) || !isStickerCommand(message)) continue;
      const chatId = message.key.remoteJid!;
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
