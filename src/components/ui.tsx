import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import type { Theme } from '../theme';
import type { IconName } from '../utils/icons';

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme } = useDrive();
  return <View style={[{ flex: 1, backgroundColor: theme.colors.bg }, style]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme } = useDrive();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
        },
        theme.shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { theme } = useDrive();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: theme.colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const { theme } = useDrive();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.surface,
          borderColor: active ? theme.colors.primary : theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color={active ? theme.colors.onPrimary : theme.colors.textMuted} />
      ) : null}
      <Text
        style={[
          styles.chipLabel,
          { color: active ? theme.colors.onPrimary : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const { theme } = useDrive();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.colors.surfaceAlt }]}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[
              styles.segment,
              active && { backgroundColor: theme.colors.surface },
              active && theme.shadow.card,
            ]}
          >
            <Text
              style={[
                styles.segmentLabel,
                { color: active ? theme.colors.text : theme.colors.textMuted },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function IconTile({
  icon,
  tint,
  ink,
  size = 44,
}: {
  icon: IconName;
  tint: string;
  ink: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: tint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size * 0.46} color={ink} />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  tone?: 'primary' | 'danger' | 'neutral';
}) {
  const { theme } = useDrive();
  const background =
    tone === 'primary' ? theme.colors.primary : tone === 'danger' ? theme.colors.danger : theme.colors.surfaceAlt;
  const labelColor = tone === 'neutral' ? theme.colors.text : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.45 : pressed ? 0.9 : 1 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={labelColor} /> : null}
      <Text style={[styles.buttonLabel, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useDrive();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
        <Ionicons name={icon} size={28} color={theme.colors.textFaint} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.emptyAction,
            { borderColor: theme.colors.primary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.emptyActionLabel, { color: theme.colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Loading() {
  const { theme } = useDrive();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={[styles.loadingLabel, { color: theme.colors.textMuted }]}>Opening vault…</Text>
    </View>
  );
}

export function Toast() {
  const { theme, toast, dismissToast } = useDrive();
  if (!toast) return null;
  return (
    <Pressable onPress={dismissToast} style={styles.toastWrap} pointerEvents="box-none">
      <View style={[styles.toast, { backgroundColor: theme.colors.text }]}>
        <Ionicons name="checkmark-circle" size={16} color={theme.colors.accent} />
        <Text style={[styles.toastLabel, { color: theme.colors.bg }]} numberOfLines={2}>
          {toast}
        </Text>
      </View>
    </Pressable>
  );
}

export function Row({
  icon,
  label,
  value,
  onPress,
  tone = 'default',
  last,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  last?: boolean;
}) {
  const { theme } = useDrive();
  const color = tone === 'danger' ? theme.colors.danger : theme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.colors.border, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
        pressed && onPress ? { backgroundColor: theme.colors.surfaceAlt } : null,
      ]}
    >
      <Ionicons name={icon} size={18} color={tone === 'danger' ? theme.colors.danger : theme.colors.textMuted} />
      <Text style={[styles.rowLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={[styles.rowValue, { color: theme.colors.textFaint }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} /> : null}
    </Pressable>
  );
}


export function GroupLabel({ label }: { label: string }) {
  const { theme } = useDrive();
  return <Text style={[styles.groupLabel, { color: theme.colors.primary }]}>{label}</Text>;
}

export function SettingsRow({
  title,
  subtitle,
  value,
  icon,
  onPress,
  right,
  tone = 'default',
}: {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: IconName;
  onPress?: () => void;
  right?: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  const { theme } = useDrive();
  const color = tone === 'danger' ? theme.colors.danger : theme.colors.text;
  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={tone === 'danger' ? theme.colors.danger : theme.colors.textMuted}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingTitle, { color }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {value ? (
        <Text style={[styles.settingValue, { color: theme.colors.textFaint }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right}
      {onPress && !right ? (
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.settingRow, { borderTopColor: theme.colors.border }]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        { borderTopColor: theme.colors.border },
        pressed ? { backgroundColor: theme.colors.surfaceAlt } : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function SettingsCard({ children, first }: { children: React.ReactNode; first?: boolean }) {
  const { theme } = useDrive();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        marginBottom: 22,
      }}
    >
      {children}
    </View>
  );
}

export function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hscroll}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  sectionAction: { fontSize: 13, fontWeight: '600' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 8,
  },
  chipLabel: { fontSize: 12.5, fontWeight: '600' },
  segmented: { flexDirection: 'row', borderRadius: 14, padding: 3 },
  segment: { flex: 1, paddingVertical: 7, borderRadius: 11, alignItems: 'center' },
  segmentLabel: { fontSize: 12.5, fontWeight: '600' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  emptyBody: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  emptyAction: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  emptyActionLabel: { fontSize: 13, fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingLabel: { fontSize: 13 },
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    maxWidth: '86%',
  },
  toastLabel: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { flex: 1, fontSize: 14.5, fontWeight: '500' },
  rowValue: { fontSize: 12.5, maxWidth: 140 },
  hscroll: { paddingHorizontal: 0, gap: 8 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  settingTitle: { fontSize: 14.5, fontWeight: '600' },
  settingSubtitle: { fontSize: 11.5, marginTop: 3, lineHeight: 16 },
  settingValue: { fontSize: 12.5, fontWeight: '600', maxWidth: 130 },
});
