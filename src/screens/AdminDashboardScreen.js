import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Platform, SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, commonStyles } from '../theme';

export default function AdminDashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for all orders
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() });
      });
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderOrderItem = ({ item }) => {
    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText}>{item.id || 'ORDER'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Delivered' ? COLORS.primaryLight : COLORS.warningLight }]}>
            <Text style={[styles.statusText, { color: item.status === 'Delivered' ? COLORS.primary : COLORS.warning }]}>
              {item.status || 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.textMuted} style={styles.infoIcon} />
          <Text style={styles.infoText}>{item.address?.name || 'Customer'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color={COLORS.textMuted} style={styles.infoIcon} />
          <Text style={styles.infoText}>{item.address?.mobile || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.textMuted} style={styles.infoIcon} />
          <Text style={styles.infoText} numberOfLines={2}>
            {item.address ? `${item.address.flat}, ${item.address.street}, ${item.address.pincode}` : 'No address'}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.itemsHeader}>Items:</Text>
        {item.items && item.items.map((i, index) => (
          <Text key={index} style={styles.itemRow}>
            • {i.name} - {i.quantity} {i.unit}
          </Text>
        ))}

        <View style={styles.footer}>
          <Text style={styles.dateText}>{item.date || 'Unknown Date'}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Real-time Orders Feed</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color={COLORS.error || '#E11D48'} />
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching live orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="receipt-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No orders found.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    backgroundColor: '#fff',
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    ...FONTS.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONTS.size.sm,
    ...FONTS.medium,
    color: COLORS.primary,
    marginTop: 2,
  },
  logoutBtn: {
    padding: SPACING.sm,
    backgroundColor: '#FFF1F2',
    borderRadius: RADIUS.full,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.size.md,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: FONTS.size.lg,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  orderIdText: {
    fontSize: FONTS.size.sm,
    ...FONTS.bold,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: FONTS.size.sm,
    ...FONTS.bold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  infoIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.size.md,
    ...FONTS.medium,
    color: COLORS.text,
  },
  itemsHeader: {
    fontSize: FONTS.size.sm,
    ...FONTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  itemRow: {
    fontSize: FONTS.size.md,
    ...FONTS.regular,
    color: COLORS.text,
    marginBottom: 2,
  },
  footer: {
    marginTop: SPACING.md,
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: FONTS.size.xs,
    ...FONTS.medium,
    color: COLORS.textMuted,
  },
});
