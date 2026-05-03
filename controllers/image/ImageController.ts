/**
 * ImageController - Controller para operações de imagem
 * 
 * Responsabilidades:
 * - Coordenar operações de imagem entre modelo e view
 * - Gerenciar upload e download de imagens
 * - Validação de dados de entrada
 * - Tratamento de erros
 */

import { ImageModel, type ImageData, type ImageUploadData, type ImageQueryOptions } from '../../models/image/ImageModel';
import { ImageUtils } from '../../utils/ImageUtils';
import { DatabaseService } from '../../services/DatabaseService';
import { PhotoSyncService } from '../../services/PhotoSyncService';

export interface ImageControllerState {
  isLoading: boolean;
  error: string | null;
  images: ImageData[];
  currentImage: ImageData | null;
}

export interface ImageUploadResult {
  success: boolean;
  data?: ImageData;
  error?: string;
}

export interface ImageListResult {
  success: boolean;
  data?: ImageData[];
  error?: string;
}

export class ImageController {
  private static instance: ImageController;
  private db: DatabaseService;
  private photoSync: PhotoSyncService;
  private state: ImageControllerState = {
    isLoading: false,
    error: null,
    images: [],
    currentImage: null
  };
  private subscribers: Set<(state: ImageControllerState) => void> = new Set();

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.photoSync = PhotoSyncService.getInstance();
  }

  /**
   * Singleton pattern para garantir uma única instância
   */
  static getInstance(): ImageController {
    if (!ImageController.instance) {
      ImageController.instance = new ImageController();
    }
    return ImageController.instance;
  }

  /**
   * Inicializa o controller
   */
  async initialize(): Promise<boolean> {
    try {
      const dbResult = await this.db.initialize();
      if (!dbResult.success) {
        this.setState({ error: dbResult.error || 'Database initialization failed' });
        return false;
      }
      return true;
    } catch (error) {
      console.error('ImageController initialization error:', error);
      this.setState({ error: 'Failed to initialize image controller' });
      return false;
    }
  }

  /**
   * Upload de uma nova imagem com sincronização
   */
  async uploadImage(
    fileUri: string, 
    category: 'user_photo' | 'company_logo' | 'request_document' | 'other',
    userId?: number,
    originalFilename?: string,
    syncToServer: boolean = true
  ): Promise<ImageUploadResult> {
    try {
      console.log(`[ImageController] Iniciando upload - fileUri: ${fileUri}, userId: ${userId}, category: ${category}`);
      this.setState({ isLoading: true, error: null });

      // Validar se o arquivo existe
      console.log(`[ImageController] Verificando se arquivo existe: ${fileUri}`);
      const fileExists = await ImageUtils.fileExists(fileUri);
      if (!fileExists) {
        const error = 'File does not exist';
        console.error(`[ImageController] Arquivo não existe: ${fileUri}`);
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }
      console.log(`[ImageController] Arquivo existe: ${fileUri}`);

      // Obter informações do arquivo
      console.log(`[ImageController] Obtendo informações do arquivo`);
      const fileInfo = await ImageUtils.getImageInfo(fileUri);
      if (!fileInfo.success || !fileInfo.data) {
        const error = fileInfo.error || 'Failed to get file info';
        console.error(`[ImageController] Falha ao obter informações: ${error}`);
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      const { mimeType, size } = fileInfo.data;
      console.log(`[ImageController] Informações obtidas - mimeType: ${mimeType}, size: ${size}`);

      // Validar tipo de arquivo
      if (!ImageUtils.isValidImageType(mimeType)) {
        const error = 'Invalid image type';
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      // Validar tamanho do arquivo
      const sizeValidation = ImageUtils.validateFileSize(size, 10); // 10MB max
      if (!sizeValidation.isValid) {
        const error = sizeValidation.error || 'File too large';
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      // Gerar nome único para o arquivo
      const filename = ImageUtils.generateUniqueFilename(
        originalFilename || 'image', 
        category
      );

      // Copiar arquivo para diretório de documentos
      const copyResult = await ImageUtils.copyToDocuments(fileUri, filename);
      if (!copyResult.success || !copyResult.data) {
        const error = copyResult.error || 'Failed to copy file';
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      // Preparar dados para salvar no banco
      const imageData: ImageUploadData = {
        filename,
        file_path: copyResult.data,
        file_size: size,
        mime_type: mimeType,
        category,
        user_id: userId
      };

      // Validar dados
      const validation = ImageModel.validateImageData(imageData);
      if (!validation.isValid) {
        const error = validation.errors.join(', ');
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      // Salvar no banco de dados
      console.log(`[ImageController] Salvando imagem no banco de dados`);
      const saveResult = await ImageModel.saveImage(imageData);
      if (!saveResult.success || !saveResult.data) {
        const error = saveResult.error || 'Failed to save image to database';
        console.error(`[ImageController] Falha ao salvar no banco: ${error}`);
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }
      console.log(`[ImageController] Imagem salva no banco com ID: ${saveResult.data.id}`);

      // Atualizar estado
      this.setState({ 
        isLoading: false, 
        currentImage: saveResult.data,
        images: [saveResult.data, ...this.state.images]
      });

      // Sincronizar com servidor se solicitado e for foto de usuário
      if (syncToServer && category === 'user_photo' && userId && saveResult.data) {
        try {
          console.log(`[ImageController] Sincronizando foto do usuário ${userId} com servidor`);
          const syncResult = await this.photoSync.uploadPhotoToServer(userId, saveResult.data.file_path);
          
          if (!syncResult.success) {
            console.warn(`[ImageController] Falha na sincronização: ${syncResult.error}`);
            // Não falha o upload local, apenas avisa sobre a sincronização
          } else {
            console.log(`[ImageController] Foto sincronizada com sucesso para usuário ${userId}`);
          }
        } catch (syncError) {
          console.warn(`[ImageController] Erro na sincronização:`, syncError);
          // Não falha o upload local
        }
      } else {
        console.log(`[ImageController] Sincronização não necessária - syncToServer: ${syncToServer}, category: ${category}, userId: ${userId}`);
      }

      console.log(`[ImageController] Upload finalizado com sucesso`);
      return { success: true, data: saveResult.data };
    } catch (error) {
      console.error('[ImageController] Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ isLoading: false, error: errorMessage });
      
      // Garantir que sempre retornamos um objeto válido
      return { 
        success: false, 
        error: errorMessage,
        data: undefined
      };
    }
  }

  /**
   * Busca imagens por categoria
   */
  async getImagesByCategory(category: string): Promise<ImageListResult> {
    try {
      this.setState({ isLoading: true, error: null });

      const result = await ImageModel.getImagesByCategory(category);
      if (!result.success) {
        const error = result.error || 'Failed to get images';
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      this.setState({ isLoading: false, images: result.data || [] });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting images by category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Busca imagens por usuário
   */
  async getImagesByUser(userId: number): Promise<ImageListResult> {
    try {
      this.setState({ isLoading: true, error: null });

      const result = await ImageModel.getImagesByUser(userId);
      if (!result.success) {
        const error = result.error || 'Failed to get user images';
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      this.setState({ isLoading: false, images: result.data || [] });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting images by user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Busca todas as imagens
   */
  async getAllImages(options: ImageQueryOptions = {}): Promise<ImageListResult> {
    try {
      this.setState({ isLoading: true, error: null });

      const result = await ImageModel.getAllImages(options);
      if (!result.success) {
        const error = result.error || 'Failed to get images';
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      this.setState({ isLoading: false, images: result.data || [] });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting all images:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Busca uma imagem por ID
   */
  async getImageById(id: number): Promise<{ success: boolean; data?: ImageData; error?: string }> {
    try {
      this.setState({ isLoading: true, error: null });

      const result = await ImageModel.getImageById(id);
      if (!result.success) {
        const error = result.error || 'Failed to get image';
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      this.setState({ isLoading: false, currentImage: result.data || null });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting image by ID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Remove uma imagem
   */
  async deleteImage(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      this.setState({ isLoading: true, error: null });

      // Buscar a imagem para obter o caminho do arquivo
      const imageResult = await ImageModel.getImageById(id);
      if (!imageResult.success || !imageResult.data) {
        const error = imageResult.error || 'Image not found';
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      // Remover arquivo do sistema
      const deleteFileResult = await ImageUtils.deleteFile(imageResult.data.file_path);
      if (!deleteFileResult.success) {
        console.warn('Failed to delete file:', deleteFileResult.error);
      }

      // Remover do banco de dados
      const deleteDbResult = await ImageModel.deleteImage(id);
      if (!deleteDbResult.success) {
        const error = deleteDbResult.error || 'Failed to delete image from database';
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      // Atualizar estado
      this.setState({ 
        isLoading: false,
        images: this.state.images.filter(img => img.id !== id),
        currentImage: this.state.currentImage?.id === id ? null : this.state.currentImage
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Converte imagem para base64
   */
  async convertImageToBase64(imageId: number): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const imageResult = await ImageModel.getImageById(imageId);
      if (!imageResult.success || !imageResult.data) {
        return { success: false, error: 'Image not found' };
      }

      const base64Result = await ImageUtils.convertToBase64(imageResult.data.file_path);
      return base64Result;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Obtém estatísticas de imagens
   */
  async getImageStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await ImageModel.getImageStats();
    } catch (error) {
      console.error('Error getting image stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Sincroniza foto de perfil do usuário
   */
  async syncUserPhoto(userId: number): Promise<{ success: boolean; data?: { localPath: string; needsUpdate: boolean; photoUrl: string }; error?: string }> {
    try {
      this.setState({ isLoading: true, error: null });

      const syncResult = await this.photoSync.syncUserPhoto(userId);
      
      if (!syncResult.success) {
        const error = syncResult.error || 'Failed to sync user photo';
        this.setState({ isLoading: false, error });
        return { success: false, error };
      }

      this.setState({ isLoading: false });
      return { success: true, data: syncResult.data };
    } catch (error) {
      console.error('Error syncing user photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload de foto de perfil com sincronização automática
   */
  async uploadUserPhoto(
    fileUri: string, 
    userId: number,
    originalFilename?: string
  ): Promise<ImageUploadResult> {
    return this.uploadImage(fileUri, 'user_photo', userId, originalFilename, true);
  }

  /**
   * Limpa cache de fotos antigas
   */
  async cleanOldPhotos(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.photoSync.cleanOldPhotos();
      return result;
    } catch (error) {
      console.error('Error cleaning old photos:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Obtém o estado atual
   */
  getState(): ImageControllerState {
    return { ...this.state };
  }

  /**
   * Atualiza o estado e notifica subscribers
   */
  private setState(newState: Partial<ImageControllerState>): void {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }

  /**
   * Adiciona um subscriber para mudanças de estado
   */
  subscribe(callback: (state: ImageControllerState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notifica todos os subscribers sobre mudanças de estado
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  /**
   * Limpa o estado de erro
   */
  clearError(): void {
    this.setState({ error: null });
  }

  /**
   * Verifica se o controller está pronto
   */
  isReady(): boolean {
    return this.db.isReady();
  }
}

// EXPANSÃO FUTURA:
// - Upload em lote
// - Compressão automática
// - Cache de imagens
// - Sincronização com servidor
// - Backup automático
// - Análise de conteúdo de imagem
