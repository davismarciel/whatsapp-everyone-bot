import { Body, Controller, Post } from '@nestjs/common';
import { MentionService } from '../services/mention.service';

@Controller('mention')
export class MentionController {
  constructor(private readonly mentionService: MentionService) {}

  @Post('/everyone')
  handleEveryone(@Body() body: { instance: string; groupJid: string }) {
    return this.mentionService.sendEveryone(body.instance, body.groupJid);
  }
}
