const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { AiAnalyticsService } = require('./dist/ai/ai-analytics.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(AiAnalyticsService);
  try {
    const stats = await service.getUsageStats();
    console.log('SUCCESS:', stats);
  } catch (err) {
    console.error('ERROR:', err);
  }
  await app.close();
}
bootstrap();
