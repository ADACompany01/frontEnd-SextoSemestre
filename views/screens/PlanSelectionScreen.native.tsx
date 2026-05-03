/**
 * PlanSelectionScreen - Tela de seleção e personalização de plano para React Native
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { EvaluationController } from '../../controllers';
import { StarRating } from '../components/StarRating.native';
import { type EvaluationIssue } from '../../models';

interface PlanSelectionScreenProps {
  plan: 'A' | 'AA' | 'AAA';
  issues: EvaluationIssue[];
  onConfirm: (plan: 'A' | 'AA' | 'AAA', selectedIssues: EvaluationIssue[]) => void;
  onBack: () => void;
}

export const PlanSelectionScreen: React.FC<PlanSelectionScreenProps> = ({
  plan,
  issues,
  onConfirm,
  onBack,
}) => {
  const [evaluationController] = useState(() => EvaluationController.getInstance());
  const [evaluationState, setEvaluationState] = useState(evaluationController.getState());
  const [otherIsChecked, setOtherIsChecked] = useState(false);
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    const unsubscribe = evaluationController.subscribe(setEvaluationState);
    return unsubscribe;
  }, [evaluationController]);

  useEffect(() => {
    evaluationController.selectPlan(plan);
  }, [plan, evaluationController]);

  const handleRatingChange = (id: string, priority: number) => {
    evaluationController.updateItemPriority(id, priority);
  };

  const handleConfirm = () => {
    if (otherIsChecked && otherText.trim() !== '') {
      const otherPriority = Math.floor(Math.random() * 5) + 1;
      evaluationController.addCustomItem(otherText.trim(), otherPriority);
    }

    const finalSelectedIssues = evaluationController.getSelectedItems();
    onConfirm(plan, finalSelectedIssues);
  };

  const getPlanDescription = (planLevel: 'A' | 'AA' | 'AAA') => {
    return evaluationController.getLevelDescription(planLevel);
  };

  const getSelectedItemsCount = () => {
    return Object.values(evaluationState.checklist).filter(
      (item) => item.priority && item.priority > 0
    ).length;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Title card */}
        <View style={styles.titleCard}>
          <Text style={styles.title}>🎨 Personalize seu Plano {plan}</Text>
          <Text style={styles.description}>{getPlanDescription(plan)}</Text>
          <Text style={styles.hint}>⭐ Defina a prioridade de cada item (1-5 estrelas)</Text>
        </View>

        {/* Checklist items */}
        <Text style={styles.sectionTitle}>📋 Itens do Plano</Text>
        {Object.entries(evaluationState.checklist).map(([id, item]) => (
          <View key={id} style={styles.checklistItem}>
            <Text style={styles.checklistText}>{item.text}</Text>
            <StarRating
              rating={item.priority || 0}
              onRatingChange={(priority) => handleRatingChange(id, priority)}
              size="md"
            />
          </View>
        ))}

        {/* Custom item section */}
        <View style={styles.customSection}>
          <View style={styles.customHeader}>
            <Text style={styles.customTitle}>✏️ Adicionar item personalizado</Text>
            <Switch
              value={otherIsChecked}
              onValueChange={setOtherIsChecked}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={otherIsChecked ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          {otherIsChecked && (
            <View style={styles.customInput}>
              <TextInput
                style={styles.textArea}
                value={otherText}
                onChangeText={setOtherText}
                placeholder="Descreva outra necessidade..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
              <Text style={styles.customHint}>
                💡 Este item será adicionado com prioridade padrão.
              </Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📝 Resumo da Seleção</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plano:</Text>
            <Text style={styles.summaryValue}>
              {plan} - {getPlanDescription(plan)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Itens selecionados:</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getSelectedItemsCount()}</Text>
            </View>
          </View>
          {otherIsChecked && otherText.trim() && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item personalizado:</Text>
              <Text style={styles.summaryValue}>{otherText.trim()}</Text>
            </View>
          )}
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmButton, getSelectedItemsCount() === 0 && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={getSelectedItemsCount() === 0}
        >
          <Text style={styles.confirmButtonText}>✅ Confirmar Solicitação</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  titleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: '#6366f1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  checklistItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  checklistText: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 12,
  },
  customSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  customInput: {
    marginTop: 16,
  },
  textArea: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  customHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginRight: 8,
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  badge: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


