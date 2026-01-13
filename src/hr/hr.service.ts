import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { LeaveRequest, LeaveStatus, LeaveType } from './entities/leave-request.entity';
import { LeaveEntitlement } from './entities/leave-entitlement.entity';
import { AssetAssignment } from './entities/asset-assignment.entity';
import { Payslip } from './entities/payslip.entity';
import { TrainingPlan } from './entities/training-plan.entity';
import { WorkShift, AttendanceCalcType } from './entities/work-shift.entity';

@Injectable()
export class HrService {
    constructor(
        @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
        @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
        @InjectRepository(LeaveRequest) private leaveRepo: Repository<LeaveRequest>,
        @InjectRepository(LeaveEntitlement) private entitlementRepo: Repository<LeaveEntitlement>,
        @InjectRepository(AssetAssignment) private assetRepo: Repository<AssetAssignment>,
        @InjectRepository(Payslip) private payslipRepo: Repository<Payslip>,
        @InjectRepository(TrainingPlan) private trainingRepo: Repository<TrainingPlan>,
        @InjectRepository(WorkShift) private shiftRepo: Repository<WorkShift>,
    ) { }

    // ==================== WORK SHIFT ====================
    async findAllShifts() {
        return this.shiftRepo.find({ order: { name: 'ASC' } });
    }

    async createShift(data: Partial<WorkShift>) {
        const shift = this.shiftRepo.create(data);
        return this.shiftRepo.save(shift);
    }

    async updateShift(id: number, data: Partial<WorkShift>) {
        await this.shiftRepo.update(id, data);
        return this.shiftRepo.findOne({ where: { id } });
    }

    async deleteShift(id: number) {
        return this.shiftRepo.delete(id);
    }

    // ==================== EMPLOYEE ====================
    async findAllEmployees() {
        return this.employeeRepo.find({ relations: ['user', 'work_shift'], order: { id: 'DESC' } });
    }

    async findOneEmployee(id: number) {
        const emp = await this.employeeRepo.findOne({ where: { id }, relations: ['user', 'work_shift'] });
        if (!emp) throw new NotFoundException('Employee not found');
        return emp;
    }

    async findEmployeeByUserId(userId: number) {
        return this.employeeRepo.findOne({ where: { user_id: userId }, relations: ['user', 'work_shift'] });
    }

    async createEmployee(data: Partial<Employee>) {
        const employee = this.employeeRepo.create(data);
        return this.employeeRepo.save(employee);
    }

    async updateEmployee(id: number, data: Partial<Employee>) {
        await this.employeeRepo.update(id, data);
        return this.findOneEmployee(id);
    }

    async deleteEmployee(id: number) {
        return this.employeeRepo.delete(id);
    }

    // ==================== ATTENDANCE ====================
    async findAttendances(employeeId?: number, month?: number, year?: number) {
        const where: any = {};
        if (employeeId) where.employee_id = employeeId;

        // Filter by month/year if provided
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            where.date = Between(startDate, endDate);
        }

