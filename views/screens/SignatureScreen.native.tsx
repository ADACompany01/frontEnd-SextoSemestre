/**
 * SignatureScreen - Tela para captura de assinatura digital
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';

interface SignatureScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signatureBase64: string) => Promise<void>;
  contractName?: string;
}

export const SignatureScreen: React.FC<SignatureScreenProps> = ({
  visible,
  onClose,
  onSave,
  contractName = 'Contrato',
}) => {
  const signatureRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleSave = async () => {
    if (!signatureRef.current) {
      Alert.alert('Erro', 'Não foi possível capturar a assinatura.');
      return;
    }

    try {
      setIsSaving(true);
      const signatureBase64 = await signatureRef.current.readSignature();
      
      if (!signatureBase64 || signatureBase64.trim() === '') {
        Alert.alert('Atenção', 'Por favor, desenhe sua assinatura antes de salvar.');
        setIsSaving(false);
        return;
      }

      await onSave(signatureBase64);
      signatureRef.current?.clearSignature();
      onClose();
    } catch (error) {
      console.error('Error saving signature:', error);
      Alert.alert('Erro', 'Erro ao salvar assinatura. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Assinatura',
      'Tem certeza que deseja cancelar? Sua assinatura não será salva.',
      [
        { text: 'Continuar Assinando', style: 'cancel' },
        {
          text: 'Cancelar',
          style: 'destructive',
          onPress: () => {
            signatureRef.current?.clearSignature();
            onClose();
          },
        },
      ]
    );
  };

  const style = `
    .m-signature-pad {
      position: absolute;
      font-size: 10px;
      width: 100%;
      height: 100%;
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .m-signature-pad--body {
      position: absolute;
      left: 20px;
      right: 20px;
      top: 20px;
      bottom: 20px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
    }
    .m-signature-pad--body canvas {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Assinar {contractName}</Text>
          <Text style={styles.subtitle}>
            Desenhe sua assinatura na área abaixo
          </Text>
        </View>

        <View style={styles.signatureContainer}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSave}
            descriptionText=""
            clearText="Limpar"
            confirmText="Salvar"
            webStyle={style}
            autoClear={false}
            imageType="image/png"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={isSaving}
          >
            <Text style={styles.clearButtonText}>🗑️ Limpar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Salvando...' : '✓ Salvar Assinatura'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  signatureContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearButtonText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

