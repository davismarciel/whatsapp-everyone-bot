import { Controller, Post, Body, Logger } from '@nestjs/common';
import { StickerService } from './sticker.service';
import { StickerWebhookMessage } from './contracts/sticker.contract';

@Controller('sticker')
export class StickerController {
  private readonly logger = new Logger(StickerController.name);

  constructor(private readonly stickerService: StickerService) {}

  /**
   * Endpoint separado para tratar apenas mensagens com imagem e legenda "/sticker".
   * Ideal para testes ou usos específicos fora do fluxo principal.
   */
  @Post('webhook')
  async handleWebhook(@Body() webhookData: StickerWebhookMessage) {
    const { instanceId, chatId, message } = webhookData;

    // Verifica se a mensagem é uma imagem com legenda "/sticker"
    const isStickerCommand =
      message.hasMedia &&
      message.type === 'image' &&
      message.body?.trim().toLowerCase() === '/sticker';

    if (!isStickerCommand) {
      this.logger.debug(
        'Comando /sticker não detectado ou não é imagem com mídia.',
      );
      return;
    }

    // Aciona a conversão da imagem para figurinha
    this.logger.log(
      `Convertendo imagem para figurinha - Mensagem: ${message.id}`,
    );
    await this.stickerService.convertImageToSticker(
      instanceId,
      chatId,
      message.id,
    );
  }
}
