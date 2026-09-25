import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthOnly } from '../auth/permissions.decorator';
import { LeaveStatus } from './entities/leave-request.entity';

@Controller('hr/me')
@UseGuards(JwtAuthGuard)
export class HrMeController {
  constructor(private readonly hrService: HrService) {}

  private async resolveMyEmployee(req: any) {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      throw new NotFoundException('Tài khoản chưa được liên kết hồ sơ nhân viên');
    }
    const employee = await this.hrService.findEmployeeByUserId(+userId);
    if (!employee) {
      throw new NotFoundException('Tài khoản chưa được liên kết hồ sơ nhân viên');
    }
    return employee;
  }

  @Get()
  @AuthOnly()
  async getMyProfile(@Request() req: any) {
    return this.resolveMyEmployee(req);
  }

  @Get('attendances')
  @AuthOnly()
  async getMyAttendances(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const employee = await this.resolveMyEmployee(req);
    return this.hrService.findAttendances(
      employee.id,
      month ? +month : undefined,
      year ? +year : undefined,
    );
  }

  @Get('leaves')
  @AuthOnly()
  async getMyLeaves(
    @Request() req: any,
    @Query('status') status?: LeaveStatus,
  ) {
    const employee = await this.resolveMyEmployee(req);
    const leaves = await this.hrService.findAllLeaves(status);
    return leaves.filter((l: any) => l.employee_id === employee.id);
  }

  @Get('payslips')
  @AuthOnly()
  async getMyPayslips(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const employee = await this.resolveMyEmployee(req);
    return this.hrService.findPayslips(
      employee.id,
      month ? +month : undefined,
      year ? +year : undefined,
    );
  }

  @Get('assets')
  @AuthOnly()
  async getMyAssets(@Request() req: any) {
    const employee = await this.resolveMyEmployee(req);
    return this.hrService.findAllAssets(employee.id);
  }

  @Get('balance')
  @AuthOnly()
  async getMyLeaveBalance(
    @Request() req: any,
    @Query('year') year?: string,
  ) {
    const employee = await this.resolveMyEmployee(req);
    const y = year ? +year : new Date().getFullYear();
    return this.hrService.getLeaveBalance(employee.id, y);
  }

  @Post('check-in')
  @AuthOnly()
  async checkIn(@Request() req: any) {
    const employee = await this.resolveMyEmployee(req);
    return this.hrService.checkIn(employee.id);
  }

  @Post('check-out')
  @AuthOnly()
  async checkOut(@Request() req: any) {
    const employee = await this.resolveMyEmployee(req);
    return this.hrService.checkOut(employee.id);
  }

  @Post('leaves')
  @AuthOnly()
  async createMyLeave(@Request() req: any, @Body() body: any) {
    const employee = await this.resolveMyEmployee(req);
    const { status, employee_id, ...rest } = body || {};
    return this.hrService.createLeave({
      ...rest,
      employee_id: employee.id,
      status: LeaveStatus.PENDING,
    });
  }
}
