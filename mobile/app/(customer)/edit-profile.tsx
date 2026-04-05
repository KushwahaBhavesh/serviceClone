import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { 
    ChevronLeft, 
    User, 
    Mail, 
    Camera, 
    Check, 
    Sparkles, 
    ShieldCheck,
    Save
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, { 
    FadeInUp, 
    FadeInDown, 
    FadeInRight,
} from 'react-native-reanimated';

import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, updateProfile, isLoading } = useAuthStore();
    const { showSuccess, showError, showInfo } = useToast();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            showInfo('Name cannot be empty.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await updateProfile({
                name: name.trim(),
                email: email.trim() || undefined,
            });
            
            setIsSaved(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showSuccess('Profile updated successfully!');
            
            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (err: any) {
            showError(err.message || 'Failed to update profile');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />
            
            {/* Premium Header */}
            <View style={[styles.header, { height: insets.top + 80 }]}>
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color="#111" strokeWidth={2.5} />
                    </Pressable>
                    <View style={styles.headerTitleWrap}>
                        <Text style={styles.headerTitle}>PROFILE SETTINGS</Text>
                        <Text style={styles.headerSubtitle}>Identity & Security</Text>
                    </View>
                    <View style={styles.shieldBadge}>
                        <ShieldCheck size={18} color={Colors.primary} strokeWidth={2.5} />
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView 
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 80, paddingBottom: 140 }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Immersive Avatar Section */}
                    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <LinearGradient
                                colors={['#F8FAFC', '#E2E8F0']}
                                style={styles.avatarPlaceholder}
                            >
                                <User size={48} color={Colors.primary} strokeWidth={1.5} />
                            </LinearGradient>
                            <Pressable style={styles.editAvatarBtn}>
                                <Camera size={18} color="#FFF" strokeWidth={2.5} />
                            </Pressable>
                        </View>
                        <Text style={styles.avatarHint}>IDENTITY VERIFICATION PHOTO</Text>
                    </Animated.View>

                    {/* Bento Infrastructure Cards */}
                    <View style={styles.form}>
                        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.bentoCard}>
                            <View style={styles.bentoHeader}>
                                <View style={styles.bentoIconBox}>
                                    <User size={18} color={Colors.primary} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.bentoLabel}>FULL NAME</Text>
                            </View>
                            <Input
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your full name"
                                containerStyle={styles.inputContainer}
                                style={styles.textInput}
                                placeholderTextColor="#94A3B8"
                            />
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bentoCard}>
                            <View style={styles.bentoHeader}>
                                <View style={styles.bentoIconBox}>
                                    <Mail size={18} color={Colors.primary} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.bentoLabel}>EMAIL ADDRESS</Text>
                            </View>
                            <Input
                                value={email}
                                onChangeText={setEmail}
                                placeholder="name@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                containerStyle={styles.inputContainer}
                                style={styles.textInput}
                                placeholderTextColor="#94A3B8"
                            />
                        </Animated.View>
                        
                        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.luxeInfoCard}>
                            <ShieldCheck size={20} color={Colors.primary} strokeWidth={2.5} />
                            <Text style={styles.luxeInfoText}>
                                Your encrypted identity data is used for secure banking and service distribution.
                            </Text>
                        </Animated.View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Immersive Action Bar */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.footerContent}>
                    <Pressable
                        onPress={handleSave}
                        disabled={isLoading || isSaved}
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            (isLoading || isSaved) && styles.btnDisabled,
                            pressed && !isLoading && !isSaved && { transform: [{ scale: 0.98 }] }
                        ]}
                    >
                        <LinearGradient
                            colors={isSaved ? ['#22C55E', '#16A34A'] : [Colors.primary, '#FF7A00']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.btnGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : isSaved ? (
                                <>
                                    <Check size={22} color="#FFF" strokeWidth={3} />
                                    <Text style={styles.btnText}>PROFILE SECURED</Text>
                                </>
                            ) : (
                                <>
                                    <Save size={20} color="#FFF" strokeWidth={2.5} />
                                    <Text style={styles.btnText}>COMMIT CHANGES</Text>
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    flex: { flex: 1 },
    
    // Header
    header: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 25 },
    navBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    headerTitleWrap: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 11, fontWeight: '700', color: '#AAA', marginTop: 2 },
    shieldBadge: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    scrollContent: { paddingHorizontal: 25 },

    // Avatar
    avatarSection: { alignItems: 'center', marginBottom: 40 },
    avatarWrapper: { position: 'relative' },
    avatarPlaceholder: { width: 120, height: 120, borderRadius: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
    editAvatarBtn: { position: 'absolute', bottom: -5, right: -5, backgroundColor: Colors.primary, width: 42, height: 42, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10 },
    avatarHint: { marginTop: 18, fontSize: 10, color: '#AAA', fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },

    // Bento Cards
    form: { gap: 18 },
    bentoCard: { backgroundColor: '#FAFAFA', borderRadius: 32, padding: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    bentoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
    bentoIconBox: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    bentoLabel: { fontSize: 10, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    inputContainer: { borderWidth: 0, paddingHorizontal: 0, marginBottom: 0, height: 44, backgroundColor: 'transparent' },
    textInput: { fontSize: 16, fontWeight: '700', color: '#111' },

    luxeInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: Colors.primary + '03', padding: 22, borderRadius: 28, borderWidth: 1, borderColor: Colors.primary + '10' },
    luxeInfoText: { flex: 1, fontSize: 12, color: '#64748B', fontWeight: '600', lineHeight: 18 },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    footerContent: { paddingHorizontal: 25, paddingVertical: 20 },
    primaryBtn: { height: 64, borderRadius: 22, overflow: 'hidden' },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    btnText: { color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    btnDisabled: { opacity: 0.6 },
});
