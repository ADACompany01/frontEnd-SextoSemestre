/**
 * StarRating - Componente de avaliação por estrelas para React Native
 * 
 * Responsabilidades:
 * - Exibir rating com estrelas
 * - Permitir interação (se não readonly)
 * - Feedback visual de hover
 * - Integração com controllers
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { IconStar } from './Icons.native';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: any;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange = () => {},
  readOnly = false,
  maxRating = 5,
  size = 'md',
  style
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32
  };

  const starSize = sizeMap[size];

  const handleStarPress = (starValue: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const getStarColor = (starValue: number) => {
    const currentRating = hoverRating || rating;
    return currentRating >= starValue ? '#fbbf24' : '#d1d5db';
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        return (
          <TouchableOpacity
            key={starValue}
            onPress={() => handleStarPress(starValue)}
            disabled={readOnly}
            style={styles.starContainer}
          >
            <IconStar
              size={starSize}
              color={getStarColor(starValue)}
              filled={true}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: 4,
  },
});

// EXPANSÃO FUTURA:
// - Suporte a meias estrelas
// - Animações de transição
// - Diferentes temas de cores
// - Tooltip com valor numérico
// - Integração com acessibilidade (ARIA)


