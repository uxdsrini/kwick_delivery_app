import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';

export default function EditItemScreen({ navigation, route }) {
  const { item } = route.params;
  
  const [itemName, setItemName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const units = ['1/2 kg', 'kg', 'pcs', 'liters', 'plate', 'packet', 'bottle'];

  const handleUpdate = () => {
    if (!itemName.trim() || unit === 'Select Units') return;
    
    const updatedItem = {
      ...item,
      name: itemName.trim(),
      quantity,
      unit,
    };
    
    // Use navigate with merge: true to ensure we return to the existing Home instance with params
    navigation.navigate({
      name: 'Home',
      params: { updatedItem },
      merge: true,
    });
  };

  return (
    <View style={commonStyles.screen}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Item</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.formCard}>
            <Text style={[styles.label, { fontSize: 18, marginBottom: 16 }]}>Edit Item</Text>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g. Organic Kale"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: SPACING.md }}>
                <Text style={styles.label}>Quantity</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity 
                    style={styles.qtyBtn} 
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Ionicons name="remove" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyInput}>{quantity}</Text>
                  <TouchableOpacity 
                    style={styles.qtyBtn} 
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Unit</Text>
                <TouchableOpacity 
                  style={styles.unitSelector}
                  onPress={() => setShowUnitPicker(!showUnitPicker)}
                >
                  <Text style={[styles.unitText, unit === 'Select Units' && { color: COLORS.textMuted }]}>{unit}</Text>
                  <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {showUnitPicker && (
              <View style={styles.unitPicker}>
                {units.map((u) => (
                  <TouchableOpacity 
                    key={u} 
                    style={[styles.unitOption, u === unit && styles.unitOptionActive]}
                    onPress={() => { setUnit(u); setShowUnitPicker(false); }}
                  >
                    <Text style={[styles.unitOptionText, u === unit && styles.unitOptionTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={[commonStyles.primaryButton, { marginTop: SPACING.xl, backgroundColor: COLORS.primary }]}
              onPress={handleUpdate}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={commonStyles.primaryButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20, ...FONTS.bold, color: COLORS.text,
  },
  backBtn: {
    position: 'absolute', left: SPACING.xl, top: 55,
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', ...SHADOWS.sm,
  },
  container: {
    padding: SPACING.lg,
  },
  formCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xxl,
    padding: SPACING.xl, ...SHADOWS.md,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  label: {
    fontSize: 16, ...FONTS.bold, color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg,
    padding: SPACING.md, fontSize: 16, color: COLORS.text,
    borderWidth: 1, borderColor: '#D1D5DB',
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  qtyLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F3F4F6', borderRadius: RADIUS.lg, 
    padding: 6, height: 52,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: '#E0E7FF', // Light blue/indigo
    alignItems: 'center', justifyContent: 'center',
  },
  qtyInput: {
    flex: 1, textAlign: 'center', fontSize: 18, ...FONTS.bold,
    color: COLORS.text,
  },
  unitSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, height: 52,
    borderWidth: 1, borderColor: '#D1D5DB',
  },
  unitText: {
    fontSize: 16, ...FONTS.semibold, color: COLORS.text,
  },
  unitPicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING.md,
    backgroundColor: '#F9FAFB', padding: SPACING.md, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  unitOption: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
  },
  unitOptionActive: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight,
  },
  unitOptionText: {
    fontSize: 14, color: COLORS.textSecondary,
  },
  unitOptionTextActive: {
    color: COLORS.primary, ...FONTS.bold,
  },
  cancelBtn: {
    marginTop: SPACING.xl, alignItems: 'center',
  },
  cancelBtnText: {
    color: '#EF4444', fontSize: 16, ...FONTS.bold,
  },
});
