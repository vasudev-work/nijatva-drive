import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDrive } from '../store/DriveProvider';
import { formatBytes } from '../utils/format';

export function StorageMeter({
  light = false,
  showCaption = true,
}: {
  light?: boolean;
  showCaption?: boolean;
}) {
  const { theme, stats } = useDrive();
  const ratio = stats.quota > 0 ? Math.min(stats.used / stats.quota, 1) : 0;
  const trackColor = light ? 'rgba(255,255,255,0.22)' : theme.colors.surfaceSunken;
  const fillColor = light ? theme.colors.accent : theme.colors.primary;
  const textColor = light ? 'rgba(255,255,255,0.82)' : theme.colors.textMuted;
  return (
    <View>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: fillColor, width: `${Math.max(ratio * 100, stats.used > 0 ? 3 : 0)}%` },
          ]}
        />
      </View>
      {showCaption ? (
        <View style={styles.captionRow}>
          <Text style={[styles.caption, { color: textColor }]}>
            {formatBytes(stats.used)} of {formatBytes(stats.quota)} used
          </Text>
          <Text style={[styles.caption, { color: textColor }]}>{Math.round(ratio * 100)}%</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  captionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  caption: { fontSize: 11.5, fontWeight: '600' },
});
