import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { AssetAssignment } from './entities/asset-assignment.entity';
import { Payslip } from './entities/payslip.entity';
import { TrainingPlan } from './entities/training-plan.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Employee,
            Attendance,
            LeaveRequest,
            AssetAssignment,
            Payslip,
            TrainingPlan,
        ]),
    ],
    controllers: [HrController],
    providers: [HrService],
    exports: [HrService],
})
export class HrModule { }
