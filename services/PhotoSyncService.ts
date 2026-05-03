/**
 * PhotoSyncService - Serviço de sincronização de fotos de perfil
 * 
 * Responsabilidades:
 * - Sincronizar fotos de perfil entre dispositivos
 * - Upload de fotos para servidor
 * - Download de fotos do servidor
 * - Gerenciar cache local de fotos
 * - Verificar se foto precisa ser atualizada
 */

import * as FileSystem from 'expo-file-system/legacy';
import { ImageModel } from '../models/image/ImageModel';
import { UserModel } from '../models/user/UserModel';

export interface PhotoSyncData {
  userId: number;
  photoUrl: string;
  lastUpdated: string;
  fileSize: number;
  mimeType: string;
}

export interface PhotoSyncResult {
  success: boolean;
  data?: {
    localPath: string;
    needsUpdate: boolean;
    photoUrl: string;
  };
  error?: string;
}

export class PhotoSyncService {
  private static instance: PhotoSyncService;
  private static readonly SERVER_BASE_URL = 'https://your-api-server.com/api'; // Substitua pela sua API
  private static readonly PHOTO_CACHE_DIR = 'photo_cache';
  private static readonly PHOTO_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

  private constructor() {}

  static getInstance(): PhotoSyncService {
    if (!PhotoSyncService.instance) {
      PhotoSyncService.instance = new PhotoSyncService();
    }
    return PhotoSyncService.instance;
  }

