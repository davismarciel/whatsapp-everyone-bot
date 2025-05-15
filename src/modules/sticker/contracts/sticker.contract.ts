export interface StickerWebhookMessage {
  instanceId: string;
  chatId: string;
  message: StickerMessage;
}

export interface StickerMessage {
  id: string;
  body?: string;
  type: string;
  fromMe: boolean;
  hasMedia: boolean;
}
