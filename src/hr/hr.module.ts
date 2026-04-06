import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveEntitlement } from './entities/leave-entitlement.entity';
import { AssetAssignment } from './entities/asset-assignment.entity';
import { Payslip } from './entities/payslip.entity';
import { TrainingPlan } from './entities/training-plan.entity';
import { WorkShift } from './entities/work-shift.entity';
import { JobPost } from './entities/job-post.entity';
import { Candidate } from './entities/candidate.entity';
import { Assessment } from './entities/assessment.entity';
import { Interview } from './entities/interview.entity';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Employee,
            Attendance,
            LeaveRequest,
            LeaveEntitlement,
            AssetAssignment,
            Payslip,
            TrainingPlan,
            WorkShift,
            JobPost,
            Candidate,
            Assessment,
            Interview,
        ]),
        AiModule,
    ],
    controllers: [HrController],
    providers: [HrService],
    exports: [HrService],
})
export class HrModule { }

