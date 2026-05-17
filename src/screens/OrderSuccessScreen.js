import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';

export default function OrderSuccessScreen({ navigation }) {
  return (
    <View style={commonStyles.screen}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={s.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
        </View>

        <Text style={s.title}>Order Placed{'\n'}Successfully!</Text>
        <Text style={s.subtitle}>
          Your fresh groceries are on their way to your doorstep.
        </Text>

        {/* Delivery Info Card */}
        <View style={s.deliveryCard}>
          <Text style={s.deliveryTitle}>Delivery Person Will Call you</Text>
          <Text style={s.deliveryDesc}>
            Delivery boy check the payment and confirm payment then your order will be deliver to your door step.
          </Text>
        </View>

        {/* Order Info Card */}
        <View style={s.orderInfoCard}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>ORDER ID</Text>
            <Text style={s.infoValue}>#FR-5421</Text>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoRow}>
            <View style={s.infoLeft}>
              <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
              <Text style={[s.infoLabel, { marginLeft: 6 }]}>Estimated Delivery</Text>
            </View>
            <Text style={[s.infoValue, { color: COLORS.accent }]}>25-30 mins</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <TouchableOpacity style={s.callBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="truck-delivery" size={22} color="#fff" />
          <Text style={s.callBtnText}>Call to Delivery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.homeBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          activeOpacity={0.85}
        >
          <Text style={s.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>

        {/* Eco Badge */}
        <View style={s.ecoBadge}>
          <View style={s.ecoIcon}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.eco} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.ecoTitle}>Carbon Neutral Delivery</Text>
            <Text style={s.ecoDesc}>This order saved 1.2kg of CO2 emissions.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.xl, paddingTop: 50, paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONTS.size.lg, ...FONTS.semibold, color: COLORS.primary,
  },
  scroll: {
    paddingHorizontal: SPACING.xl, paddingBottom: 60, alignItems: 'center',
  },
  successIcon: {
    marginTop: SPACING.xl, marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.size.xxxl, ...FONTS.extrabold, color: COLORS.text,
    textAlign: 'center', letterSpacing: -0.5, lineHeight: 40, marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONTS.size.md, ...FONTS.regular, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xxl,
  },
  deliveryCard: {
    backgroundColor: '#FCE4D6', borderRadius: RADIUS.xl,
    padding: SPACING.xl, width: '100%', marginBottom: SPACING.xl,
  },
  deliveryTitle: {
    fontSize: FONTS.size.lg, ...FONTS.bold, color: '#3E2723', marginBottom: SPACING.sm,
  },
  deliveryDesc: {
    fontSize: FONTS.size.sm, ...FONTS.regular, color: '#5D4037', lineHeight: 20,
  },
  orderInfoCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.xl, width: '100%', marginBottom: SPACING.xxl, ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  infoLeft: {
    flexDirection: 'row', alignItems: 'center',
  },
  infoLabel: {
    fontSize: FONTS.size.sm, ...FONTS.medium, color: COLORS.textSecondary, letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: FONTS.size.lg, ...FONTS.bold, color: COLORS.text,
  },
  infoDivider: {
    height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.lg,
  },
  callBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: 56,
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md, ...SHADOWS.md,
  },
  callBtnText: {
    color: '#fff', fontSize: FONTS.size.lg, ...FONTS.semibold, marginLeft: SPACING.sm,
  },
  homeBtn: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, height: 52,
    width: '100%', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, marginBottom: SPACING.xxl,
  },
  homeBtnText: {
    fontSize: FONTS.size.lg, ...FONTS.semibold, color: COLORS.text,
  },
  ecoBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.ecoLight,
    borderRadius: RADIUS.lg, padding: SPACING.lg, width: '100%',
  },
  ecoIcon: {
    marginRight: SPACING.md,
  },
  ecoTitle: {
    fontSize: FONTS.size.sm, ...FONTS.semibold, color: COLORS.eco, marginBottom: 2,
  },
  ecoDesc: {
    fontSize: FONTS.size.xs, ...FONTS.regular, color: COLORS.textSecondary,
  },
});
