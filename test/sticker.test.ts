import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import type { WAMessage } from '@whiskeysockets/baileys';
import { isStickerCommand, toSticker } from '../src/sticker.ts';

function message(caption: string, fromMe = false): WAMessage {
  return {
    key: { remoteJid: '5511999999999@s.whatsapp.net', id: 'id', fromMe },
    message: { imageMessage: { caption } },
  };
}

test('aceita imagem com /sticker de outra pessoa ou do próprio número', () => {
  assert.equal(isStickerCommand(message(' /STICKER ')), true);
  assert.equal(isStickerCommand(message('/sticker', true)), true);
  assert.equal(isStickerCommand(message('/everyone')), false);
  assert.equal(isStickerCommand({ ...message('/sticker'), message: { conversation: '/sticker' } }), false);
  assert.equal(isStickerCommand({ ...message('/sticker'), key: { remoteJid: '123456789@lid' } }), true);
  assert.equal(isStickerCommand({ ...message('/sticker'), key: { remoteJid: '120363000000000000@g.us' } }), false);
  assert.equal(isStickerCommand({ ...message('/sticker'), key: { remoteJid: 'status@broadcast' } }), false);
});

test('converte imagem para WebP quadrado dentro do limite do WhatsApp', async () => {
  const image = await sharp({ create: { width: 1200, height: 600, channels: 4, background: '#ff0033' } })
    .png()
    .toBuffer();
  const sticker = await toSticker(image);
  const metadata = await sharp(sticker).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 512);
  assert.equal(metadata.height, 512);
  assert.ok(sticker.length <= 100 * 1024);
});

test('rejeita mídia inválida', async () => {
  await assert.rejects(() => toSticker(Buffer.alloc(0)), /vazia/);
  await assert.rejects(() => toSticker(Buffer.from('não é imagem')), /unsupported image format/i);
});
