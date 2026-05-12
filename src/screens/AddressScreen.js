import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';

export default function AddressScreen({ navigation, route }) {
  const { items = [], fromProfile = false, existingAddress = null } = route.params || {};
  const [flat, setFlat] = useState(existingAddress?.flat || '');
  const [street, setStreet] = useState(existingAddress?.street || '');
  const [pincode, setPincode] = useState(existingAddress?.pincode || '');
  const [landmark, setLandmark] = useState(existingAddress?.landmark || '');
  const [mobile, setMobile] = useState(existingAddress?.mobile || '');
  const [addressType, setAddressType] = useState(existingAddress?.type || 'Home');
  const [focusedField, setFocusedField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const addressTypes = [
    { key: 'Home', icon: 'home-outline' },
    { key: 'Work', icon: 'briefcase-outline' },
    { key: 'Other', icon: 'location-outline' },
  ];

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // 1. ALWAYS prioritize the global mobile number from the user document (signup info)
          if (userData.mobile) {
            setMobile(userData.mobile);
          }
          
          // 2. If we don't have an existingAddress from params, check savedAddress or last order
          if (!existingAddress) {
            if (userData.savedAddress) {
              const saved = userData.savedAddress;
              setFlat(saved.flat || '');
              setStreet(saved.street || '');
              setPincode(saved.pincode || '');
              setLandmark(saved.landmark || '');
              // We already set the primary mobile above, so we only overwrite 
              // if the saved address specifically has one and we want that (usually we don't want the placeholder)
              // But for consistency with previous address, we can check if it's different.
              // However, user explicitly asked for the signup info mobile.
              setAddressType(saved.type || 'Home');
              return;
            }

            // Fallback: Last order
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where('userId', '==', auth.currentUser.uid));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const fetchedOrders = querySnapshot.docs.map(doc => doc.data());
              const sortedOrders = fetchedOrders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
              if (sortedOrders[0].address) {
                const lastAddr = sortedOrders[0].address;
                setFlat(lastAddr.flat || '');
                setStreet(lastAddr.street || '');
                setPincode(lastAddr.pincode || '');
                setLandmark(lastAddr.landmark || '');
                if (lastAddr.mobile) setMobile(lastAddr.mobile);
                setAddressType(lastAddr.type || 'Home');
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching address info:", error);
      }
    };

    fetchProfileData();
  }, [existingAddress]);

  const setAddressData = (address) => {
    setFlat(address.flat || '');
    setStreet(address.street || '');
    setPincode(address.pincode || '');
    setLandmark(address.landmark || '');
    setMobile(address.mobile || '');
    setAddressType(address.type || 'Home');
  };

  const handleNext = async () => {
    const address = {
      flat: flat || '',
      street: street || '',
      pincode: pincode || '',
      landmark: landmark || '',
      type: addressType || 'Home',
      mobile: mobile || '',
    };

    if (fromProfile) {
      if (!auth.currentUser) return;
      setIsSaving(true);
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          savedAddress: address
        });
        Alert.alert('Success', 'Address updated successfully!');
        navigation.goBack();
      } catch (error) {
        console.error("Error updating address:", error);
        Alert.alert('Error', 'Failed to update address.');
      } finally {
        setIsSaving(false);
      }
    } else {
      navigation.navigate('Checkout', { items, address });
    }
  };

  return (
    <View style={commonStyles.screen}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{fromProfile ? 'Edit Address' : 'Checkout'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <View style={styles.fieldGroup}>
              <Text style={commonStyles.label}>Flat / House No. / Building</Text>
              <TextInput
                style={[
                  commonStyles.input,
                  focusedField === 'flat' && commonStyles.inputFocused,
                ]}
                placeholder="Apt 4B, Willow Towers"
                placeholderTextColor={COLORS.textMuted}
                value={flat}
                onChangeText={setFlat}
                onFocus={() => setFocusedField('flat')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={commonStyles.label}>Street Name & Locality</Text>
              <TextInput
                style={[
                  commonStyles.input,
                  focusedField === 'street' && commonStyles.inputFocused,
                ]}
                placeholder="124 Orchard Street, Lower East Side"
                placeholderTextColor={COLORS.textMuted}
                value={street}
                onChangeText={setStreet}
                onFocus={() => setFocusedField('street')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.twoCol}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: SPACING.md }]}>
                <Text style={commonStyles.label}>Pincode</Text>
                <TextInput
                  style={[
                    commonStyles.input,
                    focusedField === 'pincode' && commonStyles.inputFocused,
                  ]}
                  placeholder="10002"
                  placeholderTextColor={COLORS.textMuted}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  onFocus={() => setFocusedField('pincode')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={commonStyles.label}>Landmark (Optional)</Text>
                <TextInput
                  style={[
                    commonStyles.input,
                    focusedField === 'landmark' && commonStyles.inputFocused,
                  ]}
                  placeholder="Next to Park"
                  placeholderTextColor={COLORS.textMuted}
                  value={landmark}
                  onChangeText={setLandmark}
                  onFocus={() => setFocusedField('landmark')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Address Type */}
            <View style={styles.fieldGroup}>
              <Text style={commonStyles.label}>Save Address As</Text>
              <View style={styles.addressTypeRow}>
                {addressTypes.map(type => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.addressChip,
                      addressType === type.key && styles.addressChipActive,
                    ]}
                    onPress={() => setAddressType(type.key)}
                  >
                    <Ionicons
                      name={type.icon}
                      size={16}
                      color={addressType === type.key ? '#fff' : COLORS.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[
                      styles.addressChipText,
                      addressType === type.key && styles.addressChipTextActive,
                    ]}>{type.key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Mobile */}
            <View style={styles.fieldGroup}>
              <Text style={commonStyles.label}>Mobile Number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={[
                    commonStyles.input,
                    { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },
                    focusedField === 'mobile' && commonStyles.inputFocused,
                  ]}
                  placeholder="9876543210"
                  placeholderTextColor={COLORS.textMuted}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedField('mobile')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Next Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[commonStyles.primaryButton, isSaving && { opacity: 0.7 }]}
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={commonStyles.primaryButtonText}>
              {fromProfile ? 'Save Changes' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: 50,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    ...FONTS.bold,
    color: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONTS.size.xl,
    ...FONTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  formSection: {},
  fieldGroup: {
    marginBottom: SPACING.xl,
  },
  twoCol: {
    flexDirection: 'row',
  },
  addressTypeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  addressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  addressChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  addressChipText: {
    fontSize: FONTS.size.sm,
    ...FONTS.semibold,
    color: COLORS.textSecondary,
  },
  addressChipTextActive: {
    color: '#fff',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    height: 52,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: FONTS.size.md,
    ...FONTS.semibold,
    color: COLORS.text,
  },
  bottomAction: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    paddingTop: SPACING.lg,
    backgroundColor: COLORS.background,
  },
});
