import * as crypto from 'crypto';

if (!global.crypto) {
  (global as any).crypto = crypto;
}


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// --- IMPORT MỚI ---
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // Khoi tao ung dung tu AppModule
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Create uploads folder if not exists
  const fs = await import('fs');
  const uploadDir = join(__dirname, '..', 'frontend', 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve Static Assets (Uploads)
  // URL: http://localhost:3000/uploads/filename.jpg
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  // Enable /api prefix
  app.setGlobalPrefix('api');

  // Cho phep ket noi tu moi nguon (CORS)
  app.enableCors();

  // Chay o cong 3000
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
