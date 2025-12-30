import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { SystemConfig } from './system-config.entity';
import { ActivityLog } from './entities/activity-log.entity';

import { ActivitySubscriber } from './subscribers/activity.subscriber';
import { UserContextService } from '../common/services/user-context.service';

@Module({
    imports: [TypeOrmModule.forFeature([SystemConfig, ActivityLog])],
    controllers: [SystemController],
    providers: [SystemService, ActivitySubscriber, UserContextService],
    exports: [SystemService, UserContextService]
})
export class SystemModule { }
