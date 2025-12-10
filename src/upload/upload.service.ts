import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { MaterialsService } from '../materials/materials.service';
import { ProductsService } from '../products/products.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { BOM } from '../bom/bom.entity';
import { ProductComponent } from '../products/product-component.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UploadService {
  constructor(
    private materialsService: MaterialsService,
    private productsService: ProductsService,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(BOM) private bomRepo: Repository<BOM>,
    @InjectRepository(ProductComponent) private componentRepo: Repository<ProductComponent>,
  ) {}

  private normalizeRow(row: any) {
    const newRow = {};
    Object.keys(row).forEach(key => { newRow[key.toLowerCase().trim()] = row[key]; });
    return newRow;
  }

  // 1. IMPORT NGUYEN LIEU (GIU NGUYEN)
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

  // 2. IMPORT SAN PHAM (CAP NHAT DOC THUOC TINH)
  async importProducts(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let count = 0; const errors = [];

    console.log('--- IMPORT PRODUCTS WITH VARIANTS ---');

    for (const rawRow of data) {
      const row = this.normalizeRow(rawRow);
      try {
        const sku = row['sku'] || row['ma'];
        if (!sku) continue;

        // --- DOC THUOC TINH BIEN THE ---
        const attributes = {
            color: row['color'] || row['mau'] || '',
            size: row['size'] || row['kichthuoc'] || '',
            fabric: row['fabric'] || row['chatlieu'] || ''
        };
        // -------------------------------

        const productData = {
           sku: sku.toString().trim(), 
           name: row['name'] || row['ten'] || 'No Name',
           category: row['category'] || row['nhom'] || 'General',
           product_type: row['type'] || row['loai'] || 'General',
           unit: row['unit'] || row['dvt'] || 'cai',
           base_price: row['price'] || row['gia'] || 0,
           attributes: attributes, // Luu vao DB
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

  // 3. IMPORT BOM (GIU NGUYEN)
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
        if(!sku || !matCode) continue;
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

  // 4. IMPORT COMBOS (GIU NGUYEN)
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

  // 5. DOWNLOAD TEMPLATE (CAP NHAT THEM COT MAU, SIZE)
  getTemplate(type: string): Buffer {
    let headers = [];
    let sampleData = [];

    if (type === 'materials') {
        headers = ['Category', 'Type', 'Code', 'Name', 'Unit', 'Price', 'Qty'];
        sampleData = [{ Category: 'Vải', Type: 'Cotton', Code: 'VAI_THUN', Name: 'Vải Thun Lạnh', Unit: 'm', Price: 35000, Qty: 1000 }];
    } else if (type === 'products') {
        // --- THEM COT COLOR, SIZE, FABRIC ---
        headers = ['Category', 'Type', 'SKU', 'Name', 'Color', 'Size', 'Fabric', 'Unit', 'Price'];
        sampleData = [{ Category: 'Nệm', Type: 'Mầm Non', SKU: 'NMN_XANH', Name: 'Nệm MN Xanh', Color: 'Xanh', Size: '120x60', Fabric: 'Cara', Unit: 'cai', Price: 180000 }];
    } else if (type === 'boms') {
        headers = ['ProductSKU', 'MaterialCode', 'Quantity', 'Waste'];
        sampleData = [{ ProductSKU: 'NMN_XANH', MaterialCode: 'VAI_CARA_XANH', Quantity: 1.6, Waste: 2 }];
    } else if (type === 'combos') {
        headers = ['ParentSKU', 'ChildSKU', 'Quantity'];
        sampleData = [{ ParentSKU: 'BO_NEM_GOI', ChildSKU: 'NMN_XANH', Quantity: 1 }];
    } else {
        throw new BadRequestException('Loai template khong hop le');
    }

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as any;
  }
  // Thêm vào src/upload/upload.service.ts

// ... imports cần thêm CustomerRepo ...

// Trong class UploadService:
async importCustomers(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let count = 0; const errors = [];

    for (const rawRow of data) {
      const row = this.normalizeRow(rawRow);
      try {
        const code = row['code'] || row['ma'];
        if (!code) continue;

        const customerData = {
           code: code.toString().trim(), 
           name: row['name'] || row['ten'],
           phone: row['phone'] || row['sdt'],
           address: row['address'] || row['diachi'],
           tax_code: row['tax'] || row['mst'],
           credit_limit: Number(row['limit'] || row['hanmuc']) || 0,
           current_debt: 0 // Mới tạo nợ bằng 0
        };

        // Logic upsert (Nếu có rồi thì update, chưa thì tạo mới)
        const existing = await this.customerRepo.findOne({ where: { code: customerData.code } });
        if (existing) { await this.customerRepo.update(existing.id, customerData); } 
        else { await this.customerRepo.save(customerData); }
        count++;
      } catch (e) { errors.push({ code: row['code'], error: e.message }); }
    }
    return { message: 'Import Khách hàng xong', count, errors };
}
}
