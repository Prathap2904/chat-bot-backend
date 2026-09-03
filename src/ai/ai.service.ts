import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenAI;
  private readonly modelName = 'gemini-3.6-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set. Please add it to your .env file.',
      );
    }

    this.genAI = new GoogleGenAI({ apiKey });
    this.logger.log(`AiService initialized with model: ${this.modelName}`);
  }

  /**
   * Sends a message to the Gemini API and returns the generated text response.
   * @param message - The user's input message.
   * @returns The generated text from Gemini.
   */
  async generateResponse(message: string): Promise<string> {
    this.logger.log(
      `Sending message to Gemini: "${message.substring(0, 80)}..."`,
    );

    try {
      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: message,
      });

      const text = response.text;

      if (!text) {
        this.logger.warn('Gemini returned an empty response.');
        return 'I received your message but could not generate a response. Please try again.';
      }

      this.logger.log('Successfully received response from Gemini.');
      return text;
    } catch (error) {
      this.logger.error('Error calling Gemini API', error);
      throw new InternalServerErrorException(
        'Failed to get a response from the AI service. Please try again later.',
      );
    }
  }
}
