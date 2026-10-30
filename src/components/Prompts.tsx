import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import { Sheet } from './Sheet';
import type { DriveNode } from '../types';

export function PromptSheet({
  visible,
  title,
  subtitle,
  placeholder,
  initialValue = '',
  confirmLabel = 'Save',
  keyboardType,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  keyboardType?: 'default' | 'number-pad';
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const { theme } = useDrive();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const disabled = value.trim().length === 0;

  return (
    <Sheet visible={visible} title={title} subtitle={subtitle} onClose={onClose}>
      <View style={styles.body}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textFaint}
          keyboardType={keyboardType ?? 'default'}
          autoFocus
          secureTextEntry={keyboardType === 'number-pad'}
          maxLength={keyboardType === 'number-pad' ? 6 : 120}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
            },
          ]}
        />
        <Pressable
          disabled={disabled}
          onPress={() => {
            onSubmit(value.trim());
            onClose();
          }}
          style={({ pressed }) => [
            styles.confirm,
            {
              backgroundColor: theme.colors.primary,
              opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[styles.confirmLabel, { color: theme.colors.onPrimary }]}>{confirmLabel}</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

interface FolderOption {
  node: DriveNode;
  depth: number;
}

export function FolderPickerSheet({
  visible,
  title = 'Move to',
  excludeIds = [],
  onClose,
  onSelect,
}: {
  visible: boolean;
  title?: string;
  excludeIds?: string[];
  onClose: () => void;
  onSelect: (targetId: string | null) => void;
}) {
  const { theme, nodes } = useDrive();
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  const options = useMemo<FolderOption[]>(() => {
    const out: FolderOption[] = [];
    const walk = (parentId: string | null, depth: number) => {
      const children = nodes
        .filter(
          (node) =>
            node.kind === 'folder' &&
            node.trashedAt === null &&
            node.parentId === parentId &&
            !excluded.has(node.id),
        )
        .sort((a, b) => a.name.localeCompare(b.name));
      for (const child of children) {
        out.push({ node: child, depth });
        walk(child.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [nodes, excluded]);

  return (
    <Sheet visible={visible} title={title} subtitle="Pick a destination folder" onClose={onClose}>
      <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
        <Pressable
          onPress={() => {
            onSelect(null);
            onClose();
          }}
          style={({ pressed }) => [
            styles.folderRow,
            { borderBottomColor: theme.colors.border, backgroundColor: pressed ? theme.colors.surfaceAlt : 'transparent' },
          ]}
        >
          <Ionicons name="home" size={18} color={theme.colors.primary} />
          <Text style={[styles.folderLabel, { color: theme.colors.text }]}>Vault root</Text>
        </Pressable>
        {options.map(({ node, depth }) => (
          <Pressable
            key={node.id}
            onPress={() => {
              onSelect(node.id);
              onClose();
            }}
            style={({ pressed }) => [
              styles.folderRow,
              {
                borderBottomColor: theme.colors.border,
                paddingLeft: 16 + depth * 18,
                backgroundColor: pressed ? theme.colors.surfaceAlt : 'transparent',
              },
            ]}
          >
            <Ionicons name="folder" size={18} color={theme.colors.textMuted} />
            <Text style={[styles.folderLabel, { color: theme.colors.text }]} numberOfLines={1}>
              {node.name}
            </Text>
          </Pressable>
        ))}
        {options.length === 0 ? (
          <Text style={[styles.emptyHint, { color: theme.colors.textFaint }]}>No other folders yet.</Text>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 12, paddingTop: 4 },
  input: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '500',
  },
  confirm: { marginTop: 12, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmLabel: { fontSize: 15, fontWeight: '700' },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  folderLabel: { fontSize: 14.5, fontWeight: '500', flex: 1 },
  emptyHint: { fontSize: 13, padding: 16, textAlign: 'center' },
});
