import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('chatbot_briefs')
@Index(['conversation_id', 'revision'], { unique: true })
export class ChatbotBrief {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversation_id: string;

  @Column({ type: 'int' })
  revision: number;

  @Column({ type: 'jsonb' })
  data: any;

  @Column({ type: 'varchar', length: 24 })
  changed_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
