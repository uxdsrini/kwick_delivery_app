import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function HomeScreen({ navigation, route }) {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Select Units');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('Home');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
    });
    return unsubscribe;
  }, []);

  // Handle Reorder from History OR Edit from EditItemScreen
  useEffect(() => {
    // Check for reorder
    if (route.params?.reorderItems && route.params.reorderItems.length > 0) {
      const newItems = route.params.reorderItems;
      setItems(prev => [...newItems, ...prev]);

      const first = newItems[0];
      setItemName(first.name);
      setQuantity(first.quantity);
      setUnit(first.unit);

      navigation.setParams({ reorderItems: undefined });
    }

    // Check for updated item from EditItemScreen
    if (route.params?.updatedItem) {
      const updated = route.params.updatedItem;
      setItems(prev => {
        // If list is empty but we have an updated item, it means state was lost
        // We should at least restore this item
        if (prev.length === 0) {
          return [updated];
        }

        const exists = prev.find(it => it.id === updated.id);
        if (exists) {
          return prev.map(it => it.id === updated.id ? updated : it);
        } else {
          return [updated, ...prev];
        }
      });
      navigation.setParams({ updatedItem: undefined });
    }
  }, [route.params?.reorderItems, route.params?.updatedItem]);

  const units = ['1/2 kg', 'kg', 'pcs', 'liters', 'plate', 'packet', 'bottle'];

  const addItem = () => {
    if (!itemName.trim() || unit === 'Select Units') return;
    const newItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      quantity,
      unit,
    };
    setItems([newItem, ...items]);
    setItemName('');
    setQuantity(1);
    setUnit('Select Units');
  };

  const editItem = (item) => {
    navigation.navigate('EditItem', { item });
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setItemName('');
      setQuantity(1);
    }
  };

  const handleContinue = () => {
    if (items.length === 0) return;
    navigation.navigate('Address', { items });
  };

  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemIcon}>
        <MaterialCommunityIcons name="shopping-outline" size={24} color={COLORS.primary} />
      </View>
      <View style={styles.listItemInfo}>
        <Text style={styles.listItemName}>{item.name}</Text>
        <Text style={styles.listItemQty}>{item.quantity} {item.unit}</Text>
      </View>
      <View style={styles.listItemActions}>
        <TouchableOpacity
          onPress={() => editItem(item)}
          style={styles.actionBtn}
        >
          <Feather name="edit-2" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => removeItem(item.id)}
          style={styles.actionBtn}
        >
          <Feather name="trash-2" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name="basket-outline" size={48} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Your list is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add items above to get started with{'\n'}your shopping list.
      </Text>
    </View>
  );

  return (
    <View style={commonStyles.screen}>
      <StatusBar style="dark" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoIcon}>
            <Ionicons name="leaf" size={18} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.logoText}>Kwick</Text>
            {userData?.fullName && (
              <Text style={styles.userWelcome}>Hi, {userData.fullName.split(' ')[0]}</Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Item Card */}
        <View style={styles.addCard}>
          <Text style={styles.addCardTitle}>Add Item</Text>

          <TextInput
            style={[commonStyles.input, { marginBottom: SPACING.lg }]}
            placeholder="Enter item name (e.g. Organic Kale)"
            placeholderTextColor={COLORS.textMuted}
            value={itemName}
            onChangeText={setItemName}
          />

          <View style={styles.controlsRow}>
            {/* Quantity */}
            <View style={styles.quantitySection}>
              <Text style={commonStyles.label}>Quantity</Text>
              <View style={styles.quantityStepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons name="remove" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, styles.stepperBtnPlus]}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Ionicons name="add" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Unit */}
            <View style={styles.unitSection}>
              <Text style={commonStyles.label}>Unit</Text>
              <TouchableOpacity
                style={styles.unitDropdown}
                onPress={() => setShowUnitPicker(!showUnitPicker)}
              >
                <Text style={[styles.unitText, unit === 'Select Units' && { color: COLORS.textMuted }]}>{unit}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Unit Picker Dropdown */}
          {showUnitPicker && (
            <View style={styles.unitPickerOverlay}>
              {units.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitOption, u === unit && styles.unitOptionActive]}
                  onPress={() => { setUnit(u); setShowUnitPicker(false); }}
                >
                  <Text style={[
                    styles.unitOptionText,
                    u === unit && styles.unitOptionTextActive,
                  ]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[commonStyles.primaryButton, { marginTop: SPACING.lg }]}
            onPress={addItem}
          >
            <MaterialCommunityIcons name="cart-plus" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={commonStyles.primaryButtonText}>Add to List</Text>
          </TouchableOpacity>
        </View>

        {/* Current List */}
        <View style={styles.listHeader}>
          <Text style={commonStyles.sectionTitle}>Current List</Text>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountText}>{items.length} Items</Text>
          </View>
        </View>

        {items.length === 0 ? renderEmptyState() : (
          <View style={styles.listContainer}>
            {items.map(item => (
              <View key={item.id}>
                {renderItem({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.continueWrap}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            items.length === 0 && styles.continueBtnDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={items.length === 0}
        >
          <Text style={[
            styles.continueBtnText,
            items.length === 0 && styles.continueBtnTextDisabled,
          ]}>Continue</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={items.length === 0 ? COLORS.textMuted : '#fff'}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {[
          { key: 'Home', icon: 'home-outline', label: 'Home' },
          { key: 'Orders', icon: 'bag-handle-outline', label: 'Orders' },
          { key: 'Profile', icon: 'person-outline', label: 'Profile' },
        ].map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => {
                if (tab.key === 'Orders') {
                  navigation.navigate('OrderHistory');
                } else if (tab.key === 'Profile') {
                  navigation.navigate('Profile');
                } else {
                  setActiveTab(tab.key);
                }
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
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  logoText: {
    fontSize: FONTS.size.lg,
    ...FONTS.bold,
    color: COLORS.primary,
  },
  userWelcome: {
    fontSize: FONTS.size.xs,
    ...FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: -2,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 180,
  },
  addCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.sm,
    marginBottom: SPACING.xxl,
  },
  addCardTitle: {
    fontSize: FONTS.size.lg,
    ...FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  quantitySection: {
    flex: 1,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    height: 48,
    paddingHorizontal: SPACING.xs,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnPlus: {},
  quantityText: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.size.lg,
    ...FONTS.semibold,
    color: COLORS.text,
  },
  unitSection: {
    flex: 1,
  },
  unitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    height: 48,
    paddingHorizontal: SPACING.lg,
  },
  unitText: {
    fontSize: FONTS.size.md,
    color: COLORS.text,
    ...FONTS.medium,
  },
  unitPickerOverlay: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
    ...SHADOWS.md,
    overflow: 'hidden',
  },
  unitOption: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  unitOptionActive: {
    backgroundColor: COLORS.primaryLight,
  },
  unitOptionText: {
    fontSize: FONTS.size.md,
    color: COLORS.text,
    ...FONTS.regular,
  },
  unitOptionTextActive: {
    color: COLORS.primary,
    ...FONTS.semibold,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  itemCountBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  itemCountText: {
    fontSize: FONTS.size.sm,
    color: COLORS.primary,
    ...FONTS.semibold,
  },
  listContainer: {
    gap: SPACING.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
    marginBottom: SPACING.sm,
  },
  listItemIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  listItemInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  listItemName: {
    fontSize: FONTS.size.md,
    ...FONTS.semibold,
    color: COLORS.text,
  },
  listItemQty: {
    fontSize: FONTS.size.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
  },
  removeBtn: {
    padding: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.section,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONTS.size.lg,
    ...FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONTS.size.md,
    ...FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  continueWrap: {
    position: 'absolute',
    bottom: 110,
    left: SPACING.xl,
    right: SPACING.xl,
  },
  continueBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.md,
  },
  continueBtnDisabled: {
    backgroundColor: COLORS.borderLight,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: FONTS.size.lg,
    ...FONTS.semibold,
  },
  continueBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    ...SHADOWS.lg,
  },
  navItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  navIconWrap: {
    width: 60,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  navIconWrapActive: {
    backgroundColor: COLORS.primary,
  },
  navLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    ...FONTS.medium,
  },
  navLabelActive: {
    color: COLORS.primary,
    ...FONTS.bold,
  },
});
