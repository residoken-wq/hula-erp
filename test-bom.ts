import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PfoBomEngineService } from './src/planning/pfo-bom-engine.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const bomSvc = app.get(PfoBomEngineService);
  
  // Find a PFO with a COMBO product
  const ds = app.get(DataSource);
  const pfos = await ds.query(`
    SELECT p.id, p.code, so.order_code
    FROM production_fulfillment_orders p
    JOIN sales_orders so ON p.sales_order_id = so.id
    JOIN sales_order_items soi ON soi.sales_order_id = so.id
    JOIN products pr ON soi.product_id = pr.id
    WHERE pr.product_type = 'COMBO'
    LIMIT 1
  `);
  
  if (pfos.length > 0) {
    console.log("Found PFO:", pfos[0]);
    const res = await bomSvc.calculateMaterialRequirements(pfos[0].id);
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.log("No PFO with COMBO found.");
  }
  
  await app.close();
}

bootstrap();
