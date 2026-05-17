import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        if (user.email && user.email.toLowerCase().trim() === 'bsrin6@gmail.com') {
          navigation.replace('AdminDashboard');
        } else {
          navigation.replace('Home');
        }
      }
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      if (email.toLowerCase().trim() === 'bsrin6@gmail.com') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      console.error(error);
      let errorMessage = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      }
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { signInWithPopup } = require('firebase/auth');
      const { googleProvider } = require('../firebase');

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("User logged in:", user);

      // Redirect after login
      if (user.email === 'bsrin6@gmail.com') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      console.error("Google login error:", error.message);
      Alert.alert('Google Login Error', error.message);
    }
  };

  return (
    <View style={commonStyles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Ionicons name="leaf" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.logoText}>Kwick</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.helpButton}>
                <Ionicons name="help-circle-outline" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Welcome */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Login to continue your fresh shopping journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <View style={styles.fieldGroup}>
              <Text style={commonStyles.label}>Mobile Number or Email</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'email' && styles.inputWrapperFocused,
              ]}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter email or phone"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={commonStyles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputWrapperFocused,
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotRow}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[commonStyles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={commonStyles.primaryButtonText}>Login</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            activeOpacity={0.8}
            onPress={handleGoogleLogin}
          >
            <View style={styles.googleIconWrap}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Login with Google</Text>
          </TouchableOpacity>

          {/* Bottom CTA */}
          <View style={styles.bottomCta}>
            <Text style={styles.bottomCtaText}>New user? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.bottomCtaLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: SPACING.section,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  logoText: {
    fontSize: FONTS.size.xl,
    ...FONTS.bold,
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeSection: {
    marginBottom: SPACING.xxxl,
  },
  welcomeTitle: {
    fontSize: FONTS.size.xxxl,
    ...FONTS.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: FONTS.size.md,
    ...FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  formSection: {
    marginBottom: SPACING.xxl,
  },
  fieldGroup: {
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    height: 54,
    paddingHorizontal: SPACING.lg,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.primaryGlow,
  },
  inputIcon: {
    marginRight: SPACING.md,
  },
  inputField: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: COLORS.text,
    ...FONTS.regular,
    height: '100%',
    outlineStyle: 'none',
  },
  eyeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
  },
  forgotText: {
    fontSize: FONTS.size.sm,
    color: COLORS.primary,
    ...FONTS.medium,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  dividerText: {
    marginHorizontal: SPACING.lg,
    fontSize: FONTS.size.sm,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    height: 52,
    marginBottom: SPACING.xxxl,
  },
  googleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  googleG: {
    color: '#fff',
    fontSize: 14,
    ...FONTS.bold,
  },
  googleButtonText: {
    fontSize: FONTS.size.md,
    color: COLORS.text,
    ...FONTS.semibold,
  },
  bottomCta: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCtaText: {
    fontSize: FONTS.size.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
  bottomCtaLink: {
    fontSize: FONTS.size.md,
    color: COLORS.primary,
    ...FONTS.semibold,
  },
});
