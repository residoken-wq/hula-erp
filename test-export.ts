import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { InventoryService } from './src/inventory/inventory.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const inventoryService = app.get(InventoryService);
  
  try {
    console.log('Testing confirmStockExport for PXK-230826-9248...');
    // We need the ID of the delivery. Let's find it first.
    const deliveryRepo = app.get('SalesDeliveryRepository');
    const delivery = await deliveryRepo.findOne({ where: { code: 'PXK-230826-9248' } });
    if (delivery) {
      console.log('Found delivery ID:', delivery.id);
      const res = await inventoryService.confirmStockExport(delivery.id, 'KHO_TP', 'Admin');
      console.log('Success:', res);
    } else {
      console.log('Delivery not found');
    }
  } catch (e) {
    console.error('Error during confirmStockExport:', e);
  } finally {
    await app.close();
  }
}
bootstrap();
