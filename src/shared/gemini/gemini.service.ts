import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly ai;
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.logger.log(`Using API Key: ${apiKey ? 'Provided' : 'Not provided'}`);
    this.ai = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  async getResponse(prompt: string): Promise<string> {
    this.logger.debug(`[IA] Enviando prompt: ${prompt.substring(0, 100)}...`);

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      this.logger.verbose(`[IA] Resposta bruta:`, response);

      const aiResponse =
        response.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Resposta vazia da IA';

      this.logger.log(
        `[IA] Resposta final: ${aiResponse.substring(0, 100)}...`,
      );

      return aiResponse;
    } catch (error) {
      this.logger.error(`[IA] Erro ao gerar resposta:`, error.message);
      return 'Desculpe, ocorreu um erro ao gerar a resposta da IA.';
    }
  }
}
