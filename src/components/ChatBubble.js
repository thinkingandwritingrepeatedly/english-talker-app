import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function ChatBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.roleLabel, isUser ? styles.userLabel : styles.aiLabel]}>
          {isUser ? 'You' : 'Luna'}
        </Text>
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {content}
          {!isUser && content.length > 0 && !content.endsWith('') ? '' : null}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: COLORS.accent + '20',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: COLORS.primary + '20',
    borderBottomLeftRadius: 4,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  userLabel: {
    color: COLORS.accent,
  },
  aiLabel: {
    color: COLORS.primary,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.text,
  },
  aiText: {
    color: COLORS.text,
  },
});
