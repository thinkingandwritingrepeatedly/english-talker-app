import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { DEFAULTS, STORAGE_KEYS } from '../constants/config';
import { saveAllSettings } from '../storage/SettingsStorage';

export default function SettingsModal({ visible, onClose, onSave, currentSettings }) {
  const [apiKey, setApiKey] = useState(currentSettings?.apiKey || '');
  const [baseURL, setBaseURL] = useState(currentSettings?.baseURL || DEFAULTS.BASE_URL);
  const [model, setModel] = useState(currentSettings?.model || DEFAULTS.MODEL);
  const [lang, setLang] = useState(currentSettings?.lang || 'en-US');

  React.useEffect(() => {
    if (visible && currentSettings) {
      setApiKey(currentSettings.apiKey || '');
      setBaseURL(currentSettings.baseURL || DEFAULTS.BASE_URL);
      setModel(currentSettings.model || DEFAULTS.MODEL);
      setLang(currentSettings.lang || 'en-US');
    }
  }, [visible, currentSettings]);

  const handleSave = async () => {
    const settings = {
      [STORAGE_KEYS.API_KEY]: apiKey.trim(),
      [STORAGE_KEYS.BASE_URL]: baseURL.trim() || DEFAULTS.BASE_URL,
      [STORAGE_KEYS.MODEL]: model.trim() || DEFAULTS.MODEL,
      [STORAGE_KEYS.LANG]: lang || 'en-US',
    };

    await saveAllSettings(settings);
    onSave({
      apiKey: settings[STORAGE_KEYS.API_KEY],
      baseURL: settings[STORAGE_KEYS.BASE_URL],
      model: settings[STORAGE_KEYS.MODEL],
      lang: settings[STORAGE_KEYS.LANG],
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>设置</Text>

            <Text style={styles.label}>API Key</Text>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-..."
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={styles.hint}>DeepSeek API 密钥</Text>

            <Text style={styles.label}>Base URL</Text>
            <TextInput
              style={styles.input}
              value={baseURL}
              onChangeText={setBaseURL}
              placeholder={DEFAULTS.BASE_URL}
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>模型</Text>
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder={DEFAULTS.MODEL}
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>输入语言</Text>
            <View style={styles.langRow}>
              {['en-US', 'zh-CN', 'ja-JP', 'ko-KR'].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.langChip, lang === l && styles.langChipActive]}
                  onPress={() => setLang(l)}
                >
                  <Text style={[styles.langText, lang === l && styles.langTextActive]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  langText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  langTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
