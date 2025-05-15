import { Module } from '@nestjs/common';
import { MentionService } from './services/mention.service';
import { MentionController } from './controllers/mention.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [MentionController],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionsModule {}
