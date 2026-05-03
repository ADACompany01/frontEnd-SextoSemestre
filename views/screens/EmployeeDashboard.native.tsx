/**
 * EmployeeDashboard - Dashboard do funcionário para React Native
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Image, Modal, AppState } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { RequestController, ImageController } from '../../controllers';
import { StarRating } from '../components/StarRating.native';
import { ImageUtils } from '../../utils/ImageUtils';
import { type User, type AccessibilityRequest } from '../../models';
import ApiService from '../../services/ApiService';
import { API_BASE_URL } from '../../config/api.config';

interface EmployeeDashboardProps {
  user: User;
  onLogout: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  user,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState('solicitacoes');
  const [selectedRequest, setSelectedRequest] = useState<AccessibilityRequest | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [requestController] = useState(() => RequestController.getInstance());
  const [imageController] = useState(() => ImageController.getInstance());
  const [requestState, setRequestState] = useState(requestController.getState());
  const [uploadingFileFor, setUploadingFileFor] = useState<{ type: 'quote' | 'contract'; request: AccessibilityRequest } | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    const unsubscribeRequest = requestController.subscribe(setRequestState);
    
    // Carregar solicitações do backend quando o componente é montado
    const loadRequests = async () => {
      try {
        await requestController.loadRequestsFromApi();
      } catch (error) {
        console.error('[EmployeeDashboard] Erro ao carregar solicitações:', error);
      }
    };
    
    loadRequests();
    
    return () => {
      unsubscribeRequest();
    };
  }, [requestController]);

  // Carregar foto do usuário
  useEffect(() => {
    const loadUserPhoto = async () => {
      if (user.id) {
        try {
          console.log(`[EmployeeDashboard] Buscando foto local para usuário ${user.id}`);
          const result = await imageController.getImagesByUser(user.id);
          if (result.success && result.data) {
            const profilePhoto = result.data.find((img: any) => img.category === 'user_photo');
            if (profilePhoto) {
              console.log(`[EmployeeDashboard] Foto local encontrada: ${profilePhoto.file_path}`);
              setUserPhoto(profilePhoto.file_path);
            }
          }
        } catch (error) {
          console.error('[EmployeeDashboard] Erro ao carregar foto:', error);
        }
      }
    };
    loadUserPhoto();
  }, [user.id, imageController]);

  // Monitorar AppState para recarregar foto quando app volta do background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[EmployeeDashboard] App voltou para foreground, recarregando foto...');
        // Recarregar foto quando app volta do background
        const reloadPhoto = async () => {
          if (user.id) {
            try {
              const result = await imageController.getImagesByUser(user.id);
              if (result.success && result.data) {
                const profilePhoto = result.data.find((img: any) => img.category === 'user_photo');
                if (profilePhoto) {
                  setUserPhoto(profilePhoto.file_path);
                }
              }
            } catch (error) {
              console.error('[EmployeeDashboard] Erro ao recarregar foto:', error);
            }
          }
        };
        reloadPhoto();
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, [user.id, imageController]);

  const statusConfig = requestController.getStatusConfig();

  const handleAction = async (request: AccessibilityRequest, actionType: string) => {
    if (actionType === 'sendQuote') {
      setUploadingFileFor({ type: 'quote', request });
    } else if (actionType === 'attachContract') {
      setUploadingFileFor({ type: 'contract', request });
    } else if (actionType === 'startDev') {
      // Iniciar desenvolvimento
      try {
        const nextStatus = statusConfig.nextStatus[request.status];
        if (nextStatus) {
          await requestController.updateRequestStatus(request.id, nextStatus);
          // Inicializa com status "Analysis"
          await requestController.updateDevelopmentStatus(request.id, 'Analysis');
          Alert.alert('Sucesso', 'Desenvolvimento iniciado!');
        }
      } catch (error) {
        console.error('Error starting development:', error);
        Alert.alert('Erro', 'Erro ao iniciar desenvolvimento');
      }
    } else {
      try {
        const nextStatus = statusConfig.nextStatus[request.status];
        if (nextStatus) {
          await requestController.updateRequestStatus(request.id, nextStatus);
          Alert.alert('Sucesso', 'Status atualizado com sucesso!');
        }
      } catch (error) {
        console.error('Error updating request status:', error);
        Alert.alert('Erro', 'Erro ao atualizar status');
      }
    }
  };

  const handleFileSelect = async () => {
    try {
      console.log('[EmployeeDashboard] Iniciando seleção de arquivo...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      console.log('[EmployeeDashboard] Resultado do DocumentPicker:', JSON.stringify(result, null, 2));

      // Verificar se foi cancelado (versão nova usa 'canceled', versão antiga usa 'type: cancel')
      if (result.canceled === true || (result as any).type === 'cancel') {
        console.log('[EmployeeDashboard] Seleção cancelada pelo usuário');
        return;
      }

      // Versão nova do expo-document-picker usa 'assets' array
      if ('assets' in result && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validar tamanho do arquivo (10MB máximo)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          Alert.alert(
            'Arquivo muito grande',
            `O arquivo selecionado tem ${sizeMB}MB. O tamanho máximo permitido é 10MB. Por favor, selecione um arquivo menor.`
          );
          return;
        }
        
        const fileName = file.name || file.uri?.split('/').pop() || 'documento.pdf';
        const fileUri = file.uri;

        console.log('[EmployeeDashboard] Arquivo selecionado (nova API):', {
          name: fileName,
          uri: fileUri,
          size: file.size,
          sizeMB: (file.size / (1024 * 1024)).toFixed(2),
          mimeType: file.mimeType,
        });

        // Atualizar estado com o arquivo selecionado
        setSelectedFile({
          type: 'success',
          name: fileName,
          uri: fileUri,
          size: file.size,
          mimeType: file.mimeType || 'application/pdf',
        } as any);

        setFileName(fileName);
        
        Alert.alert('Sucesso', `Arquivo "${fileName}" selecionado com sucesso!`);
        return;
      }

      // Versão antiga do expo-document-picker usa 'type' e propriedades diretas
      if ((result as any).type === 'success') {
        const file = result as any;
        const fileName = file.name || file.uri?.split('/').pop() || 'documento.pdf';
        const fileUri = file.uri;

        console.log('[EmployeeDashboard] Arquivo selecionado (API antiga):', {
          name: fileName,
          uri: fileUri,
          size: file.size,
          mimeType: file.mimeType,
        });

        setSelectedFile({
          type: 'success',
          name: fileName,
          uri: fileUri,
          size: file.size,
          mimeType: file.mimeType || 'application/pdf',
        } as any);

        setFileName(fileName);
        
        Alert.alert('Sucesso', `Arquivo "${fileName}" selecionado com sucesso!`);
        return;
      }

      // Se chegou aqui, o formato não foi reconhecido
      console.error('[EmployeeDashboard] Formato de resultado inesperado:', result);
      Alert.alert('Erro', 'Formato de arquivo não reconhecido. Tente novamente.');
    } catch (error) {
      console.error('[EmployeeDashboard] Erro ao selecionar arquivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[EmployeeDashboard] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      Alert.alert('Erro', `Não foi possível selecionar o arquivo: ${errorMessage}`);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || (selectedFile as any).type === 'cancel') {
      Alert.alert('Erro', 'Por favor, selecione um arquivo primeiro.');
      return;
    }

    if (!uploadingFileFor) return;

    setIsUploading(true);

    try {
      const { type, request } = uploadingFileFor;

      // Para React Native, precisamos usar o URI do arquivo
      const fileUri = (selectedFile as any).uri;
      const fileName = (selectedFile as any).name || 'documento.pdf';
      const fileType = (selectedFile as any).mimeType || 'application/pdf';
      const fileSize = (selectedFile as any).size;
      
      console.log('[EmployeeDashboard] Preparando upload:', {
        uri: fileUri,
        name: fileName,
        type: fileType,
        size: fileSize,
        sizeMB: (fileSize / (1024 * 1024)).toFixed(2),
      });
      
      // Verificar se o URI do arquivo está correto
      if (!fileUri) {
        throw new Error('URI do arquivo não encontrado');
      }
      
      // No React Native, o URI deve começar com file://
      if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
        console.warn('[EmployeeDashboard] URI do arquivo pode estar incorreto:', fileUri);
      }

      // Criar FormData para upload
      // IMPORTANTE: No React Native, o FormData precisa ser criado de forma específica
      const formData = new FormData();
      
      // FormData para React Native - formato correto
      // No React Native, precisamos usar o formato específico com uri, type e name
      // O nome do campo deve ser 'file' para corresponder ao FileInterceptor('file') no backend
      formData.append('file', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      } as any);
      
      console.log('[EmployeeDashboard] FormData criado:', {
        hasFile: formData.has('file'),
        fileUri,
        fileName,
        fileType,
        fileSize,
      });
      
      // Verificar se o URI do arquivo está correto
      if (!fileUri) {
        throw new Error('URI do arquivo não encontrado');
      }
      
      // No React Native, o URI deve começar com file://
      if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
        console.warn('[EmployeeDashboard] URI do arquivo pode estar incorreto:', fileUri);
      }

      // Determinar endpoint baseado no tipo
      // Para orçamentos, usar _codOrcamento (UUID) se disponível
      // Para contratos, usar _idContrato (UUID) se disponível
      let endpoint = '';
      let entityId: string;

      if (type === 'quote') {
        // Upload de orçamento - usar _codOrcamento se disponível, senão criar orçamento primeiro
        const requestAny = request as any;
        if (requestAny._codOrcamento) {
          // Já existe orçamento, usar o UUID
          entityId = requestAny._codOrcamento;
          endpoint = `/orcamentos/${entityId}/upload`;
        } else if (requestAny._idSolicitacao) {
          // É uma solicitação pendente, criar orçamento automaticamente
          console.log('[EmployeeDashboard] Criando orçamento automaticamente para solicitação:', requestAny._idSolicitacao);
          
          try {
            // ApiService já é uma instância singleton exportada
            console.log('[EmployeeDashboard] Chamando createOrcamentoFromRequest...');
            console.log('[EmployeeDashboard] Token disponível:', ApiService.hasToken());
            const orcamentoResponse = await ApiService.createOrcamentoFromRequest(requestAny._idSolicitacao);
            
            if (!orcamentoResponse.success) {
              // Se o erro for 409 (já existe orçamento), buscar a solicitação para obter o cod_orcamento
              if (orcamentoResponse.statusCode === 409) {
                console.log('[EmployeeDashboard] Orçamento já existe, buscando solicitação para obter cod_orcamento...');
                const solicitacaoResponse = await ApiService.getRequest(requestAny._idSolicitacao);
                
                if (solicitacaoResponse.success && solicitacaoResponse.data) {
                  const solicitacao = solicitacaoResponse.data.data || solicitacaoResponse.data;
                  entityId = solicitacao.cod_orcamento;
                  
                  if (entityId) {
                    endpoint = `/orcamentos/${entityId}/upload`;
                    console.log('[EmployeeDashboard] Usando orçamento existente, fazendo upload para:', endpoint);
                  } else {
                    throw new Error('Orçamento existe mas não foi possível obter o cod_orcamento');
                  }
                } else {
                  throw new Error('Não foi possível buscar a solicitação para obter o orçamento existente');
                }
              } else {
                throw new Error(orcamentoResponse.error || 'Erro ao criar orçamento');
              }
            } else {
              // Usar o cod_orcamento retornado
              entityId = orcamentoResponse.data?.cod_orcamento || orcamentoResponse.data?.data?.cod_orcamento;
              
              if (!entityId) {
                throw new Error('Orçamento criado mas não foi possível obter o ID');
              }
              
              endpoint = `/orcamentos/${entityId}/upload`;
              console.log('[EmployeeDashboard] Orçamento criado com sucesso, fazendo upload para:', endpoint);
            }
          } catch (createError) {
            console.error('[EmployeeDashboard] Erro ao criar/buscar orçamento:', createError);
            throw new Error(`Erro ao criar/buscar orçamento: ${createError instanceof Error ? createError.message : 'Erro desconhecido'}`);
          }
        } else {
          // Tentar usar o ID numérico - pode ser um UUID que foi convertido incorretamente
          // Se não funcionar, o backend retornará um erro claro
          entityId = request.id.toString();
          endpoint = `/orcamentos/${entityId}/upload`;
          console.warn('[EmployeeDashboard] Tentando upload com ID numérico - pode não funcionar se o backend esperar UUID');
        }
      } else {
        // Upload de contrato - usar _idContrato se disponível
        const requestAny = request as any;
        if (requestAny._idContrato) {
          entityId = requestAny._idContrato;
        } else {
          entityId = request.id.toString();
        }
        endpoint = `/contratos/${entityId}/upload`;
      }

      console.log(`[EmployeeDashboard] Fazendo upload para: ${endpoint} (entityId: ${entityId})`);

      // Fazer upload do arquivo
      // IMPORTANTE: Não definir Content-Type manualmente - o axios/form-data faz isso automaticamente
      // Com timeout maior para arquivos grandes (5 minutos)
      console.log('[EmployeeDashboard] Iniciando upload...');
      
      // Configuração específica para upload de arquivo no React Native
      // IMPORTANTE: No React Native, não devemos definir headers manualmente para FormData
      // O axios/form-data faz isso automaticamente com o boundary correto
      const uploadConfig: any = {
        timeout: 300000, // 5 minutos para arquivos grandes
        // Não definir headers - o interceptador do ApiService já remove Content-Type para FormData
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      };
      
      console.log('[EmployeeDashboard] Configuração de upload:', {
        timeout: uploadConfig.timeout,
        endpoint,
        fileSize: `${(fileSize / (1024 * 1024)).toFixed(2)}MB`,
      });
      
      // Usar fetch nativo do React Native para uploads (mais confiável que axios com FormData)
      // ApiService já é uma instância exportada como default
      const token = ApiService.getAuthToken();
      const baseURL = API_BASE_URL || 'http://192.168.1.7:3000';
      const fullUrl = `${baseURL}${endpoint}`;
      
      console.log('[EmployeeDashboard] Fazendo upload com fetch nativo para:', fullUrl);
      
      const fetchResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // NÃO definir Content-Type - o fetch faz isso automaticamente para FormData
        },
        body: formData,
      });
      
      console.log('[EmployeeDashboard] Resposta do fetch:', {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        ok: fetchResponse.ok,
      });
      
      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro ${fetchResponse.status}: ${fetchResponse.statusText}`);
      }
      
      const responseData = await fetchResponse.json();
      
      const uploadResponse = {
        success: true,
        data: responseData,
        statusCode: fetchResponse.status,
      };

      console.log('[EmployeeDashboard] Resposta do upload:', uploadResponse);

      // Atualizar solicitação com dados do arquivo
      const fileData = {
        name: fileName,
        url: uploadResponse.data?.filePath || uploadResponse.data?.data?.filePath || '#',
      };

      console.log('[EmployeeDashboard] Atualizando solicitação com arquivo:', fileData);
      
      await requestController.attachFileToRequest(request.id, type, fileData);

      setUploadingFileFor(null);
      setFileName('');
      setSelectedFile(null);
      
      Alert.alert('Sucesso', `${type === 'quote' ? 'Orçamento' : 'Contrato'} enviado com sucesso!`);
    } catch (error) {
      console.error('[EmployeeDashboard] Erro ao fazer upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar arquivo. Tente novamente.';
      console.error('[EmployeeDashboard] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateDevelopmentStatus = async (devStatus: any) => {
    if (!selectedRequest) return;
    
    try {
      await requestController.updateDevelopmentStatus(selectedRequest.id, devStatus);
      Alert.alert('Sucesso', 'Status de desenvolvimento atualizado!');
    } catch (error) {
      console.error('Error updating development status:', error);
      Alert.alert('Erro', 'Erro ao atualizar status');
    }
  };

  const handleViewPhoto = () => {
    if (userPhoto) {
      setIsPhotoModalVisible(true);
    } else {
      handlePhotoUpload();
    }
  };

  const handlePhotoUpload = async () => {
    try {
      Alert.alert(
        'Selecionar Foto',
        'Escolha como deseja adicionar sua foto de perfil',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Galeria',
            onPress: () => selectImageFromGallery(),
          },
          {
            text: 'Câmera',
            onPress: () => selectImageFromCamera(),
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error showing photo options:', error);
      Alert.alert('Erro', 'Não foi possível abrir as opções de foto');
    }
  };

  const selectImageFromGallery = async () => {
    try {
      console.log(`[EmployeeDashboard] Solicitando permissão da galeria`);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        console.log(`[EmployeeDashboard] Permissão da galeria negada`);
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria para selecionar fotos.');
        return;
      }

      console.log(`[EmployeeDashboard] Abrindo galeria`);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log(`[EmployeeDashboard] Resultado da galeria:`, { canceled: result.canceled, hasAssets: !!result.assets });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`[EmployeeDashboard] Imagem selecionada: ${result.assets[0].uri}`);
        await uploadSelectedImage(result.assets[0].uri);
      } else {
        console.log(`[EmployeeDashboard] Seleção cancelada ou sem assets`);
      }
    } catch (error) {
      console.error('[EmployeeDashboard] Error selecting image from gallery:', error);
      Alert.alert('Erro', 'Não foi possível acessar a galeria');
    }
  };

  const selectImageFromCamera = async () => {
    try {
      console.log(`[EmployeeDashboard] Solicitando permissão da câmera`);
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        console.log(`[EmployeeDashboard] Permissão da câmera negada`);
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à câmera para tirar fotos.');
        return;
      }

      console.log(`[EmployeeDashboard] Abrindo câmera`);
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log(`[EmployeeDashboard] Resultado da câmera:`, { canceled: result.canceled, hasAssets: !!result.assets });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`[EmployeeDashboard] Foto capturada: ${result.assets[0].uri}`);
        await uploadSelectedImage(result.assets[0].uri);
      } else {
        console.log(`[EmployeeDashboard] Captura cancelada ou sem assets`);
      }
    } catch (error) {
      console.error('[EmployeeDashboard] Error selecting image from camera:', error);
      Alert.alert('Erro', 'Não foi possível acessar a câmera');
    }
  };

  const uploadSelectedImage = async (imageUri: string) => {
    try {
      console.log(`[EmployeeDashboard] Iniciando upload da foto: ${imageUri}`);
      
      if (!user.id) {
        console.error(`[EmployeeDashboard] ID do usuário não encontrado`);
        Alert.alert('Erro', 'ID do usuário não encontrado');
        return;
      }

      console.log(`[EmployeeDashboard] Gerando nome único para arquivo`);
      const filename = ImageUtils.generateUniqueFilename('profile_photo', 'user_photo');
      console.log(`[EmployeeDashboard] Nome do arquivo: ${filename}`);
      
      const fileResult = await ImageUtils.copyToDocuments(imageUri, filename);
      
      if (!fileResult.success || !fileResult.data) {
        console.error(`[EmployeeDashboard] Falha ao criar arquivo: ${fileResult.error}`);
        Alert.alert('Erro', 'Falha ao criar arquivo da imagem');
        return;
      }

      console.log(`[EmployeeDashboard] Arquivo criado: ${fileResult.data}`);

      console.log(`[EmployeeDashboard] Obtendo informações do arquivo`);
      const fileInfo = await ImageUtils.getImageInfo(fileResult.data);
      if (!fileInfo.success || !fileInfo.data) {
        console.error(`[EmployeeDashboard] Falha ao obter informações: ${fileInfo.error}`);
        Alert.alert('Erro', 'Falha ao obter informações do arquivo');
        return;
      }

      console.log(`[EmployeeDashboard] Informações do arquivo:`, fileInfo.data);

      console.log(`[EmployeeDashboard] Fazendo upload da foto para usuário ${user.id}`);
      
      const uploadResult = await imageController.uploadImage(
        fileResult.data,
        'user_photo',
        user.id,
        filename,
        false
      ).catch((uploadError) => {
        console.error(`[EmployeeDashboard] Exceção no upload:`, uploadError);
        return { success: false, error: uploadError.message || 'Erro desconhecido no upload', data: undefined };
      });

      if (!uploadResult.success || !uploadResult.data) {
        console.error(`[EmployeeDashboard] Falha no upload: ${uploadResult.error}`);
        Alert.alert('Erro', `Falha no upload: ${uploadResult.error || 'Erro desconhecido'}`);
        return;
      }

      console.log(`[EmployeeDashboard] Upload realizado com sucesso`);

      try {
        setUserPhoto(fileResult.data);
        console.log(`[EmployeeDashboard] Estado da foto atualizado`);
      } catch (stateError) {
        console.error(`[EmployeeDashboard] Erro ao atualizar estado:`, stateError);
      }
      
      Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');

    } catch (error) {
      console.error('[EmployeeDashboard] Error uploading selected image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Erro ao fazer upload da foto: ${errorMessage}`);
    }
  };

  const getActionButton = (request: AccessibilityRequest) => {
    const { status } = request;

    if (status === 'Awaiting Quote') {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAction(request, 'sendQuote')}
        >
          <Text style={styles.actionButtonText}>📄 Enviar Orçamento</Text>
        </TouchableOpacity>
      );
    }

    if (status === 'Quote Sent') {
      return (
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>⏳ Aguardando aprovação do cliente...</Text>
        </View>
      );
    }

    if (status === 'Quote Approved') {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAction(request, 'attachContract')}
        >
          <Text style={styles.actionButtonText}>📎 Anexar Contrato</Text>
        </TouchableOpacity>
      );
    }

    if (status === 'Contract Sent') {
      return (
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>⏳ Aguardando assinatura do cliente...</Text>
        </View>
      );
    }

    if (status === 'Contract Signed') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSuccess]}
          onPress={() => handleAction(request, 'startDev')}
        >
          <Text style={styles.actionButtonText}>🚀 Iniciar Desenvolvimento</Text>
        </TouchableOpacity>
      );
    }

    if (status === 'In Development') {
      return null; // Será renderizado separadamente abaixo
    }

    return (
      <View style={styles.completedBadge}>
        <Text style={styles.completedText}>✓ Concluído</Text>
      </View>
    );
  };

  const renderContent = () => {
    if (activeTab === 'perfil') {
      return (
        <ScrollView style={styles.content}>
          <View style={styles.profileCard}>
            <TouchableOpacity 
              style={styles.profileAvatarContainer}
              onPress={handleViewPhoto}
              activeOpacity={0.8}
            >
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={styles.profileAvatarImage} />
              ) : (
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.photoUploadOverlay}>
                <Text style={styles.photoUploadIcon}>
                  {userPhoto ? '🔍' : '➕'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <Text style={styles.profileName}>{user?.name || 'N/A'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'N/A'}</Text>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>Funcionário</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={handlePhotoUpload}
            >
              <Text style={styles.photoButtonText}>
                {userPhoto ? 'Alterar Foto' : 'Adicionar Foto'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    // Tab de Solicitações
    if (selectedRequest) {
      return (
        // Detail view
        <ScrollView style={styles.detailContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRequest(null)}
          >
            <Text style={styles.backButtonText}>← Voltar para a lista</Text>
          </TouchableOpacity>

          <View style={styles.detailCard}>
            <Text style={styles.detailClient}>{selectedRequest.clientName}</Text>
            <Text style={styles.detailSite}>{selectedRequest.site}</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Plano {selectedRequest.plan}</Text>
            </View>

            {uploadingFileFor?.request.id === selectedRequest.id ? (
              <View style={styles.uploadCard}>
                <Text style={styles.uploadTitle}>
                  📎 Anexar {uploadingFileFor.type === 'quote' ? 'Orçamento' : 'Contrato'}
                </Text>

                <TouchableOpacity 
                  style={styles.selectFileButton} 
                  onPress={handleFileSelect}
                  disabled={isUploading}
                >
                  <Text style={styles.selectFileButtonText}>
                    {fileName || '📁 Selecionar Arquivo PDF'}
                  </Text>
                </TouchableOpacity>

                {fileName && (
                  <Text style={styles.fileInfoText}>
                    Arquivo: {fileName}
                  </Text>
                )}

                <View style={styles.uploadActions}>
                  <TouchableOpacity
                    style={[styles.uploadButton, (isUploading || !selectedFile) && styles.uploadButtonDisabled]}
                    onPress={handleFileUpload}
                    disabled={isUploading || !selectedFile}
                  >
                    <Text style={styles.uploadButtonText}>
                      {isUploading ? '⏳ Enviando...' : '✅ Confirmar Upload'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setUploadingFileFor(null);
                      setFileName('');
                      setSelectedFile(null);
                    }}
                    disabled={isUploading}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {getActionButton(selectedRequest)}

                {/* Development Status Update */}
                {selectedRequest.status === 'In Development' && (
                  <View style={styles.developmentSection}>
                    <Text style={styles.developmentSectionTitle}>📊 Atualizar Progresso do Desenvolvimento</Text>
                    
                    <TouchableOpacity
                      style={styles.devStatusButton}
                      onPress={() => handleUpdateDevelopmentStatus('Analysis')}
                    >
                      <Text style={styles.devStatusText}>🔍 Em Análise</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.devStatusButton}
                      onPress={() => handleUpdateDevelopmentStatus('Development')}
                    >
                      <Text style={styles.devStatusText}>💻 Em Desenvolvimento</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.devStatusButton}
                      onPress={() => handleUpdateDevelopmentStatus('Testing')}
                    >
                      <Text style={styles.devStatusText}>🧪 Em Teste</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.devStatusButton, styles.devStatusButtonDone]}
                      onPress={() => handleUpdateDevelopmentStatus('Done')}
                    >
                      <Text style={styles.devStatusText}>✅ Concluído</Text>
                    </TouchableOpacity>

                    {selectedRequest.developmentStatus && (
                      <View style={styles.currentDevStatus}>
                        <Text style={styles.currentDevStatusText}>
                          Status atual: {statusConfig.developmentSteps[['Analysis', 'Development', 'Testing', 'Done'].indexOf(selectedRequest.developmentStatus)]}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <Text style={styles.itemsTitle}>📝 Itens Solicitados pelo Cliente</Text>
                {selectedRequest.selectedIssues.length > 0 ? (
                  selectedRequest.selectedIssues.map((issue, index) => (
                    <View key={index} style={styles.issueCard}>
                      <Text style={styles.issueText}>{issue.text}</Text>
                      <StarRating rating={issue.priority} readOnly={true} />
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Nenhum item específico selecionado.</Text>
                )}
              </>
            )}
          </View>
        </ScrollView>
      );
    }

    // List view (padrão quando não está em detalhes)
    return (
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>📋 Solicitações</Text>

        {requestState.requests.length > 0 ? (
          requestState.requests.map((req) => (
            <TouchableOpacity
              key={req.id}
              style={styles.requestCard}
              onPress={() => setSelectedRequest(req)}
            >
              <View style={styles.requestInfo}>
                <Text style={styles.requestClient}>{req.clientName}</Text>
                <Text style={styles.requestSite}>{req.site} - Plano {req.plan}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {statusConfig.map[req.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Nenhuma solicitação</Text>
            <Text style={styles.emptyDesc}>Não há solicitações no momento.</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={handleViewPhoto}
            activeOpacity={0.8}
          >
            {userPhoto ? (
              <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Usuário'}! 👋</Text>
            <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Navigation footer - só mostra se não estiver em detalhes */}
      {!selectedRequest && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'solicitacoes' && styles.tabActive]}
            onPress={() => setActiveTab('solicitacoes')}
          >
            <Text style={[styles.tabIcon, activeTab === 'solicitacoes' && styles.tabIconActive]}>
              📋
            </Text>
            <Text style={[styles.tabLabel, activeTab === 'solicitacoes' && styles.tabLabelActive]}>
              Solicitações
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'perfil' && styles.tabActive]}
            onPress={() => setActiveTab('perfil')}
          >
            <Text style={[styles.tabIcon, activeTab === 'perfil' && styles.tabIconActive]}>
              👤
            </Text>
            <Text style={[styles.tabLabel, activeTab === 'perfil' && styles.tabLabelActive]}>
              Perfil
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de visualização da foto em tela cheia */}
      <Modal
        visible={isPhotoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPhotoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setIsPhotoModalVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.modalCloseButtonText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.modalContent}>
            {userPhoto && (
              <Image 
                source={{ uri: userPhoto }} 
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setIsPhotoModalVisible(false);
                handlePhotoUpload();
              }}
            >
              <Text style={styles.modalButtonText}>📷 Alterar Foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  email: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requestInfo: {
    flex: 1,
  },
  requestClient: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  requestSite: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 20,
    color: '#9ca3af',
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailContainer: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailClient: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  detailSite: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  planBadge: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  planBadgeText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonSuccess: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  completedText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  issueCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  issueText: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  infoBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  infoBadgeText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  developmentSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  developmentSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  devStatusButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  devStatusButtonDone: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  devStatusText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  currentDevStatus: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  currentDevStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadCard: {
    backgroundColor: '#f0f4ff',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  selectFileButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  selectFileButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  fileInfoText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  tabActive: {
    borderTopWidth: 3,
    borderTopColor: '#6366f1',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#6366f1',
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatarContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
  },
  profileAvatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  photoUploadOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  photoUploadIcon: {
    fontSize: 16,
    color: 'white',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  profileBadge: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  profileBadgeText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  photoButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  photoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 80,
  },
  modalImage: {
    width: '90%',
    height: '90%',
  },
  modalActions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});