import { Injectable, Logger } from '@nestjs/common';
import { MentionService } from 'src/modules/mention/services/mention.service';
import { StickerService } from 'src/modules/sticker/sticker.service';
import { WebhookMessage, MessageData } from './contracts/webhook.dtos';
import { GeminiService } from '../gemini/gemini.service';
import { MessageService } from 'src/modules/message/message.service';
import { FootballService } from 'src/modules/football/football.service';
import { commandCache, processedMessageCache } from '../cache/lru-cache';
import { commandTtls } from '../cache/cache-config';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly mentionService: MentionService,
    private readonly stickerService: StickerService,
    private readonly messageService: MessageService,
    private readonly footballService: FootballService,
    private readonly geminiService: GeminiService,
  ) {}

  async processWebhook(data: WebhookMessage) {
    const instance = data.instance;
    const messages: MessageData[] =
      data.messages || (data.data ? [data.data] : []);

    for (const message of messages) {
      const timestamp = message.messageTimestamp;
      const messageId = message.key?.id;
      const groupJid = message.key?.remoteJid;

      // Validação básica da mensagem
      if (!groupJid || !messageId || !message.message) {
        this.logger.warn(
          `Mensagem inválida ignorada: ${JSON.stringify(message)}`,
        );
        continue;
      }

      // Ignora mensagens muito antigas (> 60s)
      if (timestamp && Date.now() - timestamp * 1000 > 60_000) {
        this.logger.debug(`Mensagem ${messageId} ignorada (antiga demais).`);
        continue;
      }

      // Extrai o comando (texto ou legenda de imagem)
      let body = '';
      if (message.message?.conversation) {
        body = message.message.conversation.trim();
      } else if (message.message?.extendedTextMessage?.text) {
        body = message.message.extendedTextMessage.text.trim();
      }
      const caption = message.message?.imageMessage?.caption
        ?.trim()
        ?.toLowerCase();
      const command = body || caption;

      // Configurações baseadas no comando
      const messageKey = `${command}:msg:${messageId}`;
      const cacheKey = `resposta:${command}:${groupJid}`;
      const { duplicateTtl = 60_000, cacheTtl = 60_000 } =
        commandTtls[command] || {};

      // Verificação de duplicidade (única vez por comando)
      if (processedMessageCache.has(messageKey)) {
        this.logger.debug(`[Duplicada] ${command} ignorado (já processado).`);
        continue;
      }
      processedMessageCache.set(messageKey, true, { ttl: duplicateTtl });

      // Tratamento específico para cada comando
      if (command === '/everyone') {
        if (commandCache.has(cacheKey)) {
          this.logger.debug(`[Cache] /everyone reaproveitado.`);
          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            '🔄 Ação já realizada recentemente. Aguarde antes de tentar novamente.',
          );
          continue;
        }

        try {
          this.logger.log(`Executando /everyone para ${groupJid}`);
          await this.mentionService.sendEveryone(instance, groupJid);
          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            '🔔 Todos foram mencionados!',
          );
          commandCache.set(cacheKey, true, { ttl: cacheTtl });
        } catch (err) {
          this.logger.error(`Erro ao executar /everyone:`, err);
          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            '⚠️ Erro ao mencionar todos. Tente novamente mais tarde.',
          );
        }
      }

      if (command === '/sticker') {
        if (commandCache.has(cacheKey)) {
          this.logger.debug(`[Cache] /sticker já processado.`);
          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            '🖼️ Sticker já convertido recentemente.',
          );
          continue;
        }

        try {
          this.logger.log(`Convertendo sticker para ${messageId}`);
          await this.stickerService.convertImageToSticker(
            instance,
            groupJid,
            messageId,
          );
          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            '✅ Imagem convertida em sticker!',
          );
          commandCache.set(cacheKey, true, { ttl: cacheTtl });
        } catch (err) {
          this.logger.error(`Erro ao converter sticker:`, err);
          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            '⚠️ Erro ao converter imagem para sticker.',
          );
        }
      }

      if (command === '/futebolbr') {
        if (commandCache.has(cacheKey)) {
          this.logger.debug(`[Cache] /futebolbr recuperado.`);
          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            '🔄 Usando resultados da rodada recente...',
          );
          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            commandCache.get(cacheKey) as string,
          );
          continue;
        }

        try {
          const rodada = await this.footballService.getCurrentMatchday();
          const resultados =
            await this.footballService.getMatchdayResults(rodada);
          const tabela = await this.footballService.getStandings();
          const artilheiros = await this.footballService.getTopScorers();
          const proximos = await this.footballService.getUpcomingMatches();

          const comentario = await this.geminiService.getResponse(`
          Comente com emoção os resultados da rodada ${rodada}:
          ${resultados}

          Formato:
          *🏟️ Jogo em Destaque:* Time A X Time B - Resumo
          *🔥 Destaque Individual:* Jogador - Motivo
          *🎯 Estatística Curiosa:* Dado interessante
          *📢 Resumo Geral:* Conclusão curta
        `);

          const mensagemFinal = [
            `⚽ Resultados da Rodada ${rodada} do Campeonato Brasileiro`,
            resultados,
            `\n🤖 Comentário da rodada:\n${comentario}`,
            `\n${tabela}`,
            `\n${artilheiros}`,
            `\n${proximos}`,
          ].join('\n\n');

          commandCache.set(cacheKey, mensagemFinal, { ttl: cacheTtl });

          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            '📢 Resumo da rodada carregado:',
          );
          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            mensagemFinal,
          );
        } catch (error) {
          this.logger.error(
            `Erro ao buscar informações do Brasileirão:`,
            error,
          );
          await this.messageService.sendTextMessage(
            instance,
            groupJid,
            '⚠️ Erro ao buscar informações do Brasileirão. Tente novamente mais tarde.',
          );
        }
      }

      if (!['/everyone', '/sticker', '/futebolbr'].includes(command)) {
        this.logger.debug(`Nenhum comando reconhecido em ${messageId}`);
      }
    }
  }
}
