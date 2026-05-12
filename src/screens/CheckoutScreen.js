import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const EMOJIS = {
  kale: '🥬', carrot: '🥕', apple: '🍎', tomato: '🍅', banana: '🍌',
  milk: '🥛', egg: '🥚', bread: '🍞', rice: '🍚', onion: '🧅', potato: '🥔'
};

const getEmoji = (name) => {
  const l = name.toLowerCase();
  for (const [k, e] of Object.entries(EMOJIS)) { if (l.includes(k)) return e; }
  return '🛒';
};

export default function CheckoutScreen({ navigation, route }) {
  const { items = [], address = {} } = route.params || {};
  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const { getDoc, doc } = require('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) setUserData(userDoc.data());
      }
    };
    fetchUser();
  }, []);

  const sendOrderToWhatsApp = (order) => {
    const deliveryBoyNumber = "9963092123";
    const { Linking } = require('react-native');

    const message = `🛒 *New Kwick Order*\n\n*Customer:* ${userData?.fullName || 'Customer'}\n*Phone:* ${address.mobile || 'N/A'}\n*Address:* ${address.flat}, ${address.street}, ${address.pincode}\n\n*Items:*\n${order.items.map(item => `• ${item.name} - ${item.quantity} ${item.unit}`).join("\n")}\n\n*Payment:* Cash on Delivery\n\n_Sent via Kwick App_`;

    const whatsappUrl = `https://wa.me/${deliveryBoyNumber}?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Make sure WhatsApp is installed on your device');
    });
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setLoading(true);
    try {
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

      // Call WhatsApp redirection
      sendOrderToWhatsApp(orderData);

      navigation.navigate('OrderSuccess', { items, address });
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const addr = {
    type: address.type || 'Home',
    line1: address.flat || '42 Fresh Garden Street',
    line2: `${address.street || 'Urban Orchards'}, ${address.pincode || '560001'}`,
    mobile: address.mobile || '9876543210',
  };

  return (
    <View style={commonStyles.screen}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Address */}
        <View style={s.secRow}>
          <View style={s.secIcon}><Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={s.secLabel}>Delivery Address</Text></View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.changeBtn}>Change</Text></TouchableOpacity>
        </View>
        <View style={s.card}>
          <Text style={s.addrType}>{addr.type}</Text>
          <Text style={s.addrLine}>{addr.line1}</Text>
          <Text style={s.addrLine}>{addr.line2}</Text>
        </View>

        {/* Contact */}
        <View style={s.secRow}>
          <View style={s.secIcon}><Ionicons name="call" size={18} color={COLORS.primary} />
            <Text style={s.secLabel}>Contact Number</Text></View>
          <TouchableOpacity><Text style={s.changeBtn}>Edit</Text></TouchableOpacity>
        </View>
        <View style={s.card}>
          <Text style={s.phone}>+91 {addr.mobile}</Text>
        </View>

        {/* Order Summary */}
        <View style={s.secRow}>
          <View style={s.secIcon}><MaterialCommunityIcons name="basket" size={20} color={COLORS.primary} />
            <Text style={s.secLabel}>Order Summary</Text></View>
        </View>
        <View style={s.orderCard}>
          <View style={s.tblHeader}>
            <Text style={s.tblH}>ITEM</Text><Text style={s.tblH}>QTY</Text>
          </View>
          {items.map((item, i) => (
            <View key={item.id || i} style={[s.orderRow, i < items.length - 1 && s.orderRowBorder]}>
              <View style={s.orderLeft}>
                <View style={s.emojiWrap}><Text style={{ fontSize: 20 }}>{getEmoji(item.name)}</Text></View>
                <Text style={s.itemName}>{item.name}</Text>
              </View>
              <Text style={s.itemQty}>{item.quantity} {item.unit}</Text>
            </View>
          ))}
          {items.length === 0 && <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: COLORS.textMuted }}>No items added</Text></View>}
        </View>

        {/* Free Delivery */}
        <View style={s.banner}>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>Free Delivery</Text>
            <Text style={s.bannerSub}>Free Delivery at your doorstep.</Text>
          </View>
          <View style={s.bannerIcon}>
            <MaterialCommunityIcons name="truck-delivery" size={28} color={COLORS.accent} />
          </View>
        </View>
      </ScrollView>

      <View style={s.bottom}>
        <TouchableOpacity
          style={[commonStyles.primaryButton, loading && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={commonStyles.primaryButtonText}>Confirm On Whatsapp</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingTop: 50, paddingBottom: SPACING.md
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.size.xl, ...FONTS.bold, color: COLORS.primary },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 120 },
  secRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.md, marginTop: SPACING.xl
  },
  secIcon: { flexDirection: 'row', alignItems: 'center' },
  secLabel: { fontSize: FONTS.size.lg, ...FONTS.bold, color: COLORS.text, marginLeft: SPACING.sm },
  changeBtn: { fontSize: FONTS.size.sm, color: COLORS.primary, ...FONTS.semibold },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOWS.sm },
  addrType: { fontSize: FONTS.size.md, ...FONTS.semibold, color: COLORS.text, marginBottom: 4 },
  addrLine: { fontSize: FONTS.size.sm, color: COLORS.textSecondary, ...FONTS.regular, lineHeight: 20 },
  phone: { fontSize: FONTS.size.md, color: COLORS.text, ...FONTS.medium },
  orderCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.sm },
  tblHeader: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.surfaceElevated
  },
  tblH: { fontSize: FONTS.size.xs, ...FONTS.semibold, color: COLORS.textMuted, letterSpacing: 1 },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: 14
  },
  orderRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  orderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emojiWrap: {
    width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md
  },
  itemName: { fontSize: FONTS.size.md, ...FONTS.medium, color: COLORS.text },
  itemQty: { fontSize: FONTS.size.sm, ...FONTS.medium, color: COLORS.textSecondary },
  banner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accentLight,
    borderRadius: RADIUS.xl, padding: SPACING.xl, marginTop: SPACING.xxl
  },
  bannerTitle: { fontSize: FONTS.size.lg, ...FONTS.bold, color: COLORS.text, marginBottom: 4 },
  bannerSub: { fontSize: FONTS.size.sm, color: COLORS.textSecondary, ...FONTS.regular },
  bannerIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,140,0,0.12)',
    alignItems: 'center', justifyContent: 'center'
  },
  bottom: {
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl, paddingTop: SPACING.lg,
    backgroundColor: COLORS.background
  },
});
