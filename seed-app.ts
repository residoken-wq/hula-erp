import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { HrService } from './src/hr/hr.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  console.log('Initializing NestJS Application Context for seeding...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const hrService = app.get(HrService);
  
  const dataPath = path.join(process.cwd(), 'parsed_questions.json');
  if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      console.log(`Found ${data.length} questions to seed. Inserting...`);
      for (let i = 0; i < data.length; i++) {
          const item = data[i];
          try {
              await hrService.createReviewQuestion(item);
          } catch(e) {
              console.error(`Failed to insert question ${i}: ${e.message}`);
          }
      }
      console.log(`Successfully seeded ${data.length} questions!`);
  } else {
      console.log('No parsed_questions.json found!');
  }
  await app.close();
}
bootstrap();
