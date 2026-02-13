import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Milestone } from './milestone.entity';
import { Task } from '../../tasks/task.entity';

export enum ProjectStatus {
    PLANNING = 'PLANNING',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED',
    ON_HOLD = 'ON_HOLD'
}

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PLANNING })
    status: ProjectStatus;

    @Column({ type: 'timestamp', nullable: true })
    start_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    end_date: Date; // Expected end date

    @ManyToOne(() => User)
    @JoinColumn({ name: 'manager_id' })
    manager: User;

    @Column({ nullable: true })
    manager_id: number;

    @OneToMany(() => Milestone, (m) => m.project)
    milestones: Milestone[];

    @OneToMany(() => Task, (t) => t.project)
    tasks: Task[]; // Tasks directly linked to project

    @CreateDateColumn() created_at: Date;
    @UpdateDateColumn() updated_at: Date;
}
