import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { runSimulation } from '../../services/simulationService';
import COLORS from '../../constants/colors';

// ── Helpers ───────────────────────────────────────────────────────────────────
const pct = (count, total) =>
  total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';

const formatNumber = (n) =>
  n?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') ?? '0';

// ── Color scale for coverage bars ─────────────────────────────────────────────
const coverageColor = (percent) => {
  const p = parseFloat(percent);
  if (p >= 60) return '#16A34A';   // green  — high coverage
  if (p >= 30) return '#D97706';   // amber  — moderate
  return '#DC2626';                // red    — low coverage
};

// ── Single horizontal bar row ─────────────────────────────────────────────────
const BarRow = ({ label, count, total, color }) => {
  const percentage = pct(count, total);
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
      <View style={barStyles.barTrack}>
        <View
          style={[
            barStyles.barFill,
            { width: `${Math.min(parseFloat(percentage), 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={barStyles.pctText}>{percentage}%</Text>
      <Text style={barStyles.countText}>({formatNumber(count)})</Text>
    </View>
  );
};

const barStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  label:     { width: 90, fontSize: 12, color: COLORS.textMid, fontWeight: '500' },
  barTrack:  { flex: 1, height: 10, backgroundColor: '#F1F5F9', borderRadius: 99, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: 99 },
  pctText:   { width: 40, fontSize: 12, fontWeight: '700', color: COLORS.textDark, textAlign: 'right' },
  countText: { width: 52, fontSize: 11, color: COLORS.textLight, textAlign: 'right' },
});

// ── Section card wrapper ──────────────────────────────────────────────────────
const SectionCard = ({ title, icon, children }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{icon}  {title}</Text>
    {children}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ResultsScreen({ route, navigation }) {
  const { policy_text, rules } = route.params;

  const [result,    setResult]    = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');

  // ── Run simulation on mount ───────────────────────────────────────────────
  useEffect(() => {
    const simulate = async () => {
      try {
        const data = await runSimulation(policy_text, rules);
        setResult(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Simulation failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    simulate();
  }, []);

  const handleNewPolicy = useCallback(() => {
    navigation.navigate('PolicyInput');
  }, [navigation]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingTitle}>Running Simulation</Text>
        <Text style={styles.loadingSubtitle}>
          Filtering 10,000 citizen records…
        </Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Simulation Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleNewPolicy}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    total_population,
    eligible_count,
    coverage_percent,
    breakdowns,
  } = result;

  const excluded_count = total_population - eligible_count;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>PIS</Text>
          </View>
          <Text style={styles.screenTitle}>Simulation Results</Text>
          <Text style={styles.screenSub}>
            Based on {formatNumber(total_population)} synthetic citizen records
          </Text>
        </View>

        {/* ── Hero Coverage Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroStat}>
              <Text style={styles.heroNumber}>{formatNumber(eligible_count)}</Text>
              <Text style={styles.heroLabel}>Eligible Citizens</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroNumber, { color: '#DC2626' }]}>
                {formatNumber(excluded_count)}
              </Text>
              <Text style={styles.heroLabel}>Excluded</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroNumber, { color: coverageColor(coverage_percent) }]}>
                {coverage_percent}%
              </Text>
              <Text style={styles.heroLabel}>Coverage</Text>
            </View>
          </View>

          {/* Overall coverage bar */}
          <View style={styles.overallBarTrack}>
            <View
              style={[
                styles.overallBarFill,
                {
                  width: `${Math.min(parseFloat(coverage_percent), 100)}%`,
                  backgroundColor: coverageColor(coverage_percent),
                },
              ]}
            />
          </View>
          <Text style={styles.overallBarLabel}>
            Overall population coverage
          </Text>
        </View>

        {/* ── Breakdown 1: Social Category ── */}
        <SectionCard title="By Social Category" icon="🏷️">
          {Object.entries(breakdowns?.social_category || {}).map(([cat, count]) => (
            <BarRow
              key={cat}
              label={cat}
              count={count}
              total={eligible_count}
              color="#6D28D9"
            />
          ))}
        </SectionCard>

        {/* ── Breakdown 2: Rural vs Urban ── */}
        <SectionCard title="By Area Type" icon="🗺️">
          {Object.entries(breakdowns?.rural_urban || {}).map(([area, count]) => (
            <BarRow
              key={area}
              label={area}
              count={count}
              total={eligible_count}
              color="#0369A1"
            />
          ))}
        </SectionCard>

        {/* ── Breakdown 3: Gender ── */}
        <SectionCard title="By Gender" icon="👥">
          {Object.entries(breakdowns?.gender || {}).map(([g, count]) => (
            <BarRow
              key={g}
              label={g}
              count={count}
              total={eligible_count}
              color="#0F766E"
            />
          ))}
        </SectionCard>

        {/* ── Top States ── */}
        <SectionCard title="Top 5 States by Coverage" icon="📍">
          {(breakdowns?.all_states || []).map(({ state, count, state_total }) => (
            <BarRow
              key={state}
              label={state}
              count={count}
              total={state_total}
              color={coverageColor(pct(count, state_total))}
            />
          ))}
        </SectionCard>

        {/* ── View India Map Button ── */}
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => navigation.navigate('IndiaMap', {
            stateData:        breakdowns?.all_states || [],
            total_population,
          })}
          activeOpacity={0.85}
        >
          <Text style={styles.mapButtonText}>🗺️  View India Map</Text>
        </TouchableOpacity>

        {/* ── New Policy Button ── */}
        <TouchableOpacity
          style={styles.newPolicyButton}
          onPress={handleNewPolicy}
          activeOpacity={0.85}
        >
          <Text style={styles.newPolicyButtonText}>＋  Simulate Another Policy</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },

  // Loading / Error center screens
  centerScreen: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.background, padding: 32,
  },
  loadingTitle:    { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginTop: 20, marginBottom: 8 },
  loadingSubtitle: { fontSize: 14, color: COLORS.textMid, textAlign: 'center' },
  errorIcon:       { fontSize: 40, marginBottom: 16 },
  errorTitle:      { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  errorText:       { fontSize: 14, color: COLORS.textMid, textAlign: 'center', marginBottom: 24 },
  retryButton: {
    height: 48, paddingHorizontal: 32, borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  retryButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

  // Header
  header: { alignItems: 'center', marginBottom: 24 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 6,
  },
  logoText:    { color: COLORS.white, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  screenSub:   { fontSize: 14, color: COLORS.textMid, textAlign: 'center' },

  // Hero card
  heroCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  heroTop:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  heroStat:   { flex: 1, alignItems: 'center' },
  heroNumber: { fontSize: 26, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  heroLabel:  { fontSize: 11, color: COLORS.textMid, fontWeight: '500', textAlign: 'center' },
  heroDivider:{ width: 1, backgroundColor: COLORS.border, marginHorizontal: 4 },
  overallBarTrack: {
    height: 12, backgroundColor: '#F1F5F9',
    borderRadius: 99, overflow: 'hidden', marginBottom: 8,
  },
  overallBarFill:  { height: '100%', borderRadius: 99 },
  overallBarLabel: { fontSize: 12, color: COLORS.textLight, textAlign: 'center' },

  // Section card
  sectionCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: COLORS.textDark,
    marginBottom: 16,
  },

  // Map button
  mapButton: {
    height: 54, backgroundColor: '#0F766E', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 5,
    marginBottom: 12,
  },
  mapButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  // New policy button
  newPolicyButton: {
    height: 54, backgroundColor: COLORS.primary, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 5,
  },
  newPolicyButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});