import { Controller, Post, Body, Logger } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  private readonly logger = new Logger(MessageController.name);

  constructor(private readonly messageService: MessageService) {}

  @Post('send')
  async sendMessage(
    @Body() body: { instanceId: string; chatId: string; text: string },
  ) {
    const { instanceId, chatId, text } = body;
    this.logger.log(`Enviando mensagem para ${chatId}: ${text}`);
    await this.messageService.sendTextMessage(instanceId, chatId, text);
    return { status: 'mensagem enviada' };
  }
}
