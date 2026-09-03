import {
  Controller,
  Get,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Temporary test endpoint – verifies the full NestJS → AiService → Gemini pipeline.
   * Remove or guard this route before going to production.
   *
   * GET /ai/test
   */
  @Get('test')
  async test(): Promise<{ prompt: string; response: string }> {
    const prompt = 'Hello, introduce yourself as Ethan Hunt, a Lead Developer.';

    this.logger.log(`[TEST] Calling AiService with prompt: "${prompt}"`);

    try {
      const response = await this.aiService.generateResponse(prompt);
      this.logger.log('[TEST] Gemini responded successfully.');
      return { prompt, response };
    } catch (error) {
      // Log the full error so it is visible in the backend terminal
      this.logger.error('[TEST] Gemini call failed:', error);

      throw new HttpException(
        {
          status: HttpStatus.BAD_GATEWAY,
          message: 'Gemini API call failed – check backend logs for details.',
          // Expose error message in response for easier troubleshooting (remove in prod)
          detail: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
