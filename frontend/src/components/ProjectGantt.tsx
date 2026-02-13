import React from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import dayjs from 'dayjs';
import api from '../utils/api';
import { message } from 'antd';

interface ProjectGanttProps {
    tasks: any[];
    milestones: any[];
    onUpdate?: () => void;
}

const ProjectGantt: React.FC<ProjectGanttProps> = ({ tasks, milestones, onUpdate }) => {
    // Transform data
    let ganttTasks: Task[] = [];

    // 1. Milestones as Project/Group type
    milestones.forEach(m => {
        const start = m.start_date ? new Date(m.start_date) : (m.due_date ? dayjs(m.due_date).subtract(1, 'day').toDate() : new Date());
        const end = m.due_date ? new Date(m.due_date) : dayjs(start).add(1, 'day').toDate();

        ganttTasks.push({
            start,
            end,
            name: m.title,
            id: `m-${m.id}`, // Prefix to avoid collision
            type: 'project',
            progress: m.status === 'DONE' ? 100 : 0, // Simplified progress
            isDisabled: false,
            styles: { progressColor: '#1890ff', progressSelectedColor: '#096dd9' }
        });
    });

    // 2. Tasks
    tasks.forEach(t => {
        const start = t.start_date ? new Date(t.start_date) : (t.created_at ? new Date(t.created_at) : new Date());
        const end = t.due_date ? new Date(t.due_date) : dayjs(start).add(1, 'hour').toDate();
        // If end is before start, fix it
        const finalEnd = end < start ? dayjs(start).add(1, 'day').toDate() : end;

        ganttTasks.push({
            start,
            end: finalEnd,
            name: t.title,
            id: `t-${t.id}`,
            type: 'task',
            project: t.milestone_id ? `m-${t.milestone_id}` : undefined,
            progress: t.status === 'DONE' ? 100 : (t.status === 'IN_PROGRESS' ? 50 : 0),
            isDisabled: false,
            styles: { progressColor: '#52c41a', progressSelectedColor: '#389e0d' }
        });
    });

    // Fallback if no data
    if (ganttTasks.length === 0) {
        return <div style={{ padding: 20, textAlign: 'center' }}>No timeline data available. Add milestones or tasks to see the chart.</div>;
    }

    const handleDateChange = async (task: Task) => {
        try {
            const isMilestone = task.id.startsWith('m-');
            const id = parseInt(task.id.split('-')[1]);
            const payload = {
                start_date: task.start,
                due_date: task.end
            };

            if (isMilestone) {
                await api.put(`/projects/milestones/${id}`, payload);
            } else {
                await api.put(`/tasks/${id}`, payload); // Need to ensure PUT /tasks/:id supports start_date
            }
            message.success('Timeline updated');
            if (onUpdate) onUpdate();
        } catch (e) {
            message.error('Failed to update timeline');
        }
    };

    return (
        <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
            <Gantt
                tasks={ganttTasks}
                viewMode={ViewMode.Day} // Could specificy Month/Year using buttons if needed
                onDateChange={handleDateChange}
                listCellWidth="155px"
                columnWidth={60}
            />
        </div>
    );
};

export default ProjectGantt;
