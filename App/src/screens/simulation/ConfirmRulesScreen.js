import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { parsePolicy, parsePolicyDocument } from '../../services/simulationService';
import COLORS from '../../constants/colors';

// ── Operator labels ────────────────────────────────────────────────────────────
const OPERATOR_LABEL = {
  equals:                  '=',
  not_equals:              '≠',
  greater_than:            '>',
  less_than:               '<',
  greater_than_or_equal:   '≥',
  less_than_or_equal:      '≤',
  in_list:                 'IN',
  not_in_list:             'NOT IN',
  is_true:                 'IS',
  is_false:                'IS NOT',
};

// ── Field display names ───────────────────────────────────────────────────────
const FIELD_LABEL = {
  age:              'Age',
  gender:           'Gender',
  income_annual:    'Annual Income',
  state:            'State',
  rural_urban:      'Area Type',
  social_category:  'Social Category',
  occupation:       'Occupation',
  marital_status:   'Marital Status',
  disability:       'Disability',
  education_level:  'Education Level',
  bpl_status:       'BPL Status',
};

// ── Format value for display ──────────────────────────────────────────────────
const formatValue = (field, value) => {
  if (field === 'income_annual' && typeof value === 'number') {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000)   return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

// ── Rule chip color by field category ─────────────────────────────────────────
const FIELD_COLOR = {
  age:             { bg: '#EFF6FF', border: '#93C5FD', text: '#1D4ED8' },
  gender:          { bg: '#FDF4FF', border: '#E879F9', text: '#86198F' },
  income_annual:   { bg: '#F0FDF4', border: '#86EFAC', text: '#15803D' },
  state:           { bg: '#FFF7ED', border: '#FDB876', text: '#C2410C' },
  rural_urban:     { bg: '#F0FDFA', border: '#5EEAD4', text: '#0F766E' },
  social_category: { bg: '#FEF9C3', border: '#FDE047', text: '#854D0E' },
  occupation:      { bg: '#F5F3FF', border: '#C4B5FD', text: '#6D28D9' },
  marital_status:  { bg: '#FFF1F2', border: '#FDA4AF', text: '#BE123C' },
  disability:      { bg: '#FFF7ED', border: '#FDBA74', text: '#C2410C' },
  education_level: { bg: '#F0F9FF', border: '#7DD3FC', text: '#0369A1' },
  bpl_status:      { bg: '#F7FEE7', border: '#A3E635', text: '#3F6212' },
};

const DEFAULT_COLOR = { bg: '#F8FAFC', border: '#CBD5E1', text: '#475569' };

// ── Single Rule Card ──────────────────────────────────────────────────────────
const RuleCard = ({ rule, index }) => {
  const color = FIELD_COLOR[rule.field] || DEFAULT_COLOR;
  return (
    <View style={[styles.ruleCard, { borderLeftColor: color.border, borderLeftWidth: 4 }]}>
      <View style={styles.ruleCardTop}>
        <View style={[styles.fieldBadge, { backgroundColor: color.bg, borderColor: color.border }]}>
          <Text style={[styles.fieldBadgeText, { color: color.text }]}>
            {FIELD_LABEL[rule.field] || rule.field}
          </Text>
        </View>
        <View style={styles.operatorBadge}>
          <Text style={styles.operatorText}>
            {OPERATOR_LABEL[rule.operator] || rule.operator}
          </Text>
        </View>
        <View style={[styles.valueBadge, { backgroundColor: color.bg, borderColor: color.border }]}>
          <Text style={[styles.valueText, { color: color.text }]}>
            {formatValue(rule.field, rule.value)}
          </Text>
        </View>
      </View>
      <Text style={styles.ruleLabel}>{rule.label}</Text>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ConfirmRulesScreen({ route, navigation }) {
  const { policy_text, parsed: initialParsed } = route.params;

  const [parsed,     setParsed]     = useState(initialParsed);
  const [isLoading,  setIsLoading]  = useState(false);
  const [apiError,   setApiError]   = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // ── Disapprove — regenerate rules ─────────────────────────────────────────
  const handleDisapprove = useCallback(() => {
    Alert.alert(
      'Regenerate Rules?',
      'The AI will re-analyse your policy and generate a new set of rules.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', style: 'default', onPress: regenerateRules },
      ]
    );
  }, [policy_text]);

  const regenerateRules = useCallback(async () => {
    setIsLoading(true);
    setApiError('');
    try {
      // Detect if it was a document upload or plain text
      const isDocument = policy_text.startsWith('[Document:');
      let result;

      if (isDocument) {
        // Can't re-upload a file, so send the extracted label as context
        result = await parsePolicy(
          `Please re-analyse and regenerate rules for this policy: ${policy_text}`
        );
      } else {
        result = await parsePolicy(policy_text);
      }

      setParsed(result);
      setRetryCount(prev => prev + 1);
    } catch (error) {
      setApiError(
        error.response?.data?.message || 'Failed to regenerate rules. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [policy_text]);

  // ── Approve — go to simulation ────────────────────────────────────────────
  const handleApprove = useCallback(() => {
    navigation.navigate('Results', {
      policy_text,
      rules: parsed.rules,
    });
  }, [navigation, policy_text, parsed]);

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
          <Text style={styles.screenTitle}>Review Policy Rules</Text>
          <Text style={styles.screenSub}>
            Confirm the rules the AI extracted from your policy
          </Text>
        </View>

        {/* ── Understood As ── */}
        <View style={styles.understoodCard}>
          <Text style={styles.understoodLabel}>🤖 AI understood this as:</Text>
          <Text style={styles.understoodText}>{parsed.understood_as}</Text>
          {retryCount > 0 && (
            <View style={styles.retryBadge}>
              <Text style={styles.retryBadgeText}>
                Attempt {retryCount + 1}
              </Text>
            </View>
          )}
        </View>

        {/* ── Rules List ── */}
        <View style={styles.rulesSection}>
          <Text style={styles.sectionTitle}>
            {parsed.rules.length} Rule{parsed.rules.length !== 1 ? 's' : ''} Extracted
          </Text>

          {parsed.rules.length === 0 ? (
            <View style={styles.emptyRules}>
              <Text style={styles.emptyRulesIcon}>⚠️</Text>
              <Text style={styles.emptyRulesText}>
                No rules could be extracted. Try disapproving to regenerate or go back and rewrite your policy.
              </Text>
            </View>
          ) : (
            parsed.rules.map((rule, index) => (
              <RuleCard key={`${rule.field}-${index}`} rule={rule} index={index} />
            ))
          )}
        </View>

        {/* ── API Error ── */}
        {apiError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{apiError}</Text>
          </View>
        ) : null}

        {/* ── Loading state while regenerating ── */}
        {isLoading && (
          <View style={styles.regeneratingBox}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.regeneratingText}>
              AI is re-analysing your policy…
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ── Action Buttons — fixed at bottom ── */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.disapproveButton, isLoading && styles.buttonDisabled]}
          onPress={handleDisapprove}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.disapproveButtonText}>✗  Disapprove</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.approveButton,
            (isLoading || parsed.rules.length === 0) && styles.buttonDisabled,
          ]}
          onPress={handleApprove}
          disabled={isLoading || parsed.rules.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.approveButtonText}>✓  Approve & Simulate</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 120,  // space for fixed action bar
  },

  // Header
  header: { alignItems: 'center', marginBottom: 24 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 6,
  },
  logoText:    { color: COLORS.white, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  screenSub:   { fontSize: 14, color: COLORS.textMid, textAlign: 'center', lineHeight: 20 },

  // Understood As card
  understoodCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  understoodLabel: {
    fontSize: 12, fontWeight: '600',
    color: COLORS.textMid, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  understoodText: {
    fontSize: 15, color: COLORS.textDark,
    lineHeight: 22, fontWeight: '500',
  },
  retryBadge: {
    alignSelf: 'flex-start', marginTop: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  retryBadgeText: { fontSize: 11, color: '#1D4ED8', fontWeight: '600' },

  // Rules section
  rulesSection:  { marginBottom: 16 },
  sectionTitle:  {
    fontSize: 13, fontWeight: '700',
    color: COLORS.textMid, marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Rule card
  ruleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  ruleCardTop: {
    flexDirection: 'row', alignItems: 'center',
    flexWrap: 'wrap', gap: 8, marginBottom: 8,
  },
  fieldBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  fieldBadgeText: { fontSize: 12, fontWeight: '700' },
  operatorBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6,
  },
  operatorText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  valueBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  valueText:  { fontSize: 12, fontWeight: '700' },
  ruleLabel:  { fontSize: 13, color: COLORS.textMid, lineHeight: 18 },

  // Empty rules
  emptyRules: {
    alignItems: 'center', padding: 32,
    backgroundColor: COLORS.card, borderRadius: 14,
  },
  emptyRulesIcon: { fontSize: 32, marginBottom: 12 },
  emptyRulesText: {
    fontSize: 14, color: COLORS.textMid,
    textAlign: 'center', lineHeight: 20,
  },

  // Regenerating
  regeneratingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 10,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  regeneratingText: { fontSize: 14, color: '#1D4ED8', fontWeight: '500' },

  // Error banner
  errorBanner: {
    backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12,
    marginBottom: 14, borderLeftWidth: 4, borderLeftColor: COLORS.error,
  },
  errorBannerText: { color: '#991B1B', fontSize: 14, fontWeight: '500' },

  // Action bar
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12,
    padding: 16, paddingBottom: 32,
    backgroundColor: COLORS.background,
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
  },
  disapproveButton: {
    flex: 1, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.error,
    backgroundColor: COLORS.white,
  },
  disapproveButtonText: {
    color: COLORS.error, fontSize: 15, fontWeight: '700',
  },
  approveButton: {
    flex: 2, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28, shadowRadius: 6, elevation: 4,
  },
  approveButtonText: {
    color: COLORS.white, fontSize: 15, fontWeight: '700',
  },
  buttonDisabled: { opacity: 0.5 },
});