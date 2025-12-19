import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: 'INFO' }) // INFO, WARNING, SUCCESS, ERROR
  type: string;

  @Column({ default: false })
  is_read: boolean;

  @Column({ nullable: true })
  link: string; // Link để click vào (VD: /tasks/123)

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  user_id: number;

  @CreateDateColumn()
  created_at: Date;
}