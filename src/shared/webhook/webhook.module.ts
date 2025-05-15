import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { MentionsModule } from 'src/modules/mention/mention.module';
import { StickerModule } from 'src/modules/sticker/sticker.module';
import { GeminiModule } from '../gemini/gemini.module';
import { MessageModule } from 'src/modules/message/message.module';
import { FootballModule } from 'src/modules/football/football.module';

@Module({
  imports: [
    MentionsModule,
    StickerModule,
    GeminiModule,
    MessageModule,
    FootballModule,
  ],
  providers: [WebhookService],
  controllers: [WebhookController],
})
export class WebhookModule {}
