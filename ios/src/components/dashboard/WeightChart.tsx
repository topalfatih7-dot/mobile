import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

export type WeightPoint = {
  date?: string;
  value?: number;
};

type Props = {
  data: WeightPoint[];
  height?: number;
};

/**
 * Web parity: Adsız `ProgressChart.WeightChart` (LineChart value vs date).
 *
 * Pure RN Views — no react-native-svg.
 * Dev-client binary may lack RNSVGSvgViewAndroid until a native rebuild.
 */
export function WeightChart({ data, height = 180 }: Props) {
  const { width: screenW } = useWindowDimensions();
  const chartW = Math.max(280, Math.min(screenW - 64, 400));

  const chart = useMemo(() => {
    const points = (data || [])
      .map((d) => ({
        date: String(d.date || ''),
        value: Number(d.value),
      }))
      .filter((d) => d.date && Number.isFinite(d.value));

    if (points.length === 0) return null;

    const padX = 12;
    const padTop = 12;
    const axisH = 22;
    const chartH = height - axisH;
    const innerW = chartW - padX * 2;
    const innerH = chartH - padTop - 8;

    const values = points.map((p) => p.value);
    const minV = Math.min(...values) - 1;
    const maxV = Math.max(...values) + 1;
    const range = Math.max(maxV - minV, 0.5);

    const coords = points.map((p, i) => {
      const x =
        points.length === 1
          ? padX + innerW / 2
          : padX + (i / (points.length - 1)) * innerW;
      const y = padTop + innerH - ((p.value - minV) / range) * innerH;
      return { x, y, ...p };
    });

    const segments: {
      key: string;
      left: number;
      top: number;
      width: number;
      angle: number;
    }[] = [];

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      segments.push({
        key: `s-${i}`,
        left: (a.x + b.x) / 2 - len / 2,
        top: (a.y + b.y) / 2 - 1.25,
        width: len,
        angle,
      });
    }

    return {
      chartH,
      chartW,
      coords,
      segments,
      labelLeft: minV.toFixed(0),
      labelRight: maxV.toFixed(0),
      firstDate: points[0]?.date || '',
      lastDate: points[points.length - 1]?.date || '',
      gridYs: [0, 0.5, 1].map((t) => padTop + innerH * (1 - t)),
      padX,
    };
  }, [data, height, chartW]);

  if (!chart) return null;

  return (
    <View style={[styles.wrap, { height }]}>
      <View style={[styles.canvas, { height: chart.chartH, width: chart.chartW }]}>
        {chart.gridYs.map((y, i) => (
          <View
            key={`g-${i}`}
            style={[
              styles.gridLine,
              {
                top: y,
                left: chart.padX,
                width: chart.chartW - chart.padX * 2,
              },
            ]}
          />
        ))}

        {chart.segments.map((s) => (
          <View
            key={s.key}
            style={[
              styles.segment,
              {
                left: s.left,
                top: s.top,
                width: s.width,
                transform: [{ rotate: `${s.angle}deg` }],
              },
            ]}
          />
        ))}

        {chart.coords.map((c, i) => (
          <View
            key={`d-${i}`}
            style={[
              styles.dot,
              {
                left: c.x - 4,
                top: c.y - 4,
              },
            ]}
          />
        ))}
      </View>
      <View style={[styles.axisRow, { width: chart.chartW }]}>
        <Text style={styles.axisText}>{chart.firstDate}</Text>
        <Text style={styles.axisText}>
          {chart.labelLeft}–{chart.labelRight} kg
        </Text>
        <Text style={styles.axisText}>{chart.lastDate}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.cream[200],
    opacity: 0.9,
  },
  segment: {
    position: 'absolute',
    height: 2.5,
    backgroundColor: colors.brand[500],
    borderRadius: 2,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand[500],
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: 4,
  },
  axisText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.55,
  },
});
