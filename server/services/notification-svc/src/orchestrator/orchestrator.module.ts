import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@shared/entities/src/user.entity';
import { DatabaseModule } from '../database/database.module';
import { PreferenceModule } from '../preference/preference.module';
import { TemplateModule } from '../template/template.module';
import { QueueModule } from '../queue/queue.module';
import { OrchestratorService } from './orchestrator.service';

@Module({
  imports: [
    DatabaseModule,
    PreferenceModule,
    TemplateModule,
    QueueModule,
    TypeOrmModule.forFeature([User]),
  ],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
