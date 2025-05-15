import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MentionService {
  private readonly logger = new Logger(MentionService.name);

  constructor(private readonly httpService: HttpService) {}

  async sendEveryone(instance: string, groupJid: string) {
    try {
      const members = await this.getGroupMembers(instance, groupJid);
      this.logger.log(`[Mention] Gerado para ${members.length} membros`);

      const mentionText =
        members.map((jid) => `@${jid.split('@')[0]}`).join(' ') + ' atenção!';

      await this.httpService.axiosRef.post(
        `${process.env.SERVER_URL}/message/sendText/${instance}`,
        {
          number: groupJid,
          text: mentionText,
          mentioned: members,
        },
        { headers: { apikey: process.env.AUTHENTICATION_API_KEY } },
      );

      this.logger.log(`[Mention] Mensagem enviada para grupo ${groupJid}`);
    } catch (error) {
      this.logger.error(`[Mention] Falha ao mencionar todos:`, error.message);
      throw error;
    }
  }

  private async getGroupMembers(
    instance: string,
    groupJid: string,
  ): Promise<string[]> {
    try {
      const res = await this.httpService.axiosRef.get(
        `${process.env.SERVER_URL}/group/participants/${instance}?groupJid=${groupJid}`,
        { headers: { apikey: process.env.AUTHENTICATION_API_KEY } },
      );
      return res.data.participants.map((p) => p.id);
    } catch (error) {
      this.logger.warn(
        `[Mention] Falha ao buscar membros do grupo:`,
        error.message,
      );
      return [];
    }
  }
}
