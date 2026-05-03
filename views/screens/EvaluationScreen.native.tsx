/**
 * EvaluationScreen - Tela de avaliação de sites para React Native
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { EvaluationController } from '../../controllers';

interface EvaluationScreenProps {
  onSelectPlan: (plan: 'A' | 'AA' | 'AAA', issues: any[]) => void;
}

export const EvaluationScreen: React.FC<EvaluationScreenProps> = ({
  onSelectPlan,
}) => {
  const [url, setUrl] = useState('');
  const [evaluationController] = useState(() => EvaluationController.getInstance());
  const [evaluationState, setEvaluationState] = useState(evaluationController.getState());

  useEffect(() => {
    const unsubscribe = evaluationController.subscribe(setEvaluationState);
    return unsubscribe;
  }, [evaluationController]);

  const handleEvaluate = async () => {
    if (!url.trim()) return;

    try {
      await evaluationController.evaluateSite(url);
    } catch (error) {
      // Error is handled by the controller
    }
  };

  const handleSelectPlan = (plan: 'A' | 'AA' | 'AAA') => {
    const issues = evaluationState.currentEvaluation?.issues || [];
    onSelectPlan(plan, issues);
  };

  const getScoreColor = (score: number) => {
    if (score > 89) return '#10b981';
    if (score > 69) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreMessage = (score: number) => {
    if (score > 89) return 'Excelente! Seu site tem boa acessibilidade.';
    if (score > 69) return 'Bom! Algumas melhorias podem ser feitas.';
    if (score > 49) return 'Regular. Várias melhorias são necessárias.';
    return 'Precisa de melhorias significativas.';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Avaliar Site</Text>
        <Text style={styles.subtitle}>Digite a URL do site que deseja avaliar:</Text>
      </View>

      {/* URL input */}
      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://exemplo.com"
          placeholderTextColor="#9ca3af"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!evaluationState.isLoading}
        />
        <TouchableOpacity
          style={[styles.button, evaluationState.isLoading && styles.buttonDisabled]}
          onPress={handleEvaluate}
          disabled={evaluationState.isLoading}
        >
          {evaluationState.isLoading ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.buttonText}>  Avaliando...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>✨ Avaliar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error message */}
      {evaluationState.error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{evaluationState.error}</Text>
        </View>
      )}

      {/* Evaluation results */}
      {evaluationState.currentEvaluation && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>📊 Resultado da Avaliação</Text>

          {/* Score display */}
          <View style={styles.scoreContainer}>
            <View
              style={[
                styles.scoreCircle,
                { borderColor: getScoreColor(evaluationState.currentEvaluation.score) },
              ]}
            >
              <Text
                style={[
                  styles.scoreText,
                  { color: getScoreColor(evaluationState.currentEvaluation.score) },
                ]}
              >
                {evaluationState.currentEvaluation.score}
              </Text>
            </View>
            <Text style={[styles.scoreMessage, { color: getScoreColor(evaluationState.currentEvaluation.score) }]}>
              {getScoreMessage(evaluationState.currentEvaluation.score)}
            </Text>
          </View>

          {/* Issues found */}
          <View style={styles.issuesSection}>
            <Text style={styles.sectionTitle}>⚠️ Problemas Encontrados:</Text>
            {evaluationState.currentEvaluation.issues.map((issue, index) => (
              <View key={issue.id || index} style={styles.issueItem}>
                <Text style={styles.issueBullet}>•</Text>
                <Text style={styles.issueText}>{issue.text}</Text>
              </View>
            ))}
          </View>

          {/* Suggested plans */}
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>📦 Planos Sugeridos:</Text>
            {evaluationState.suggestedPlans.map((plan) => (
              <TouchableOpacity
                key={plan.level}
                style={styles.planCard}
                onPress={() => handleSelectPlan(plan.level)}
              >
                <Text style={styles.planLevel}>Plano {plan.level}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
                <Text style={styles.planArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
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
  inputCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  issuesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  issueItem: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  issueBullet: {
    color: '#ef4444',
    fontSize: 16,
    marginRight: 8,
  },
  issueText: {
    flex: 1,
    color: '#4b5563',
    fontSize: 14,
  },
  plansSection: {
    marginTop: 8,
  },
  planCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
    marginRight: 12,
  },
  planDescription: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  planArrow: {
    fontSize: 20,
    color: '#6366f1',
  },
});


