/**
 * IndiaMapScreen.js — APPROACH 1
 * ────────────────────────────────
 * Uses @svg-maps/india (accurate state SVG paths) + react-native-svg
 *
 * Install:
 *   npx expo install react-native-svg
 *   npm install @svg-maps/india
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import India from '@svg-maps/india';
import COLORS from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Heat color: blue(0%) → yellow(50%) → red(100%) ────────────────────────────
const heatColor = (pct) => {
  const p = Math.max(0, Math.min(100, parseFloat(pct) || 0)) / 100;
  if (p < 0.5) {
    const t = p * 2;
    return `rgb(${Math.round(t * 255)},${Math.round(100 + t * 155)},${Math.round(220 - t * 220)})`;
  }
  const t = (p - 0.5) * 2;
  return `rgb(255,${Math.round(255 - t * 255)},0)`;
};

const formatNumber = (n) =>
  (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ── Name normaliser — @svg-maps/india uses lowercase IDs, match to your state names
const normaliseStateName = (svgName) => {
  const map = {
    'andaman and nicobar islands': 'Andaman and Nicobar',
    'andhra pradesh':              'Andhra Pradesh',
    'arunachal pradesh':           'Arunachal Pradesh',
    'assam':                       'Assam',
    'bihar':                       'Bihar',
    'chandigarh':                  'Chandigarh',
    'chhattisgarh':                'Chhattisgarh',
    'dadra and nagar haveli':      'Dadra and Nagar Haveli',
    'daman and diu':               'Daman and Diu',
    'delhi':                       'Delhi',
    'goa':                         'Goa',
    'gujarat':                     'Gujarat',
    'haryana':                     'Haryana',
    'himachal pradesh':            'Himachal Pradesh',
    'jammu and kashmir':           'Jammu and Kashmir',
    'jharkhand':                   'Jharkhand',
    'karnataka':                   'Karnataka',
    'kerala':                      'Kerala',
    'ladakh':                      'Ladakh',
    'lakshadweep':                 'Lakshadweep',
    'madhya pradesh':              'Madhya Pradesh',
    'maharashtra':                 'Maharashtra',
    'manipur':                     'Manipur',
    'meghalaya':                   'Meghalaya',
    'mizoram':                     'Mizoram',
    'nagaland':                    'Nagaland',
    'odisha':                      'Odisha',
    'puducherry':                  'Puducherry',
    'punjab':                      'Punjab',
    'rajasthan':                   'Rajasthan',
    'sikkim':                      'Sikkim',
    'tamil nadu':                  'Tamil Nadu',
    'telangana':                   'Telangana',
    'tripura':                     'Tripura',
    'uttar pradesh':               'Uttar Pradesh',
    'uttarakhand':                 'Uttarakhand',
    'west bengal':                 'West Bengal',
  };
  return map[svgName?.toLowerCase()] || svgName;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function IndiaMapScreen({ route, navigation }) {
  const { stateData = [], total_population = 10000 } = route.params || {};

  const stateMap = useMemo(() => {
    const map = {};
    stateData.forEach(({ state, count, state_total }) => {
      const coverage = state_total > 0
        ? ((count / state_total) * 100).toFixed(1)
        : '0.0';
      map[state] = { count, state_total, coverage };
    });
    return map;
  }, [stateData]);

  const [selected, setSelected] = useState(null);

  const mapWidth  = SCREEN_WIDTH - 32;
  // @svg-maps/india viewBox is "0 0 1000 1100" — maintain aspect ratio
  const mapHeight = mapWidth * (1100 / 1000);

  return (
    <View style={styles.flex}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>State-wise Coverage</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* Tooltip */}
        {selected ? (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipState}>{selected.state}</Text>
            <View style={styles.tooltipRow}>
              <View style={styles.tooltipStat}>
                <Text style={[styles.tooltipValue, { color: heatColor(selected.coverage) }]}>
                  {selected.coverage}%
                </Text>
                <Text style={styles.tooltipLabel}>Coverage</Text>
              </View>
              <View style={styles.tooltipDivider} />
              <View style={styles.tooltipStat}>
                <Text style={styles.tooltipValue}>{formatNumber(selected.count)}</Text>
                <Text style={styles.tooltipLabel}>Eligible</Text>
              </View>
              <View style={styles.tooltipDivider} />
              <View style={styles.tooltipStat}>
                <Text style={styles.tooltipValue}>{formatNumber(selected.state_total)}</Text>
                <Text style={styles.tooltipLabel}>Total</Text>
              </View>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, {
                width: `${Math.min(parseFloat(selected.coverage), 100)}%`,
                backgroundColor: heatColor(selected.coverage),
              }]} />
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Tap any state to see details</Text>
          </View>
        )}

        {/* SVG Map */}
        <View style={styles.mapContainer}>
          <Svg
            width={mapWidth}
            height={mapHeight}
            viewBox={India.viewBox}
          >
            <G>
              {India.locations.map((location) => {
                const stateName = normaliseStateName(location.name);
                const info      = stateMap[stateName];
                const coverage  = info?.coverage ?? '0';
                const fill      = info ? heatColor(coverage) : '#E2E8F0';
                const isSelected = selected?.state === stateName;

                return (
                  <Path
                    key={location.id}
                    d={location.path}
                    fill={fill}
                    stroke={isSelected ? '#1E293B' : '#FFFFFF'}
                    strokeWidth={isSelected ? 3 : 1}
                    opacity={isSelected ? 1 : 0.88}
                    onPress={() => {
                      if (isSelected) {
                        setSelected(null);
                      } else {
                        setSelected({
                          state:       stateName,
                          coverage:    info?.coverage    ?? '0.0',
                          count:       info?.count       ?? 0,
                          state_total: info?.state_total ?? 0,
                        });
                      }
                    }}
                  />
                );
              })}
            </G>
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Coverage Scale</Text>
          <View style={styles.legendBar}>
            {Array.from({ length: 100 }, (_, i) => (
              <View key={i} style={[styles.legendSeg, { backgroundColor: heatColor(i) }]} />
            ))}
          </View>
          <View style={styles.legendLabels}>
            {[0, 25, 50, 75, 100].map(s => (
              <Text key={s} style={styles.legendLabel}>{s}%</Text>
            ))}
          </View>
          <View style={styles.legendNote}>
            <Text style={styles.legendNoteText}>🔵 Low coverage</Text>
            <Text style={styles.legendNoteText}>🔴 High coverage</Text>
          </View>
        </View>

        {/* Sorted state list */}
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>All States — sorted by coverage</Text>
          {Object.entries(stateMap)
            .sort((a, b) => parseFloat(b[1].coverage) - parseFloat(a[1].coverage))
            .map(([stateName, info]) => (
              <TouchableOpacity
                key={stateName}
                style={[styles.listRow, selected?.state === stateName && styles.listRowActive]}
                onPress={() => setSelected({ state: stateName, ...info })}
                activeOpacity={0.7}
              >
                <View style={[styles.dot, { backgroundColor: heatColor(info.coverage) }]} />
                <Text style={styles.listName} numberOfLines={1}>{stateName}</Text>
                <View style={styles.listBarTrack}>
                  <View style={[styles.listBarFill, {
                    width: `${Math.min(parseFloat(info.coverage), 100)}%`,
                    backgroundColor: heatColor(info.coverage),
                  }]} />
                </View>
                <Text style={styles.listPct}>{info.coverage}%</Text>
              </TouchableOpacity>
            ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  backButton:  { width: 60 },
  backText:    { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },

  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  tooltip: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  tooltipState: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 12 },
  tooltipRow:   { flexDirection: 'row', marginBottom: 12 },
  tooltipStat:  { flex: 1, alignItems: 'center' },
  tooltipValue: { fontSize: 20, fontWeight: '800', color: COLORS.textDark, marginBottom: 2 },
  tooltipLabel: { fontSize: 12, color: COLORS.textMid },
  tooltipDivider: { width: 0.5, backgroundColor: COLORS.border, marginHorizontal: 8 },
  barTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 99, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 99 },

  placeholder: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 20,
    marginBottom: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  placeholderText: { fontSize: 14, color: COLORS.textLight },

  mapContainer: {
    alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 14, padding: 8, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  legendCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  legendTitle:  { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 10 },
  legendBar:    { flexDirection: 'row', height: 14, borderRadius: 99, overflow: 'hidden', marginBottom: 6 },
  legendSeg:    { flex: 1, height: '100%' },
  legendLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  legendLabel:  { fontSize: 11, color: COLORS.textLight },
  legendNote:   { flexDirection: 'row', justifyContent: 'space-between' },
  legendNoteText: { fontSize: 12, color: COLORS.textMid },

  listCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  listTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 12 },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  listRowActive: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 6 },
  dot:          { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  listName:     { width: 120, fontSize: 13, color: COLORS.textDark, fontWeight: '500' },
  listBarTrack: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 99, overflow: 'hidden' },
  listBarFill:  { height: '100%', borderRadius: 99 },
  listPct:      { width: 42, fontSize: 12, fontWeight: '700', color: COLORS.textDark, textAlign: 'right' },
});