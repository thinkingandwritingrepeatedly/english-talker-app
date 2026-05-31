import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function PreviewBar({ mode, accumText, interimText }) {
  if (mode === 'idle' || mode === 'preparing' || mode === 'no-service') return null;

  const isListening = mode === 'listening';
  const showContent = accumText || interimText;

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <View style={[styles.dot, isListening && styles.dotActive]} />
        <Text style={styles.label}>
          {isListening ? '聆听中' : mode === 'processing' ? '思考中' : '朗读中'}
        </Text>
      </View>
      {showContent ? (
        <Text style={styles.text} numberOfLines={3}>
          <Text style={styles.accumText}>{accumText}</Text>
          {interimText ? (
            <Text style={styles.interimText}> {interimText}</Text>
          ) : null}
          {isListening && !showContent ? (
            <Text style={styles.interimText}>听你说话...</Text>
          ) : null}
        </Text>
      ) : (
        <Text style={styles.placeholder}>
          {isListening ? '正在听你说话...' : '处理中...'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    marginHorizontal: 20,
    padding: 10,
    minHeight: 44,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textSecondary,
    marginRight: 5,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
  },
  accumText: {
    color: COLORS.text,
  },
  interimText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  placeholder: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
