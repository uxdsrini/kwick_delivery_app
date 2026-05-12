import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';

const getStatusColor = (status) => {
  switch (status) {
    case 'In Transit': return COLORS.accent;
    case 'Delivered': return COLORS.primary;
    case 'Cancelled': return COLORS.error;
    default: return COLORS.textSecondary;
  }
};

const getStatusBg = (status) => {
  switch (status) {
    case 'In Transit': return COLORS.accentLight;
    case 'Delivered': return COLORS.primaryLight;
    case 'Cancelled': return COLORS.errorLight;
    default: return COLORS.surfaceElevated;
  }
};

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      // Import directly to avoid issues if firebase isn't initialized yet
      const { db, auth } = require('../firebase');
      const { collection, getDocs, orderBy, query, where } = require('firebase/firestore');
      
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'orders'), 
        where('userId', '==', userId)
      );
      
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));

      // Sort locally by createdAt to avoid needing a Firestore composite index
      const sorted = fetched.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setOrders(sorted);
    } catch (e) {
      console.error("Firestore Fetch Error Details:", e);
      // Log more specifically if it's an index error
      if (e.message?.includes('index')) {
        console.warn("Firestore needs an index. Sorting locally instead...");
      }
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  const getItemSummary = (items) => {
    if (!items || items.length === 0) return 'No items';
    // Handle both string items and object items
    const firstItem = items[0];
    const name = typeof firstItem === 'object' ? firstItem.name : firstItem;
    
    const shown = name;
    const more = items.length - 1;
    return more > 0 ? `${shown} + ${more} more` : shown;
  };

  const getQtySummary = (items) => {
    if (!items || items.length === 0) return '';
    const firstItem = items[0];
    if (typeof firstItem === 'object') {
      return `${firstItem.quantity} ${firstItem.unit}`;
    }
    return '1 kg'; // Fallback for old orders so the UI isn't empty
  };

  const renderOrder = (order) => (
    <View key={order.id} style={s.orderCard}>
      {/* Header */}
      <View style={s.cardHeader}>
        <View>
          <Text style={s.orderDate}>{order.date}</Text>
          <Text style={s.orderId}>Order #{order.id}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
          <Text style={[s.statusText, { color: getStatusColor(order.status) }]}>
            {order.status}
          </Text>
        </View>
      </View>

      {/* Items */}
      <View style={s.itemRow}>
        <View style={s.emojiWrap}>
          <Text style={{ fontSize: 24 }}>{order.emoji || '🛒'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.itemSummary}>{getItemSummary(order.items)}</Text>
          <Text style={s.totalText}>{getQtySummary(order.items)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={s.actionRow}>
        <TouchableOpacity 
          style={s.reorderBtn}
          onPress={() => {
            const reorderItems = order.items.map((item, index) => {
              const isObj = typeof item === 'object';
              return {
                id: `reorder-${order.id}-${index}-${Date.now()}`,
                name: isObj ? item.name : item,
                quantity: isObj ? item.quantity : 1,
                unit: isObj ? item.unit : 'kg',
              };
            });
            navigation.navigate('Home', { reorderItems });
          }}
        >
          <Text style={s.reorderBtnText}>Reorder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={commonStyles.screen}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={s.emptyWrap}>
          <MaterialCommunityIcons name="package-variant" size={64} color={COLORS.textMuted} />
          <Text style={s.emptyTitle}>No orders yet</Text>
          <Text style={s.emptySub}>Your order history will appear here</Text>
          <TouchableOpacity
            style={[commonStyles.primaryButton, { marginTop: 24, paddingHorizontal: 32 }]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={commonStyles.primaryButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          {orders.map(renderOrder)}
        </ScrollView>
      )}

      {/* Bottom Nav */}
      <View style={s.bottomNav}>
        {[
          { key: 'Home', icon: 'home-outline', label: 'Home' },
          { key: 'Orders', icon: 'bag-handle-outline', label: 'Orders' },
          { key: 'Profile', icon: 'person-outline', label: 'Profile' },
        ].map(tab => {
          const isActive = tab.key === 'Orders';
          return (
            <TouchableOpacity
              key={tab.key}
              style={s.navItem}
              onPress={() => {
                if (tab.key === 'Home') navigation.navigate('Home');
                if (tab.key === 'Profile') navigation.navigate('Profile');
              }}
            >
              <View style={[
                s.navIconWrap,
                isActive && s.navIconWrapActive,
              ]}>
                <Ionicons
                  name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
                  size={22}
                  color={isActive ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
              <Text style={[
                s.navLabel,
                isActive && s.navLabelActive,
              ]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingTop: 50, paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.size.xl, ...FONTS.bold, color: COLORS.text,
  },
  scroll: {
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md, fontSize: FONTS.size.md, color: COLORS.textSecondary,
  },
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONTS.size.xl, ...FONTS.bold, color: COLORS.text, marginTop: SPACING.lg,
  },
  emptySub: {
    fontSize: FONTS.size.md, color: COLORS.textMuted, marginTop: SPACING.sm,
  },
  orderCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  orderDate: {
    fontSize: FONTS.size.xs, ...FONTS.semibold, color: COLORS.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2,
  },
  orderId: {
    fontSize: FONTS.size.lg, ...FONTS.bold, color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: FONTS.size.xs, ...FONTS.bold,
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg,
  },
  emojiWrap: {
    width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  itemSummary: {
    fontSize: FONTS.size.md, ...FONTS.medium, color: COLORS.text, marginBottom: 2,
  },
  totalText: {
    fontSize: FONTS.size.md, ...FONTS.bold, color: COLORS.accent,
  },
  actionRow: {
    flexDirection: 'row', gap: SPACING.md,
  },
  outlineBtn: {
    flex: 1, height: 42, borderRadius: RADIUS.lg, borderWidth: 1.5,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  outlineBtnText: {
    fontSize: FONTS.size.sm, ...FONTS.semibold, color: COLORS.text,
  },
  greenOutlineBtn: {
    flex: 1, height: 42, borderRadius: RADIUS.lg, borderWidth: 1.5,
    borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  greenOutlineBtnText: {
    fontSize: FONTS.size.sm, ...FONTS.semibold, color: COLORS.primary,
  },
  reorderBtn: {
    flex: 1, height: 42, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  reorderBtnText: {
    fontSize: FONTS.size.sm, ...FONTS.bold, color: '#fff',
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
    backgroundColor: COLORS.primary,
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
