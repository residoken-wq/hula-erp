import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { Task } from '../../tasks/task.entity';

@Entity('milestones')
export class Milestone {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'timestamp', nullable: true })
    due_date: Date;

    @Column({ default: 'PENDING' }) // PENDING, DONE
    status: string;

    @ManyToOne(() => Project, (p) => p.milestones, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @Column()
    project_id: number;

    @OneToMany(() => Task, (t) => t.milestone)
    tasks: Task[];

    @CreateDateColumn() created_at: Date;
}
