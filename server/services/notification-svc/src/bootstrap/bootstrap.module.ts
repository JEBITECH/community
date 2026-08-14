import { Module } from '@nestjs/common';
import { BootstrapController } from './bootstrap.controller';
import { NotificationBootstrapService } from './bootstrap.service';
import { PreferenceModule } from '../preference/preference.module';

@Module({
  imports: [PreferenceModule],
  controllers: [BootstrapController],
  providers: [NotificationBootstrapService],
  exports: [NotificationBootstrapService],
})
export class BootstrapModule {}
