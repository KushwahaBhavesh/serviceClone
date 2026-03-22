import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, User, Mail, Camera, Save, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, updateProfile, isLoading } = useAuthStore();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Name cannot be empty.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        try {
            await updateProfile({
                name: name.trim(),
                email: email.trim() || undefined,
            });
            
            setIsSaved(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update profile');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <View style={styles.navbar}>
                    <Pressable 
                        onPress={() => router.back()} 
                        style={({ pressed }) => [
                            styles.navBtn,
                            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                        ]}
                    >
                        <ChevronLeft size={24} color="#1E293B" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 44 }} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarPlaceholder}>
                                <User size={50} color={Colors.primary} strokeWidth={1.5} />
                            </View>
                            <Pressable style={styles.editAvatarBtn}>
                                <Camera size={18} color="#FFF" />
                            </Pressable>
                        </View>
                        <Text style={styles.avatarHint}>Tap to change photo</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <User size={20} color="#94A3B8" style={styles.inputIcon} />
                                <Input
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Your Name"
                                    containerStyle={styles.input}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
                                <Input
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Email Address"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    containerStyle={styles.input}
                                />
                            </View>
                        </View>
                        
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                Your email is used for receipts, booking updates, and account security.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Action Bar */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
                <Pressable
                    onPress={handleSave}
                    disabled={isLoading || isSaved}
                    style={({ pressed }) => [
                        styles.saveBtn,
                        (isLoading || isSaved) && styles.saveBtnDisabled,
                        pressed && !isLoading && !isSaved && { transform: [{ scale: 0.98 }] }
                    ]}
                >
                    <LinearGradient
                        colors={isSaved ? [Colors.success, Colors.success] : [Colors.primary, Colors.primaryLight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveGradient}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : isSaved ? (
                            <>
                                <Check size={20} color="#FFF" strokeWidth={3} />
                                <Text style={styles.saveText}>Profile Updated</Text>
                            </>
                        ) : (
                            <>
                                <Save size={20} color="#FFF" />
                                <Text style={styles.saveText}>Save Changes</Text>
                            </>
                        )}
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    flex: { flex: 1 },
    header: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: 16,
    },
    navBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    scrollContent: {
        padding: Spacing.xl,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.primary + '20',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    avatarHint: {
        marginTop: 12,
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: -4,
    },
    input: {
        flex: 1,
        borderWidth: 0,
        marginBottom: 0,
        height: 56,
        backgroundColor: 'transparent',
    },
    infoBox: {
        backgroundColor: '#F1F5F9',
        padding: 16,
        borderRadius: 16,
        marginTop: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        textAlign: 'center',
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    saveBtn: {
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    saveBtnDisabled: {
        opacity: 0.8,
        shadowOpacity: 0,
        elevation: 0,
    },
    saveGradient: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    saveText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
});
