import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Button, Card, Title, theme } from '../components/ui';
import { isBackgroundEnabled, setBackgroundSampling } from '../background';
import { ensureNotificationPermission } from '../notify';
import { useStore } from '../store';

export function SettingsScreen() {
  const { settings, updateSettings } = useStore();
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl);
  const [hosts, setHosts] = useState(settings.hosts.join('\n'));
  const [samples, setSamples] = useState(String(settings.samples));
  const [interval, setIntervalSec] = useState(String(settings.intervalSec));
  const [alertQ, setAlertQ] = useState(String(settings.alertQuality));
  const [tp, setTp] = useState(settings.runThroughput);
  const [bg, setBg] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { isBackgroundEnabled().then(setBg); }, []);

  const save = async () => {
    const list = hosts.split('\n').map((h) => h.trim()).filter(Boolean);
    if (list.length < 3) {
      setMsg('Se necesitan al menos 3 hosts.');
      return;
    }
    await updateSettings({
      ...settings,
      backendUrl: backendUrl.trim().replace(/\/$/, ''),
      hosts: list,
      samples: Math.max(2, parseInt(samples, 10) || 6),
      intervalSec: Math.max(10, parseInt(interval, 10) || 30),
      alertQuality: Math.min(100, Math.max(0, parseInt(alertQ, 10) || 35)),
      runThroughput: tp,
    });
    setMsg('Configuración guardada.');
  };

  const toggleBg = async (v: boolean) => {
    setBg(v);
    if (v) await ensureNotificationPermission();
    setMsg(await setBackgroundSampling(v));
    setBg(await isBackgroundEnabled());
  };

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Card>
        <Title>Backend de throughput</Title>
        <Text style={styles.label}>URL (IP LAN de tu PC, puerto 4000)</Text>
        <TextInput style={styles.input} value={backendUrl} onChangeText={setBackendUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
        <View style={styles.switchRow}>
          <Text style={styles.label}>Ejecutar test de descarga/subida</Text>
          <Switch value={tp} onValueChange={setTp} />
        </View>
      </Card>

      <Card>
        <Title>Hosts de latencia (uno por línea, mín. 3)</Title>
        <TextInput style={[styles.input, { height: 100 }]} multiline value={hosts} onChangeText={setHosts} autoCapitalize="none" autoCorrect={false} />
        <Text style={styles.label}>Muestras por host</Text>
        <TextInput style={styles.input} value={samples} onChangeText={setSamples} keyboardType="number-pad" />
        <Text style={styles.label}>Intervalo de sesión (segundos)</Text>
        <TextInput style={styles.input} value={interval} onChangeText={setIntervalSec} keyboardType="number-pad" />
      </Card>

      <Card>
        <Title>Alertas y segundo plano</Title>
        <Text style={styles.label}>Notificar si la calidad baja de (0–100)</Text>
        <TextInput style={styles.input} value={alertQ} onChangeText={setAlertQ} keyboardType="number-pad" />
        <View style={styles.switchRow}>
          <Text style={styles.label}>Muestreo en segundo plano</Text>
          <Switch value={bg} onValueChange={toggleBg} />
        </View>
        <Text style={styles.hint}>iOS ejecuta tareas en segundo plano cada ~15 min o más, a criterio del sistema. No funciona con la app cerrada a la fuerza.</Text>
      </Card>

      {msg ? <Text style={[styles.msg, /restringido|No disponible|Se necesitan/.test(msg) && styles.warn]}>{msg}</Text> : null}
      <Button label="Guardar" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  label: { color: theme.muted, fontSize: 12, marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: theme.bg, color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  hint: { color: theme.muted, fontSize: 11, marginTop: 8 },
  msg: { color: '#86efac', marginBottom: 10 },
  warn: { color: '#fbbf24' },
});
