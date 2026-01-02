import { supabase } from '../lib/supabaseClient';

const BUCKET_NAME = 'pdfs';
const ORIGINALS_PATH = 'originals';

interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  errors: Array<{ productId: string; error: string }>;
}

export class MigrationService {
  /**
   * Convert Google Drive share URL to direct download URL
   */
  private convertToDirectURL(url: string): string {
    // Handle different Google Drive URL formats
    if (url.includes('drive.google.com')) {
      // Format 1: https://drive.google.com/file/d/FILE_ID/view
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }

      // Format 2: https://drive.google.com/open?id=FILE_ID
      const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (openMatch) {
        const fileId = openMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }

    return url;
  }

  /**
   * Download PDF from Google Drive
   */
  private async downloadPDFFromDrive(url: string): Promise<Blob> {
    try {
      const directUrl = this.convertToDirectURL(url);

      // Try multiple CORS proxies in order
      const corsProxies = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        '' // Direct attempt (no proxy)
      ];

      let lastError: any;

      for (const proxy of corsProxies) {
        try {
          const fetchUrl = proxy + encodeURIComponent(directUrl);
          console.log(`Trying to fetch PDF with proxy: ${proxy ? 'using proxy' : 'direct'}`);

          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/pdf'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();

          // Verify it's a PDF or binary data
          if (blob.size > 0 && (blob.type.includes('pdf') || blob.type === 'application/octet-stream' || blob.type === '')) {
            console.log(`Successfully downloaded PDF (${blob.size} bytes)`);
            return blob;
          }

          throw new Error('Invalid PDF blob received');
        } catch (error) {
          lastError = error;
          console.log(`Proxy ${proxy || 'direct'} failed, trying next...`);
          continue;
        }
      }

      throw lastError || new Error('All download methods failed');
    } catch (error) {
      console.error('Error downloading from Drive:', error);
      throw new Error(`Failed to download PDF: ${error}`);
    }
  }

  /**
   * Extract file ID from Google Drive URL
   */
  private extractFileId(url: string): string {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }

  /**
   * Upload PDF to Supabase Storage
   */
  private async uploadToStorage(blob: Blob, productId: string): Promise<string> {
    const fileName = `${ORIGINALS_PATH}/${productId}.pdf`;

    // Force blob to be application/pdf type
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, pdfBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf'
      });

    if (error) {
      throw new Error(`Failed to upload to storage: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Update product with new Storage URL
   */
  private async updateProductUrl(productId: string, newUrl: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ pdf_url: newUrl })
      .eq('id', productId);

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  /**
   * Migrate a single PDF from Drive to Storage
   */
  private async migrateSinglePDF(
    productId: string,
    driveUrl: string,
    onProgress?: (message: string) => void
  ): Promise<string> {
    try {
      onProgress?.(`📥 Baixando PDF do Google Drive...`);
      const blob = await this.downloadPDFFromDrive(driveUrl);

      onProgress?.(`☁️ Fazendo upload para Supabase Storage...`);
      const storageUrl = await this.uploadToStorage(blob, productId);

      onProgress?.(`💾 Atualizando banco de dados...`);
      await this.updateProductUrl(productId, storageUrl);

      return storageUrl;
    } catch (error) {
      console.error(`Error migrating PDF for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get all products with Google Drive PDFs
   */
  private async getProductsWithDrivePDFs(): Promise<Array<{ id: string; title: string; pdfUrl: string }>> {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, pdf_url')
      .not('pdf_url', 'is', null)
      .neq('pdf_url', '#');

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    // Filter only Google Drive URLs and non-Storage URLs
    return (data || []).filter(p =>
      p.pdf_url &&
      (p.pdf_url.includes('drive.google.com') ||
       (!p.pdf_url.includes('supabase') && p.pdf_url !== '#'))
    ).map(p => ({
      id: p.id,
      title: p.title,
      pdfUrl: p.pdf_url
    }));
  }

  /**
   * Migrate all PDFs from Google Drive to Supabase Storage
   */
  async migrateAllPDFs(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationProgress> {
    const progress: MigrationProgress = {
      total: 0,
      completed: 0,
      failed: 0,
      current: '',
      status: 'running',
      errors: []
    };

    try {
      // Get all products with Drive PDFs
      onProgress?.({ ...progress, current: 'Buscando produtos...' });
      const products = await this.getProductsWithDrivePDFs();

      progress.total = products.length;
      onProgress?.({ ...progress, current: `Encontrados ${products.length} PDFs para migrar` });

      // Migrate each PDF
      for (const product of products) {
        try {
          progress.current = `Migrando: ${product.title}`;
          onProgress?.({ ...progress });

          await this.migrateSinglePDF(
            product.id,
            product.pdfUrl,
            (msg) => onProgress?.({ ...progress, current: `${product.title}: ${msg}` })
          );

          progress.completed++;
          onProgress?.({ ...progress, current: `✅ ${product.title} migrado com sucesso!` });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          progress.failed++;
          progress.errors.push({
            productId: product.id,
            error: error instanceof Error ? error.message : String(error)
          });
          onProgress?.({ ...progress, current: `❌ Erro ao migrar ${product.title}` });
        }
      }

      progress.status = 'completed';
      progress.current = `Migração concluída! ✅ ${progress.completed} sucesso | ❌ ${progress.failed} falhas`;
      onProgress?.({ ...progress });

      return progress;
    } catch (error) {
      progress.status = 'error';
      progress.current = `Erro fatal: ${error instanceof Error ? error.message : String(error)}`;
      onProgress?.({ ...progress });
      throw error;
    }
  }

  /**
   * Test migration with a single PDF
   */
  async testMigration(productId: string): Promise<boolean> {
    try {
      const { data: product } = await supabase
        .from('products')
        .select('pdf_url')
        .eq('id', productId)
        .single();

      if (!product || !product.pdf_url) {
        throw new Error('Product not found or has no PDF');
      }

      await this.migrateSinglePDF(productId, product.pdf_url);
      return true;
    } catch (error) {
      console.error('Test migration failed:', error);
      return false;
    }
  }
}

export const migrationService = new MigrationService();
