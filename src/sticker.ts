import { extractMessageContent, isJidUser, isLidUser, type WAMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_STICKER_BYTES = 100 * 1024;

export function isStickerCommand(message: WAMessage): boolean {
  const content = extractMessageContent(message.message);
  const caption = content?.imageMessage?.caption;
  const chatId = message.key.remoteJid;
  return isPrivateChat(chatId) &&
    typeof caption === 'string' &&
    caption.trim().toLowerCase() === '/sticker';
}

export function isPrivateChat(jid: string | undefined | null): boolean {
  return typeof jid === 'string' && (isJidUser(jid) === true || isLidUser(jid) === true);
}

export async function toSticker(image: Buffer): Promise<Buffer> {
  if (image.length === 0 || image.length > MAX_IMAGE_BYTES) {
    throw new Error('Imagem vazia ou maior que 10 MB');
  }

  for (const quality of [80, 65, 50, 35, 20]) {
    const sticker = await sharp(image, { limitInputPixels: 40_000_000, animated: false })
      .rotate()
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality, effort: 5 })
      .toBuffer();
    if (sticker.length <= MAX_STICKER_BYTES) return sticker;
  }

  throw new Error('Não foi possível gerar uma figurinha de até 100 KB');
}
