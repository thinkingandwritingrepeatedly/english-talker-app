import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function VoiceToggle({ enabled, onToggle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔊</Text>
      <Text style={styles.label}>语音</Text>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
        thumbColor={enabled ? COLORS.primary : COLORS.textSecondary}
        style={styles.switch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginRight: 2,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});
