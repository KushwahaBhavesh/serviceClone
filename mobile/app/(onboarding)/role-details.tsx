import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Dimensions,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
    FadeInRight,
    FadeOutLeft,
    FadeInUp,
    FadeInDown,
    Layout,
    useAnimatedStyle,
    withSpring,
    interpolateColor,
    SlideInDown,
    FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { 
    ChevronLeft, 
    ChevronRight, 
    Check, 
    Briefcase, 
    ShieldCheck, 
    FileText, 
    Star, 
    Award,
    Plus,
    X,
    Sparkles,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { useToast } from '../../context/ToastContext';
import { catalogApi, type Category } from '../../lib/marketplace';

const { width } = Dimensions.get('window');

const BUSINESS_CATEGORIES = [
    { name: 'Plumbing', icon: 'water-outline' },
    { name: 'Electrical', icon: 'flash-outline' },
    { name: 'Cleaning', icon: 'sparkles-outline' },
    { name: 'Carpentry', icon: 'hammer-outline' },
    { name: 'Painting', icon: 'brush-outline' },
    { name: 'Appliance', icon: 'tv-outline' },
    { name: 'Pest Control', icon: 'bug-outline' },
    { name: 'Other', icon: 'ellipsis-horizontal-outline' }
];

export default function RoleDetailsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { role, email, name } = useLocalSearchParams<{ role: string, email: string, name?: string }>();
    const { showError, showSuccess, showInfo } = useToast();

    // Step state
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = role === 'MERCHANT' ? 3 : 1;

    // Merchant States
    const [businessName, setBusinessName] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const [description, setDescription] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [gstNumber, setGstNumber] = useState('');

    // Dynamic Categories
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await catalogApi.listCategories();
                // Map top 5 categories + Other
                const top5 = data.categories
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .slice(0, 5)
                    .map(cat => ({
                        name: cat.name,
                        icon: 'briefcase-outline' // Default icon for dynamic categories
                    }));
                
                setCategories([...top5, { name: 'Other', icon: 'ellipsis-horizontal-outline' }]);
            } catch (error) {
                console.error('Error fetching categories:', error);
                // Fallback to static if fetch fails
                setCategories(BUSINESS_CATEGORIES);
            } finally {
                setIsLoadingCategories(false);
            }
        };

        if (role === 'MERCHANT') {
            fetchCategories();
        }
    }, [role]);

    // Agent States
    const [skillInput, setSkillInput] = useState('');
    const [skillTags, setSkillTags] = useState<string[]>([]);

    const handleAddSkill = useCallback(() => {
        if (!skillInput.trim()) return;
        const newSkills = skillInput.split(',').map(s => s.trim()).filter(s => s.length > 0 && !skillTags.includes(s));
        if (newSkills.length > 0) {
            setSkillTags(prev => [...prev, ...newSkills]);
            setSkillInput('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, [skillInput, skillTags]);

    const removeSkill = useCallback((skill: string) => {
        setSkillTags(prev => prev.filter(s => s !== skill));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const validateStep = () => {
        if (role === 'MERCHANT') {
            if (currentStep === 1) {
                if (!businessName.trim()) return "Business name is required";
                if (!businessCategory) return "Please select a category";
                if (isOtherSelected && !customCategory.trim()) return "Please specify your category";
            }
            if (currentStep === 2) {
                if (!panNumber.trim() || panNumber.length !== 10) return "Valid 10-digit PAN is required";
            }
        } else if (role === 'AGENT') {
            if (skillTags.length === 0) return "Please add at least one skill";
        }
        return null;
    };

    const handleNext = () => {
        const error = validateStep();
        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showInfo(error);
            return;
        }

        if (currentStep < totalSteps) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCurrentStep(prev => prev + 1);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push({
                pathname: '/(onboarding)/location',
                params: {
                    role,
                    email,
                    name,
                    businessName: businessName.trim(),
                    businessCategory: isOtherSelected ? customCategory.trim() : businessCategory,
                    description: description.trim(),
                    panNumber: panNumber.toUpperCase(),
                    gstNumber: gstNumber.toUpperCase(),
                    skills: JSON.stringify(skillTags),
                }
            });
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentStep(prev => prev - 1);
        } else {
            router.back();
        }
    };

    const renderStepContent = () => {
        if (role === 'MERCHANT') {
            switch (currentStep) {
                case 1:
                    return (
                        <Animated.View exiting={FadeOutLeft} entering={FadeInRight} style={styles.stepContent}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionLabel}>IDENTITY & BRANDING</Text>
                            </View>

                            <View style={styles.bentoCard}>
                                <View style={styles.luxeInputGroup}>
                                    <View style={styles.inputIconWrapper}>
                                        <Briefcase size={20} color={Colors.primary} />
                                    </View>
                                    <View style={styles.inputMain}>
                                        <Text style={styles.fieldLabel}>LEGAL BUSINESS NAME</Text>
                                        <TextInput
                                            style={styles.premiumInput}
                                            placeholder="e.g. Acme Services Co."
                                            placeholderTextColor="#94A3B8"
                                            value={businessName}
                                            onChangeText={setBusinessName}
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.sectionHeader, { marginTop: 10 }]}>
                                <Text style={styles.sectionLabel}>PRIMARY EXPERTISE</Text>
                            </View>

                            <View style={styles.categoryGrid}>
                                {categories.map((cat) => (
                                    <Pressable
                                        key={cat.name}
                                        onPress={() => {
                                            setBusinessCategory(cat.name);
                                            setIsOtherSelected(cat.name === 'Other');
                                            Haptics.selectionAsync();
                                        }}
                                        style={[
                                            styles.categoryCard,
                                            businessCategory === cat.name && styles.categoryCardActive
                                        ]}
                                    >
                                        <View style={[
                                            styles.categoryIconBg,
                                            businessCategory === cat.name && { backgroundColor: 'rgba(255,255,255,0.2)' }
                                        ]}>
                                            <Star
                                                size={18}
                                                color={businessCategory === cat.name ? '#FFFFFF' : Colors.primary}
                                                strokeWidth={2.5}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.categoryLabel,
                                            businessCategory === cat.name && styles.categoryLabelActive
                                        ]}>{cat.name}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            {isOtherSelected && (
                                <Animated.View entering={FadeInUp} style={styles.bentoCard}>
                                    <View style={styles.luxeInputGroup}>
                                        <View style={styles.inputIconWrapper}>
                                            <Sparkles size={20} color={Colors.primary} />
                                        </View>
                                        <View style={styles.inputMain}>
                                            <Text style={styles.fieldLabel}>SPECIFY CATEGORY</Text>
                                            <TextInput
                                                style={styles.premiumInput}
                                                placeholder="e.g. Pet Grooming"
                                                placeholderTextColor="#94A3B8"
                                                value={customCategory}
                                                onChangeText={setCustomCategory}
                                            />
                                        </View>
                                    </View>
                                </Animated.View>
                            )}
                        </Animated.View>
                    );
                case 2:
                    return (
                        <Animated.View exiting={FadeOutLeft} entering={FadeInRight} style={styles.stepContent}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionLabel}>LEGAL VERIFICATION</Text>
                            </View>

                            <View style={styles.luxeInfoCard}>
                                <ShieldCheck size={24} color={Colors.primary} strokeWidth={2.5} />
                                <Text style={styles.luxeInfoText}>
                                    Secure verification ensures payment compliance and builds marketplace trust.
                                </Text>
                            </View>

                            <View style={styles.bentoCard}>
                                <View style={styles.luxeInputGroup}>
                                    <View style={styles.inputIconWrapper}>
                                        <FileText size={20} color={Colors.primary} />
                                    </View>
                                    <View style={styles.inputMain}>
                                        <Text style={styles.fieldLabel}>PAN NUMBER (10 DIGITS)</Text>
                                        <TextInput
                                            style={styles.premiumInput}
                                            placeholder="ABCDE1234F"
                                            value={panNumber}
                                            onChangeText={setPanNumber}
                                            autoCapitalize="characters"
                                            maxLength={10}
                                        />
                                    </View>
                                </View>
                                
                                <View style={styles.divider} />
                                
                                <View style={styles.luxeInputGroup}>
                                    <View style={styles.inputIconWrapper}>
                                        <Check size={20} color={Colors.primary} />
                                    </View>
                                    <View style={styles.inputMain}>
                                        <Text style={styles.fieldLabel}>GST NUMBER (OPTIONAL)</Text>
                                        <TextInput
                                            style={styles.premiumInput}
                                            placeholder="15-digit GSTIN"
                                            value={gstNumber}
                                            onChangeText={setGstNumber}
                                            autoCapitalize="characters"
                                            maxLength={15}
                                        />
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                    );
                case 3:
                    return (
                        <Animated.View exiting={FadeOutLeft} entering={FadeInRight} style={styles.stepContent}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionLabel}>EXECUTIVE SUMMARY</Text>
                            </View>

                            <View style={styles.bentoCard}>
                                <View style={styles.luxeInputGroup}>
                                    <View style={styles.inputIconWrapper}>
                                        <Award size={20} color={Colors.primary} />
                                    </View>
                                    <View style={styles.inputMain}>
                                        <Text style={styles.fieldLabel}>PUBLIC BIO & HIGHLIGHTS</Text>
                                        <TextInput
                                            style={styles.premiumTextArea}
                                            placeholder="Tell customers about your expertise and what makes you unique..."
                                            value={description}
                                            onChangeText={setDescription}
                                            multiline
                                        />
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.charCount}>{description.length} CHARACTERS</Text>
                        </Animated.View>
                    );
            }
        }

        if (role === 'AGENT') {
            return (
                <Animated.View exiting={FadeOutLeft} entering={FadeInRight} style={styles.stepContent}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel}>SKILLS & EXPERTISE</Text>
                    </View>

                    <View style={styles.bentoCard}>
                        <View style={styles.luxeInputGroup}>
                            <View style={styles.inputIconWrapper}>
                                <Award size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.inputMain}>
                                <Text style={styles.fieldLabel}>ADD SPECIALIZED SKILL</Text>
                                <TextInput
                                    style={styles.premiumInput}
                                    placeholder="e.g. Master Electrician"
                                    placeholderTextColor="#94A3B8"
                                    value={skillInput}
                                    onChangeText={setSkillInput}
                                    onSubmitEditing={handleAddSkill}
                                />
                            </View>
                            <Pressable onPress={handleAddSkill} style={styles.plusBtn}>
                                <Plus size={20} color="#FFF" strokeWidth={3} />
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.tagCloud}>
                        {skillTags.map((tag) => (
                            <Animated.View
                                key={tag}
                                layout={Layout.springify()}
                                entering={FadeInRight}
                                style={styles.skillTag}
                            >
                                <Text style={styles.skillTagText}>{tag}</Text>
                                <Pressable onPress={() => removeSkill(tag)} style={styles.tagCloseBtn}>
                                    <X size={12} color={Colors.primary} strokeWidth={3} />
                                </Pressable>
                            </Animated.View>
                        ))}
                    </View>
                </Animated.View>
            );
        }

        return (
            <View style={styles.centered}>
                <LinearGradient
                    colors={[Colors.primary, '#FF7A00']}
                    style={styles.successIconBg}
                >
                    <Check size={48} color="#FFF" strokeWidth={3} />
                </LinearGradient>
                <Text style={styles.successTitle}>Profile Locked!</Text>
                <Text style={styles.successSub}>Ready to set your base location and go live.</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />

            {/* ─── Sticky Oracle Header ─── */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Pressable onPress={handleBack} style={styles.navBtn}>
                        <ChevronLeft size={22} color="#0F172A" strokeWidth={2.5} />
                    </Pressable>
                    <View style={styles.indicatorTrack}>
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <View 
                                key={i} 
                                style={[
                                    styles.indicatorPill,
                                    currentStep > i && styles.indicatorPillActive,
                                    currentStep === i + 1 && styles.indicatorPillCurrent
                                ]} 
                            />
                        ))}
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 120 }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.heroBox}>
                        <View style={styles.heroBadge}>
                            <Sparkles size={14} color={Colors.primary} strokeWidth={2.5} />
                            <Text style={styles.heroBadgeText}>STEP {currentStep} OF {totalSteps}</Text>
                        </View>
                        <Text style={styles.title}>
                            {currentStep === 3 ? 'Finalize your <Text style={styles.titleHighlight}>Oracle.</Text>' : 'Professional <Text style={styles.titleHighlight}>Expertise.</Text>'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {role === 'MERCHANT'
                                ? 'Refine your professional credentials for the premium marketplace.'
                                : 'Showcase your specialized skills to handle high-value mandates.'}
                        </Text>
                    </Animated.View>

                    {renderStepContent()}
                </ScrollView>
            </KeyboardAvoidingView>

            <Animated.View 
                entering={SlideInDown.springify()} 
                style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
            >
                <Pressable
                    onPress={handleNext}
                    style={({ pressed }) => [
                        styles.primaryBtn,
                        pressed && { transform: [{ scale: 0.98 }] }
                    ]}
                >
                    <LinearGradient
                        colors={[Colors.primary, '#FF7A00']}
                        style={styles.btnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.btnText}>
                            {currentStep === totalSteps ? 'COMPLETE REGISTRATION' : 'SAVE & CONTINUE'}
                        </Text>
                        <ChevronRight size={22} color="#FFF" strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    flex: { flex: 1 },
    
    // Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    navBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    indicatorTrack: { flexDirection: 'row', gap: 6 },
    indicatorPill: { width: 20, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
    indicatorPillActive: { backgroundColor: Colors.primary + '60' },
    indicatorPillCurrent: { width: 40, backgroundColor: Colors.primary },

    scrollContent: { paddingHorizontal: 25 },
    
    // Hero
    heroBox: { marginBottom: 40 },
    heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '10', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 16 },
    heroBadgeText: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
    title: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    titleHighlight: { color: Colors.primary },
    subtitle: { fontSize: 16, color: '#64748B', marginTop: 10, lineHeight: 24, fontWeight: '500' },

    // Step Content
    stepContent: { gap: 20 },
    sectionHeader: { marginBottom: 5, marginLeft: 2 },
    sectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.primary, letterSpacing: 1.5 },
    
    // Bento Card
    bentoCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 4 },
    luxeInputGroup: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 5 },
    inputIconWrapper: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    inputMain: { flex: 1 },
    fieldLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 4 },
    premiumInput: { fontSize: 16, fontWeight: '700', color: '#0F172A', padding: 0 },
    premiumTextArea: { fontSize: 16, fontWeight: '700', color: '#0F172A', padding: 0, minHeight: 120, textAlignVertical: 'top' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
    charCount: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginTop: 10, textAlign: 'right', paddingRight: 25 },

    // Category Grid
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
    categoryCard: { width: (width - 50 - 24) / 3, aspectRatio: 1, backgroundColor: '#FFF', borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#F1F5F9', gap: 8, padding: 8 },
    categoryCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    categoryIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    categoryLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', textAlign: 'center' },
    categoryLabelActive: { color: '#FFF' },

    // Info Card
    luxeInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: Colors.primary + '08', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 22, borderWidth: 1, borderColor: Colors.primary + '15', marginBottom: 5 },
    luxeInfoText: { flex: 1, fontSize: 13, color: Colors.primary, fontWeight: '700', lineHeight: 20 },

    // Agent Skills
    plusBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    skillTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#F1F5F9', gap: 10 },
    skillTagText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    tagCloseBtn: { width: 20, height: 20, borderRadius: 6, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    // Footer
    footer: { position: 'absolute', left: 25, right: 25, zIndex: 100 },
    primaryBtn: { height: 70, borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 15 },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
    btnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    successIconBg: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    successTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
    successSub: { fontSize: 16, color: '#64748B', textAlign: 'center', paddingHorizontal: 40 },
});
