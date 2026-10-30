import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import { palette } from '../theme';

const POINTS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'shield-checkmark',
    title: 'Stored on your device',
    body: 'Your vault lives in app-private storage. No account, no upload, no surprises.',
  },
  {
    icon: 'folder-open',
    title: 'Folders that behave',
    body: 'Drag-free move, rename, star and share — every action is one tap away.',
  },
  {
    icon: 'phone-portrait',
    title: 'Made for one hand',
    body: 'A thumb-friendly layout with dark mode, app lock and a proper trash can.',
  },
];

export function WelcomeScreen() {
  const { theme, completeOnboarding } = useDrive();
  return (
    <LinearGradient
      colors={[theme.colors.headerFrom, theme.colors.headerTo, '#0A3F35']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <View style={styles.markRow}>
        <View style={styles.mark}>
          <Ionicons name="shield-checkmark" size={20} color="#04120E" />
        </View>
        <Text style={styles.brand}>NIJATVA</Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={styles.headline}>Your files.{'\n'}Finally yours.</Text>
        <Text style={styles.sub}>
          A calm, private drive for the things you would rather not hand to a server.
        </Text>

        <View style={styles.points}>
          {POINTS.map((point) => (
            <View key={point.title} style={styles.point}>
              <View style={styles.pointIcon}>
                <Ionicons name={point.icon} size={16} color={palette.mintSoft} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{point.title}</Text>
                <Text style={styles.pointBody}>{point.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        onPress={completeOnboarding}
        style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.9 : 1 }]}
      >
        <Text style={styles.ctaLabel}>Create my vault</Text>
        <Ionicons name="arrow-forward" size={18} color="#04120E" />
      </Pressable>
      <Text style={styles.footnote}>Nothing is uploaded. Everything stays on this phone.</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 26, paddingTop: 40, paddingBottom: 34 },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#19C08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', letterSpacing: 4 },
  headline: { color: '#FFFFFF', fontSize: 40, fontWeight: '700', letterSpacing: -1.4, lineHeight: 46 },
  sub: { color: 'rgba(255,255,255,0.72)', fontSize: 14.5, lineHeight: 21, marginTop: 14, maxWidth: 300 },
  points: { marginTop: 34, gap: 18 },
  point: { flexDirection: 'row', gap: 12 },
  pointIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pointBody: { color: 'rgba(255,255,255,0.62)', fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#19C08A',
    borderRadius: 18,
    paddingVertical: 16,
  },
  ctaLabel: { color: '#04120E', fontSize: 15.5, fontWeight: '700' },
  footnote: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 14,
  },
});
