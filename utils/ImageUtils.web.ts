/**
 * ImageUtils.web - Utilitários para manipulação de imagens na web
 * 
 * Responsabilidades:
 * - Conversão entre formatos de imagem
 * - Validação de arquivos de imagem
 * - Manipulação de blobs e object URLs
 * - Integração com IndexedDB
 */

import { IndexedDBAdapter } from '../services/storage/IndexedDBAdapter';

export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  size: number;
  mimeType: string;
}

export interface ImageConversionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageUtils {
  private static dbAdapter: IndexedDBAdapter | null = null;

  private static getDBAdapter(): IndexedDBAdapter {
    if (!this.dbAdapter) {
      this.dbAdapter = new IndexedDBAdapter();
    }
    return this.dbAdapter;
  }

  /**
   * Valida se um arquivo é uma imagem válida
   */
  static isValidImageType(mimeType: string): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];
    return validTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Gera um nome único para arquivo de imagem
   */
  static generateUniqueFilename(originalName: string, category: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(originalName);
    return `${category}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Extrai a extensão de um nome de arquivo
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  /**
   * Determina o tipo MIME baseado na extensão
   */
  static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff'
    };
    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Converte uma imagem para base64
   */
  static async convertToBase64(fileUri: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      // No navegador, fileUri pode ser um object URL ou data URL
      if (fileUri.startsWith('data:')) {
        // Já é base64
        const base64 = fileUri.split(',')[1];
        return { success: true, data: base64 };
      }

      // Se for object URL, buscar do blob storage
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({ success: true, data: base64 });
        };
        reader.onerror = () => {
          resolve({ success: false, error: 'Failed to convert to base64' });
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting to base64:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Converte base64 para Blob
   */
  static async convertBase64ToBlob(base64: string, mimeType: string): Promise<Blob> {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Converte base64 para Object URL
   */
  static async convertBase64ToFile(base64: string, filename: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const extension = this.getFileExtension(filename);
      const mimeType = this.getMimeTypeFromExtension(extension);
      const blob = await this.convertBase64ToBlob(base64, mimeType);
      const objectUrl = URL.createObjectURL(blob);
      
      return { success: true, data: objectUrl };
    } catch (error) {
      console.error('Error converting base64 to file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obtém informações de um arquivo de imagem
   */
  static async getImageInfo(fileUri: string): Promise<{ success: boolean; data?: ImageMetadata; error?: string }> {
    try {
      let blob: Blob;

      if (fileUri.startsWith('data:')) {
        // Data URL
        const base64 = fileUri.split(',')[1];
        const mimeType = fileUri.split(';')[0].split(':')[1];
        blob = await this.convertBase64ToBlob(base64, mimeType);
      } else if (fileUri.startsWith('blob:')) {
        // Object URL
        const response = await fetch(fileUri);
        blob = await response.blob();
      } else {
        throw new Error('Invalid file URI');
      }

      const extension = this.getFileExtension(fileUri);
      const mimeType = blob.type || this.getMimeTypeFromExtension(extension);

      const metadata: ImageMetadata = {
        size: blob.size,
        mimeType,
        format: extension
      };

      // Tentar obter dimensões
      try {
        const dimensions = await this.getImageDimensions(fileUri);
        metadata.width = dimensions.width;
        metadata.height = dimensions.height;
      } catch (e) {
        // Dimensões opcionais
      }

      return { success: true, data: metadata };
    } catch (error) {
      console.error('Error getting image info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obtém dimensões de uma imagem
   */
  private static async getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * "Copia" arquivo para storage (na web, salva no IndexedDB)
   */
  static async copyToDocuments(sourceUri: string, filename: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      // No navegador, retornamos o object URL
      // A imagem será salva no IndexedDB quando salvarmos os metadados
      return { success: true, data: sourceUri };
    } catch (error) {
      console.error('Error copying file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Remove um "arquivo" (revoga object URL)
   */
  static async deleteFile(fileUri: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (fileUri.startsWith('blob:')) {
        URL.revokeObjectURL(fileUri);
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verifica se um "arquivo" existe (no contexto web)
   */
  static async fileExists(fileUri: string): Promise<boolean> {
    try {
      if (fileUri.startsWith('data:') || fileUri.startsWith('blob:')) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Obtém o tamanho de um arquivo
   */
  static async getFileSize(fileUri: string): Promise<{ success: boolean; data?: number; error?: string }> {
    try {
      const info = await this.getImageInfo(fileUri);
      if (info.success && info.data) {
        return { success: true, data: info.data.size };
      }
      return { success: false, error: 'Failed to get file size' };
    } catch (error) {
      console.error('Error getting file size:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Valida o tamanho de um arquivo
   */
  static validateFileSize(size: number, maxSizeMB: number = 10): { isValid: boolean; error?: string } {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`
      };
    }

    return { isValid: true };
  }

  /**
   * Formata o tamanho de arquivo para exibição
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cria um URI de dados para exibição de imagem
   */
  static createDataUri(base64: string, mimeType: string): string {
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Limpa arquivos temporários (no navegador, revoga object URLs antigos)
   */
  static async cleanupTempFiles(maxAgeHours: number = 24): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      // No navegador, não temos controle direto sobre object URLs antigos
      // Eles são automaticamente limpos pelo garbage collector
      console.log('Cleanup não necessário no navegador');
      return { success: true, deletedCount: 0 };
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Salva blob de imagem no IndexedDB
   */
  static async saveImageBlob(imageId: number, blob: Blob): Promise<{ success: boolean; error?: string }> {
    try {
      const adapter = this.getDBAdapter();
      await adapter.initialize();
      const result = await adapter.saveImageBlob(imageId, blob);
      return result;
    } catch (error) {
      console.error('Error saving image blob:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Recupera blob de imagem do IndexedDB e cria object URL
   */
  static async getImageBlobUrl(imageId: number): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const adapter = this.getDBAdapter();
      await adapter.initialize();
      const result = await adapter.getImageBlob(imageId);
      
      if (result.success && result.data) {
        const objectUrl = URL.createObjectURL(result.data);
        return { success: true, data: objectUrl };
      }
      
      return { success: false, error: 'Image blob not found' };
    } catch (error) {
      console.error('Error getting image blob URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}



