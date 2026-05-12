import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !mobile || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional details in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        mobile,
        email,
        createdAt: new Date().toISOString(),
      });

      navigation.replace('Home');
    } catch (error) {
      console.error(error);
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      Alert.alert('Sign Up Error', errorMessage);
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
      console.log("User signed up with Google:", user);
      
      // Redirect after signup
      navigation.replace('Home');
    } catch (error) {
      console.error("Google signup error:", error.message);
      Alert.alert('Google Sign Up Error', error.message);
    }
  };

  const renderInput = (icon, placeholder, value, setter, fieldKey, options = {}) => (
    <View style={styles.fieldGroup}>
      <Text style={commonStyles.label}>{options.label}</Text>
      <View style={[
        styles.inputWrapper,
        focusedField === fieldKey && styles.inputWrapperFocused,
      ]}>
        <Ionicons name={icon} size={20} color={COLORS.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.inputField}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={setter}
          secureTextEntry={options.secure}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'sentences'}
          onFocus={() => setFocusedField(fieldKey)}
          onBlur={() => setFocusedField(null)}
        />
        {options.togglePassword !== undefined && (
          <TouchableOpacity
            onPress={options.onToggle}
            style={styles.eyeButton}
          >
            <Ionicons
              name={options.togglePassword ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={32} color={COLORS.primary} />
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join our community of fresh food lovers
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {renderInput('person-outline', 'John Doe', fullName, setFullName, 'name', {
              label: 'Full Name',
            })}
            {renderInput('call-outline', '9876543210', mobile, setMobile, 'mobile', {
              label: 'Mobile Number',
              keyboardType: 'phone-pad',
            })}
            {renderInput('mail-outline', 'john@example.com', email, setEmail, 'email', {
              label: 'Email Address',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}
            {renderInput('lock-closed-outline', '••••••••', password, setPassword, 'password', {
              label: 'Password',
              secure: !showPassword,
              togglePassword: showPassword,
              onToggle: () => setShowPassword(!showPassword),
            })}
            {renderInput('lock-closed-outline', '••••••••', confirmPassword, setConfirmPassword, 'confirmPassword', {
              label: 'Confirm Password',
              secure: !showConfirmPassword,
              togglePassword: showConfirmPassword,
              onToggle: () => setShowConfirmPassword(!showConfirmPassword),
            })}
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[commonStyles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleSignUp}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={commonStyles.primaryButtonText}>Sign Up</Text>
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

          {/* Google */}
          <TouchableOpacity 
            style={commonStyles.secondaryButton} 
            activeOpacity={0.8}
            onPress={handleGoogleLogin}
          >
            <View style={styles.googleIcon}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={commonStyles.secondaryButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

          {/* Bottom Links */}
          <View style={styles.bottomLinks}>
            <View style={styles.loginRow}>
              <Text style={styles.bottomText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.policyRow}>
              <TouchableOpacity>
                <Text style={styles.policyText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.policySeparator}>•</Text>
              <TouchableOpacity>
                <Text style={styles.policyText}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  title: {
    fontSize: FONTS.size.xxl,
    ...FONTS.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.size.md,
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: SPACING.xxl,
  },
  fieldGroup: {
    marginBottom: SPACING.lg,
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
  googleIcon: {
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
  bottomLinks: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  bottomText: {
    fontSize: FONTS.size.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
  linkText: {
    fontSize: FONTS.size.md,
    color: COLORS.primary,
    ...FONTS.semibold,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  policyText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },
  policySeparator: {
    marginHorizontal: SPACING.sm,
    color: COLORS.textMuted,
  },
});
