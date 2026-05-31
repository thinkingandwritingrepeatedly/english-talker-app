import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';
import { DEFAULTS, STORAGE_KEYS } from '../constants/config';
import { createAIService } from '../services/AIService';
import {
  initSTT, destroySTT, initTTS,
  startListening, stopListening,
  speak, stopSpeaking, isSpeaking,
  requestMicPermission, detectRecognition,
} from '../services/VoiceService';
import { loadSettings, getVoiceToggle, setVoiceToggle } from '../storage/SettingsStorage';

const ConversationContext = createContext(null);

const initialState = {
  mode: 'idle',
  messages: [],
  interimText: '',
  accumText: '',
  isVoiceEnabled: true,
  apiKey: '',
  baseURL: DEFAULTS.BASE_URL,
  model: DEFAULTS.MODEL,
  lang: 'en-US',
  showSettings: false,
  settingsReady: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_INTERIM':
      return { ...state, interimText: action.payload };
    case 'SET_ACCUM':
      return { ...state, accumText: action.payload };
    case 'APPEND_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_LAST_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m, i) =>
          i === state.messages.length - 1 ? { ...m, content: action.payload } : m
        ),
      };
    case 'SET_VOICE_ENABLED':
      return { ...state, isVoiceEnabled: action.payload };
    case 'SET_SETTINGS':
      return { ...state, ...action.payload };
    case 'SET_SHOW_SETTINGS':
      return { ...state, showSettings: action.payload };
    case 'SET_SETTINGS_READY':
      return { ...state, settingsReady: action.payload };
    case 'RESET':
      return { ...state, messages: [], accumText: '', interimText: '' };
    default:
      return state;
  }
}

