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
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  } catch (err) {
    const fs = await import('fs');
    fs.writeFileSync(join(__dirname, 'startup-err.txt'), `Startup Error: ${err.message}\nStack: ${err.stack}`);
    console.error('Startup Error:', err);
    process.exit(1);
  }
}
bootstrap();
