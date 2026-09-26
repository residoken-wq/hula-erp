import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('chatbot_tickets')
export class ChatbotTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 32 })
  category: string;

  @Column({ type: 'varchar', length: 8, default: 'normal' })
  priority: string;

  @Column({ type: 'varchar', length: 20, default: 'received' })
  status: string;

  @Index()
  @Column({ type: 'uuid' })
  conversation_id: string;

  @Column({ type: 'uuid', nullable: true })
  request_id: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  contact: any;

  @Column({ type: 'int', nullable: true })
  owner_user_id: number | null;

  @Column({ type: 'text', nullable: true })
  customer_update: string | null;

  @Column({ type: 'text', nullable: true })
  internal_note: string | null;

  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  idempotency_key: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
