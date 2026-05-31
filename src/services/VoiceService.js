import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import * as Speech from 'expo-speech';
import { DEFAULTS } from '../constants/config';

let recognitionListeners = [];
let ttsListeners = null;
let permissionGranted = false;
let recognitionMode = 'default';

export function checkRecognitionAvailable() {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export function supportsOnDeviceRecognition() {
  try {
    return ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
  } catch {
    return false;
  }
}

export function getRecognitionServices() {
  try {
    return ExpoSpeechRecognitionModule.getSpeechRecognitionServices();
  } catch {
    return [];
  }
}

/** Try all available recognition methods, returns true if any works */
export function detectRecognition() {
  if (checkRecognitionAvailable()) {
    recognitionMode = 'default';
    return true;
  }
  if (supportsOnDeviceRecognition()) {
    recognitionMode = 'on-device';
    return true;
  }
  const services = getRecognitionServices();
  if (services.length > 0) {
    recognitionMode = 'service:' + services[0];
    return true;
  }
  recognitionMode = 'none';
  return false;
}

export function getRecognitionMode() {
  return recognitionMode;
}

export async function requestMicPermission() {
  if (permissionGranted) return true;
  try {
    const permResult = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    permissionGranted = permResult.granted;
    return permissionGranted;
  } catch (e) {
    console.warn('Permission request error:', e);
    return false;
  }
}

export function initSTT(handlers) {
  cleanupSTTListeners();

  recognitionListeners = [
    ExpoSpeechRecognitionModule.addListener('start', () => {
      handlers.onStart?.();
    }),
    ExpoSpeechRecognitionModule.addListener('end', () => {
      handlers.onEnd?.();
    }),
    ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const transcript = event.results?.[0]?.transcript || '';
      if (event.isFinal) {
        handlers.onResults?.(transcript);
      } else {
        handlers.onPartial?.(transcript);
      }
    }),
    ExpoSpeechRecognitionModule.addListener('error', (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      handlers.onError?.(event.message || event.error);
    }),
  ];
}

function cleanupSTTListeners() {
  for (const listener of recognitionListeners) {
    listener.remove();
  }
  recognitionListeners = [];
}

export function destroySTT() {
  cleanupSTTListeners();
  try {
    ExpoSpeechRecognitionModule.abort();
  } catch {}
}

export async function startListening(locale = 'en-US') {
  try {
    const options = {
      lang: locale,
      interimResults: true,
      continuous: false,
    };

    if (recognitionMode === 'on-device') {
      options.requiresOnDeviceRecognition = true;
    } else if (recognitionMode.startsWith('service:')) {
      options.androidRecognitionServicePackage = recognitionMode.slice(8);
    }

    ExpoSpeechRecognitionModule.start(options);
  } catch (e) {
    console.warn('Voice.start error:', e);
    throw e;
  }
}

export async function stopListening() {
  try {
    ExpoSpeechRecognitionModule.stop();
  } catch (e) {
    console.warn('Voice.stop error:', e);
  }
}

export function isSTTAvailable() {
  return true;
}

export function initTTS() {}

export async function speak(text, { onDone, onError } = {}) {
  if (!text) return;

  if (ttsListeners) {
    Speech.removeAllListeners('start');
    Speech.removeAllListeners('done');
    Speech.removeAllListeners('error');
    Speech.removeAllListeners('stopped');
  }

  ttsListeners = { onDone, onError };

  Speech.speak(text, {
    language: 'en-US',
    rate: DEFAULTS.SPEECH_RATE,
    pitch: DEFAULTS.SPEECH_PITCH,
    onStart: () => {},
    onDone: () => {
      ttsListeners?.onDone?.();
      ttsListeners = null;
    },
    onError: (e) => {
      ttsListeners?.onError?.(e);
      ttsListeners = null;
    },
    onStopped: () => {
      ttsListeners?.onDone?.();
      ttsListeners = null;
    },
  });
}

export async function stopSpeaking() {
  try {
    Speech.stop();
  } catch {}
  ttsListeners = null;
}

export async function isSpeaking() {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
