import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { theme, meta } = useDrive();
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);

  const expected = meta.passcode ?? '';

  const press = (key: string) => {
    if (key === 'del') {
      setEntry((prev) => prev.slice(0, -1));
      setError(false);
      return;
    }
    if (key === '') return;
    const next = `${entry}${key}`.slice(0, 6);
    setEntry(next);
    setError(false);
    if (next.length === expected.length) {
      if (next === expected) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setEntry(''), 400);
      }
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.head}>
        <View style={[styles.mark, { backgroundColor: theme.colors.primarySoft }]}>
          <Ionicons name="lock-closed" size={22} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Vault locked</Text>
        <Text style={[styles.sub, { color: error ? theme.colors.danger : theme.colors.textMuted }]}>
          {error ? 'That passcode did not match' : 'Enter your passcode to continue'}
        </Text>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: expected.length }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index < entry.length ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.pad}>
        {KEYS.map((key, index) => (
          <Pressable
            key={`${key}-${index}`}
            onPress={() => press(key)}
            disabled={key === ''}
            style={({ pressed }) => [
              styles.key,
              {
                backgroundColor: key === '' ? 'transparent' : theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {key === 'del' ? (
              <Ionicons name="backspace" size={20} color={theme.colors.textMuted} />
            ) : (
              <Text style={[styles.keyLabel, { color: theme.colors.text }]}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  head: { alignItems: 'center' },
  mark: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 6 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 26 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 36 },
  key: {
    width: 76,
    height: 62,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: { fontSize: 21, fontWeight: '600' },
});
