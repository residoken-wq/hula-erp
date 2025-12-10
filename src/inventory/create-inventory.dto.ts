import { IsNotEmpty, IsEnum, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateInventoryDto {
  @IsNotEmpty({ message: 'Loai giao dich (type) khong duoc de trong! (IMPORT hoac EXPORT)' })
  @IsEnum(['IMPORT', 'EXPORT'], { message: 'Type phai la IMPORT hoac EXPORT' })
  type: 'IMPORT' | 'EXPORT';

  @IsNotEmpty()
  @IsEnum(['PRODUCT', 'MATERIAL'])
  itemType: 'PRODUCT' | 'MATERIAL';

  @IsNotEmpty()
  @IsNumber()
  itemId: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  ref?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