        return this.attendanceRepo.find({
            where,
            relations: ['employee'],
            order: { date: 'DESC', check_in: 'DESC' }
        });
    }

    async checkIn(employeeId: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today
        let attendance = await this.attendanceRepo.findOne({
            where: { employee_id: employeeId, date: today }
        });

        if (attendance && attendance.check_in) {
            return { message: 'Already checked in today', attendance };
        }

        const now = new Date();
        const isLate = now.getHours() >= 9; // Late if after 9 AM

        if (!attendance) {
            attendance = this.attendanceRepo.create({
                employee_id: employeeId,
                date: today,
                check_in: now,
                status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT
            });
        } else {
            attendance.check_in = now;
            attendance.status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
        }

        return this.attendanceRepo.save(attendance);
    }

    async checkOut(employeeId: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await this.attendanceRepo.findOne({
            where: { employee_id: employeeId, date: today }
        });

        if (!attendance) {
            throw new NotFoundException('No check-in record for today');
        }

        if (attendance.check_out) {
            return { message: 'Already checked out today', attendance };
        }

        attendance.check_out = new Date();

        // Calculate work hours
        if (attendance.check_in) {
            const diffMs = attendance.check_out.getTime() - attendance.check_in.getTime();
            attendance.work_hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        }

        return this.attendanceRepo.save(attendance);
    }

    async createAttendance(data: Partial<Attendance>) {
        const attendance = this.attendanceRepo.create(data);
        return this.attendanceRepo.save(attendance);
    }

    async updateAttendance(id: number, data: Partial<Attendance>) {
        await this.attendanceRepo.update(id, data);
        return this.attendanceRepo.findOne({ where: { id }, relations: ['employee'] });
    }

    async deleteAttendance(id: number) {
        return this.attendanceRepo.delete(id);
    }

    // ==================== LEAVE REQUEST ====================
    async findAllLeaves(status?: LeaveStatus) {
        const where: any = {};
        if (status) where.status = status;
        return this.leaveRepo.find({
            where,
            relations: ['employee', 'approved_by'],
            order: { created_at: 'DESC' }
        });
    }

    async createLeave(data: Partial<LeaveRequest>) {
        // Calculate days
        if (data.start_date && data.end_date) {
            const start = new Date(data.start_date);
            const end = new Date(data.end_date);
            data.days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
        const leave = this.leaveRepo.create(data);
        return this.leaveRepo.save(leave);
    }

    async approveLeave(id: number, approverId: number, approved: boolean, rejectReason?: string) {
        const leave = await this.leaveRepo.findOne({ where: { id } });
        if (!leave) throw new NotFoundException('Leave request not found');

        leave.status = approved ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;
        leave.approved_by_id = approverId;
        leave.approved_at = new Date();
        if (!approved && rejectReason) leave.reject_reason = rejectReason;

        return this.leaveRepo.save(leave);
    }

    async deleteLeave(id: number) {
        return this.leaveRepo.delete(id);
    }

    // ==================== LEAVE ENTITLEMENT ====================
    async findEntitlements(employeeId?: number, year?: number) {
        const where: any = {};
        if (employeeId) where.employee_id = employeeId;
        if (year) where.year = year;
        return this.entitlementRepo.find({ where, relations: ['employee'], order: { year: 'DESC' } });
    }

    async createEntitlement(data: Partial<LeaveEntitlement>) {
        // Check if entitlement already exists for this employee+year
        const existing = await this.entitlementRepo.findOne({
            where: { employee_id: data.employee_id, year: data.year }
        });

        if (existing) {
            // Update existing
            await this.entitlementRepo.update(existing.id, {
                annual_days: data.annual_days,
                carried_days: data.carried_days,
            });
            return this.entitlementRepo.findOne({ where: { id: existing.id }, relations: ['employee'] });
        }

        // Create new
        const entitlement = this.entitlementRepo.create(data);
        return this.entitlementRepo.save(entitlement);
    }

    async updateEntitlement(id: number, data: Partial<LeaveEntitlement>) {
        await this.entitlementRepo.update(id, data);
        return this.entitlementRepo.findOne({ where: { id }, relations: ['employee'] });
    }

    async getLeaveBalance(employeeId: number, year: number) {
        // Get entitlement for this year
        const entitlement = await this.entitlementRepo.findOne({
            where: { employee_id: employeeId, year }
        });

        // Get approved annual leaves for this year
        const approvedLeaves = await this.leaveRepo.find({
            where: {
                employee_id: employeeId,
                leave_type: LeaveType.ANNUAL,
                status: LeaveStatus.APPROVED,
            }
        });

        // Filter leaves within the year
        const usedDays = approvedLeaves
            .filter(l => new Date(l.start_date).getFullYear() === year)
            .reduce((sum, l) => sum + Number(l.days), 0);

        const annual = entitlement ? Number(entitlement.annual_days) : 12;
        const carried = entitlement ? Number(entitlement.carried_days) : 0;
        const total = annual + carried;
        const remaining = total - usedDays;

        return {
            year,
            annual_days: annual,
            carried_days: carried,
            total_days: total,
            used_days: usedDays,
            remaining_days: remaining,
        };
    }

    // ==================== ASSET ASSIGNMENT ====================
    async findAllAssets(employeeId?: number) {
        const where: any = {};
        if (employeeId) where.employee_id = employeeId;
        return this.assetRepo.find({ where, relations: ['employee'], order: { assigned_date: 'DESC' } });
    }

    async createAsset(data: Partial<AssetAssignment>) {
        const asset = this.assetRepo.create(data);
        return this.assetRepo.save(asset);
    }

    async updateAsset(id: number, data: Partial<AssetAssignment>) {
        await this.assetRepo.update(id, data);
        return this.assetRepo.findOne({ where: { id }, relations: ['employee'] });
    }

    async deleteAsset(id: number) {
        return this.assetRepo.delete(id);
    }

    // ==================== PAYSLIP ====================
    async findPayslips(employeeId?: number, month?: number, year?: number) {
        const where: any = {};
        if (employeeId) where.employee_id = employeeId;
        if (month) where.month = month;
        if (year) where.year = year;
        return this.payslipRepo.find({ where, relations: ['employee'], order: { year: 'DESC', month: 'DESC' } });
    }

    async createPayslip(data: Partial<Payslip>) {
        // Calculate derived values
        const actual = Number(data.actual_work_days) || 0;
        const standard = Number(data.standard_work_days) || 26;
        const base = Number(data.base_salary) || 0;

        // Formula: ROUND(base_salary / 25 * actual_work_days, -3) = rounds to nearest 1000
        data.actual_salary = Math.round((base / 25 * actual) / 1000) * 1000;

        const meal = Number(data.allowance_meal) || 0;
        const transport = Number(data.allowance_transport) || 0;
        const phone = Number(data.allowance_phone) || 0;
        const bonus = Number(data.bonus) || 0;

        data.gross_income = data.actual_salary + meal + transport + phone + bonus;

        // Company contributions (based on base_salary)
        data.bhxh_company = Math.round(base * 0.175);
        data.bhyt_company = Math.round(base * 0.03);
        data.bhtn_company = Math.round(base * 0.01);

        // Employee contributions
        data.bhxh_employee = Math.round(base * 0.08);
        data.bhyt_employee = Math.round(base * 0.015);
        data.bhtn_employee = Math.round(base * 0.01);

        // Net salary
        const totalDeductions =
            Number(data.bhxh_employee) +
            Number(data.bhyt_employee) +
            Number(data.bhtn_employee) +
            Number(data.union_fee || 0) +
            Number(data.tax_income || 0) +
            Number(data.other_deductions || 0);

        data.net_salary = data.gross_income - totalDeductions;

        const payslip = this.payslipRepo.create(data);
        return this.payslipRepo.save(payslip);
    }

    async updatePayslip(id: number, data: Partial<Payslip>) {
        // Recalculate if salary data changed
        if (data.base_salary || data.actual_work_days) {
            const existing = await this.payslipRepo.findOne({ where: { id } });
            const merged = { ...existing, ...data };
            return this.createPayslip({ ...merged, id });
        }
        await this.payslipRepo.update(id, data);
        return this.payslipRepo.findOne({ where: { id }, relations: ['employee'] });
    }

    async deletePayslip(id: number) {
        return this.payslipRepo.delete(id);
    }

    // ==================== TRAINING PLAN ====================
    async findTrainingPlans(employeeId?: number) {
        const where: any = {};
        if (employeeId) where.employee_id = employeeId;
        return this.trainingRepo.find({ where, relations: ['employee'], order: { created_at: 'DESC' } });
    }

    async createTrainingPlan(data: Partial<TrainingPlan>) {
        const plan = this.trainingRepo.create(data);
        return this.trainingRepo.save(plan);
    }

    async updateTrainingPlan(id: number, data: Partial<TrainingPlan>) {
        // Calculate progress from milestones
        if (data.milestones && Array.isArray(data.milestones)) {
            const total = data.milestones.length;
            const completed = data.milestones.filter(m => m.completed).length;
            data.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        }
        await this.trainingRepo.update(id, data);
        return this.trainingRepo.findOne({ where: { id }, relations: ['employee'] });
    }

    async deleteTrainingPlan(id: number) {
        return this.trainingRepo.delete(id);
    }
}
