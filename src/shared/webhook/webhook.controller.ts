import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { DefaultResponse, WebhookMessage } from './contracts/webhook.dtos';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async handleWebhook(@Body() body: WebhookMessage): Promise<DefaultResponse> {
    try {
      // Extrai a primeira mensagem relevante (pode vir em data ou messages[])
      const message = body.data || body.messages?.[0];

      // Tenta identificar o comando enviado (texto simples, extendido ou legenda da imagem)
      const command =
        message?.message?.conversation?.trim() ||
        message?.message?.extendedTextMessage?.text?.trim() ||
        message?.message?.imageMessage?.caption?.trim();

      // Se não for um comando (não começa com "/"), ignora
      if (!command?.startsWith('/')) {
        return { status: 'ignorado' };
      }

      // Log do comando e repassa para o serviço processar
      this.logger.debug(`Comando recebido: ${command}`);
      await this.webhookService.processWebhook(body);
      return { status: 'ok' };
    } catch (err) {
      // Em caso de erro, registra e responde com status de erro
      this.logger.error('Erro ao processar webhook', err);
      return { status: 'erro', motivo: 'Falha no webhook' };
    }
  }
}
