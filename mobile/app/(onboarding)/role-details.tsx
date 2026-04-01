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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInRight,
    FadeOutLeft,
    Layout,
    useAnimatedStyle,
    withSpring,
    interpolateColor
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types/auth';
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
    const { role, email, name } = useLocalSearchParams<{ role: UserRole, email: string, name?: string }>();

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
            // In a real app, maybe show a toast. For now, simple return.
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
                        <Animated.View exiting={FadeOutLeft} entering={FadeInRight} style={styles.stepContainer}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="briefcase" size={24} color={Colors.primary} />
                                <Text style={styles.sectionTitle}>Business Identification</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Official Business Name</Text>
                                <Input
                                    placeholder="Enter your registered name"
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                    containerStyle={styles.premiumInput}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Select Primary Category</Text>
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
                                            <Ionicons
                                                name={cat.icon as any}
                                                size={24}
                                                color={businessCategory === cat.name ? '#FFFFFF' : Colors.textMedium}
                                            />
                                            <Text style={[
                                                styles.categoryLabel,
                                                businessCategory === cat.name && styles.categoryLabelActive
                                            ]}>{cat.name}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {isOtherSelected && (
                                <Animated.View exiting={FadeOutLeft} entering={FadeInRight} style={styles.inputGroup}>
                                    <Text style={styles.label}>Specify Other Service</Text>
                                    <Input
                                        placeholder="e.g. Pet Grooming, Photography"
                                        value={customCategory}
                                        onChangeText={setCustomCategory}
                                        containerStyle={styles.premiumInput}
                                    />
                                </Animated.View>
                            )}
                        </Animated.View>
                    );
                case 2:
                    return (
                        <Animated.View exiting={FadeOutLeft} entering={FadeInRight} style={styles.stepContainer}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="document-text" size={24} color={Colors.primary} />
                                <Text style={styles.sectionTitle}>Legal Information</Text>
                            </View>

                            <View style={styles.glassInfoBox}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
                                <Text style={styles.glassInfoText}>
                                    We use this to verify your business and process payments securely.
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>PAN Number (Mandatory)</Text>
                                <Input
                                    placeholder="ABCDE1234F"
                                    value={panNumber}
                                    onChangeText={setPanNumber}
                                    autoCapitalize="characters"
                                    maxLength={10}
                                    containerStyle={styles.premiumInput}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>GST Number (Optional)</Text>
                                <Input
                                    placeholder="22AAAAA0000A1Z5"
                                    value={gstNumber}
                                    onChangeText={setGstNumber}
                                    autoCapitalize="characters"
                                    maxLength={15}
                                    containerStyle={styles.premiumInput}
                                />
                            </View>
                        </Animated.View>
                    );
                case 3:
                    return (
                        <Animated.View exiting={FadeOutLeft} entering={FadeInRight} style={styles.stepContainer}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
                                <Text style={styles.sectionTitle}>Business Highlights</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Public Bio / Description</Text>
                                <View style={styles.premiumTextAreaContainer}>
                                    <TextInput
                                        style={styles.premiumTextArea}
                                        placeholder="Tell customers about your expertise, years in business, and what makes you unique..."
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                        numberOfLines={6}
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                                <Text style={styles.charCount}>{description.length} characters</Text>
                            </View>
                        </Animated.View>
                    );
            }
        }

        if (role === 'AGENT') {
            return (
                <Animated.View exiting={FadeOutLeft} entering={FadeInRight} style={styles.stepContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="ribbon" size={24} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>Expertise & Skills</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Specialized Skills</Text>
                        <View style={styles.skillInputWrapper}>
                            <TextInput
                                style={styles.skillInput}
                                placeholder="e.g. Master Electrician, HVAC"
                                value={skillInput}
                                onChangeText={setSkillInput}
                                onSubmitEditing={handleAddSkill}
                                placeholderTextColor="#94A3B8"
                            />
                            <Pressable
                                onPress={handleAddSkill}
                                style={({ pressed }) => [
                                    styles.skillAddBtn,
                                    pressed && { opacity: 0.8 }
                                ]}
                            >
                                <Ionicons name="add" size={24} color="#FFF" />
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.tagCloud}>
                        {skillTags.map((tag) => (
                            <View key={tag}>
                                <Animated.View
                                    layout={Layout.springify()}
                                    entering={FadeInRight}
                                    style={styles.skillTag}
                                >
                                    <Text style={styles.skillTagText}>{tag}</Text>
                                    <Pressable onPress={() => removeSkill(tag)} hitSlop={8}>
                                        <Ionicons name="close" size={16} color={Colors.primary} />
                                    </Pressable>
                                </Animated.View>
                            </View>
                        ))}
                    </View>
                </Animated.View>
            );
        }

        return (
            <View style={styles.centered}>
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryLight]}
                    style={styles.successIconBg}
                >
                    <Ionicons name="checkmark" size={48} color="#FFF" />
                </LinearGradient>
                <Text style={styles.successTitle}>Profile Locked!</Text>
                <Text style={styles.successSub}>Ready to set your base location and go live.</Text>
            </View>
        );
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <StatusBar style="dark" />

                {/* Background Pattern */}
                <View style={styles.backgroundLayer}>
                    <View style={styles.bgContainer}>
                        <View style={[styles.decoration, styles.decor1]} />
                        <View style={[styles.decoration, styles.decor2]} />
                    </View>
                </View>

                {/* Progress Header */}
                <View style={[styles.navbar, { paddingTop: insets.top + Spacing.sm }]}>
                    <Pressable onPress={handleBack} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={24} color="#1E293B" />
                    </Pressable>
                    <View style={styles.progressOverview}>
                        <Text style={styles.stepText}>Step {currentStep} of {totalSteps}</Text>
                        <View style={styles.progressTrack}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    { width: `${(currentStep / totalSteps) * 100}%` }
                                ]}
                            />
                        </View>
                    </View>
                    <View style={styles.navBtnSpacer} />
                </View>

                <View style={styles.content}>
                    <View style={styles.headerArea}>
                        <Text style={styles.title}>
                            {currentStep === 3 ? 'Final Touches' : 'Professional Profile'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {role === 'MERCHANT'
                                ? 'Let\'s build your brand presence on the platform.'
                                : 'Showcase your expertise to get higher-paying jobs.'}
                        </Text>
                    </View>

                    {renderStepContent()}
                </View>

                {/* Fixed Footer */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
                    <Pressable
                        onPress={handleNext}
                        style={({ pressed }) => [
                            styles.mainButton,
                            pressed && styles.mainButtonPressed
                        ]}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.btnGradient}
                        >
                            <Text style={styles.btnText}>
                                {currentStep === totalSteps ? 'Complete Profile' : 'Save & Continue'}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#FFF" />
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    backgroundLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
    },
    bgContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    decoration: {
        position: 'absolute',
        borderRadius: 100,
    },
    decor1: {
        width: 250,
        height: 250,
        backgroundColor: Colors.primary + '08',
        top: -80,
        right: -80,
    },
    decor2: {
        width: 150,
        height: 150,
        backgroundColor: Colors.secondary + '08',
        bottom: '10%',
        left: -50,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    navBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    navBtnSpacer: { width: 44 },
    progressOverview: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
    },
    stepText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    progressTrack: {
        width: '100%',
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
    },
    headerArea: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 6,
        lineHeight: 22,
    },
    stepContainer: {
        gap: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    inputGroup: {
        gap: 10,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 4,
    },
    premiumInput: {
        backgroundColor: '#FFF',
        color: Colors.primary,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        width: (width - Spacing.xl * 2 - 24) / 3,
        aspectRatio: 1,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        gap: 8,
        padding: 8,
    },
    categoryCardActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    categoryLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        textAlign: 'center',
    },
    categoryLabelActive: {
        color: '#FFF',
    },
    glassInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '08',
        padding: 16,
        borderRadius: 18,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.primary + '15',
    },
    glassInfoText: {
        flex: 1,
        fontSize: 13,
        color: Colors.primary,
        lineHeight: 18,
        fontWeight: '600',
    },
    premiumTextAreaContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        padding: 16,
        minHeight: 160,
    },
    premiumTextArea: {
        fontSize: 16,
        color: '#0F172A',
        lineHeight: 24,
        textAlignVertical: 'top',
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#94A3B8',
        marginRight: 4,
    },
    skillInputWrapper: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 6,
        height: 64,
    },
    skillInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    skillAddBtn: {
        width: 52,
        height: 52,
        backgroundColor: Colors.primary,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    skillTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    skillTagText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
    },
    mainButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 8,
    },
    mainButtonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    btnGradient: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    btnText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    successIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
    },
    successSub: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
    }
});
