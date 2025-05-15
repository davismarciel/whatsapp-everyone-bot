import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StickerService {
  private readonly evolutionApiUrl: string;
  private readonly logger = new Logger(StickerService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.evolutionApiUrl =
      this.configService.get<string>('SERVER_URL') || 'http://localhost:8080';
  }

  async convertImageToSticker(
    instanceId: string,
    chatId: string,
    messageId: string,
  ): Promise<void> {
    try {
      const headers = {
        apikey: this.configService.get<string>('AUTHENTICATION_API_KEY'),
      };

      this.logger.log(`[Sticker] Buscando mídia para mensagem ${messageId}`);

      const base64Response = await firstValueFrom(
        this.httpService.post(
          `${this.evolutionApiUrl}/chat/getBase64FromMediaMessage/${instanceId}`,
          {
            message: {
              key: { id: messageId },
            },
          },
          { headers },
        ),
      );

      if (!base64Response.data?.base64) {
        throw new Error('Falha ao obter base64 da mídia');
      }

      this.logger.log(`[Sticker] Enviando sticker para ${chatId}`);

      await firstValueFrom(
        this.httpService.post(
          `${this.evolutionApiUrl}/message/sendSticker/${instanceId}`,
          {
            number: chatId,
            sticker: base64Response.data.base64,
          },
          { headers },
        ),
      );

      this.logger.log(`[Sticker] Sticker enviado com sucesso`);
    } catch (error) {
      this.logger.error(
        `[Sticker] Erro ao converter imagem:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
