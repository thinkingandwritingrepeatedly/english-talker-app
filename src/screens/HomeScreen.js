import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Platform, StatusBar,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { COLORS, STATE_LABELS } from '../constants/theme';
import { useConversation } from '../context/ConversationContext';
import Avatar from '../components/Avatar';
import PreviewBar from '../components/PreviewBar';
import ControlButton from '../components/ControlButton';
import VoiceToggle from '../components/VoiceToggle';
import ChatBubble from '../components/ChatBubble';
import SettingsModal from '../components/SettingsModal';

export default function HomeScreen() {
  const {
    mode, messages, interimText, accumText,
    isVoiceEnabled, showSettings,
    startConversation, stopConversation, toggleVoice,
    updateSettings, resetConversation, dispatch, settingsReady,
    sendMessage, apiKey, baseURL, model, lang,
  } = useConversation();

  const flatListRef = useRef(null);
  const [inputText, setInputText] = useState('');

  const statusText = STATE_LABELS[mode] || '';

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>English Talker</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => dispatch({ type: 'SET_SHOW_SETTINGS', payload: true })}
            >
              <Text style={styles.headerBtnIcon}>⚙</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={resetConversation}>
              <Text style={styles.headerBtnIcon}>↺</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Voice Area (centered, compact) ── */}
        <View style={styles.voiceArea}>
          <View style={styles.avatarWrap}>
            <Avatar mode={mode} />
          </View>
          <ControlButton mode={mode} onStart={startConversation} onStop={stopConversation} />
          <PreviewBar mode={mode} accumText={accumText} interimText={interimText} />
        </View>

        <View style={styles.divider} />

        {/* ── Text Input (always visible) ── */}
        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="输入消息..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={1000}
              editable={mode !== 'processing'}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendBtnText}>发送</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Chat History ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
          style={styles.chatList}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyText}>输入文字或点击「开始对话」与 Luna 交流</Text>
            </View>
          }
        />

        {/* ── Voice Toggle ── */}
        <VoiceToggle enabled={isVoiceEnabled} onToggle={toggleVoice} />
      </View>

      {/* Settings Modal */}
      {settingsReady && (
        <SettingsModal
          visible={showSettings}
          onClose={() => dispatch({ type: 'SET_SHOW_SETTINGS', payload: false })}
          onSave={updateSettings}
          currentSettings={{ apiKey, baseURL, model, lang }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 6,
  },
  headerBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  /* ── Voice Area (centered stack) ── */
  voiceArea: {
    alignItems: 'center',
    paddingVertical: 2,
    gap: 2,
  },
  avatarWrap: {
    transform: [{ scale: 0.3 }],
    marginVertical: -49,
  },

  /* ── Divider ── */
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },

  /* ── Input Section (above chat, always visible) ── */
  inputSection: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: COLORS.text,
    maxHeight: 32,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },

  /* ── Chat History ── */
  chatList: {
    flex: 1,
  },
  chatContent: {
    paddingVertical: 6,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
