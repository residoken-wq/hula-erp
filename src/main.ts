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
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Bật full logs
    });

    // Create uploads folder if not exists
    const fs = await import('fs');
    const uploadDir = join(__dirname, '..', 'frontend', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Serve Static Assets (Uploads)
    app.useStaticAssets(uploadDir, {
      prefix: '/uploads/',
    });

    // Enable /api prefix
    app.setGlobalPrefix('api');
    app.enableCors();

    await app.listen(3000, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (err) {
    console.error('FATAL STARTUP ERROR:', err);
    process.exit(1);
  }
}
bootstrap();
