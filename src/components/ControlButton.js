import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function ControlButton({ mode, onStart, onStop }) {
  const isActive = mode !== 'idle';

  return (
    <TouchableOpacity
      style={[styles.button, isActive ? styles.stopButton : styles.startButton]}
      onPress={isActive ? onStop : onStart}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{isActive ? '■' : '▶'}</Text>
      <Text style={styles.text}>{isActive ? '停止' : '开始对话'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 140,
  },
  startButton: {
    backgroundColor: COLORS.accent,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  icon: {
    fontSize: 12,
    color: COLORS.text,
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
});
