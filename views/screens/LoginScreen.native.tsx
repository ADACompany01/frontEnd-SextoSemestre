/**
 * LoginScreen - Tela de login para React Native
 * 
 * Responsabilidades:
 * - Interface de login adaptada para mobile
 * - Validação de formulário
 * - Integração com AuthController
 * - Feedback de erro
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { AuthController } from '../../controllers';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onRegisterPress?: () => void;
  className?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onRegisterPress,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authController] = useState(() => AuthController.getInstance());
  const [authState, setAuthState] = useState(authController.getAuthState());

  useEffect(() => {
    const unsubscribe = authController.subscribe(setAuthState);
    return unsubscribe;
  }, [authController]);

  const handleSubmit = async () => {
    if (!AuthController.validateCredentials({ email, password })) {
      return;
    }

    try {
      const user = await authController.login({
        email: AuthController.formatEmail(email),
        password
      });
      onLoginSuccess(user);
    } catch (error) {
      // Error is handled by the controller and displayed in authState.error
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (authState.error) {
      authController.clearError();
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (authState.error) {
      authController.clearError();
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
            {/* Logo da ADA Company */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/AdaHome.png')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>ADA Company</Text>
            <Text style={styles.subtitle}>Bem-vindo(a) de volta! 👋</Text>
          </View>

          {/* Login form */}
          <View style={styles.form}>
            {/* Email field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="seu@email.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!authState.isLoading}
              />
            </View>

            {/* Password field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                editable={!authState.isLoading}
              />
            </View>

            {/* Error message */}
            {authState.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{authState.error}</Text>
              </View>
            )}

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.submitButton, authState.isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={authState.isLoading}
            >
              <Text style={styles.submitButtonText}>
                {authState.isLoading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            {/* Forgot password link */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={onRegisterPress}
              disabled={authState.isLoading}
            >
              <Text style={styles.registerButtonText}>
                ✨ Criar Nova Conta
              </Text>
            </TouchableOpacity>
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
    alignItems: 'center',
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 90,
    borderWidth: 0,
    borderColor: '#000000',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  form: {
    gap: 24,
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
  forgotPasswordContainer: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

// EXPANSÃO FUTURA:
// - Integração com OAuth (Google, Facebook)
// - Recuperação de senha
// - Autenticação de dois fatores
// - Lembrar usuário
// - Validação em tempo real
// - Animações de entrada
