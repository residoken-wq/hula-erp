import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { SystemConfig } from './system-config.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SystemConfig])],
    controllers: [SystemController],
    providers: [SystemService],
    exports: [SystemService]
})
export class SystemModule { }
