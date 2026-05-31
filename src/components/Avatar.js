import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';
import { COLORS, AVATAR_STATES } from '../constants/theme';

export default function Avatar({ mode }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotAnim = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  const state = AVATAR_STATES[mode] || AVATAR_STATES.idle;

  useEffect(() => {
    // Glow pulse
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.7,
          duration: state.pulse || 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: state.pulse || 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse scale
    if (state.pulse > 0) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: state.pulse * 0.4,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: state.pulse * 0.6,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      glowLoop.start();
      return () => {
        pulseLoop.stop();
        glowLoop.stop();
        pulseAnim.setValue(1);
        glowOpacity.setValue(0.3);
      };
    }

    // Rotate (processing mode)
    if (state.rotate) {
      const rotLoop = Animated.loop(
        Animated.timing(rotAnim, {
          toValue: 1,
          duration: state.rotate,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotLoop.start();
      glowLoop.start();
      return () => {
        rotLoop.stop();
        glowLoop.stop();
        rotAnim.setValue(0);
        glowOpacity.setValue(0.3);
      };
    }

    glowLoop.start();
    return () => {
      glowLoop.stop();
      glowOpacity.setValue(0.3);
    };
  }, [mode, state.pulse, state.rotate]);

  const rotateInterp = rotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const color = state.glow || COLORS.primary;
  const eyesOpen = state.eyes === 'open';

  return (
    <View style={styles.wrapper}>
      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glow,
          {
            borderColor: color,
            opacity: glowOpacity,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Rotating ring for processing */}
      {state.rotate ? (
        <Animated.View
          style={[
            styles.rotRing,
            {
              borderColor: color,
              borderLeftColor: 'transparent',
              transform: [{ rotate: rotateInterp }],
            },
          ]}
        />
      ) : null}

      {/* Face SVG */}
      <Animated.View style={[styles.faceContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Svg width="110" height="110" viewBox="0 0 110 110">
          {/* Face circle */}
          <Circle cx="55" cy="55" r="50" fill={COLORS.card} />

          {/* Eyes */}
          {eyesOpen ? (
            <G>
              <Ellipse cx="38" cy="48" rx="5" ry="6" fill={COLORS.text} />
              <Ellipse cx="72" cy="48" rx="5" ry="6" fill={COLORS.text} />
              {/* Pupils */}
              <Circle cx="40" cy="48" r="2.5" fill={COLORS.bg} />
              <Circle cx="74" cy="48" r="2.5" fill={COLORS.bg} />
            </G>
          ) : (
            <G>
              <Path d="M33,50 Q38,44 43,50" stroke={COLORS.text} strokeWidth="2.5" fill="none" />
              <Path d="M67,50 Q72,44 77,50" stroke={COLORS.text} strokeWidth="2.5" fill="none" />
            </G>
          )}

          {/* Mouth */}
          <Path
            d={mode === 'speaking' ? 'M38,72 Q55,82 72,72' : 'M38,68 Q55,74 72,68'}
            stroke={COLORS.textSecondary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Cheek blush */}
          <Circle cx="28" cy="62" r="6" fill={color} opacity="0.15" />
          <Circle cx="82" cy="62" r="6" fill={color} opacity="0.15" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const SIZE = 140;

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  glow: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2.5,
  },
  rotRing: {
    position: 'absolute',
    width: SIZE - 4,
    height: SIZE - 4,
    borderRadius: (SIZE - 4) / 2,
    borderWidth: 2,
  },
  faceContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
  },
});
