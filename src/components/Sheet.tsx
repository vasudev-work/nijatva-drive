import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import type { IconName } from '../utils/icons';

export interface SheetAction {
  key: string;
  label: string;
  icon: IconName;
  tone?: 'default' | 'danger';
  onPress: () => void;
}

export function Sheet({
  visible,
  title,
  subtitle,
  actions,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  actions?: SheetAction[];
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const { theme } = useDrive();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: theme.colors.surfaceSunken }]} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: theme.colors.surfaceAlt }]}>
              <Ionicons name="close" size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          {children}
          {actions && actions.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              {actions.map((action, index) => (
                <Pressable
                  key={action.key}
                  onPress={() => {
                    onClose();
                    requestAnimationFrame(action.onPress);
                  }}
                  style={({ pressed }) => [
                    styles.action,
                    {
                      borderTopColor: theme.colors.border,
                      borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                    },
                    pressed ? { backgroundColor: theme.colors.surfaceAlt } : null,
                  ]}
                >
                  <Ionicons
                    name={action.icon}
                    size={19}
                    color={action.tone === 'danger' ? theme.colors.danger : theme.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.actionLabel,
                      { color: action.tone === 'danger' ? theme.colors.danger : theme.colors.text },
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: 28,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingBottom: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  close: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 15 },
  actionLabel: { fontSize: 14.5, fontWeight: '600' },
});
