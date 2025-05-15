import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MessageService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async sendTextMessage(
    instanceId: string,
    chatId: string,
    text: string,
  ): Promise<void> {
    const headers = {
      apikey:
        this.configService.get<string>('AUTHENTICATION_API_KEY') || 'everyone',
    };
    console.log('[MessageService] Enviando mensagem:', {
      number: chatId,
      text,
    });

    await firstValueFrom(
      this.httpService.post(
        `${this.configService.get<string>('SERVER_URL')}/message/sendText/${instanceId}`,
        {
          number: chatId,
          options: {
            delay: 0,
            presence: 'composing',
          },
          text: text,
        },
        { headers },
      ),
    );
  }
}
