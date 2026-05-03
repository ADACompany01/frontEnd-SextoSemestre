/**
 * ImageModel - Modelo de dados para imagens
 * 
 * Responsabilidades:
 * - Gerenciar dados de imagens no banco SQLite
 * - Validação de tipos de imagem
 * - Operações CRUD para imagens
 * - Categorização de imagens
 */

import { DatabaseService } from '../../services/DatabaseService';

export interface ImageData {
  id?: number;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: 'user_photo' | 'company_logo' | 'request_document' | 'other';
  user_id?: number;
  created_at?: string;
}

export interface ImageUploadData {
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: 'user_photo' | 'company_logo' | 'request_document' | 'other';
  user_id?: number;
}

export interface ImageQueryOptions {
  category?: string;
  user_id?: number;
  limit?: number;
  offset?: number;
}

export class ImageModel {
  private static db = DatabaseService.getInstance();

  /**
   * Salva uma nova imagem no banco de dados
   */
  static async saveImage(imageData: ImageUploadData): Promise<{ success: boolean; data?: ImageData; error?: string }> {
    try {
      const result = await this.db.execute(`
        INSERT INTO images (filename, file_path, file_size, mime_type, category, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        imageData.filename,
        imageData.file_path,
        imageData.file_size,
        imageData.mime_type,
        imageData.category,
        imageData.user_id || null
      ]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Buscar a imagem recém-criada
      const savedImage = await this.getImageById(result.data.lastInsertRowId);
      return { success: true, data: savedImage.data };
    } catch (error) {
      console.error('Error saving image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Busca uma imagem por ID
   */
  static async getImageById(id: number): Promise<{ success: boolean; data?: ImageData; error?: string }> {
    try {
      const result = await this.db.getFirst(`
        SELECT * FROM images WHERE id = ?
      `, [id]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, data: result.data as ImageData };
    } catch (error) {
      console.error('Error getting image by ID:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Busca imagens por categoria
   */
  static async getImagesByCategory(category: string): Promise<{ success: boolean; data?: ImageData[]; error?: string }> {
    try {
      const result = await this.db.query(`
        SELECT * FROM images WHERE category = ? ORDER BY created_at DESC
      `, [category]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, data: result.data as ImageData[] };
    } catch (error) {
      console.error('Error getting images by category:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Busca imagens por usuário
   */
  static async getImagesByUser(userId: number): Promise<{ success: boolean; data?: ImageData[]; error?: string }> {
    try {
      const result = await this.db.query(`
        SELECT * FROM images WHERE user_id = ? ORDER BY created_at DESC
      `, [userId]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, data: result.data as ImageData[] };
    } catch (error) {
      console.error('Error getting images by user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Busca todas as imagens com filtros opcionais
   */
  static async getAllImages(options: ImageQueryOptions = {}): Promise<{ success: boolean; data?: ImageData[]; error?: string }> {
    try {
      let sql = 'SELECT * FROM images WHERE 1=1';
      const params: any[] = [];

      if (options.category) {
        sql += ' AND category = ?';
        params.push(options.category);
      }

      if (options.user_id) {
        sql += ' AND user_id = ?';
        params.push(options.user_id);
      }

      sql += ' ORDER BY created_at DESC';

      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
      }

      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }

      const result = await this.db.query(sql, params);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, data: result.data as ImageData[] };
    } catch (error) {
      console.error('Error getting all images:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Atualiza dados de uma imagem
   */
  static async updateImage(id: number, imageData: Partial<ImageUploadData>): Promise<{ success: boolean; data?: ImageData; error?: string }> {
    try {
      const fields: string[] = [];
      const params: any[] = [];

      if (imageData.filename) {
        fields.push('filename = ?');
        params.push(imageData.filename);
      }

      if (imageData.file_path) {
        fields.push('file_path = ?');
        params.push(imageData.file_path);
      }

      if (imageData.file_size) {
        fields.push('file_size = ?');
        params.push(imageData.file_size);
      }

      if (imageData.mime_type) {
        fields.push('mime_type = ?');
        params.push(imageData.mime_type);
      }

      if (imageData.category) {
        fields.push('category = ?');
        params.push(imageData.category);
      }

      if (imageData.user_id !== undefined) {
        fields.push('user_id = ?');
        params.push(imageData.user_id);
      }

      if (fields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const result = await this.db.execute(`
        UPDATE images SET ${fields.join(', ')} WHERE id = ?
      `, params);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Buscar a imagem atualizada
      const updatedImage = await this.getImageById(id);
      return { success: true, data: updatedImage.data };
    } catch (error) {
      console.error('Error updating image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Remove uma imagem do banco de dados
   */
  static async deleteImage(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.db.execute(`
        DELETE FROM images WHERE id = ?
      `, [id]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Remove todas as imagens de um usuário
   */
  static async deleteImagesByUser(userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.db.execute(`
        DELETE FROM images WHERE user_id = ?
      `, [userId]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting images by user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Valida dados de imagem
   */
  static validateImageData(imageData: ImageUploadData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!imageData.filename || imageData.filename.trim() === '') {
      errors.push('Filename is required');
    }

    if (!imageData.file_path || imageData.file_path.trim() === '') {
      errors.push('File path is required');
    }

    if (!imageData.mime_type || imageData.mime_type.trim() === '') {
      errors.push('MIME type is required');
    }

    if (!imageData.category || !['user_photo', 'company_logo', 'request_document', 'other'].includes(imageData.category)) {
      errors.push('Valid category is required');
    }

    if (imageData.file_size <= 0) {
      errors.push('File size must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtém estatísticas de imagens
   */
  static async getImageStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await this.db.query(`
        SELECT 
          category,
          COUNT(*) as count,
          SUM(file_size) as total_size,
          AVG(file_size) as avg_size
        FROM images 
        GROUP BY category
      `);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting image stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// EXPANSÃO FUTURA:
// - Compressão automática de imagens
// - Thumbnails automáticos
// - Cache de imagens
// - Validação de formato de arquivo
// - Limpeza automática de arquivos órfãos
// - Backup de imagens
