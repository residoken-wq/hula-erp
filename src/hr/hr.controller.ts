import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaveStatus } from './entities/leave-request.entity';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
    constructor(private readonly hrService: HrService) { }

    // ==================== WORK SHIFT ====================
    @Get('shifts')
    findAllShifts() {
        return this.hrService.findAllShifts();
    }

    @Post('shifts')
    createShift(@Body() data: any) {
        return this.hrService.createShift(data);
    }

    @Put('shifts/:id')
    updateShift(@Param('id') id: string, @Body() data: any) {
        return this.hrService.updateShift(+id, data);
    }

    @Delete('shifts/:id')
    deleteShift(@Param('id') id: string) {
        return this.hrService.deleteShift(+id);
    }

    // ==================== EMPLOYEE ====================
    @Get('employees')
    findAllEmployees() {
        return this.hrService.findAllEmployees();
    }

    @Get('employees/by-user/:userId')
    findEmployeeByUserId(@Param('userId') userId: string) {
        return this.hrService.findEmployeeByUserId(+userId);
    }

    @Get('employees/:id')
    findOneEmployee(@Param('id') id: string) {
        return this.hrService.findOneEmployee(+id);
    }

    @Post('employees')
    createEmployee(@Body() data: any) {
        return this.hrService.createEmployee(data);
    }

    @Put('employees/:id')
    updateEmployee(@Param('id') id: string, @Body() data: any) {
        return this.hrService.updateEmployee(+id, data);
    }

    @Delete('employees/:id')
    deleteEmployee(@Param('id') id: string) {
        return this.hrService.deleteEmployee(+id);
    }

    // ==================== ATTENDANCE ====================
    @Get('attendances')
    findAttendances(
        @Query('employee_id') employeeId?: string,
        @Query('month') month?: string,
        @Query('year') year?: string,
    ) {
        return this.hrService.findAttendances(
            employeeId ? +employeeId : undefined,
            month ? +month : undefined,
            year ? +year : undefined,
        );
    }

    @Post('check-in')
    checkIn(@Body('employee_id') employeeId: number) {
        return this.hrService.checkIn(employeeId);
    }

    @Post('check-out')
    checkOut(@Body('employee_id') employeeId: number) {
        return this.hrService.checkOut(employeeId);
    }

    @Post('attendances')
    createAttendance(@Body() data: any) {
        return this.hrService.createAttendance(data);
    }

    @Put('attendances/:id')
    updateAttendance(@Param('id') id: string, @Body() data: any) {
        return this.hrService.updateAttendance(+id, data);
    }

    @Delete('attendances/:id')
    deleteAttendance(@Param('id') id: string) {
        return this.hrService.deleteAttendance(+id);
    }

    // ==================== LEAVE REQUEST ====================
    @Get('leaves')
    findAllLeaves(@Query('status') status?: LeaveStatus) {
        return this.hrService.findAllLeaves(status);
    }

    @Post('leaves')
    createLeave(@Body() data: any) {
        return this.hrService.createLeave(data);
    }

    @Put('leaves/:id/approve')
    approveLeave(
        @Param('id') id: string,
        @Body() body: { approved: boolean; reject_reason?: string },
        @Request() req: any,
    ) {
        return this.hrService.approveLeave(+id, req.user.userId, body.approved, body.reject_reason);
    }

    @Delete('leaves/:id')
    deleteLeave(@Param('id') id: string) {
        return this.hrService.deleteLeave(+id);
    }

    // ==================== LEAVE ENTITLEMENT ====================
    @Get('entitlements')
    findEntitlements(
        @Query('employee_id') employeeId?: string,
        @Query('year') year?: string,
    ) {
        return this.hrService.findEntitlements(
            employeeId ? +employeeId : undefined,
            year ? +year : undefined,
        );
    }

    @Post('entitlements')
    createEntitlement(@Body() data: any) {
        return this.hrService.createEntitlement(data);
    }

    @Put('entitlements/:id')
    updateEntitlement(@Param('id') id: string, @Body() data: any) {
        return this.hrService.updateEntitlement(+id, data);
    }

    @Get('balance/:employeeId')
    getLeaveBalance(
        @Param('employeeId') employeeId: string,
        @Query('year') year?: string,
    ) {
        const y = year ? +year : new Date().getFullYear();
        return this.hrService.getLeaveBalance(+employeeId, y);
    }

    // ==================== ASSET ASSIGNMENT ====================
    @Get('assets')
    findAllAssets(@Query('employee_id') employeeId?: string) {
        return this.hrService.findAllAssets(employeeId ? +employeeId : undefined);
    }

    @Post('assets')
    createAsset(@Body() data: any) {
        return this.hrService.createAsset(data);
    }

    @Put('assets/:id')
    updateAsset(@Param('id') id: string, @Body() data: any) {
        return this.hrService.updateAsset(+id, data);
    }

    @Delete('assets/:id')
    deleteAsset(@Param('id') id: string) {
        return this.hrService.deleteAsset(+id);
    }

    // ==================== PAYSLIP ====================
    @Get('payslips')
    findPayslips(
        @Query('employee_id') employeeId?: string,
        @Query('month') month?: string,
        @Query('year') year?: string,
    ) {
        return this.hrService.findPayslips(
            employeeId ? +employeeId : undefined,
            month ? +month : undefined,
            year ? +year : undefined,
        );
    }

    @Post('payslips')
    createPayslip(@Body() data: any) {
        return this.hrService.createPayslip(data);
    }

    @Put('payslips/:id')
    updatePayslip(@Param('id') id: string, @Body() data: any) {
        return this.hrService.updatePayslip(+id, data);
    }

    @Delete('payslips/:id')
    deletePayslip(@Param('id') id: string) {
        return this.hrService.deletePayslip(+id);
    }

    // ==================== TRAINING PLAN ====================
    @Get('trainings')
    findTrainingPlans(@Query('employee_id') employeeId?: string) {
        return this.hrService.findTrainingPlans(employeeId ? +employeeId : undefined);
    }

    @Post('trainings')
    createTrainingPlan(@Body() data: any) {
        return this.hrService.createTrainingPlan(data);
    }

    @Put('trainings/:id')
    updateTrainingPlan(@Param('id') id: string, @Body() data: any) {
        return this.hrService.updateTrainingPlan(+id, data);
    }

    @Delete('trainings/:id')
    deleteTrainingPlan(@Param('id') id: string) {
        return this.hrService.deleteTrainingPlan(+id);
    }

    // ==================== RECRUITMENT ====================

    @Get('recruitment/jobs')
    findAllJobs() {
        return this.hrService.findAllJobs();
    }

    @Post('recruitment/jobs')
    createJob(@Body() data: any) {
        return this.hrService.createJob(data);
    }

    @Put('recruitment/jobs/:id')
    updateJob(@Param('id') id: string, @Body() data: any) {
        return this.hrService.updateJob(+id, data);
    }

    @Delete('recruitment/jobs/:id')
    deleteJob(@Param('id') id: string) {
        return this.hrService.deleteJob(+id);
    }

    @Get('recruitment/candidates')
    findCandidates(@Query('job_id') jobId?: string) {
        return this.hrService.findCandidates(jobId ? +jobId : undefined);
    }

    @Post('recruitment/candidates')
    createCandidate(@Body() data: any) {
        return this.hrService.createCandidate(data);
    }

    @Put('recruitment/candidates/:id')
    updateCandidate(@Param('id') id: string, @Body() data: any) {
        return this.hrService.updateCandidate(+id, data);
    }

    @Delete('recruitment/candidates/:id')
    deleteCandidate(@Param('id') id: string) {
        return this.hrService.deleteCandidate(+id);
    }

    @Post('recruitment/candidates/:id/send-assessment')
    sendAssessment(@Param('id') id: string, @Body('questions') questions: any[]) {
        return this.hrService.createAssessment(+id, questions);
    }

    @Get('recruitment/assessments/:candidateId')
    getAssessment(@Param('candidateId') candidateId: string) {
        return this.hrService.getAssessmentByCandidate(+candidateId);
    }
    
    @Post('recruitment/assessments/:id/evaluate')
    evaluateAssessment(@Param('id') id: string) {
        return this.hrService.evaluateAssessment(+id);
    }

    @Get('recruitment/interviews')
    findInterviews(@Query('candidate_id') candidateId?: string) {
        return this.hrService.findInterviews(candidateId ? +candidateId : undefined);
    }

    @Post('recruitment/interviews')
    createInterview(@Body() data: any) {
        return this.hrService.createInterview(data);
    }

    @Put('recruitment/interviews/:id')
    updateInterview(@Param('id') id: string, @Body() data: any) {
        return this.hrService.updateInterview(+id, data);
    }

    @Delete('recruitment/interviews/:id')
    deleteInterview(@Param('id') id: string) {
        return this.hrService.deleteInterview(+id);
    }
}
