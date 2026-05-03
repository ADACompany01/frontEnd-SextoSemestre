/**
 * ClientDashboard - Dashboard do cliente para React Native
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Modal, AppState } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthController, RequestController, EvaluationController, ImageController } from '../../controllers';
import { EvaluationScreen } from './EvaluationScreen.native';
import { PlanSelectionScreen } from './PlanSelectionScreen.native';
import { Timeline } from '../components/Timeline.native';
import { ImageUtils } from '../../utils/ImageUtils';
import { type User } from '../../models';
import ApiService from '../../services/ApiService';

interface ClientDashboardProps {
  user: User;
  onLogout: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState('avaliar');
  const [evaluationState, setEvaluationState] = useState({ plan: null, issues: [] });
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [selectedHistoryRequest, setSelectedHistoryRequest] = useState<any | null>(null);

  // Controllers
  const [requestController] = useState(() => RequestController.getInstance());
  const [evaluationController] = useState(() => EvaluationController.getInstance());
  const [imageController] = useState(() => ImageController.getInstance());

  // States
  const [requestState, setRequestState] = useState(requestController.getState());
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    const unsubscribeRequest = requestController.subscribe(setRequestState);
    return () => {
      unsubscribeRequest();
    };
  }, [requestController]);

  // Carregar foto do usuário
  useEffect(() => {
    const loadUserPhoto = async () => {
      if (user.id) {
        try {
          // TEMPORARIAMENTE DESABILITADO PARA DEBUG
          // // Primeiro, tentar sincronizar com o servidor
          // console.log(`[ClientDashboard] Sincronizando foto do usuário ${user.id}`);
          // const syncResult = await imageController.syncUserPhoto(user.id);
          
          // if (syncResult.success && syncResult.data?.localPath) {
          //   console.log(`[ClientDashboard] Foto sincronizada: ${syncResult.data.localPath}`);
          //   setUserPhoto(syncResult.data.localPath);
          //   return;
          // }

          // Se não conseguiu sincronizar, buscar foto local
          console.log(`[ClientDashboard] Buscando foto local para usuário ${user.id}`);
          const result = await imageController.getImagesByUser(user.id);
          if (result.success && result.data) {
            // Buscar apenas a foto de perfil mais recente
            const profilePhoto = result.data.find((img: any) => img.category === 'user_photo');
            if (profilePhoto) {
              console.log(`[ClientDashboard] Foto local encontrada: ${profilePhoto.file_path}`);
              setUserPhoto(profilePhoto.file_path);
            }
          }
        } catch (error) {
          console.error('[ClientDashboard] Erro ao carregar foto:', error);
          // Em caso de erro, tentar buscar foto local como fallback
          try {
            const result = await imageController.getImagesByUser(user.id);
            if (result.success && result.data) {
              const profilePhoto = result.data.find((img: any) => img.category === 'user_photo');
              if (profilePhoto) {
                setUserPhoto(profilePhoto.file_path);
              }
            }
          } catch (fallbackError) {
            console.error('[ClientDashboard] Erro no fallback:', fallbackError);
          }
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
        console.log('[ClientDashboard] App voltou para foreground, recarregando foto...');
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
              console.error('[ClientDashboard] Erro ao recarregar foto:', error);
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

  // Filter requests for current client
  const clientRequests = useMemo(
    () => requestState.requests.filter(r => r.clientName === user.name),
    [requestState.requests, user.name]
  );

  const activeRequest = useMemo(
    () => {
      // Pega a solicitação mais recente (prioriza não completa, mas mostra completa se não houver outra)
      const notCompleted = clientRequests
        .filter((r) => r.status !== 'Completed')
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))[0];
      
      if (notCompleted) {
        return notCompleted;
      }
      
      // Se não houver nenhuma não completa, pega a mais recente completa
      const completed = clientRequests
        .filter((r) => r.status === 'Completed')
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))[0];
      
      return completed || null;
    },
    [clientRequests]
  );

  const handleSelectPlan = (plan: 'A' | 'AA' | 'AAA', issues: any[]) => {
    setEvaluationState({ plan, issues });
  };

  const handleConfirmPlan = async (plan: 'A' | 'AA' | 'AAA', selectedIssues: any[]) => {
    try {
      // Obter a URL real da avaliação
      const evaluationState = evaluationController.getState();
      const siteUrl = evaluationState.currentEvaluation?.siteUrl || '';
      
      const requestData = {
        clientName: user.name,
        site: siteUrl,
        plan,
        status: 'Awaiting Quote' as const,
        selectedIssues,
      };

      // Passar o email do cliente para salvar no backend
      await requestController.createRequest(requestData, user.email);

      setEvaluationState({ plan: null, issues: [] });
      setActiveTab('acompanhar');
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const handleBackToEvaluation = () => {
    setEvaluationState({ plan: null, issues: [] });
    evaluationController.clearCurrentEvaluation();
  };

  const handleApproveQuote = async (requestId: string) => {
    try {
      const requestAny = requestState.requests.find((r: any) => r.id.toString() === requestId) as any;
      if (!requestAny?._idSolicitacao) {
        Alert.alert('Erro', 'ID da solicitação não encontrado.');
        return;
      }

      console.log('[ClientDashboard] Aprovando orçamento:', {
        requestId,
        _idSolicitacao: requestAny._idSolicitacao,
        status: requestAny.status,
        quoteFile: requestAny.quoteFile
      });

      // Atualizar status para ORCAMENTO_APROVADO no backend
      // ApiService já é uma instância exportada como default
      const response = await ApiService.updateSolicitacao(requestAny._idSolicitacao, {
        status: 'ORCAMENTO_APROVADO',
      });

      if (response.success) {
        // Atualizar status local
        const nextStatus = requestController.getStatusConfig().nextStatus['Quote Sent'];
        if (nextStatus) {
          await requestController.updateRequestStatus(Number(requestId), nextStatus);
        }
        // Recarregar solicitações para atualizar o estado
        await requestController.loadRequestsFromApi();
        Alert.alert('Sucesso!', 'Orçamento aprovado! Aguarde o contrato.');
      } else {
        throw new Error(response.error || 'Erro ao aprovar orçamento');
      }
    } catch (error) {
      console.error('Error approving quote:', error);
      Alert.alert('Erro', 'Erro ao aprovar orçamento. Tente novamente.');
      throw error;
    }
  };

  const handleRejectQuote = async (requestId: string) => {
    Alert.alert(
      'Recusar Orçamento',
      'Deseja realmente recusar este orçamento? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: async () => {
            try {
              const requestAny = requestState.requests.find((r: any) => r.id.toString() === requestId) as any;
              if (!requestAny?._idSolicitacao) {
                Alert.alert('Erro', 'ID da solicitação não encontrado.');
                return;
              }

              // Atualizar status para CANCELADA no backend
              // ApiService já é uma instância exportada como default
              const response = await ApiService.updateSolicitacao(requestAny._idSolicitacao, {
                status: 'CANCELADA',
              });

              if (response.success) {
                // Atualizar status local
                await requestController.updateRequestStatus(parseInt(requestId), 'Completed');
                Alert.alert('Sucesso', 'Orçamento recusado com sucesso.');
                // Recarregar solicitações
                await requestController.loadRequestsFromApi();
              } else {
                throw new Error(response.error || 'Erro ao recusar orçamento');
              }
            } catch (error) {
              console.error('Error rejecting quote:', error);
              Alert.alert('Erro', 'Erro ao recusar orçamento. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const handleSignContract = async (requestId: string, signatureBase64?: string) => {
    try {
      if (signatureBase64) {
        // Assinar contrato com assinatura digital
        await requestController.signContract(Number(requestId), signatureBase64);
      } else {
        // Fallback: apenas atualizar status (compatibilidade)
        const nextStatus = requestController.getStatusConfig().nextStatus['Contract Sent'];
        if (nextStatus) {
          await requestController.updateRequestStatus(Number(requestId), nextStatus);
        }
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      throw error;
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
      // Mostrar opções para o usuário escolher
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
      console.log(`[ClientDashboard] Solicitando permissão da galeria`);
      
      // Solicitar permissão para acessar a galeria
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        console.log(`[ClientDashboard] Permissão da galeria negada`);
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria para selecionar fotos.');
        return;
      }

      console.log(`[ClientDashboard] Abrindo galeria`);
      
      // Abrir a galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log(`[ClientDashboard] Resultado da galeria:`, { canceled: result.canceled, hasAssets: !!result.assets });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`[ClientDashboard] Imagem selecionada: ${result.assets[0].uri}`);
        await uploadSelectedImage(result.assets[0].uri);
      } else {
        console.log(`[ClientDashboard] Seleção cancelada ou sem assets`);
      }
    } catch (error) {
      console.error('[ClientDashboard] Error selecting image from gallery:', error);
      Alert.alert('Erro', 'Não foi possível acessar a galeria');
    }
  };

  const selectImageFromCamera = async () => {
    try {
      console.log(`[ClientDashboard] Solicitando permissão da câmera`);
      
      // Solicitar permissão para acessar a câmera
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        console.log(`[ClientDashboard] Permissão da câmera negada`);
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à câmera para tirar fotos.');
        return;
      }

      console.log(`[ClientDashboard] Abrindo câmera`);
      
      // Abrir a câmera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log(`[ClientDashboard] Resultado da câmera:`, { canceled: result.canceled, hasAssets: !!result.assets });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`[ClientDashboard] Foto capturada: ${result.assets[0].uri}`);
        await uploadSelectedImage(result.assets[0].uri);
      } else {
        console.log(`[ClientDashboard] Captura cancelada ou sem assets`);
      }
    } catch (error) {
      console.error('[ClientDashboard] Error selecting image from camera:', error);
      Alert.alert('Erro', 'Não foi possível acessar a câmera');
    }
  };

  const uploadSelectedImage = async (imageUri: string) => {
    let loadingShown = false;
    
    try {
      console.log(`[ClientDashboard] Iniciando upload da foto: ${imageUri}`);
      
      // Validar se o usuário tem ID
      if (!user.id) {
        console.error(`[ClientDashboard] ID do usuário não encontrado`);
        Alert.alert('Erro', 'ID do usuário não encontrado');
        return;
      }

      // Mostrar feedback visual
      loadingShown = true;

      // Criar arquivo temporário
      console.log(`[ClientDashboard] Gerando nome único para arquivo`);
      const filename = ImageUtils.generateUniqueFilename('profile_photo', 'user_photo');
      console.log(`[ClientDashboard] Nome do arquivo: ${filename}`);
      
      const fileResult = await ImageUtils.copyToDocuments(imageUri, filename);
      
      if (!fileResult.success || !fileResult.data) {
        console.error(`[ClientDashboard] Falha ao criar arquivo: ${fileResult.error}`);
        Alert.alert('Erro', 'Falha ao criar arquivo da imagem');
        return;
      }

      console.log(`[ClientDashboard] Arquivo criado: ${fileResult.data}`);

      // Obter informações do arquivo
      console.log(`[ClientDashboard] Obtendo informações do arquivo`);
      const fileInfo = await ImageUtils.getImageInfo(fileResult.data);
      if (!fileInfo.success || !fileInfo.data) {
        console.error(`[ClientDashboard] Falha ao obter informações: ${fileInfo.error}`);
        Alert.alert('Erro', 'Falha ao obter informações do arquivo');
        return;
      }

      console.log(`[ClientDashboard] Informações do arquivo:`, fileInfo.data);

      // Upload da imagem SEM sincronização automática (para debug)
      console.log(`[ClientDashboard] Fazendo upload da foto para usuário ${user.id}`);
      
      const uploadResult = await imageController.uploadImage(
        fileResult.data,
        'user_photo',
        user.id,
        filename,
        false // Desabilitar sincronização
      ).catch((uploadError) => {
        console.error(`[ClientDashboard] Exceção no upload:`, uploadError);
        return { success: false, error: uploadError.message || 'Erro desconhecido no upload', data: undefined };
      });

      if (!uploadResult.success || !uploadResult.data) {
        console.error(`[ClientDashboard] Falha no upload: ${uploadResult.error}`);
        Alert.alert('Erro', `Falha no upload: ${uploadResult.error || 'Erro desconhecido'}`);
        return;
      }

      console.log(`[ClientDashboard] Upload realizado com sucesso`);

      // Atualizar estado local de forma segura
      try {
        setUserPhoto(fileResult.data);
        console.log(`[ClientDashboard] Estado da foto atualizado`);
      } catch (stateError) {
        console.error(`[ClientDashboard] Erro ao atualizar estado:`, stateError);
      }
      
      // Mostrar mensagem de sucesso
      Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');

    } catch (error) {
      console.error('[ClientDashboard] Error uploading selected image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Erro ao fazer upload da foto: ${errorMessage}`);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'avaliar':
        return evaluationState.plan ? (
          <PlanSelectionScreen
            plan={evaluationState.plan}
            issues={evaluationState.issues}
            onConfirm={handleConfirmPlan}
            onBack={handleBackToEvaluation}
          />
        ) : (
          <EvaluationScreen onSelectPlan={handleSelectPlan} />
        );

      case 'acompanhar':
        return activeRequest ? (
          <ScrollView style={styles.timelineContainer}>
            {activeRequest.status === 'Completed' && (
              <View style={styles.completedBanner}>
                <Text style={styles.completedBannerIcon}>🎉</Text>
                <Text style={styles.completedBannerTitle}>Projeto Concluído!</Text>
                <Text style={styles.completedBannerText}>
                  Este projeto foi finalizado com sucesso.
                </Text>
                <Text style={styles.completedBannerHint}>
                  💡 Para consultar o histórico completo deste serviço, acesse a aba "Perfil" e clique no projeto desejado.
                </Text>
              </View>
            )}
            <Timeline
              request={activeRequest}
              statusConfig={requestController.getStatusConfig()}
              onApprove={handleApproveQuote}
              onReject={handleRejectQuote}
              onSignContract={handleSignContract}
            />
          </ScrollView>
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>Nenhum projeto ativo</Text>
              <Text style={styles.emptyText}>Você ainda não tem projetos em andamento.</Text>
            </View>
          </View>
        );

      case 'perfil':
        if (selectedHistoryRequest) {
          // Visualização detalhada do histórico
          return (
            <View style={styles.historyDetailContainer}>
              <View style={styles.historyDetailHeader}>
                <TouchableOpacity 
                  style={styles.historyBackButton}
                  onPress={() => setSelectedHistoryRequest(null)}
                >
                  <Text style={styles.historyBackButtonText}>← Voltar ao Perfil</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.historyDetailContent}>
                <View style={styles.historyDetailTitle}>
                  <Text style={styles.historyDetailTitleText}>
                    {selectedHistoryRequest.site} - Plano {selectedHistoryRequest.plan}
                  </Text>
                  <View style={[
                    styles.historyDetailStatusBadge,
                    selectedHistoryRequest.status === 'Completed' && styles.historyDetailStatusBadgeCompleted
                  ]}>
                    <Text style={styles.historyDetailStatusText}>
                      {requestController.getStatusConfig().map[selectedHistoryRequest.status]}
                    </Text>
                  </View>
                </View>
                <Timeline
                  request={selectedHistoryRequest}
                  statusConfig={requestController.getStatusConfig()}
                  onApprove={handleApproveQuote}
                  onReject={handleRejectQuote}
                  onSignContract={handleSignContract}
                />
              </ScrollView>
            </View>
          );
        }

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
                <Text style={styles.profileBadgeText}>Cliente</Text>
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

            <Text style={styles.historyTitle}>📋 Histórico de Planos</Text>
            <Text style={styles.historyHint}>💡 Toque em um projeto para ver os detalhes completos</Text>
            {clientRequests.length > 0 ? (
              clientRequests.map((req) => {
                const reqAny = req as any;
                const canApproveOrReject = req.status === 'Quote Sent' && reqAny._idSolicitacao;
                
                return (
                  <View key={req.id} style={styles.historyCardContainer}>
                    <TouchableOpacity 
                      style={styles.historyCard}
                      onPress={() => setSelectedHistoryRequest(req)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.historyCardContent}>
                        <Text style={styles.historyProject}>{req.site} - Plano {req.plan}</Text>
                        <Text style={styles.historyStatus}>
                          Status: {requestController.getStatusConfig().map[req.status]}
                        </Text>
                      </View>
                      <Text style={styles.historyArrow}>→</Text>
                    </TouchableOpacity>
                    {canApproveOrReject && (
                      <View style={styles.historyActions}>
                        <TouchableOpacity
                          style={styles.historyApproveButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleApproveQuote(req.id.toString());
                          }}
                        >
                          <Text style={styles.historyApproveButtonText}>✅ Aprovar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.historyRejectButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleRejectQuote(req.id.toString());
                          }}
                        >
                          <Text style={styles.historyRejectButtonText}>❌ Recusar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.historyEmpty}>Nenhum plano contratado ainda.</Text>
            )}
          </ScrollView>
        );

      default:
        return null;
    }
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

      {/* Navigation footer */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'avaliar' && styles.tabActive]}
          onPress={() => setActiveTab('avaliar')}
        >
          <Text style={[styles.tabIcon, activeTab === 'avaliar' && styles.tabIconActive]}>
            🔍
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'avaliar' && styles.tabLabelActive]}>
            Avaliar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'acompanhar' && styles.tabActive]}
          onPress={() => setActiveTab('acompanhar')}
        >
          <Text style={[styles.tabIcon, activeTab === 'acompanhar' && styles.tabIconActive]}>
            📋
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'acompanhar' && styles.tabLabelActive]}>
            Acompanhar
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
  timelineContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
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
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
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
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  historyHint: {
    fontSize: 12,
    color: '#6366f1',
    marginBottom: 12,
  },
  historyCardContainer: {
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyCardContent: {
    flex: 1,
  },
  historyProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  historyStatus: {
    fontSize: 14,
    color: '#6b7280',
  },
  historyArrow: {
    fontSize: 20,
    color: '#9ca3af',
    marginLeft: 12,
  },
  historyEmpty: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  historyApproveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  historyApproveButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  historyRejectButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  historyRejectButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  historyDetailContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  historyDetailHeader: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  historyBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyBackButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  historyDetailContent: {
    flex: 1,
  },
  historyDetailTitle: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  historyDetailTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  historyDetailStatusBadge: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  historyDetailStatusBadgeCompleted: {
    backgroundColor: '#d1fae5',
  },
  historyDetailStatusText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBanner: {
    backgroundColor: '#d1fae5',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedBannerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  completedBannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  completedBannerText: {
    fontSize: 16,
    color: '#047857',
    textAlign: 'center',
    marginBottom: 12,
  },
  completedBannerHint: {
    fontSize: 14,
    color: '#065f46',
    textAlign: 'center',
    fontStyle: 'italic',
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
  profileAvatarContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
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
  // Estilos do Modal
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
