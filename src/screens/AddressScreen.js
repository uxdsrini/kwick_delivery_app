import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, updateDoc, setDoc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';

const EMOJIS = {
  kale: '🥬', carrot: '🥕', apple: '🍎', tomato: '🍅', banana: '🍌',
  milk: '🥛', egg: '🥚', bread: '🍞', rice: '🍚', onion: '🧅', potato: '🥔'
};

const getEmoji = (name) => {
  const l = name.toLowerCase();
  for (const [k, e] of Object.entries(EMOJIS)) { if (l.includes(k)) return e; }
  return '🛒';
};
export default function AddressScreen({ navigation, route }) {
  const { items = [], fromProfile = false, existingAddress = null } = route.params || {};
  const [flat, setFlat] = useState(existingAddress?.flat || '');
  const [street, setStreet] = useState(existingAddress?.street || '');
  const [pincode, setPincode] = useState(existingAddress?.pincode || '');
  const [landmark, setLandmark] = useState(existingAddress?.landmark || '');
  const [mobile, setMobile] = useState(existingAddress?.mobile || '');
  const [name, setName] = useState(existingAddress?.name || '');
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
        let userData = {};
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          userData = userDoc.data();

          let hasGlobalMobile = false;
          if (userData.mobile) {
            setMobile(userData.mobile);
            hasGlobalMobile = true;
          }

          if (userData.name || userData.displayName) {
            setName(userData.name || userData.displayName);
          }
        }

        if (!existingAddress) {
          let foundAddress = null;

          if (userData.savedAddress) {
            foundAddress = userData.savedAddress;
          } else {
            // Fetch from the most recent order in the database
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where('userId', '==', auth.currentUser.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const fetchedOrders = querySnapshot.docs.map(d => d.data());
              const sortedOrders = fetchedOrders.sort((a, b) => {
                const aTime = a.createdAt?.seconds || a.createdAt || 0;
                const bTime = b.createdAt?.seconds || b.createdAt || 0;
                return bTime - aTime;
              });

              if (sortedOrders[0] && sortedOrders[0].address) {
                foundAddress = sortedOrders[0].address;
              }
            }
          }

          if (foundAddress) {
            if (foundAddress.name) setName(foundAddress.name);
            setFlat(foundAddress.flat || '');
            setStreet(foundAddress.street || '');
            setPincode(foundAddress.pincode || '');
            setLandmark(foundAddress.landmark || '');
            setAddressType(foundAddress.type || 'Home');
            if (foundAddress.mobile) {
              setMobile(foundAddress.mobile);
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
    setName(address.name || '');
    setFlat(address.flat || '');
    setStreet(address.street || '');
    setPincode(address.pincode || '');
    setLandmark(address.landmark || '');
    setMobile(address.mobile || '');
    setAddressType(address.type || 'Home');
  };

  const sendOrderToWhatsApp = (orderData, addressObj) => {
    const deliveryBoyNumber = "9347172123";
    const message = `🛒 *New Kwick Order*\n\n*Customer:* ${addressObj.name || 'Customer'}\n*Phone:* ${addressObj.mobile || 'N/A'}\n*Address:* ${addressObj.type}: ${addressObj.flat}, ${addressObj.street}, ${addressObj.pincode}\n\n*Items:*\n${items.map(item => `• ${item.name} - ${item.quantity} ${item.unit}`).join("\n")}\n\n_Sent via Kwick App_`;

    const whatsappUrl = `https://wa.me/${deliveryBoyNumber}?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Make sure WhatsApp is installed on your device');
    });
  };

  const handleNext = async () => {
    const address = {
      name: name || '',
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
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          savedAddress: address
        }, { merge: true });
        Alert.alert('Success', 'Address updated successfully!');
        navigation.goBack();
      } catch (error) {
        console.error("Error updating address:", error);
        Alert.alert('Error', 'Failed to update address.');
      } finally {
        setIsSaving(false);
      }
    } else {
      if (!items || items.length === 0) {
        Alert.alert('Error', 'Your cart is empty.');
        return;
      }

      setIsSaving(true);
      try {
        if (auth.currentUser) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            savedAddress: address
          }, { merge: true });
        }

        const orderId = `FR-${Math.floor(1000 + Math.random() * 9000)}`;
        const orderData = {
          id: orderId,
          userId: auth.currentUser?.uid || 'anonymous',
          items: items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit
          })),
          total: 0,
          status: 'In Transit',
          emoji: getEmoji(items[0]?.name || ''),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() + ', ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          createdAt: serverTimestamp(),
          address: address,
        };

        await addDoc(collection(db, 'orders'), orderData);
        sendOrderToWhatsApp(orderData, address);

        navigation.navigate('OrderSuccess', { items, address });
      } catch (error) {
        console.log('Error placing order:', error);
        Alert.alert('Error', 'Failed to place order.');
      } finally {
        setIsSaving(false);
      }
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
                  placeholder="505212"
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

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={commonStyles.label}>Full Name</Text>
              <TextInput
                style={[
                  commonStyles.input,
                  focusedField === 'name' && commonStyles.inputFocused,
                ]}
                placeholder="John Doe"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
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
              {fromProfile ? 'Save Changes' : 'Confirm On Whatsapp'}
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
