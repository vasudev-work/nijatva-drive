import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import { DriveHeader } from '../components/DriveHeader';
import { Card, Chip, Row, SectionTitle } from '../components/ui';
import { PromptSheet } from '../components/Prompts';
import { StorageMeter } from '../components/StorageMeter';
import { ping, pushSnapshot } from '../api/client';
import { formatBytes, initialsOf } from '../utils/format';
import { vaultFootprint } from '../storage';

export function SettingsScreen() {
  const { theme, meta, stats, setThemeMode, setPasscode, setApiUrl, notify, nodes } = useDrive();
  const [passPrompt, setPassPrompt] = useState(false);
  const [urlPrompt, setUrlPrompt] = useState(false);
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

  return (
    <View style={{ flex: 1 }}>
      <DriveHeader
        title="Settings"
        subtitle="Your vault, your rules"
        showSearch={false}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 150 }}>
        <Card style={{ padding: 16, marginBottom: 18 }}>
          <View style={styles.account}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.avatarLabel, { color: theme.colors.onPrimary }]}>
                {initialsOf('Vasudev Work')}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.colors.text }]}>Vasudev Work</Text>
              <Text style={[styles.email, { color: theme.colors.textMuted }]}>
                vasudev.work@rediffmail.com
              </Text>
            </View>
            <View style={[styles.plan, { backgroundColor: theme.colors.primarySoft }]}>
              <Text style={[styles.planLabel, { color: theme.colors.primary }]}>Free</Text>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <StorageMeter />
          </View>
        </Card>

        <SectionTitle title="Storage" />
        <Card style={{ padding: 16, marginBottom: 18 }}>
          {categories.length === 0 ? (
            <Text style={[styles.muted, { color: theme.colors.textMuted }]}>
              Nothing stored yet. Upload a file to see the breakdown.
            </Text>
          ) : (
            categories.map(([category, bytes]) => {
              const ratio = stats.used > 0 ? bytes / stats.used : 0;
              return (
                <View key={category} style={{ marginBottom: 12 }}>
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
                        {
                          width: `${Math.max(ratio * 100, 2)}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
          <Text style={[styles.footprint, { color: theme.colors.textFaint }]}>
            {footprint.files} blobs on this device · {formatBytes(footprint.bytes)} written
          </Text>
        </Card>

        <SectionTitle title="Appearance" />
        <Card style={{ padding: 14, marginBottom: 18 }}>
          <View style={styles.chipRow}>
            <Chip label="System" active={meta.themeMode === 'system'} onPress={() => setThemeMode('system')} icon="phone-portrait" />
            <Chip label="Light" active={meta.themeMode === 'light'} onPress={() => setThemeMode('light')} icon="sunny" />
            <Chip label="Dark" active={meta.themeMode === 'dark'} onPress={() => setThemeMode('dark')} icon="moon" />
          </View>
        </Card>

        <SectionTitle title="Security" />
        <Card style={{ marginBottom: 18 }}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>App lock</Text>
              <Text style={[styles.rowBody, { color: theme.colors.textMuted }]}>
                Ask for a passcode when the app opens
              </Text>
            </View>
            <Switch
              value={meta.passcode !== null}
              onValueChange={(next) => {
                if (next) setPassPrompt(true);
                else setPasscode(null);
              }}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surfaceSunken }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Row
            icon="shield-checkmark"
            label="Encryption"
            value="Local vault"
            last
          />
          <Row
            icon="key"
            label="Change passcode"
            onPress={() => setPassPrompt(true)}
            last
          />
        </Card>

        <SectionTitle title="Sync" />
        <Card style={{ marginBottom: 18 }}>
          <Row
            icon="server"
            label="API base url"
            value={meta.apiUrl ?? 'not set'}
            onPress={() => setUrlPrompt(true)}
          />
          <Row
            icon="refresh"
            label={checking ? 'Testing…' : 'Test connection & push snapshot'}
            onPress={testConnection}
            last
          />
        </Card>

        <SectionTitle title="About" />
        <Card style={{ marginBottom: 18 }}>
          <Row icon="information-circle" label="Version" value="1.0.0" />
          <Row icon="logo-github" label="Repository" value="nijatva-drive" />
          <Row icon="sparkles" label="Design language" value="Nijatva" last />
        </Card>

        <Text style={[styles.footer, { color: theme.colors.textFaint }]}>
          Nijatva Drive keeps every file inside this app's private storage. Share links are generated
          locally as a UI demo and are not resolvable on the internet.
        </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  account: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { fontSize: 15, fontWeight: '700' },
  name: { fontSize: 15.5, fontWeight: '700' },
  email: { fontSize: 12.5, marginTop: 2 },
  plan: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  planLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  muted: { fontSize: 13, lineHeight: 19 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  legend: { fontSize: 12.5, fontWeight: '600' },
  legendValue: { fontSize: 12, fontWeight: '600' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  footprint: { fontSize: 11.5, marginTop: 4, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowTitle: { fontSize: 14.5, fontWeight: '600' },
  rowBody: { fontSize: 12, marginTop: 2 },
  footer: { fontSize: 11.5, lineHeight: 17, paddingHorizontal: 4 },
});
