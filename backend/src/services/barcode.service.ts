import QRCode from 'qrcode';
import { env } from '../config/env';

export class BarcodeService {
  /**
   * Generate QR code as data URL for a chemical
   */
  async generateQRCode(chemical: {
    id: string;
    name: string;
    casNumber: string | null;
    batchNumber: string | null;
    expiryDate: Date;
    status: string;
    quantity: number;
    unit: string;
    storageLocation: string | null;
    hazardClass: string;
    barcodeData: string | null;
  }): Promise<string> {
    const data = JSON.stringify({
      id: chemical.id,
      name: chemical.name,
      cas: chemical.casNumber,
      batch: chemical.batchNumber,
      expiry: chemical.expiryDate.toISOString().split('T')[0],
      status: chemical.status,
      qty: `${chemical.quantity} ${chemical.unit}`,
      location: chemical.storageLocation,
      hazard: chemical.hazardClass,
      barcode: chemical.barcodeData,
      url: `${env.FRONTEND_URL}/chemicals/${chemical.id}`,
    });

    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    return qrDataUrl;
  }

  /**
   * Generate QR code as buffer (for PDF embedding)
   */
  async generateQRBuffer(data: string): Promise<Buffer> {
    return QRCode.toBuffer(data, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
  }
}

export default new BarcodeService();
