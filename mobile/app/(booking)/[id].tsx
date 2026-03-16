import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { bookingApi, type Booking } from '../../lib/marketplace';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';

export default function BookingDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchBooking = async () => {
        try {
            if (!id) return;
            const response = await bookingApi.getBooking(id);
            setBooking(response.data.booking);
        } catch (error) {
            console.error('Failed to fetch booking:', error);
            Alert.alert('Error', 'Could not load booking details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooking();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Booking not found</Text>
            </View>
        );
    }

    const isCompleted = booking.status === 'COMPLETED';
    const showReviewBtn = isCompleted && !booking.completedAt; // Wait, check if review exists. 
    // In schema, booking has review? Let's check Booking type in marketplace.ts again.
    // Booking interface in marketplace.ts doesn't have review field yet.

    const statusColor = getStatusColor(booking.status);

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: `Booking #${booking.bookingNumber}`,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: 'white' },
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Status Header */}
                <View style={[styles.statusBanner, { backgroundColor: statusColor + '10' }]}>
                    <Ionicons name={getStatusIcon(booking.status)} size={24} color={statusColor} />
                    <View style={styles.statusInfo}>
                        <Text style={[styles.statusLabel, { color: statusColor }]}>
                            {booking.status.replace('_', ' ')}
                        </Text>
                        <Text style={styles.dateText}>
                            {format(new Date(booking.scheduledAt), 'PPP p')}
                        </Text>
                    </View>
                </View>

                {/* Service Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Services</Text>
                    {booking.items.map((item, index) => (
                        <View key={item.id || index} style={styles.serviceItem}>
                            <View style={styles.serviceIconContainer}>
                                <Ionicons name="construct-outline" size={20} color={Colors.textMedium} />
                            </View>
                            <View style={styles.serviceInfo}>
                                <Text style={styles.serviceName}>{item.service?.name || 'Service'}</Text>
                                <Text style={styles.serviceQty}>Qty: {item.quantity}</Text>
                            </View>
                            <Text style={styles.servicePrice}>₹{item.price * item.quantity}</Text>
                        </View>
                    ))}
                </View>

                {/* Address */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Service Location</Text>
                    <View style={styles.infoCard}>
                        <Ionicons name="location-outline" size={20} color={Colors.primary} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>{booking.address?.label || 'Address'}</Text>
                            <Text style={styles.infoSubtitle}>
                                {booking.address?.line1}, {booking.address?.line2 ? booking.address.line2 + ', ' : ''}
                                {booking.address?.city}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Price Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Price Summary</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Subtotal</Text>
                        <Text style={styles.priceValue}>₹{booking.subtotal}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Tax (18%)</Text>
                        <Text style={styles.priceValue}>₹{booking.tax}</Text>
                    </View>
                    <View style={[styles.priceRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>₹{booking.total}</Text>
                    </View>
                </View>

                {/* Notes */}
                {booking.notes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Notes</Text>
                        <View style={styles.notesContainer}>
                            <Text style={styles.notesText}>{booking.notes}</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.bottomActions}>
                {isCompleted ? (
                    <Button
                        title="Rate Service"
                        onPress={() => router.push(`/(customer)/reviews/add/${booking.id}` as any)}
                        style={styles.actionBtn}
                        icon={<Ionicons name="star" size={20} color="white" />}
                    />
                ) : (
                    <Button
                        title="Support"
                        variant="outline"
                        onPress={() => Alert.alert('Support', 'Connecting you to help center...')}
                        style={styles.actionBtn}
                    />
                )}
            </View>
        </View>
    );
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'PENDING': return Colors.secondary;
        case 'ACCEPTED': return '#2563EB';
        case 'IN_PROGRESS': return Colors.primary;
        case 'COMPLETED': return Colors.success;
        case 'CANCELLED': return Colors.error;
        default: return Colors.textMedium;
    }
};

const getStatusIcon = (status: string): any => {
    switch (status) {
        case 'COMPLETED': return 'checkmark-circle';
        case 'CANCELLED': return 'close-circle';
        case 'IN_PROGRESS': return 'play-circle';
        default: return 'time';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: FontSize.md,
        color: Colors.error,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.xl,
    },
    statusInfo: {
        marginLeft: Spacing.md,
    },
    statusLabel: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    dateText: {
        fontSize: FontSize.sm,
        color: Colors.textMedium,
        marginTop: 2,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.textDark,
        marginBottom: Spacing.md,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    serviceIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: FontSize.md,
        fontWeight: '500',
        color: Colors.textDark,
    },
    serviceQty: {
        fontSize: FontSize.xs,
        color: Colors.textLight,
        marginTop: 2,
    },
    servicePrice: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textDark,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    infoContent: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    infoTitle: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textDark,
    },
    infoSubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textMedium,
        marginTop: 2,
        lineHeight: 20,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    priceLabel: {
        fontSize: FontSize.md,
        color: Colors.textMedium,
    },
    priceValue: {
        fontSize: FontSize.md,
        color: Colors.textDark,
    },
    totalRow: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    totalLabel: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.textDark,
    },
    totalValue: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: Colors.primary,
    },
    notesContainer: {
        backgroundColor: '#F9FAFB',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    notesText: {
        fontSize: FontSize.sm,
        color: Colors.textMedium,
        lineHeight: 22,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        paddingBottom: Spacing.xl + 8,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionBtn: {
        width: '100%',
    },
});
