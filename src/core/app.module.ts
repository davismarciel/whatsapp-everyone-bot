import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookModule } from '../shared/webhook/webhook.module';
import { MentionController } from '../modules/mention/controllers/mention.controller';
import { MentionService } from '../modules/mention/services/mention.service';
import { MentionsModule } from '../modules/mention/mention.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), WebhookModule, MentionsModule, HttpModule],
  controllers: [AppController, MentionController],
  providers: [AppService, MentionService ],
  exports: [MentionService],
})
export class AppModule {}
