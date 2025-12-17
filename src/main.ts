import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Khoi tao ung dung tu AppModule (noi chua ket noi DB)
  const app = await NestFactory.create(AppModule);
  
  // Cho phep ket noi tu moi nguon (CORS)
  app.enableCors();
  
  // Chay o cong 3000
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
