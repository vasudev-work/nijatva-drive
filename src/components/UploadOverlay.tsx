import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';

export function UploadOverlay() {
  const { theme, uploading } = useDrive();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!uploading) return;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      spin.setValue(0);
    };
  }, [uploading, spin]);

  if (!uploading) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progress = uploading.total > 0 ? uploading.done / uploading.total : 0;

  return (
    <View style={styles.root} pointerEvents="auto">
      <View style={[styles.scrim, { backgroundColor: theme.colors.overlay }]} />
      <View
        style={[
          styles.dropzone,
          { borderColor: theme.colors.accent, backgroundColor: theme.colors.surface },
          theme.shadow.float,
        ]}
      >
        <View style={styles.ringWrap}>
          <Animated.View
            style={[
              styles.ring,
              { borderColor: theme.colors.primarySoft, borderTopColor: theme.colors.primary, transform: [{ rotate }] },
            ]}
          />
          <View style={[styles.ringIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <Ionicons name="cloud-upload" size={20} color={theme.colors.primary} />
          </View>
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Uploading {uploading.total > 1 ? `${uploading.done + 1} of ${uploading.total}` : ''}
        </Text>
        <Text style={[styles.file, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {uploading.current}
        </Text>
        <View style={[styles.track, { backgroundColor: theme.colors.surfaceSunken }]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: theme.colors.primary,
                width: `${Math.max(progress * 100, 6)}%`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', zIndex: 40 },
  scrim: { ...StyleSheet.absoluteFill },
  dropzone: {
    width: '80%',
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  ringWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  ring: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 3 },
  ringIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14.5, fontWeight: '700' },
  file: { fontSize: 12, marginTop: 4, maxWidth: '100%' },
  track: { height: 5, borderRadius: 3, width: '100%', marginTop: 16, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
});
