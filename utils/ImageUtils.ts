/**
 * ImageUtils - Utilitários para manipulação de imagens
 * 
 * Responsabilidades:
 * - Conversão entre formatos de imagem
 * - Validação de arquivos de imagem
 * - Geração de nomes únicos para arquivos
 * - Manipulação de metadados de imagem
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

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
  // Diretórios usando a API legacy do expo-file-system
  private static getDocumentDirectory(): string {
    return FileSystem.documentDirectory || '';
  }

  private static getCacheDirectory(): string {
    return FileSystem.cacheDirectory || '';
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
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return { success: true, data: base64 };
    } catch (error) {
      console.error('Error converting to base64:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Converte base64 para URI de arquivo
   */
  static async convertBase64ToFile(base64: string, filename: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const fileUri = `${this.getDocumentDirectory()}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return { success: true, data: fileUri };
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
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (!fileInfo.exists) {
        return { success: false, error: 'File does not exist' };
      }

      const extension = this.getFileExtension(fileUri);
      const mimeType = this.getMimeTypeFromExtension(extension);

      const metadata: ImageMetadata = {
        size: fileInfo.size || 0,
        mimeType,
        format: extension
      };

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
   * Copia um arquivo para o diretório de documentos
   */
  static async copyToDocuments(sourceUri: string, filename: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const destinationUri = `${this.getDocumentDirectory()}${filename}`;
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri
      });
      
      return { success: true, data: destinationUri };
    } catch (error) {
      console.error('Error copying file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Remove um arquivo do sistema
   */
  static async deleteFile(fileUri: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
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
   * Verifica se um arquivo existe
   */
  static async fileExists(fileUri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      return fileInfo.exists;
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
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (!fileInfo.exists) {
        return { success: false, error: 'File does not exist' };
      }

      return { success: true, data: fileInfo.size || 0 };
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
   * Limpa arquivos temporários antigos
   */
  static async cleanupTempFiles(maxAgeHours: number = 24): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const tempDir = this.getCacheDirectory();
      if (!tempDir) {
        return { success: false, error: 'Cache directory not available' };
      }

      const files = await FileSystem.readDirectoryAsync(tempDir);
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const fileUri = tempDir + file;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        if (fileInfo.exists && fileInfo.modificationTime) {
          const fileAge = now - (fileInfo.modificationTime * 1000);
          
          if (fileAge > maxAge) {
            await FileSystem.deleteAsync(fileUri);
            deletedCount++;
          }
        }
      }

      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// EXPANSÃO FUTURA:
// - Redimensionamento de imagens
// - Compressão automática
// - Geração de thumbnails
// - Watermark automático
// - Rotação de imagens
// - Filtros de imagem
// - OCR em imagens
