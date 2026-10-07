import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { theme } from './src/components/ui';
import { ChartsScreen } from './src/screens/ChartsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { MapScreen } from './src/screens/MapScreen';
import { MonitorScreen } from './src/screens/MonitorScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { useStore } from './src/store';

const TABS = [
  { key: 'monitor', label: 'Monitor', icon: '📡', Screen: MonitorScreen },
  { key: 'map', label: 'Mapa', icon: '🗺️', Screen: MapScreen },
  { key: 'charts', label: 'Gráficos', icon: '📈', Screen: ChartsScreen },
  { key: 'history', label: 'Historial', icon: '🗂️', Screen: HistoryScreen },
  { key: 'settings', label: 'Ajustes', icon: '⚙️', Screen: SettingsScreen },
] as const;

export default function App() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('monitor');
  const { ready, init } = useStore();

  useEffect(() => { init(); }, [init]);

  const Active = TABS.find((t) => t.key === tab)!.Screen;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <Text style={styles.header}>Network QoS Monitor</Text>
        <View style={{ flex: 1 }}>
          {ready ? <Active /> : <ActivityIndicator style={{ marginTop: 60 }} color={theme.accent} />}
        </View>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
              <Text style={{ fontSize: 20, opacity: tab === t.key ? 1 : 0.5 }}>{t.icon}</Text>
              <Text style={[styles.tabLabel, tab === t.key && { color: theme.accent }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: { color: theme.text, fontSize: 20, fontWeight: '800', paddingHorizontal: 16, paddingVertical: 10 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderColor: theme.border, backgroundColor: theme.card },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabLabel: { color: theme.muted, fontSize: 10, marginTop: 2 },
});
