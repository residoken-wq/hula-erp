import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserGroup } from './user-group.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ select: false }) // Không trả về password khi query thường
  password: string; 

  @Column()
  full_name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => UserGroup, (group) => group.users)
  @JoinColumn({ name: 'group_id' })
  group: UserGroup;

  @Column({ nullable: true })
  group_id: number;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}