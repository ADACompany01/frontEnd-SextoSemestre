/**
 * RegisterScreen - Tela de cadastro de usuário
 * 
 * Responsabilidades:
 * - Formulário de cadastro completo
 * - Validação de campos
 * - Integração com API de registro
 * - Feedback visual de sucesso/erro
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import ApiService from '../../services/ApiService';

interface RegisterScreenProps {
  onRegisterSuccess: (user: any) => void;
  onBackPress: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onBackPress,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = (): boolean => {
    setError('');

    if (!name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (!email.trim()) {
      setError('Email é obrigatório');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email inválido');
      return false;
    }

    if (!password) {
      setError('Senha é obrigatória');
      return false;
    }

    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('[RegisterScreen] Registrando usuário...');

      const response = await ApiService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        type: 'client', // Sempre cliente - funcionários não podem se cadastrar
        phone: phone.trim() || undefined,
      });

      if (response.success && response.data) {
        console.log('[RegisterScreen] Registro bem-sucedido!');
        console.log('[RegisterScreen] Dados recebidos:', response.data);

        // Mapear resposta do backend para formato esperado pelo frontend
        const user = {
          id: response.data.user?.id,
          name: response.data.user?.nome || name.trim(),
          email: response.data.user?.email || email.trim(),
          type: response.data.user?.tipo === 'funcionario' ? 'employee' : 'client',
        };

        console.log('[RegisterScreen] Usuário mapeado:', user);
        console.log('[RegisterScreen] Token recebido:', response.data.token ? 'Sim' : 'Não');

        // O token já foi salvo pelo ApiService, então o usuário já está autenticado
        Alert.alert(
          '✅ Sucesso!',
          `Conta criada com sucesso!\nBem-vindo(a), ${user.name}!`,
          [
            {
              text: 'OK',
              onPress: () => onRegisterSuccess(user),
            },
          ]
        );
      } else {
        setError(response.error || 'Erro ao criar conta');
      }
    } catch (err) {
      console.error('[RegisterScreen] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Preencha os dados para começar 🚀
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="João Silva"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            {/* Email field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="joao@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Phone field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone (opcional)</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="(11) 98765-4321"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            {/* Password field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha *</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                editable={!isLoading}
              />
              <Text style={styles.hint}>Mínimo de 6 caracteres</Text>
            </View>

            {/* Confirm Password field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Senha *</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {/* Error message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  ✨ Criar Conta
                </Text>
              )}
            </TouchableOpacity>

            {/* Info */}
            <Text style={styles.infoText}>
              Ao criar uma conta, você concorda com nossos{' '}
              <Text style={styles.infoLink}>Termos de Uso</Text> e{' '}
              <Text style={styles.infoLink}>Política de Privacidade</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 15,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#1f2937',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  infoLink: {
    color: '#6366f1',
    fontWeight: '600',
  },
});


