import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

export function createGeminiClient(
  configService: ConfigService,
): GoogleGenerativeAI {
  const apiKey = configService.get<string>('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error(
      'A chave da API Gemini (GEMINI_API_KEY) não foi definida no .env',
    );
  }

  return new GoogleGenerativeAI(apiKey);
}
