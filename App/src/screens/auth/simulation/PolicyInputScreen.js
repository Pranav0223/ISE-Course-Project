import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, ScrollView,
  Platform, Animated, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { parsePolicy, parsePolicyDocument } from '../../services/simulationService';
import COLORS from '../../constants/colors';

// ── Constants ─────────────────────────────────────────────────────────────────
const EXAMPLES = [
  {
    label: '👩 Widow Pension',
    text: 'Widowed women above 60 from rural areas of Uttar Pradesh or Bihar with annual income below 1 lakh.',
  },
  {
    label: '🌾 Farmer Subsidy',
    text: 'Small and marginal farmers from SC or ST category with land holding below 2 acres and annual income below 1.5 lakh.',
  },
  {
    label: '♿ Disability Scheme',
    text: 'Persons with disability of any age from rural or urban areas with annual income below 2 lakh.',
  },
  {
    label: '🎓 Scholarship',
    text: 'Students aged 18 to 25 from OBC or SC category with annual family income below 2.5 lakh.',
  },
  {
    label: '🏠 Housing Scheme',
    text: 'BPL families from rural areas in kuchha houses with annual income below 1.2 lakh.',
  },
];

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const MIN_CHARS   = 10;
const MAX_CHARS   = 500;
const MAX_FILE_MB = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄';
  if (mimeType === 'application/pdf') return '📕';
  return '📝';
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function PolicyInputScreen({ navigation }) {

  // mode: 'text' | 'upload'
  const [mode,         setMode]         = useState('text');
  const [policyText,   setPolicyText]   = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadNotes,  setUploadNotes]  = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [apiError,     setApiError]     = useState('');

  // ── Tab slide animation
  const tabIndicator = useRef(new Animated.Value(0)).current;

  const switchMode = (newMode) => {
    setMode(newMode);
    setApiError('');
    Animated.timing(tabIndicator, {
      toValue:         newMode === 'text' ? 0 : 1,
      duration:        200,
      useNativeDriver: false,
    }).start();
  };

  // ── Chip press animation
  const chipScales = useRef(EXAMPLES.map(() => new Animated.Value(1))).current;

  const animateChip = (index) => {
    Animated.sequence([
      Animated.timing(chipScales[index], { toValue: 0.93, duration: 80,  useNativeDriver: true }),
      Animated.timing(chipScales[index], { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleChipPress = (index) => {
    animateChip(index);
    setPolicyText(EXAMPLES[index].text);
    setApiError('');
  };

  // ── File picker ───────────────────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type:                 ACCEPTED_TYPES,
        copyToCacheDirectory: true,
        multiple:             false,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // Extension guard
      const ext = file.name?.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        Alert.alert(
          'Unsupported File',
          'Please upload a PDF or Word document (.pdf, .doc, .docx).',
          [{ text: 'OK' }]
        );
        return;
      }

      // Size guard
      if (file.size && file.size > MAX_FILE_MB * 1024 * 1024) {
        Alert.alert(
          'File Too Large',
          `Please upload a file smaller than ${MAX_FILE_MB} MB.`,
          [{ text: 'OK' }]
        );
        return;
      }

      setSelectedFile(file);
      setApiError('');
    } catch {
      setApiError('Could not open file picker. Please try again.');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setApiError('');
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleAnalyse = async () => {
    setIsLoading(true);
    setApiError('');

    try {
      let result;

      if (mode === 'text') {
        result = await parsePolicy(policyText.trim());
      } else {
        const formData = new FormData();
        formData.append('document', {
          uri:   selectedFile.uri,
          name:  selectedFile.name,
          type:  selectedFile.mimeType || 'application/pdf',
        });
        if (uploadNotes.trim()) {
          formData.append('notes', uploadNotes.trim());
        }
        result = await parsePolicyDocument(formData);
      }

      navigation.navigate('ConfirmRules', {
        policy_text: mode === 'text'
          ? policyText.trim()
          : `[Document: ${selectedFile.name}]${uploadNotes.trim() ? '\n' + uploadNotes.trim() : ''}`,
        parsed: result,   // { understood_as, rules[] }
      });

    } catch (error) {
      setApiError(
        error.response?.data?.message || 'Failed to analyse policy. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived
  const textReady      = mode === 'text'   && policyText.trim().length >= MIN_CHARS;
  const uploadReady    = mode === 'upload' && selectedFile !== null;
  const isButtonActive = (textReady || uploadReady) && !isLoading;
  const charCount      = policyText.length;
  const isOverLimit    = charCount > MAX_CHARS;

  const tabLeft = tabIndicator.interpolate({
    inputRange:  [0, 1],
    outputRange: ['2%', '51%'],
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>PIS</Text>
          </View>
          <Text style={styles.screenTitle}>Describe Your Policy</Text>
          <Text style={styles.screenSub}>
            Type the eligibility criteria or upload a policy document
          </Text>
        </View>

        {/* ── Main Card ── */}
        <View style={styles.card}>

          {/* ── Segmented Tab ── */}
          <View style={styles.tabContainer}>
            <Animated.View style={[styles.tabIndicator, { left: tabLeft }]} />
            <TouchableOpacity
              style={styles.tab}
              onPress={() => switchMode('text')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'text' && styles.tabTextActive]}>
                ✏️  Write Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => switchMode('upload')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'upload' && styles.tabTextActive]}>
                📎  Upload Document
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─── TEXT MODE ─── */}
          {mode === 'text' && (
            <View style={styles.modeContent}>
              <Text style={styles.fieldLabel}>Policy Description</Text>

              <TextInput
                style={[styles.textArea, isOverLimit && styles.inputError]}
                placeholder={'"e.g. Widowed women above 60 from rural UP or Bihar with income below 1 lakh"'}
                placeholderTextColor={COLORS.textLight}
                multiline
                textAlignVertical="top"
                value={policyText}
                onChangeText={(t) => { setPolicyText(t); setApiError(''); }}
                maxLength={600}
                autoCapitalize="sentences"
                autoCorrect
              />

              <Text style={[styles.charCount, isOverLimit && styles.charCountError]}>
                {charCount} / {MAX_CHARS}
                {isOverLimit ? '  — Consider shortening' : ''}
              </Text>

              <View style={styles.chipsSection}>
                <Text style={styles.chipsLabel}>Try an example →</Text>
                <View style={styles.chipsRow}>
                  {EXAMPLES.map((ex, i) => (
                    <Animated.View key={i} style={{ transform: [{ scale: chipScales[i] }] }}>
                      <TouchableOpacity
                        style={[styles.chip, policyText === ex.text && styles.chipActive]}
                        onPress={() => handleChipPress(i)}
                        activeOpacity={0.9}
                      >
                        <Text style={[styles.chipText, policyText === ex.text && styles.chipTextActive]}>
                          {ex.label}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ─── UPLOAD MODE ─── */}
          {mode === 'upload' && (
            <View style={styles.modeContent}>

              {/* Upload zone or file preview */}
              {!selectedFile ? (
                <TouchableOpacity
                  style={styles.uploadZone}
                  onPress={handlePickFile}
                  activeOpacity={0.7}
                >
                  <Text style={styles.uploadZoneIcon}>📄</Text>
                  <Text style={styles.uploadZoneTitle}>Tap to upload policy document</Text>
                  <Text style={styles.uploadZoneSub}>
                    Supports PDF, DOC, DOCX · Max {MAX_FILE_MB} MB
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  {/* File preview strip */}
                  <View style={styles.filePreview}>
                    <View style={styles.fileIconBox}>
                      <Text style={styles.fileIconText}>
                        {getFileIcon(selectedFile.mimeType)}
                      </Text>
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                        {selectedFile.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {formatFileSize(selectedFile.size)}
                        {selectedFile.mimeType?.includes('pdf') ? ' · PDF' : ' · Word'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={handleRemoveFile}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Change file */}
                  <TouchableOpacity
                    style={styles.changeFileButton}
                    onPress={handlePickFile}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changeFileText}>📎  Change File</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Optional notes */}
              <View style={styles.notesSection}>
                <Text style={styles.fieldLabel}>
                  Additional Notes
                  <Text style={styles.fieldLabelOptional}> (optional)</Text>
                </Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Any extra context the system should know about…"
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  textAlignVertical="top"
                  value={uploadNotes}
                  onChangeText={(t) => { setUploadNotes(t); setApiError(''); }}
                  maxLength={300}
                  autoCapitalize="sentences"
                />
              </View>

            </View>
          )}

        </View>

        {/* ── Tips Box ── */}
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 Supported fields</Text>
          <Text style={styles.tipText}>
            Age, gender, income, state, occupation, social category (SC / ST / OBC),
            marital status, rural/urban, disability, education level, BPL status
          </Text>
        </View>

        {/* ── API Error ── */}
        {apiError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{apiError}</Text>
          </View>
        ) : null}

        {/* ── Analyse Button ── */}
        <TouchableOpacity
          style={[styles.analyseButton, !isButtonActive && styles.analyseButtonDisabled]}
          onPress={handleAnalyse}
          disabled={!isButtonActive}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={styles.analyseButtonText}>Analysing…</Text>
            </View>
          ) : (
            <Text style={styles.analyseButtonText}>🔍  Analyse Policy</Text>
          )}
        </TouchableOpacity>

        {!isButtonActive && !isLoading && (
          <Text style={styles.buttonHint}>
            {mode === 'text'
              ? 'Start typing to enable analysis'
              : 'Upload a document to enable analysis'}
          </Text>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },

  // Header
  header:      { alignItems: 'center', marginBottom: 24 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 6,
  },
  logoText:    { color: COLORS.white, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  screenSub:   { fontSize: 14, color: COLORS.textMid, textAlign: 'center', lineHeight: 20 },

  // Card
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    marginBottom: 14, overflow: 'hidden',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row', backgroundColor: COLORS.background,
    borderRadius: 12, padding: 3, position: 'relative', height: 46,
  },
  tabIndicator: {
    position: 'absolute', top: 3, width: '48%', height: 40,
    backgroundColor: COLORS.card, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  tab:          { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  tabText:      { fontSize: 13, fontWeight: '500', color: COLORS.textMid },
  tabTextActive:{ color: COLORS.primary, fontWeight: '700' },

  // Mode content
  modeContent: { padding: 14, paddingTop: 10 },

  // Field
  fieldLabel:         { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 10 },
  fieldLabelOptional: { fontWeight: '400', color: COLORS.textLight, fontSize: 13 },

  // Text area
  textArea: {
    minHeight: 130, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.textDark,
    backgroundColor: COLORS.white, lineHeight: 22,
  },
  inputError:     { borderColor: COLORS.error },
  charCount:      { textAlign: 'right', fontSize: 12, color: COLORS.textLight, marginTop: 6, marginBottom: 16 },
  charCountError: { color: COLORS.error },

  // Chips
  chipsSection: { borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingTop: 16 },
  chipsLabel:   { fontSize: 12, fontWeight: '600', color: COLORS.textMid, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  chipActive:   { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText:     { fontSize: 13, color: COLORS.textMid, fontWeight: '500' },
  chipTextActive:{ color: COLORS.primary, fontWeight: '700' },

  // Upload zone
  uploadZone: {
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
    borderRadius: 14, paddingVertical: 36, alignItems: 'center',
    justifyContent: 'center', backgroundColor: COLORS.background, marginBottom: 16,
  },
  uploadZoneIcon:  { fontSize: 40, marginBottom: 12 },
  uploadZoneTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 },
  uploadZoneSub:   { fontSize: 12, color: COLORS.textLight },

  // File preview
  filePreview: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primaryLight, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.primary,
    padding: 12, marginBottom: 12, gap: 12,
  },
  fileIconBox:  { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  fileIconText: { fontSize: 22 },
  fileInfo:     { flex: 1 },
  fileName:     { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 3 },
  fileSize:     { fontSize: 12, color: COLORS.textMid },
  removeButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  removeButtonText: { fontSize: 12, color: COLORS.textMid, fontWeight: '700' },

  // Change file
  changeFileButton: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white, marginBottom: 16 },
  changeFileText:   { fontSize: 13, color: COLORS.textMid, fontWeight: '500' },

  // Notes
  notesSection: { borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingTop: 16 },
  notesInput:   { minHeight: 80, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 14, color: COLORS.textDark, backgroundColor: COLORS.white, lineHeight: 20 },

  // Tips
  tipBox:  { backgroundColor: '#FFFBEB', borderLeftWidth: 4, borderLeftColor: '#F59E0B', borderRadius: 10, padding: 14, marginBottom: 14 },
  tipTitle:{ fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 5 },
  tipText: { fontSize: 12, color: '#78350F', lineHeight: 18 },

  // Error banner
  errorBanner:     { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: COLORS.error },
  errorBannerText: { color: '#991B1B', fontSize: 14, fontWeight: '500' },

  // Button
  analyseButton: {
    height: 54, backgroundColor: COLORS.primary, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 5, marginBottom: 10,
  },
  analyseButtonDisabled: { backgroundColor: COLORS.border, shadowOpacity: 0, elevation: 0 },
  analyseButtonText:     { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  loadingRow:            { flexDirection: 'row', alignItems: 'center', gap: 10 },
  buttonHint:            { textAlign: 'center', fontSize: 12, color: COLORS.textLight },
});