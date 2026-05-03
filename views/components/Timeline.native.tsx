/**
 * Timeline - Componente de timeline para acompanhamento de solicitações (React Native)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { type AccessibilityRequest, type StatusConfig } from '../../models';
import { SignatureScreen } from '../screens/SignatureScreen.native';

interface TimelineProps {
  request: AccessibilityRequest;
  statusConfig: StatusConfig;
  onApprove?: (requestId: string) => Promise<void>;
  onReject?: (requestId: string) => Promise<void>;
  onSignContract?: (requestId: string, signatureBase64?: string) => Promise<void>;
}

export const Timeline: React.FC<TimelineProps> = ({ request, statusConfig, onApprove, onReject, onSignContract }) => {
  if (!request) return null;

  const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false);
  const { status, quoteFile, contractFile, developmentStatus } = request;
  const { steps, map } = statusConfig;
  const currentStepName = map[status] || steps[0];
  const currentStepIndex = steps.indexOf(currentStepName);

  const getStepStatus = (index: number) => {
    const isCompleted = index < currentStepIndex;
    const isCurrent = index === currentStepIndex;

    if (isCurrent) return 'current';
    if (isCompleted) return 'completed';
    return 'pending';
  };

  const showQuoteFile = (step: string, index: number) => {
    return step === 'Orçamento' && quoteFile && index <= currentStepIndex;
  };

  const showContractFile = (step: string, index: number) => {
    return step === 'Contrato' && contractFile && index <= currentStepIndex;
  };

  const isQuoteStepActive = (step: string, index: number) => {
    const stepStatus = getStepStatus(index);
    return stepStatus === 'current' && step === 'Orçamento';
  };

  const canApproveQuote = (step: string, index: number) => {
    return step === 'Orçamento' && quoteFile && status === 'Quote Sent';
  };

  const canSignContract = (step: string, index: number) => {
    return step === 'Contrato' && contractFile && status === 'Contract Sent';
  };

  const handleApprove = async () => {
    if (!onApprove) return;

    Alert.alert(
      'Aprovar Orçamento',
      'Deseja aprovar este orçamento? O funcionário receberá a notificação.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar',
          onPress: async () => {
            try {
              await onApprove(request.id.toString());
            } catch (error) {
              Alert.alert('Erro', 'Erro ao aprovar orçamento. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!onReject) return;

    Alert.alert(
      'Recusar Orçamento',
      'Deseja realmente recusar este orçamento? Você precisará criar uma nova solicitação.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: async () => {
            try {
              await onReject(request.id.toString());
            } catch (error) {
              Alert.alert('Erro', 'Erro ao recusar orçamento. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const handleSignContract = async () => {
    if (!onSignContract) return;
    setIsSignatureModalVisible(true);
  };

  const handleSaveSignature = async (signatureBase64: string) => {
    try {
      await onSignContract(request.id.toString(), signatureBase64);
      Alert.alert('Sucesso!', 'Contrato assinado! O projeto entrará em desenvolvimento.');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao assinar contrato. Tente novamente.');
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Acompanhamento do Projeto</Text>

      {steps.map((step, index) => {
        const stepStatus = getStepStatus(index);
        const showQuote = showQuoteFile(step, index);
        const showContract = showContractFile(step, index);
        const isQuoteActive = isQuoteStepActive(step, index);

        return (
          <View key={step} style={styles.stepContainer}>
            {/* Connector line */}
            {index > 0 && (
              <View
                style={[
                  styles.connector,
                  stepStatus === 'completed' && styles.connectorCompleted,
                ]}
              />
            )}

            {/* Step content */}
            <View style={styles.stepContent}>
              {/* Step indicator */}
              <View
                style={[
                  styles.indicator,
                  stepStatus === 'current' && styles.indicatorCurrent,
                  stepStatus === 'completed' && styles.indicatorCompleted,
                ]}
              >
                {stepStatus === 'completed' && <Text style={styles.checkIcon}>✓</Text>}
                {stepStatus === 'current' && <View style={styles.currentDot} />}
              </View>

              {/* Step info */}
              <View style={styles.stepInfo}>
                <Text
                  style={[
                    styles.stepName,
                    stepStatus === 'current' && styles.stepNameCurrent,
                    stepStatus === 'completed' && styles.stepNameCompleted,
                  ]}
                >
                  {step}
                </Text>

                {stepStatus === 'current' && (
                  <Text style={styles.currentLabel}>✨ Etapa atual</Text>
                )}

                {stepStatus === 'completed' && (
                  <Text style={styles.completedLabel}>✅ Concluído</Text>
                )}

                {/* File download buttons */}
                {(showQuote || showContract) && (
                  <View style={styles.fileActions}>
                    <TouchableOpacity
                      style={styles.fileButton}
                      onPress={() => {
                        const url = showQuote ? quoteFile!.url : contractFile!.url;
                        Linking.openURL(url);
                      }}
                    >
                      <Text style={styles.fileButtonText}>📄 Ver Arquivo</Text>
                    </TouchableOpacity>

                    {/* Approve button for quote */}
                    {canApproveQuote(step, index) && onApprove && (
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={handleApprove}
                      >
                        <Text style={styles.approveButtonText}>✅ Aprovar Orçamento</Text>
                      </TouchableOpacity>
                    )}

                    {/* Reject button for quote */}
                    {canApproveQuote(step, index) && onReject && (
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={handleReject}
                      >
                        <Text style={styles.rejectButtonText}>❌ Recusar Orçamento</Text>
                      </TouchableOpacity>
                    )}

                    {/* Sign contract button */}
                    {canSignContract(step, index) && onSignContract && (
                      <TouchableOpacity
                        style={styles.signButton}
                        onPress={handleSignContract}
                      >
                        <Text style={styles.signButtonText}>✍️ Assinar Contrato</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Status messages */}
                {step === 'Orçamento' && status === 'Awaiting Quote' && (
                  <Text style={styles.waitingText}>⏳ Aguardando orçamento do funcionário...</Text>
                )}

                {/* Contact options for Quote step */}
                {step === 'Orçamento' && status === 'Quote Sent' && (
                  <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>💬 Dúvidas sobre o orçamento?</Text>
                    <Text style={styles.contactSubtitle}>Entre em contato para esclarecer ou negociar valores</Text>
                    <View style={styles.contactButtons}>
                      <TouchableOpacity 
                        style={styles.whatsappButton}
                        onPress={() => {
                          const phoneNumber = '5511999999999'; // Número da empresa
                          const message = `Olá! Gostaria de tirar dúvidas sobre o orçamento do projeto ${request.site}`;
                          const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
                          Linking.openURL(url).catch(() => {
                            Alert.alert('Erro', 'Não foi possível abrir o WhatsApp. Verifique se o aplicativo está instalado.');
                          });
                        }}
                      >
                        <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.scheduleButton}
                        onPress={() => {
                          Alert.alert(
                            'Agendar Reunião',
                            'Você será redirecionado para o Calendly para agendar uma reunião com nossa equipe.',
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: 'Abrir Calendly',
                                onPress: () => {
                                  const calendlyUrl = 'https://calendly.com/ada-company';
                                  Linking.openURL(calendlyUrl).catch(() => {
                                    Alert.alert('Erro', 'Não foi possível abrir o link.');
                                  });
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.scheduleButtonText}>📅 Agendar Reunião</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {step === 'Orçamento' && status === 'Quote Approved' && (
                  <Text style={styles.approvedText}>✅ Orçamento aprovado! Aguardando contrato...</Text>
                )}

                {step === 'Contrato' && status === 'Quote Approved' && (
                  <Text style={styles.waitingText}>⏳ Funcionário está preparando o contrato...</Text>
                )}

                {step === 'Contrato' && status === 'Contract Signed' && (
                  <Text style={styles.approvedText}>✅ Contrato assinado! Projeto em desenvolvimento...</Text>
                )}

                {/* Development progress */}
                {step === 'Desenvolvimento' && status === 'In Development' && developmentStatus && (
                  <View style={styles.developmentCard}>
                    <Text style={styles.developmentTitle}>📊 Progresso do Desenvolvimento</Text>
                    <View style={styles.developmentBadge}>
                      <Text style={styles.developmentText}>
                        {statusConfig.developmentSteps[['Analysis', 'Development', 'Testing', 'Done'].indexOf(developmentStatus)]}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      })}

      {/* Modal de Assinatura */}
      <SignatureScreen
        visible={isSignatureModalVisible}
        onClose={() => setIsSignatureModalVisible(false)}
        onSave={handleSaveSignature}
        contractName={`Contrato - ${request.site || 'Projeto'}`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  stepContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  connector: {
    position: 'absolute',
    left: 15,
    top: -24,
    width: 2,
    height: 24,
    backgroundColor: '#e5e7eb',
  },
  connectorCompleted: {
    backgroundColor: '#10b981',
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indicatorCurrent: {
    backgroundColor: '#6366f1',
  },
  indicatorCompleted: {
    backgroundColor: '#10b981',
  },
  checkIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
  },
  stepNameCurrent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  stepNameCompleted: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  currentLabel: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 4,
  },
  completedLabel: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  fileActions: {
    marginTop: 12,
    gap: 8,
  },
  fileButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fileButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  approveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    marginLeft: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  signButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  signButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  waitingText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  approvedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 8,
  },
  developmentCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  developmentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  developmentBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  developmentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  emailButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  emailButtonText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '600',
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  whatsappButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
