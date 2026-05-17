import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [lastOrderAddress, setLastOrderAddress] = useState(null);
  const [activeTab, setActiveTab] = useState('Profile');

  const effectiveAddress = userData?.savedAddress || lastOrderAddress;

  // Editable states
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    let userUnsubscribe = null;
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Real-time listener for user data
        userUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            // Only update editable fields if the user hasn't started typing changes
            setEditedName(prev => hasChanges ? prev : (data.fullName || data.name || data.displayName || data.savedAddress?.name || user.displayName || prev));
            setEditedPhone(prev => hasChanges ? prev : (data.mobile || data.phoneNumber || data.savedAddress?.mobile || user.phoneNumber || prev));
          } else {
            setEditedName(prev => hasChanges ? prev : (user.displayName || prev));
            setEditedPhone(prev => hasChanges ? prev : (user.phoneNumber || prev));
          }
        });

        try {
          // Fetch last order address
          const ordersRef = collection(db, 'orders');
          const q = query(
            ordersRef,
            where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const fetchedOrders = querySnapshot.docs.map(doc => doc.data());
            // Sort locally by createdAt descending
            const sortedOrders = fetchedOrders.sort((a, b) => {
              const dateA = a.createdAt?.seconds || 0;
              const dateB = b.createdAt?.seconds || 0;
              return dateB - dateA;
            });
            const lastAddr = sortedOrders[0].address;
            setLastOrderAddress(lastAddr);

            if (lastAddr) {
              setEditedName(prev => hasChanges ? prev : (prev || lastAddr.name || ''));
              setEditedPhone(prev => hasChanges ? prev : (prev || lastAddr.mobile || ''));
            }
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
        }
      } else {
        navigation.replace('Login');
      }
    });

    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const { setDoc, doc } = require('firebase/firestore');
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: editedName,
        mobile: editedPhone,
      }, { merge: true });
      setUserData({ ...userData, fullName: editedName, mobile: editedPhone });
      setHasChanges(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[commonStyles.screen, { backgroundColor: '#F9FAFB' }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <View style={styles.mainCard}>
          <Text style={styles.groupTitle}>Personal Information</Text>

          <InfoSection
            label="User Name"
            value={editedName}
            icon="user"
            onChangeText={setEditedName}
            setHasChanges={setHasChanges}
          />

          <InfoSection
            label="Contact Number"
            value={editedPhone}
            icon="phone"
            onChangeText={setEditedPhone}
            keyboardType="phone-pad"
            setHasChanges={setHasChanges}
          />

          <View style={styles.divider} />

          <Text style={styles.groupTitle}>Saved Addresses</Text>
          <InfoSection
            label="Delivery Address"
            icon="map-pin"
            isAddress={true}
            onPress={() => navigation.navigate('Address', { fromProfile: true, existingAddress: effectiveAddress })}
            addressDisplay={(
              <View>
                <Text style={styles.addressType}>{effectiveAddress?.type || 'Not Set'}</Text>
                <Text style={styles.addressText}>
                  {effectiveAddress
                    ? `${effectiveAddress.flat}, ${effectiveAddress.street}, ${effectiveAddress.pincode}`
                    : 'No address saved yet. Tap to add address.'}
                </Text>
              </View>
            )}
          />

          {hasChanges && (
            <TouchableOpacity
              style={[commonStyles.primaryButton, { marginTop: 20 }]}
              onPress={handleUpdateProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={commonStyles.primaryButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.supportSection}>
          <Text style={styles.supportHeader}>PREFERENCES & SUPPORT</Text>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#E11D48" />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {[
          { key: 'Home', icon: 'home-outline', label: 'Home' },
          { key: 'Orders', icon: 'bag-handle-outline', label: 'Orders' },
          { key: 'Profile', icon: 'person-outline', label: 'Profile' },
        ].map(tab => {
          const isActive = tab.key === 'Profile';
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => {
                if (tab.key === 'Home') navigation.navigate('Home');
                if (tab.key === 'Orders') navigation.navigate('OrderHistory');
              }}
            >
              <View style={[
                styles.navIconWrap,
                isActive && styles.navIconWrapActive,
              ]}>
                <Ionicons
                  name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
                  size={22}
                  color={isActive ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
              <Text style={[
                styles.navLabel,
                isActive && styles.navLabelActive,
              ]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const InfoSection = ({ label, value, icon, isAddress, onChangeText, keyboardType, onPress, addressDisplay, setHasChanges }) => (
  <View style={styles.infoSection}>
    <View style={styles.sectionHeader}>
      <View style={styles.labelRow}>
        {icon && <Feather name={icon} size={18} color={COLORS.primary} />}
        <Text style={styles.sectionLabel}>{label}</Text>
      </View>
    </View>

    {isAddress ? (
      <TouchableOpacity
        style={[styles.infoBox, styles.addressCard]}
        onPress={onPress}
      >
        {addressDisplay}
      </TouchableOpacity>
    ) : (
      <View style={styles.infoBox}>
        <TextInput
          style={styles.infoInput}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            if (setHasChanges) setHasChanges(true);
          }}
          placeholder={`Enter ${label}`}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
        />
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    ...FONTS.bold,
    color: COLORS.text,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.sm,
    marginBottom: SPACING.xl,
  },
  groupTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#111827',
    marginBottom: SPACING.lg,
  },
  infoSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#111827',
  },
  infoBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  infoInput: {
    fontSize: 16,
    ...FONTS.medium,
    color: COLORS.text,
    padding: 0,
  },
  addressCard: {
    borderColor: '#F3F4F6',
    backgroundColor: '#fff',
    ...SHADOWS.xs,
  },
  infoValue: {
    fontSize: 16,
    color: '#374151',
    ...FONTS.medium,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: SPACING.xl,
  },
  addressType: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#111827',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  supportSection: {
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.md,
  },
  supportHeader: {
    fontSize: 13,
    ...FONTS.bold,
    color: '#9CA3AF',
    marginBottom: SPACING.xl,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    gap: 10,
  },
  logoutBtnText: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#DC2626',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 35,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    ...SHADOWS.lg,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  navIconWrap: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  navIconWrapActive: {
    backgroundColor: COLORS.primary, // Green from bottom nav in screenshot
  },
  navLabel: {
    fontSize: 12,
    ...FONTS.medium,
    color: '#9CA3AF',
  },
  navLabelActive: {
    color: COLORS.primary,
    ...FONTS.bold,
  },
});