  /**
   * Sincroniza a foto de perfil do usuário
   * Verifica se precisa baixar uma nova versão do servidor
   */
  async syncUserPhoto(userId: number): Promise<PhotoSyncResult> {
    try {
      console.log(`[PhotoSync] Iniciando sincronização para usuário ${userId}`);

      // 1. Verificar se usuário tem foto no servidor
      const serverPhoto = await this.getServerPhoto(userId);
      if (!serverPhoto.success) {
        console.log(`[PhotoSync] Usuário ${userId} não tem foto no servidor`);
        return { success: true, data: { localPath: '', needsUpdate: false, photoUrl: '' } };
      }

      // 2. Verificar se foto local precisa ser atualizada
      const localPhoto = await this.getLocalPhoto(userId);
      const needsUpdate = this.shouldUpdatePhoto(localPhoto, serverPhoto.data!);

      if (!needsUpdate && localPhoto?.localPath) {
        console.log(`[PhotoSync] Foto local está atualizada para usuário ${userId}`);
        return { 
          success: true, 
          data: { 
            localPath: localPhoto.localPath, 
            needsUpdate: false, 
            photoUrl: serverPhoto.data!.photoUrl 
          } 
        };
      }

      // 3. Baixar foto do servidor
      console.log(`[PhotoSync] Baixando nova foto para usuário ${userId}`);
      const downloadResult = await this.downloadPhotoFromServer(serverPhoto.data!);
      
      if (!downloadResult.success) {
        return { success: false, error: downloadResult.error };
      }

      // 4. Salvar foto localmente
      const saveResult = await this.savePhotoLocally(userId, downloadResult.data!);
      
      if (!saveResult.success) {
        return { success: false, error: saveResult.error };
      }

      console.log(`[PhotoSync] Foto sincronizada com sucesso para usuário ${userId}`);
      return { 
        success: true, 
        data: { 
          localPath: saveResult.data!.localPath, 
          needsUpdate: true, 
          photoUrl: serverPhoto.data!.photoUrl 
        } 
      };

    } catch (error) {
      console.error('[PhotoSync] Erro na sincronização:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Faz upload da foto para o servidor
   */
  async uploadPhotoToServer(userId: number, localPhotoPath: string): Promise<{ success: boolean; data?: PhotoSyncData; error?: string }> {
    try {
      console.log(`[PhotoSync] Fazendo upload da foto para usuário ${userId}`);

      // 1. Verificar se arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(localPhotoPath);
      if (!fileInfo.exists) {
        return { success: false, error: 'Arquivo de foto não encontrado' };
      }

      // 2. Converter para base64
      const base64Data = await FileSystem.readAsStringAsync(localPhotoPath, {
        encoding: FileSystem.EncodingType.Base64
      });

      // 3. Fazer upload para servidor
      const uploadResult = await this.uploadToServer(userId, base64Data, fileInfo);
      
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      console.log(`[PhotoSync] Upload realizado com sucesso para usuário ${userId}`);
      return { success: true, data: uploadResult.data };

    } catch (error) {
      console.error('[PhotoSync] Erro no upload:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Obtém foto do servidor
   */
  private async getServerPhoto(userId: number): Promise<{ success: boolean; data?: PhotoSyncData; error?: string }> {
    try {
      // Por enquanto, simular que não há servidor (modo offline)
      // Quando implementar o servidor real, descomente o código abaixo
      
      console.log(`[PhotoSync] Modo offline - usuário ${userId} não tem foto no servidor`);
      return { success: false, error: 'Foto não encontrada no servidor' };

      /* CÓDIGO PARA QUANDO IMPLEMENTAR O SERVIDOR:
      const response = await fetch(`${PhotoSyncService.SERVER_BASE_URL}/users/${userId}/photo`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Foto não encontrada no servidor' };
        }
        return { success: false, error: `Erro do servidor: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
      */

    } catch (error) {
      console.error('[PhotoSync] Erro ao buscar foto do servidor:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro de conexão' 
      };
    }
  }

  /**
   * Obtém foto local do usuário
   */
  private async getLocalPhoto(userId: number): Promise<{ localPath: string; lastUpdated: string } | null> {
    try {
      const user = await UserModel.getUserById(userId);
      if (!user.success || !user.data?.photo_path) {
        return null;
      }

      const fileInfo = await FileSystem.getInfoAsync(user.data.photo_path);
      if (!fileInfo.exists) {
        return null;
      }

      return {
        localPath: user.data.photo_path,
        lastUpdated: user.data.updated_at || new Date().toISOString()
      };

    } catch (error) {
      console.error('[PhotoSync] Erro ao buscar foto local:', error);
      return null;
    }
  }

  /**
   * Verifica se foto precisa ser atualizada
   */
  private shouldUpdatePhoto(localPhoto: { localPath: string; lastUpdated: string } | null, serverPhoto: PhotoSyncData): boolean {
    if (!localPhoto) {
      return true; // Não tem foto local, precisa baixar
    }

    const localDate = new Date(localPhoto.lastUpdated);
    const serverDate = new Date(serverPhoto.lastUpdated);

    return serverDate > localDate; // Servidor tem versão mais nova
  }

  /**
   * Baixa foto do servidor
   */
  private async downloadPhotoFromServer(serverPhoto: PhotoSyncData): Promise<{ success: boolean; data?: { localPath: string; base64Data: string }; error?: string }> {
    try {
      // 1. Criar diretório de cache se não existir
      const cacheDir = `${FileSystem.documentDirectory}${PhotoSyncService.PHOTO_CACHE_DIR}/`;
      const cacheDirInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (!cacheDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      // 2. Gerar nome único para arquivo
      const fileName = `user_${serverPhoto.userId}_${Date.now()}.jpg`;
      const localPath = `${cacheDir}${fileName}`;

      // 3. Baixar arquivo do servidor
      const downloadResult = await FileSystem.downloadAsync(serverPhoto.photoUrl, localPath);
      
      if (downloadResult.status !== 200) {
        return { success: false, error: `Erro no download: ${downloadResult.status}` };
      }

      // 4. Converter para base64
      const base64Data = await FileSystem.readAsStringAsync(localPath, {
        encoding: FileSystem.EncodingType.Base64
      });

      return { success: true, data: { localPath, base64Data } };

    } catch (error) {
      console.error('[PhotoSync] Erro no download:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Salva foto localmente
   */
  private async savePhotoLocally(userId: number, photoData: { localPath: string; base64Data: string }): Promise<{ success: boolean; data?: { localPath: string }; error?: string }> {
    try {
      // 1. Mover arquivo para diretório permanente
      const permanentPath = `${FileSystem.documentDirectory}user_${userId}_photo.jpg`;
      await FileSystem.moveAsync({
        from: photoData.localPath,
        to: permanentPath
      });

      // 2. Atualizar usuário com novo caminho da foto
      const updateResult = await UserModel.updateUser(userId, { photo_path: permanentPath });
      
      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }

      return { success: true, data: { localPath: permanentPath } };

    } catch (error) {
      console.error('[PhotoSync] Erro ao salvar foto localmente:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Faz upload para servidor
   */
  private async uploadToServer(userId: number, base64Data: string, fileInfo: any): Promise<{ success: boolean; data?: PhotoSyncData; error?: string }> {
    try {
      // Por enquanto, simular upload bem-sucedido (modo offline)
      // Quando implementar o servidor real, descomente o código abaixo
      
      console.log(`[PhotoSync] Modo offline - upload simulado para usuário ${userId}`);
      return { 
        success: true, 
        data: {
          userId,
          photoUrl: `file://local/user_${userId}_photo.jpg`,
          lastUpdated: new Date().toISOString(),
          fileSize: fileInfo.size,
          mimeType: 'image/jpeg'
        }
      };

      /* CÓDIGO PARA QUANDO IMPLEMENTAR O SERVIDOR:
      const response = await fetch(`${PhotoSyncService.SERVER_BASE_URL}/users/${userId}/photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          photoData: base64Data,
          mimeType: 'image/jpeg',
          fileSize: fileInfo.size
        })
      });

      if (!response.ok) {
        return { success: false, error: `Erro no upload: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
      */

    } catch (error) {
      console.error('[PhotoSync] Erro no upload para servidor:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro de conexão' 
      };
    }
  }

  /**
   * Limpa cache de fotos antigas
   */
  async cleanOldPhotos(): Promise<{ success: boolean; error?: string }> {
    try {
      const cacheDir = `${FileSystem.documentDirectory}${PhotoSyncService.PHOTO_CACHE_DIR}/`;
      const cacheDirInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (!cacheDirInfo.exists) {
        return { success: true };
      }

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = `${cacheDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && fileInfo.modificationTime) {
          const fileAge = now - fileInfo.modificationTime * 1000;
          
          if (fileAge > PhotoSyncService.PHOTO_CACHE_EXPIRY) {
            await FileSystem.deleteAsync(filePath);
            console.log(`[PhotoSync] Arquivo antigo removido: ${file}`);
          }
        }
      }

      return { success: true };

    } catch (error) {
      console.error('[PhotoSync] Erro na limpeza:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }
}
