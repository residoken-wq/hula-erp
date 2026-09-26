import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ChatbotConfigDto } from '../config/chatbot-config.dto';
import { renderTemplate } from '../config/chatbot-config.service';
import { CHATBOT_DEFAULTS } from '../chatbot.defaults';

describe('Chatbot Config & Validation (CB0-10, CB0-12, CB0-14)', () => {
  it('renderTemplate replaces placeholders and escapes HTML characters', () => {
    const template = 'Xin chào {short_name} - {display_name}!';
    const rendered = renderTemplate(template, {
      short_name: 'Trợ lý <AI> & "Special"',
      display_name: 'HULA Support',
    });
    expect(rendered).toBe('Xin chào Trợ lý &lt;AI&gt; &amp; &quot;Special&quot; - HULA Support!');
  });

  it('validates a valid ChatbotConfigDto successfully', async () => {
    const validData = {
      ...CHATBOT_DEFAULTS,
      display_name: 'Trợ lý AI HULA Test',
      short_name: 'Trợ lý Test',
      avatar_url: '/images/chatbot/cuu-hula-192.webp',
      greeting: 'Xin chào {short_name} hỗ trợ bạn.',
      notify_emails: ['test@example.com'],
      notify_user_ids: [1, 2],
    };

    const instance = plainToInstance(ChatbotConfigDto, validData);
    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('rejects display_name containing <, >, {, } (CB0-10)', async () => {
    const invalidData = {
      ...CHATBOT_DEFAULTS,
      display_name: 'Trợ lý <AI>',
    };
    const instance = plainToInstance(ChatbotConfigDto, invalidData);
    const errors = await validate(instance);
    expect(errors.some((e) => e.property === 'display_name')).toBe(true);
  });

  it('rejects display_name with length < 2 (CB0-10)', async () => {
    const invalidData = {
      ...CHATBOT_DEFAULTS,
      display_name: 'A',
    };
    const instance = plainToInstance(ChatbotConfigDto, invalidData);
    const errors = await validate(instance);
    expect(errors.some((e) => e.property === 'display_name')).toBe(true);
  });

  it('rejects greeting with unallowed placeholders like {abc} (CB0-10)', async () => {
    const invalidData = {
      ...CHATBOT_DEFAULTS,
      greeting: 'Chào mừng bạn đến với {abc}',
    };
    const instance = plainToInstance(ChatbotConfigDto, invalidData);
    const errors = await validate(instance);
    expect(errors.some((e) => e.property === 'greeting')).toBe(true);
  });

  it('rejects invalid email in notify_emails (CB0-10)', async () => {
    const invalidData = {
      ...CHATBOT_DEFAULTS,
      notify_emails: ['not-an-email'],
    };
    const instance = plainToInstance(ChatbotConfigDto, invalidData);
    const errors = await validate(instance);
    expect(errors.some((e) => e.property === 'notify_emails')).toBe(true);
  });

  it('rejects secrets in text fields like AIza... or sk-...', async () => {
    const secretData = {
      ...CHATBOT_DEFAULTS,
      response_sla_text: 'Key is ' + ['AIza', 'SyD3x91abcdefghijk123456'].join(''),
    };
    const instance = plainToInstance(ChatbotConfigDto, secretData);
    const errors = await validate(instance);
    expect(errors.some((e) => e.property === 'response_sla_text')).toBe(true);
  });
});
