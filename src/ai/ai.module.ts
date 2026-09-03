import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [AiService],
  // Export AiService so other modules (e.g., WebsocketGateway) can inject it
  exports: [AiService],
})
export class AiModule {}
