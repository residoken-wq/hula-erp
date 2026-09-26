import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('chatbot_requests')
export class ChatbotRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 20 })
  type: string;

  @Index()
  @Column({ type: 'uuid' })
  conversation_id: string;

  @Column({ type: 'int', nullable: true })
  brief_revision: number | null;

  @Column({ type: 'jsonb' })
  contact: any;

  @Column({ type: 'uuid', nullable: true })
  consent_id: string | null;

  @Column({ type: 'varchar', length: 20, default: 'received' })
  status: string;

  @Column({ type: 'int', nullable: true })
  owner_user_id: number | null;

  @Column({ type: 'int', nullable: true })
  customer_id: number | null;

  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  idempotency_key: string;

  @Column({ type: 'date', nullable: true })
  customer_requested_due_at: string | null;

  @Column({ type: 'date', nullable: true })
  promised_due_at: string | null;

  @Column({ type: 'text', nullable: true })
  internal_note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
