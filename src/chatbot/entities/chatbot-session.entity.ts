import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ChatbotConversation } from './chatbot-conversation.entity';

@Entity('chatbot_sessions')
export class ChatbotSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'char', length: 64, unique: true })
  token_hash: string;

  @Index()
  @Column({ type: 'uuid' })
  conversation_id: string;

  @ManyToOne(() => ChatbotConversation, (conv) => conv.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: ChatbotConversation;

  @Column({ type: 'char', length: 64 })
  ip_hash: string;

  @Column({ type: 'varchar', length: 300 })
  user_agent: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  analytics_session_id: string | null;

  @Column({ type: 'timestamptz' })
  last_seen_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
