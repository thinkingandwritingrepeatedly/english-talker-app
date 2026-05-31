export const COLORS = {
  bg: '#0B1121',
  card: '#1A233A',
  cardLight: '#1E2A45',
  primary: '#6C5CE7',
  accent: '#00E676',
  processing: '#FFD700',
  text: '#FFFFFF',
  textSecondary: '#8892B0',
  border: '#2A3A5C',
  error: '#FF5252',
  surface: '#131D35',
  overlay: 'rgba(0,0,0,0.6)',
};

export const STATE_COLORS = {
  idle: COLORS.primary,
  preparing: COLORS.primary,
  listening: COLORS.accent,
  processing: COLORS.processing,
  speaking: COLORS.primary,
};

export const STATE_LABELS = {
  idle: '点击开始对话',
  preparing: '准备中...',
  listening: '聆听中...',
  processing: '思考中...',
  speaking: '朗读中...',
  'no-service': '文字输入模式',
};

export const AVATAR_STATES = {
  idle: { glow: COLORS.primary, pulse: 4000, eyes: 'open' },
  preparing: { glow: COLORS.primary, pulse: 2000, eyes: 'open' },
  listening: { glow: COLORS.accent, pulse: 1200, eyes: 'open' },
  processing: { glow: COLORS.processing, pulse: 0, eyes: 'closed', rotate: 2000 },
  speaking: { glow: COLORS.primary, pulse: 800, eyes: 'open' },
};

export const FONTS = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};
