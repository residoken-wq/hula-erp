import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { MaterialsService } from '../materials/materials.service';
import { ProductsService } from '../products/products.service';
import { SalesService } from '../sales/sales.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { BOM } from '../bom/bom.entity';
import { ProductComponent } from '../products/product-component.entity';
import { Customer, CustomerType } from '../customers/customer.entity';

@Injectable()
export class UploadService {
  constructor(
    private materialsService: MaterialsService,
    private productsService: ProductsService,
    private salesService: SalesService,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(BOM) private bomRepo: Repository<BOM>,
    @InjectRepository(ProductComponent) private componentRepo: Repository<ProductComponent>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) { }

  private normalizeRow(row: any) {
    const newRow = {};
    Object.keys(row).forEach(key => { newRow[key.toLowerCase().trim()] = row[key]; });
    return newRow;
  }

  // 0. UPLOAD IMAGE
  async uploadImage(file: Express.Multer.File) {
    return this.saveFile(file, 'img');
  }

  async uploadFile(file: Express.Multer.File) {
    return this.saveFile(file, 'file');
  }

  private async saveFile(file: Express.Multer.File, prefix: string) {
    const fs = require('fs');
    const path = require('path');

    // Save to backend 'uploads' directory
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique name
    const ext = path.extname(file.originalname);
    const filename = `${prefix}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    // Return backend API URL
    return { url: `/api/upload/files/${filename}` };
  }

  // Helper to serve file
  async serveFile(filename: string, res: any) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', '..', 'uploads', filename);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  }

  // 1. IMPORT NGUYEN LIEU
  async importMaterials(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let count = 0; const errors = [];
    for (const rawRow of data) {
      const row = this.normalizeRow(rawRow);
      try {
        const code = row['code'] || row['ma'];
        if (!code) continue;
        const mat = {
          code: code.toString().trim(),
          name: row['name'] || row['ten'] || 'No Name',
          category: row['category'] || row['nhom'] || 'General',
          material_type: row['type'] || row['loai'] || 'General',
          unit: row['unit'] || row['dvt'] || 'pcs',
          cost_per_unit: row['price'] || row['gia'] || 0,
          quantity_in_stock: row['qty'] || row['ton'] || 0,
          supplier_name: 'Import Excel'
        };
        const existing = await this.materialsService.findOneByCode(mat.code);
        if (existing) { await this.materialsService.materialRepo.update(existing.id, mat); }
        else { await this.materialsService.materialRepo.save(mat); }
        count++;
      } catch (e) { errors.push({ row, error: e.message }); }
    }
    return { message: 'Done', count, errors };
  }

  // 2. IMPORT SAN PHAM
  async importProducts(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let count = 0; const errors = [];

    for (const rawRow of data) {
      const row = this.normalizeRow(rawRow);
      try {
        const sku = row['sku'] || row['ma'];
        if (!sku) continue;

        const attributes = {
          color: row['color'] || row['mau'] || '',
          size: row['size'] || row['kichthuoc'] || '',
          fabric: row['fabric'] || row['chatlieu'] || ''
        };

        const productData = {
          sku: sku.toString().trim(),
          name: row['name'] || row['ten'] || 'No Name',
          category: row['category'] || row['nhom'] || 'General',
          product_type: row['type'] || row['loai'] || 'General',
          unit: row['unit'] || row['dvt'] || 'cai',
          base_price: row['price'] || row['gia'] || 0,
          attributes: attributes,
          is_active: true
        };

        const existing = await this.productsService.findOneBySku(productData.sku);
        if (existing) { await this.productRepo.update(existing.id, productData); }
        else { await this.productRepo.save(productData); }
        count++;
      } catch (e) { errors.push({ sku: row['sku'], error: e.message }); }
    }
    return { message: 'Done', count, errors };
  }

  // 3. IMPORT BOM
  async importBoms(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let count = 0; const errors = [];
    for (const rawRow of data) {
      const row = this.normalizeRow(rawRow);
      try {
        const sku = row['productsku'] || row['masp'];
        const matCode = row['materialcode'] || row['manl'];
        const qty = row['quantity'] || row['sl'];
        if (!sku || !matCode) continue;
        const product = await this.productsService.findOneBySku(sku);
        const material = await this.materialsService.findOneByCode(matCode);
        if (!product || !material) continue;
        const existingBom = await this.bomRepo.findOne({ where: { product_id: product.id, material_id: material.id } });
        if (existingBom) {
          existingBom.quantity = qty; existingBom.waste_percent = row['waste'] || 0;
          await this.bomRepo.save(existingBom);
        } else {
          const newBom = new BOM(); newBom.product = product; newBom.material = material;
          newBom.quantity = qty; newBom.waste_percent = row['waste'] || 0;
          await this.bomRepo.save(newBom);
        }
        count++;
      } catch (e) { errors.push({ row, error: e.message }); }
    }
    return { message: 'Done', count, errors };
  }

  // 4. IMPORT COMBOS
  async importCombos(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let count = 0; const errors = [];
    for (const rawRow of data) {
      const row = this.normalizeRow(rawRow);
      try {
        const parentSku = row['parentsku'] || row['mabosp'];
        const childSku = row['childsku'] || row['maspcon'];
        const qty = row['quantity'] || row['sl'];
        if (!parentSku || !childSku) continue;
        const parent = await this.productsService.findOneBySku(parentSku);
        const child = await this.productsService.findOneBySku(childSku);
        if (!parent || !child) continue;
        const existing = await this.componentRepo.findOne({ where: { parent_product: { id: parent.id }, child_product: { id: child.id } } });
        if (existing) { existing.quantity = qty; await this.componentRepo.save(existing); }
        else { const newComp = new ProductComponent(); newComp.parent_product = parent; newComp.child_product = child; newComp.quantity = qty; await this.componentRepo.save(newComp); }
        count++;
      } catch (e) { errors.push({ row, error: e.message }); }
    }
    return { message: 'Done', count, errors };
  }

  // 5. IMPORT CUSTOMERS (CRM)
  async importCustomers(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let count = 0; const errors = [];

    for (const rawRow of data) {
      const row = this.normalizeRow(rawRow);
      try {
        const code = row['code'] || row['ma'];
        if (!code) continue;

        // Chuan hoa Type: LEAD hoac CUSTOMER
        let type = CustomerType.LEAD;
        const rawType = (row['type'] || row['loai'] || '').toString().toUpperCase();
        if (rawType.includes('CUST') || rawType.includes('KHACH')) type = CustomerType.CUSTOMER;

        const customerData = {
          code: code.toString().trim(),
          name: row['name'] || row['ten'],
          phone: row['phone'] || row['sdt'],
          email: row['email'] || '',
          address: row['address'] || row['diachi'],
          tax_code: row['tax'] || row['mst'],
          credit_limit: Number(row['limit'] || row['hanmuc']) || 0,
          type: type,
          current_debt: 0
        };

        const existing = await this.customerRepo.findOne({ where: { code: customerData.code } });
        if (existing) { await this.customerRepo.update(existing.id, customerData); }
        else { await this.customerRepo.save(customerData); }
        count++;
      } catch (e) { errors.push({ code: row['code'], error: e.message }); }
    }
    return { message: 'Import Khách hàng thành công', count, errors };
  }

  // 6. TEMPLATE (UPDATE)
  getTemplate(type: string): Buffer {
    let headers = [];
    let sampleData = [];

    if (type === 'materials') {
      headers = ['Category', 'Type', 'Code', 'Name', 'Unit', 'Price', 'Qty'];
      sampleData = [{ Category: 'Vải', Type: 'Cotton', Code: 'VAI_THUN', Name: 'Vải Thun Lạnh', Unit: 'm', Price: 35000, Qty: 1000 }];
    } else if (type === 'products') {
      headers = ['Category', 'Type', 'SKU', 'Name', 'Color', 'Size', 'Fabric', 'Unit', 'Price'];
      sampleData = [{ Category: 'Nệm', Type: 'Mầm Non', SKU: 'NMN_XANH', Name: 'Nệm MN Xanh', Color: 'Xanh', Size: '120x60', Fabric: 'Cara', Unit: 'cai', Price: 180000 }];
    } else if (type === 'boms') {
      headers = ['ProductSKU', 'MaterialCode', 'Quantity', 'Waste'];
      sampleData = [{ ProductSKU: 'NMN_XANH', MaterialCode: 'VAI_CARA_XANH', Quantity: 1.6, Waste: 2 }];
    } else if (type === 'combos') {
      headers = ['ParentSKU', 'ChildSKU', 'Quantity'];
      sampleData = [{ ParentSKU: 'BO_NEM_GOI', ChildSKU: 'NMN_XANH', Quantity: 1 }];
    } else if (type === 'customers') {
      // --- TEMPLATE KHACH HANG ---
      headers = ['Code', 'Name', 'Type', 'Phone', 'Email', 'Address', 'Tax', 'Limit'];
      sampleData = [
        { Code: 'KH001', Name: 'Công ty ABC', Type: 'CUSTOMER', Phone: '0909123456', Email: 'abc@gmail.com', Address: 'HCM', Tax: '030123456', Limit: 50000000 },
        { Code: 'LEAD01', Name: 'Chị Lan', Type: 'LEAD', Phone: '0918...', Email: '', Address: '', Tax: '', Limit: 0 }
      ];
    } else if (type === 'sales') {
      // --- TEMPLATE DON HANG ---
      headers = ['CustomerCode', 'OrderDate', 'ProductSKU', 'Quantity', 'UnitPrice', 'Notes'];
      sampleData = [
        { CustomerCode: 'KH001', OrderDate: '2026-01-01', ProductSKU: 'PRD-001', Quantity: 10, UnitPrice: 50000, Notes: 'Giao gấp' },
        { CustomerCode: 'KH001', OrderDate: '2026-01-01', ProductSKU: 'PRD-002', Quantity: 5, UnitPrice: 75000, Notes: '' }
      ];
    } else {
      throw new BadRequestException('Loai template khong hop le');
    }

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    return XLSX.write({ Sheets: { Sheet1: ws }, SheetNames: ['Sheet1'] }, { type: 'buffer', bookType: 'xlsx' });
  }

  // 7. IMPORT SALES ORDERS NEW
  async importSalesOrders(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const ordersMap = new Map();
    const errors = [];
    let count = 0;

    // Group rows by CustomerCode + OrderDate to create single order with multiple items
    for (const rawRow of data) {
      const row = this.normalizeRow(rawRow);
      try {
        const customerCode = row['customercode'] || row['makh'];
        if (!customerCode) continue;

        const orderDateStr = row['orderdate'] || row['ngaydat'];
        const notes = row['notes'] || row['ghichu'] || '';

        const sku = row['productsku'] || row['masp'];
        const qty = Number(row['quantity'] || row['sl']) || 0;
        const price = Number(row['unitprice'] || row['dongia']) || 0;

        if (!sku || qty <= 0) {
          errors.push({ row, error: 'SKU or Quantity invalid' });
          continue;
        }

        const key = `${customerCode}_${orderDateStr || 'today'}_${notes}`;

        if (!ordersMap.has(key)) {
          ordersMap.set(key, {
            customerCode,
            orderDate: orderDateStr ? new Date(orderDateStr) : new Date(),
            notes,
            items: []
          });
        }

        ordersMap.get(key).items.push({ sku, qty, price });
      } catch (e) {
        errors.push({ row, error: e.message });
      }
    }

    // Process each grouped order
    for (const [key, orderData] of ordersMap.entries()) {
      try {
        const customer = await this.customerRepo.findOne({ where: { code: orderData.customerCode } });
        if (!customer) {
          errors.push({ key, error: `Customer ${orderData.customerCode} not found` });
          continue;
        }

        // Create Order
        const newOrder = await this.salesService.createOrder({
          customer_id: customer.id,
          order_date: orderData.orderDate,
          note: orderData.notes, // Map 'notes' to 'note' as per SalesService
          items: orderData.items.map(i => ({
            sku: i.sku, // SalesService expects 'sku'
            quantity: i.qty,
            price: i.price
          }))
        });

        if (newOrder) count++;

      } catch (e) {
        errors.push({ key, error: e.message });
      }
    }

    return { message: `Imported ${count} orders`, count, errors };
  }
}