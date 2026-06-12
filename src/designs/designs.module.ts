import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignsController } from './designs.controller';
import { DesignsService } from './designs.service';
import { CustomerLogo } from './entities/customer-logo.entity';
import { PrintDesign } from './entities/print-design.entity';
import { PrintSample } from './entities/print-sample.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerLogo, PrintDesign, PrintSample])
  ],
  controllers: [DesignsController],
  providers: [DesignsService],
  exports: [DesignsService]
})
export class DesignsModule {}
