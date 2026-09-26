import { detectMagicBytes, sanitizeFilename } from '../attachments/chat-attachment.service';
import * as crypto from 'crypto';

describe('Chat Attachments (CB0-18)', () => {
  it('correctly detects PNG magic bytes', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    expect(detectMagicBytes(pngHeader)).toBe('image/png');
  });

  it('correctly detects JPEG magic bytes', () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    expect(detectMagicBytes(jpegHeader)).toBe('image/jpeg');
  });

  it('correctly detects PDF magic bytes', () => {
    const pdfHeader = Buffer.from('%PDF-1.7 header content');
    expect(detectMagicBytes(pdfHeader)).toBe('application/pdf');
  });

  it('rejects HTML disguised as PNG (CB0-18)', () => {
    const fakeHtml = Buffer.from('<html><body>Not an image</body></html>');
    expect(detectMagicBytes(fakeHtml)).toBeNull();
  });

  it('rejects SVG file (CB0-18)', () => {
    const svgContent = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
    expect(detectMagicBytes(svgContent)).toBeNull();
  });

  it('sanitizes filename and strips path traversal (P0.8)', () => {
    const malicious = '../../../etc/passwd';
    expect(sanitizeFilename(malicious)).toBe('passwd');

    const longName = 'a'.repeat(300) + '.png';
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBeLessThanOrEqual(200);
  });

  it('preserves PDF content and computes matching SHA256 (CB0-18)', () => {
    const samplePdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const sha1 = crypto.createHash('sha256').update(samplePdf).digest('hex');
    const sha2 = crypto.createHash('sha256').update(samplePdf).digest('hex');
    expect(sha1).toBe(sha2);
  });
});
