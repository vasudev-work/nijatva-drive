import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import { GroupLabel, SettingsCard, SettingsRow } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { PromptSheet } from '../components/Prompts';
import { StorageMeter } from '../components/StorageMeter';
import { ping, pushSnapshot } from '../api/client';
import { formatBytes, initialsOf } from '../utils/format';
import { vaultFootprint } from '../storage';
import type { HomeTab, ThemeMode } from '../types';

const REPO_URL = 'https://github.com/vasudev-work/nijatva-drive';

export function SettingsScreen() {
  const {
    theme,
    meta,
    stats,
    nodes,
    setThemeMode,
    setPasscode,
    setApiUrl,
    setDefaultHomeTab,
    setPhotoBackup,
    setTelemetry,
    setCrashReports,
    clearCache,
    notify,
  } = useDrive();
  const [passPrompt, setPassPrompt] = useState(false);
  const [urlPrompt, setUrlPrompt] = useState(false);
  const [themeSheet, setThemeSheet] = useState(false);
  const [homeSheet, setHomeSheet] = useState(false);
  const [logSheet, setLogSheet] = useState(false);
  const [checking, setChecking] = useState(false);

  const footprint = (() => {
    try {
      return vaultFootprint();
    } catch {
      return { files: stats.files, bytes: stats.used };
    }
  })();

  const categories = Object.entries(stats.byCategory)
    .filter(([, bytes]) => bytes > 0)
    .sort((a, b) => b[1] - a[1]);

  const themeLabel = meta.themeMode === 'system' ? 'System default' : meta.themeMode === 'dark' ? 'Dark' : 'Light';
  const homeLabel = meta.defaultHomeTab === 'photos' ? 'Photos' : 'My files';

  const testConnection = async () => {
    if (!meta.apiUrl) {
      setUrlPrompt(true);
      return;
    }
    setChecking(true);
    const health = await ping(meta.apiUrl);
    if (health.ok && health.data) {
      const sync = await pushSnapshot(meta.apiUrl, nodes);
      notify(
        sync.ok
          ? `Connected · ${sync.data?.accepted ?? 0} items pushed`
          : `Connected, sync failed: ${sync.error ?? 'unknown'}`,
      );
    } else {
      notify(health.error ?? 'Could not reach the API');
    }
    setChecking(false);
  };

  const toggle = (value: boolean, onChange: (next: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: theme.colors.primary, false: theme.colors.surfaceSunken }}
      thumbColor="#FFFFFF"
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}>
        <GroupLabel label="Account settings" />
        <SettingsCard>
          <View style={styles.accountRow}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.avatarLabel, { color: theme.colors.onPrimary }]}>
                {initialsOf('Vasudev Work')}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountName, { color: theme.colors.text }]}>nijatva.os</Text>
              <Text style={[styles.accountMail, { color: theme.colors.textMuted }]}>
                vasudev.work@rediffmail.com
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}>
              <Text style={[styles.badgeLabel, { color: theme.colors.primary }]}>Local</Text>
            </View>
          </View>
          <SettingsRow
            title="This vault is on this device"
            subtitle="No account, no server. Everything stays in app storage."
          />
        </SettingsCard>

        <GroupLabel label="Security" />
        <SettingsCard>
          <SettingsRow
            title="App Lock"
            subtitle={meta.passcode ? 'Passcode required on open' : 'Enable a passcode or device lock'}
            right={toggle(meta.passcode !== null, (next) => (next ? setPassPrompt(true) : setPasscode(null)))}
          />
          <SettingsRow
            title="Change passcode"
            value={meta.passcode ? 'Set' : 'Not set'}
            onPress={() => setPassPrompt(true)}
          />
          <SettingsRow title="Encryption" subtitle="Local vault — blobs are not encrypted at rest yet" value="None" />
        </SettingsCard>

        <GroupLabel label="Backup" />
        <SettingsCard>
          <SettingsRow
            title="Photo backup"
            subtitle={meta.photoBackup ? 'On — new photos are pinned to the vault' : 'Off'}
            right={toggle(meta.photoBackup, setPhotoBackup)}
          />
        </SettingsCard>

        <GroupLabel label="Appearance" />
        <SettingsCard>
          <SettingsRow title="Theme" value={themeLabel} onPress={() => setThemeSheet(true)} />
          <SettingsRow title="Default home tab" value={homeLabel} onPress={() => setHomeSheet(true)} />
        </SettingsCard>

        <GroupLabel label="Storage" />
        <SettingsCard>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <StorageMeter />
            {categories.map(([category, bytes]) => {
              const ratio = stats.used > 0 ? bytes / stats.used : 0;
              return (
                <View key={category} style={{ marginTop: 14 }}>
                  <View style={styles.legendRow}>
                    <Text style={[styles.legend, { color: theme.colors.text }]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                    <Text style={[styles.legendValue, { color: theme.colors.textFaint }]}>
                      {formatBytes(bytes)}
                    </Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceSunken }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.max(ratio * 100, 2)}%`, backgroundColor: theme.colors.primary },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
            <Text style={[styles.footprint, { color: theme.colors.textFaint }]}>
              {footprint.files} blobs on this device · {formatBytes(footprint.bytes)} written
            </Text>
          </View>
        </SettingsCard>

        <GroupLabel label="Sync" />
        <SettingsCard>
          <SettingsRow
            title="API base url"
            subtitle={meta.apiUrl ?? 'Point at server/index.js to exercise the stub'}
            value={meta.apiUrl ? 'Set' : 'Not set'}
            onPress={() => setUrlPrompt(true)}
          />
          <SettingsRow
            title="Test connection"
            subtitle={checking ? 'Working…' : 'Ping the stub and push a snapshot'}
            onPress={testConnection}
          />
        </SettingsCard>

        <GroupLabel label="About" />
        <SettingsCard>
          <SettingsRow
            title="Privacy policy"
            icon="open-outline"
            onPress={() => Linking.openURL(`${REPO_URL}#honest-notes-on-security`).catch(() => notify('No browser'))}
          />
          <SettingsRow
            title="Terms of service"
            icon="open-outline"
            onPress={() => Linking.openURL(`${REPO_URL}#license`).catch(() => notify('No browser'))}
          />
          <SettingsRow title="Version" value="1.1.0" />
          <SettingsRow title="Design language" value="Nijatva" />
        </SettingsCard>

        <GroupLabel label="Usage statistics" />
        <SettingsCard>
          <SettingsRow
            title="Anonymous telemetry"
            subtitle="Off by default. Nothing is sent anywhere from this build."
            right={toggle(meta.telemetry, setTelemetry)}
          />
          <SettingsRow
            title="Anonymous crash reports"
            subtitle="Kept local until you connect a backend."
            right={toggle(meta.crashReports, setCrashReports)}
          />
        </SettingsCard>

        <GroupLabel label="System" />
        <SettingsCard>
          <SettingsRow
            title="Clear local cache"
            subtitle="Remove blob files no longer referenced by the index"
            onPress={() => {
              clearCache();
            }}
          />
          <SettingsRow title="Show log" subtitle="Vault diagnostics" onPress={() => setLogSheet(true)} />
        </SettingsCard>

        <Text style={[styles.footer, { color: theme.colors.textFaint }]}>Nijatva Drive 1.1.0</Text>
      </ScrollView>

      <PromptSheet
        visible={passPrompt}
        title={meta.passcode ? 'Change passcode' : 'Set a passcode'}
        subtitle="4 to 6 digits, stored on this device"
        placeholder="••••"
        keyboardType="number-pad"
        confirmLabel="Save passcode"
        onClose={() => setPassPrompt(false)}
        onSubmit={(value) => {
          if (value.length < 4) {
            notify('Use at least 4 digits');
            return;
          }
          setPasscode(value);
        }}
      />

      <PromptSheet
        visible={urlPrompt}
        title="API base url"
        subtitle="Point the app at the stub in server/index.js"
        placeholder="http://192.168.1.10:8787"
        initialValue={meta.apiUrl ?? ''}
        confirmLabel="Save url"
        onClose={() => setUrlPrompt(false)}
        onSubmit={(value) => setApiUrl(value.length > 0 ? value : null)}
      />

      <Sheet visible={themeSheet} title="Theme" subtitle="Applies immediately" onClose={() => setThemeSheet(false)}>
        <View style={styles.optionList}>
          {(
            [
              { key: 'system' as ThemeMode, label: 'System default', icon: 'phone-portrait-outline' as const },
              { key: 'light' as ThemeMode, label: 'Light', icon: 'sunny-outline' as const },
              { key: 'dark' as ThemeMode, label: 'Dark', icon: 'moon-outline' as const },
            ]
          ).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => {
                setThemeMode(option.key);
                setThemeSheet(false);
              }}
              style={({ pressed }) => [styles.option, pressed ? { backgroundColor: theme.colors.surfaceAlt } : null]}
            >
              <Ionicons name={option.icon} size={18} color={theme.colors.textMuted} />
              <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{option.label}</Text>
              {meta.themeMode === option.key ? (
                <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet
        visible={homeSheet}
        title="Default home tab"
        subtitle="Where the app opens after unlock"
        onClose={() => setHomeSheet(false)}
      >
        <View style={styles.optionList}>
          {(
            [
              { key: 'files' as HomeTab, label: 'My files', icon: 'folder-outline' as const },
              { key: 'photos' as HomeTab, label: 'Photos', icon: 'images-outline' as const },
            ]
          ).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => {
                setDefaultHomeTab(option.key);
                setHomeSheet(false);
              }}
              style={({ pressed }) => [styles.option, pressed ? { backgroundColor: theme.colors.surfaceAlt } : null]}
            >
              <Ionicons name={option.icon} size={18} color={theme.colors.textMuted} />
              <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{option.label}</Text>
              {meta.defaultHomeTab === option.key ? (
                <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet
        visible={logSheet}
        title="Vault diagnostics"
        subtitle="What the app knows right now"
        onClose={() => setLogSheet(false)}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}>
          {[
            ['nodes', `${nodes.length}`],
            ['files', `${stats.files}`],
            ['folders', `${stats.folders}`],
            ['trashed', `${stats.trashed}`],
            ['shared', `${stats.shared}`],
            ['offline', `${stats.files > 0 ? nodes.filter((n) => n.offline).length : 0}`],
            ['blobs on disk', `${footprint.files} (${formatBytes(footprint.bytes)})`],
            ['used / quota', `${formatBytes(stats.used)} / ${formatBytes(stats.quota)}`],
            ['api url', meta.apiUrl ?? 'not set'],
            ['theme', themeLabel],
            ['passcode', meta.passcode ? 'set' : 'not set'],
          ].map(([key, value]) => (
            <View key={key} style={styles.logRow}>
              <Text style={[styles.logKey, { color: theme.colors.textMuted }]}>{key}</Text>
              <Text style={[styles.logValue, { color: theme.colors.text }]}>{value}</Text>
            </View>
          ))}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { fontSize: 15, fontWeight: '700' },
  accountName: { fontSize: 15, fontWeight: '700' },
  accountMail: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.4 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  legend: { fontSize: 12.5, fontWeight: '600' },
  legendValue: { fontSize: 12, fontWeight: '600' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  footprint: { fontSize: 11.5, marginTop: 16, fontWeight: '500' },
  footer: { fontSize: 11.5, textAlign: 'center', fontWeight: '500', marginTop: 4 },
  optionList: { paddingHorizontal: 8, paddingBottom: 6 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderRadius: 12,
  },
  optionLabel: { flex: 1, fontSize: 14.5, fontWeight: '600' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, gap: 12 },
  logKey: { fontSize: 12.5, fontWeight: '500' },
  logValue: { fontSize: 12.5, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
