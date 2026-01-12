import React, { useState, useEffect } from 'react';
import { Tabs, Card } from 'antd';
import {
    UserOutlined, ClockCircleOutlined, CalendarOutlined, GiftOutlined,
    DollarOutlined, ReadOutlined, TeamOutlined, ScheduleOutlined
} from '@ant-design/icons';
import api from '../utils/api';

// Import HR Components
import EmployeesTab from '../components/hr/EmployeesTab';
import AttendanceTab from '../components/hr/AttendanceTab';
import LeaveTab from '../components/hr/LeaveTab';
import AssetsTab from '../components/hr/AssetsTab';
import PayslipTab from '../components/hr/PayslipTab';
import TrainingTab from '../components/hr/TrainingTab';
import ShiftsTab from '../components/hr/ShiftsTab';

const { TabPane } = Tabs;

const HRPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('employees');

    // Shared data states
    const [employees, setEmployees] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [attendances, setAttendances] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [payslips, setPayslips] = useState<any[]>([]);
    const [trainings, setTrainings] = useState<any[]>([]);

    // Load core data on mount
    useEffect(() => {
        loadEmployees();
        loadUsers();
        loadShifts();
    }, []);

    // Load tab-specific data when tab changes
    useEffect(() => {
        if (activeTab === 'attendance') loadAttendances();
        if (activeTab === 'leave') loadLeaves();
        if (activeTab === 'assets') loadAssets();
        if (activeTab === 'payslip') loadPayslips();
        if (activeTab === 'training') loadTrainings();
    }, [activeTab]);

    const loadEmployees = async () => {
        try {
            const res = await api.get('/hr/employees');
            setEmployees(res.data);
        } catch (e) { console.error(e); }
    };

    const loadUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e) { console.error(e); }
    };

    const loadShifts = async () => {
        try {
            const res = await api.get('/hr/shifts');
            setShifts(res.data);
        } catch (e) { console.error(e); }
    };

    const loadAttendances = async () => {
        try {
            const res = await api.get('/hr/attendances');
            setAttendances(res.data);
        } catch (e) { console.error(e); }
    };

    const loadLeaves = async () => {
        try {
            const res = await api.get('/hr/leaves');
            setLeaves(res.data);
        } catch (e) { console.error(e); }
    };

    const loadAssets = async () => {
        try {
            const res = await api.get('/hr/assets');
            setAssets(res.data);
        } catch (e) { console.error(e); }
    };

    const loadPayslips = async () => {
        try {
            const res = await api.get('/hr/payslips');
            setPayslips(res.data);
        } catch (e) { console.error(e); }
    };

    const loadTrainings = async () => {
        try {
            const res = await api.get('/hr/trainings');
            setTrainings(res.data);
        } catch (e) { console.error(e); }
    };

    return (
        <div style={{ padding: 20 }}>
            <Card title={<><TeamOutlined /> Quản Lý Nhân Sự (HR)</>}>
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab={<><UserOutlined /> Nhân viên</>} key="employees">
                        <EmployeesTab employees={employees} users={users} shifts={shifts} onRefresh={loadEmployees} />
                    </TabPane>

                    <TabPane tab={<><ClockCircleOutlined /> Chấm công</>} key="attendance">
                        <AttendanceTab employees={employees} attendances={attendances} onRefresh={loadAttendances} />
                    </TabPane>

                    <TabPane tab={<><CalendarOutlined /> Nghỉ phép</>} key="leave">
                        <LeaveTab employees={employees} leaves={leaves} onRefresh={loadLeaves} />
                    </TabPane>

                    <TabPane tab={<><GiftOutlined /> Tài sản</>} key="assets">
                        <AssetsTab employees={employees} assets={assets} onRefresh={loadAssets} />
                    </TabPane>

                    <TabPane tab={<><DollarOutlined /> Bảng lương</>} key="payslip">
                        <PayslipTab employees={employees} payslips={payslips} onRefresh={loadPayslips} />
                    </TabPane>

                    <TabPane tab={<><ReadOutlined /> Đào tạo</>} key="training">
                        <TrainingTab employees={employees} trainings={trainings} onRefresh={loadTrainings} />
                    </TabPane>

                    <TabPane tab={<><ScheduleOutlined /> Ca làm việc</>} key="shifts">
                        <ShiftsTab shifts={shifts} onRefresh={loadShifts} />
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
};

export default HRPage;
