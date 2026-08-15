import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventChatMessage } from './entities/event-chat-message.entity';
import { ChatConfig } from './entities/chat-config.entity';
import { ChatConfigService } from './chat-config.service';
import { ChatConfigController } from './chat-config.controller';
import { ChatHistoryController } from './chat-history.controller';
import { ChatGateway } from './chat.gateway';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Event, EventChatMessage, ChatConfig, User])],
  controllers: [ChatConfigController, ChatHistoryController],
  providers: [ChatConfigService, ChatGateway],
})
export class ChatModule {}