export function ConversationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const aiServiceRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const turnLockRef = useRef(false);

  const initApp = useCallback(async () => {
    const stored = await loadSettings();
    const voice = await getVoiceToggle();

    dispatch({
      type: 'SET_SETTINGS',
      payload: {
        apiKey: stored[STORAGE_KEYS.API_KEY] || '',
        baseURL: stored[STORAGE_KEYS.BASE_URL] || DEFAULTS.BASE_URL,
        model: stored[STORAGE_KEYS.MODEL] || DEFAULTS.MODEL,
        lang: stored[STORAGE_KEYS.LANG] || 'en-US',
        isVoiceEnabled: voice,
      },
    });

    aiServiceRef.current = createAIService({
      baseURL: stored[STORAGE_KEYS.BASE_URL] || DEFAULTS.BASE_URL,
      apiKey: stored[STORAGE_KEYS.API_KEY] || '',
      model: stored[STORAGE_KEYS.MODEL] || DEFAULTS.MODEL,
    });

    initTTS();
    initSTT({
      onStart: () => {},
      onEnd: () => {
        // Auto-restart listening for continuous recognition
        if (stateRef.current.mode === 'listening') {
          startListening(stateRef.current.lang).catch(() => {});
        }
      },
      onResults: (text) => {
        const s = stateRef.current;
        const newAccum = s.accumText + (s.accumText ? ' ' : '') + text;
        dispatch({ type: 'SET_ACCUM', payload: newAccum });
        dispatch({ type: 'SET_INTERIM', payload: '' });
        resetSilenceTimer();
      },
      onPartial: (text) => {
        dispatch({ type: 'SET_INTERIM', payload: text });
        resetSilenceTimer();
      },
      onError: (err) => {
        console.warn('STT error:', err);
      },
    });

    dispatch({ type: 'SET_SETTINGS_READY', payload: true });
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      handleSilence();
    }, DEFAULTS.SILENCE_TIMEOUT);
  }, []);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    if (stateRef.current.mode === 'listening') {
      silenceTimerRef.current = setTimeout(() => {
        handleSilence();
      }, DEFAULTS.SILENCE_TIMEOUT);
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const handleSilence = useCallback(async () => {
    const s = stateRef.current;
    if (!s.accumText || turnLockRef.current) return;
    turnLockRef.current = true;

    try {
      await stopListening();
      clearSilenceTimer();
      dispatch({ type: 'SET_MODE', payload: 'processing' });

      const userMsg = { role: 'user', content: s.accumText };
      dispatch({ type: 'APPEND_MESSAGE', payload: userMsg });
      dispatch({ type: 'SET_ACCUM', payload: '' });

      const stream = aiServiceRef.current.streamChat([...s.messages, userMsg]);
      let fullReply = '';
      const assistantMsg = { role: 'assistant', content: '' };
      dispatch({ type: 'APPEND_MESSAGE', payload: assistantMsg });

      for await (const chunk of stream) {
        fullReply += chunk;
        dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: fullReply });
      }

      if (s.isVoiceEnabled) {
        dispatch({ type: 'SET_MODE', payload: 'speaking' });
        await speak(fullReply, {
          onDone: () => {
            finishTurn();
          },
        });
      } else {
        finishTurn();
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        finishTurn();
        return;
      }
      console.warn('AI error:', e);
      finishTurn();
    }
  }, []);

  const finishTurn = useCallback(() => {
    const s = stateRef.current;
    if (s.mode === 'idle' || s.mode === 'no-service') {
      turnLockRef.current = false;
      return;
    }
    dispatch({ type: 'SET_MODE', payload: 'listening' });
    startListening(s.lang).catch(() => {});
    turnLockRef.current = false;
  }, []);

  const startConversation = useCallback(async () => {
    if (!stateRef.current.apiKey) {
      dispatch({ type: 'SET_SHOW_SETTINGS', payload: true });
      return;
    }
    dispatch({ type: 'SET_MODE', payload: 'preparing' });

    if (!detectRecognition()) {
      dispatch({ type: 'SET_MODE', payload: 'no-service' });
      return;
    }

    try {
      const granted = await requestMicPermission();
      if (!granted) {
        dispatch({ type: 'SET_MODE', payload: 'idle' });
        return;
      }
      startListening(stateRef.current.lang);
      dispatch({ type: 'SET_MODE', payload: 'listening' });
    } catch (e) {
      dispatch({ type: 'SET_MODE', payload: 'idle' });
    }
  }, []);

  const stopConversation = useCallback(async () => {
    clearSilenceTimer();
    aiServiceRef.current?.abort();
    dispatch({ type: 'SET_MODE', payload: 'idle' });
    dispatch({ type: 'SET_INTERIM', payload: '' });
    dispatch({ type: 'SET_ACCUM', payload: '' });
    await stopListening().catch(() => {});
    await stopSpeaking();
    turnLockRef.current = false;
  }, [clearSilenceTimer]);

  const toggleVoice = useCallback(async (enabled) => {
    dispatch({ type: 'SET_VOICE_ENABLED', payload: enabled });
    await setVoiceToggle(enabled);
    if (!enabled) {
      const speaking = await isSpeaking();
      if (speaking) await stopSpeaking();
    }
  }, []);

  const updateSettings = useCallback((settings) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
    aiServiceRef.current = createAIService({
      baseURL: settings.baseURL || DEFAULTS.BASE_URL,
      apiKey: settings.apiKey || '',
      model: settings.model || DEFAULTS.MODEL,
    });
    dispatch({ type: 'SET_SHOW_SETTINGS', payload: false });
  }, []);

  const resetConversation = useCallback(() => {
    stopConversation();
    dispatch({ type: 'RESET' });
  }, [stopConversation]);

  const streamAndReply = useCallback(async (userText) => {
    const s = stateRef.current;
    if (!aiServiceRef.current) {
      console.warn('AI service not initialized');
      turnLockRef.current = false;
      return;
    }
    try {
      const stream = aiServiceRef.current.streamChat([...s.messages, { role: 'user', content: userText }]);
      let fullReply = '';
      const assistantMsg = { role: 'assistant', content: '' };
      dispatch({ type: 'APPEND_MESSAGE', payload: assistantMsg });

      for await (const chunk of stream) {
        fullReply += chunk;
        dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: fullReply });
      }

      if (s.isVoiceEnabled && fullReply) {
        dispatch({ type: 'SET_MODE', payload: 'speaking' });
        await speak(fullReply, {
          onDone: () => {
            const current = stateRef.current;
            if (current.mode === 'speaking') {
              dispatch({ type: 'SET_MODE', payload: current.messages.length > 0 ? 'no-service' : 'idle' });
            }
            turnLockRef.current = false;
          },
        });
      } else {
        turnLockRef.current = false;
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('AI error:', e);
      turnLockRef.current = false;
    }
  }, []);

  const sendMessage = useCallback(async (text) => {
    const s = stateRef.current;
    if (!text.trim() || turnLockRef.current) return;
    turnLockRef.current = true;

    // Stop any ongoing voice activity
    if (s.mode === 'listening') {
      await stopListening().catch(() => {});
      clearSilenceTimer();
    }
    await stopSpeaking().catch(() => {});
    dispatch({ type: 'SET_INTERIM', payload: '' });
    dispatch({ type: 'SET_ACCUM', payload: '' });

    const userMsg = { role: 'user', content: text.trim() };
    dispatch({ type: 'APPEND_MESSAGE', payload: userMsg });
    dispatch({ type: 'SET_MODE', payload: 'processing' });

    await streamAndReply(text.trim());

    const after = stateRef.current;
    if (after.mode === 'processing' || after.mode === 'speaking') {
      dispatch({ type: 'SET_MODE', payload: 'no-service' });
    }
    turnLockRef.current = false;
  }, [streamAndReply, stopListening, clearSilenceTimer, stopSpeaking]);

  useEffect(() => {
    initApp().catch((e) => {
      console.warn('initApp error:', e);
      dispatch({ type: 'SET_SETTINGS_READY', payload: true });
    });
    return () => {
      destroySTT();
      clearSilenceTimer();
    };
  }, [initApp, clearSilenceTimer, dispatch]);

  const value = {
    ...state,
    startConversation,
    stopConversation,
    toggleVoice,
    updateSettings,
    resetConversation,
    sendMessage,
    dispatch,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error('useConversation must be used within ConversationProvider');
  return ctx;
}
