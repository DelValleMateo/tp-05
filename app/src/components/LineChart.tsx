import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { theme } from './ui';

interface Props {
  title: string;
  unit: string;
  data: (number | null)[];
  color: string;
  height?: number;
}

export function LineChart({ title, unit, data, color, height = 130 }: Props) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const pts = data.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null);
  const padL = 36, padR = 8, padT = 10, padB = 16;

  let body: React.ReactNode = null;
  if (w > 0 && pts.length > 0) {
    const max = Math.max(...pts.map((p) => p.v)) || 1;
    const min = Math.min(0, ...pts.map((p) => p.v));
    const x = (i: number) => padL + (data.length <= 1 ? (w - padL - padR) / 2 : (i / (data.length - 1)) * (w - padL - padR));
    const y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (height - padT - padB);
    const d = pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    body = (
      <Svg width={w} height={height}>
        {[0, 0.5, 1].map((t) => {
          const v = min + (max - min) * t;
          return (
            <React.Fragment key={t}>
              <Line x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} stroke={theme.border} strokeWidth={1} />
              <SvgText x={padL - 4} y={y(v) + 4} fill={theme.muted} fontSize={10} textAnchor="end">
                {v >= 100 ? v.toFixed(0) : v.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Path d={d} stroke={color} strokeWidth={2} fill="none" />
        {pts.map((p) => (
          <Circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={3} fill={color} />
        ))}
      </Svg>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {title} <Text style={styles.unit}>({unit})</Text>
      </Text>
      <View onLayout={onLayout} style={{ height }}>
        {body ?? <Text style={styles.empty}>Sin datos</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  title: { color: theme.text, fontWeight: '600', marginBottom: 4 },
  unit: { color: theme.muted, fontWeight: '400' },
  empty: { color: theme.muted, paddingTop: 40, textAlign: 'center' },
});
