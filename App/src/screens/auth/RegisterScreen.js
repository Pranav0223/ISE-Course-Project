import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, ScrollView,
  Platform
} from 'react-native';
import { register as registerService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { login as loginService } from '../../services/authService';
import COLORS from '../../constants/colors';

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [department,  setDepartment]  = useState('');
  const [password,    setPassword]    = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [role,        setRole]        = useState('viewer');
  const [showPass,    setShowPass]    = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [apiError,    setApiError]    = useState('');
  const [errors,      setErrors]      = useState({});

  // ── Validation ─────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!name.trim())
      newErrors.name = 'Full name is required';

    if (!email.trim())
      newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = 'Enter a valid email address';

    if (!department.trim())
      newErrors.department = 'Department is required';

    if (!password)
      newErrors.password = 'Password is required';
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (!confirmPass)
      newErrors.confirmPass = 'Please confirm your password';
    else if (confirmPass !== password)
      newErrors.confirmPass = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setApiError('');
    try {
      // Register the user
      await registerService(
        name.trim(), email.trim().toLowerCase(),
        password, role, department.trim()
      );
      // Auto-login after registration
      const { token, user } = await loginService(
        email.trim().toLowerCase(), password
      );
      login(user, token);
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reusable field component ────────────────────────────────────
  const Field = ({ label, value, onChangeText, placeholder, keyboardType,
                   secureTextEntry, errorKey, rightElement }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        errors[errorKey] ? styles.inputError : null
      ]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secureTextEntry || false}
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            setErrors(prev => ({ ...prev, [errorKey]: '' }));
            setApiError('');
          }}
        />
        {rightElement || null}
      </View>
      {errors[errorKey]
        ? <Text style={styles.fieldError}>{errors[errorKey]}</Text>
        : null}
    </View>
  );

  // ── UI ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>PIS</Text>
          </View>
          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.tagline}>Register as a government official</Text>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.card}>

          {/* API error banner */}
          {apiError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          ) : null}

          {/* Full Name */}
          <Field
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rahul Sharma"
            errorKey="name"
          />

          {/* Email */}
          <Field
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@gov.in"
            keyboardType="email-address"
            errorKey="email"
          />

          {/* Department */}
          <Field
            label="Department / Ministry"
            value={department}
            onChangeText={setDepartment}
            placeholder="e.g. Ministry of Agriculture"
            errorKey="department"
          />

          {/* Role selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleRow}>
              {['viewer', 'policy_officer'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleButton, role === r && styles.roleButtonActive]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                    {r === 'viewer' ? 'Viewer' : 'Policy Officer'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.roleHint}>
              {role === 'viewer'
                ? 'Can view and explore simulation results'
                : 'Can create policies and run simulations'}
            </Text>
          </View>

          {/* Password */}
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 6 characters"
            secureTextEntry={!showPass}
            errorKey="password"
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />

          {/* Confirm Password */}
          <Field
            label="Confirm Password"
            value={confirmPass}
            onChangeText={setConfirmPass}
            placeholder="Re-enter your password"
            secureTextEntry={!showPass}
            errorKey="confirmPass"
          />

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={styles.registerButtonText}>Create Account</Text>
            }
          </TouchableOpacity>

        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          For authorized government officials only.{'\n'}
          Simulation results are for planning purposes only.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  logoText: { color: COLORS.white, fontSize: 24, fontWeight: '800', letterSpacing: 1 },
  appName:  { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  tagline:  { fontSize: 14, color: COLORS.textMid },

  // Card
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, marginBottom: 24,
  },

  // Error banner
  errorBanner: {
    backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12,
    marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.error,
  },
  errorBannerText: { color: '#991B1B', fontSize: 14, fontWeight: '500' },

  // Fields
  fieldGroup:   { marginBottom: 18 },
  label:        { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    height: 50, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, backgroundColor: COLORS.white,
  },
  input:      { flex: 1, fontSize: 15, color: COLORS.textDark },
  inputError: { borderColor: COLORS.error },
  fieldError: { color: COLORS.error, fontSize: 12, marginTop: 6, marginLeft: 2 },
  eyeButton:  { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  eyeText:    { fontSize: 18 },

  // Role selector
  roleRow: { flexDirection: 'row', gap: 10 },
  roleButton: {
    flex: 1, height: 44, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  roleButtonActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  roleText:         { fontSize: 13, color: COLORS.textMid, fontWeight: '500' },
  roleTextActive:   { color: COLORS.primary, fontWeight: '700' },
  roleHint:         { fontSize: 12, color: COLORS.textLight, marginTop: 8 },

  // Button
  registerButton: {
    height: 52, backgroundColor: COLORS.primary, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  buttonDisabled:      { opacity: 0.6 },
  registerButtonText:  { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  // Footer
  footer:      { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  footerText:  { fontSize: 14, color: COLORS.textMid },
  footerLink:  { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  disclaimer:  { textAlign: 'center', fontSize: 11, color: COLORS.textLight, lineHeight: 17 },
});