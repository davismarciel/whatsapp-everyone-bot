export interface WebhookMessage {
  instance: string;
  messages: MessageData[];
  data?: MessageData;
}
export interface MessageData {
  key: {
    id: string;
    remoteJid: string;
  };
  messageTimestamp: number;
  message?: any;
}
export interface DefaultResponse {
  status: 'ok' | 'erro' | 'ignorado';
  motivo?: string;
  dados?: any;
}
