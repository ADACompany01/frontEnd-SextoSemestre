/**
 * CircularProgress - Componente de progresso circular para React Native
 * 
 * Responsabilidades:
 * - Exibir progresso em formato circular
 * - Cores baseadas na pontuação
 * - Animações suaves
 * - Integração com avaliações
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  strokeWidth?: number;
  style?: any;
  showPercentage?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  score,
  size = 'md',
  strokeWidth = 10,
  style,
  showPercentage = true
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const sizeMap = {
    sm: { container: 96, text: 24, radius: 36 },
    md: { container: 144, text: 36, radius: 50 },
    lg: { container: 192, text: 48, radius: 70 }
  };

  const currentSize = sizeMap[size];
  const radius = currentSize.radius;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const getScoreColor = (score: number) => {
    if (score > 89) return '#10b981';
    if (score > 69) return '#f59e0b';
    return '#ef4444';
  };

  const scoreColor = getScoreColor(score);

  return (
    <View style={[styles.container, { width: currentSize.container, height: currentSize.container }, style]}>
      <Svg width={currentSize.container} height={currentSize.container} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={currentSize.container / 2}
          cy={currentSize.container / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={currentSize.container / 2}
          cy={currentSize.container / 2}
          r={radius}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${currentSize.container / 2} ${currentSize.container / 2})`}
        />
      </Svg>
      
      {showPercentage && (
        <View style={styles.textContainer}>
          <Text style={[styles.text, { fontSize: currentSize.text, color: scoreColor }]}>
            {Math.round(score)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
});

// EXPANSÃO FUTURA:
// - Animações de entrada
// - Diferentes formatos de progresso
// - Indicadores de texto personalizados
// - Suporte a gradientes
// - Integração com tooltips


