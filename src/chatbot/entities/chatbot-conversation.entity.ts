import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { ChatbotSession } from './chatbot-session.entity';
import { ChatbotMessage } from './chatbot-message.entity';

@Entity('chatbot_conversations')
export class ChatbotConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 8, unique: true })
  public_code: string;

  @Column({ type: 'varchar', length: 24, default: 'new' })
  state: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  intent: string | null;

  @Column({ type: 'varchar', length: 24, nullable: true })
  segment: string | null;

  @Column({ type: 'boolean', default: false })
  human_active: boolean;

  @Column({ type: 'int', nullable: true })
  assigned_user_id: number | null;

  @Column({ type: 'int', nullable: true })
  customer_id: number | null;

  @Column({ type: 'int', default: 0 })
  unread_staff: number;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  last_message_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => ChatbotSession, (session) => session.conversation)
  sessions?: ChatbotSession[];

  @OneToMany(() => ChatbotMessage, (message) => message.conversation)
  messages?: ChatbotMessage[];
}
