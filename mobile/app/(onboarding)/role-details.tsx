import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types/auth';

const BUSINESS_CATEGORIES = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Carpentry',
    'Painting',
    'Appliance Repair',
    'Pest Control',
    'Other'
];

export default function RoleDetailsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { role, email } = useLocalSearchParams<{ role: UserRole, email: string }>();

    // Merchant States
    const [businessName, setBusinessName] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');
    const [description, setDescription] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [gstNumber, setGstNumber] = useState('');

    // Agent States
    const [skills, setSkills] = useState('');
    const [skillTags, setSkillTags] = useState<string[]>([]);

    const handleAddSkill = () => {
        if (!skills.trim()) return;
        const newSkills = skills.split(',').map(s => s.trim()).filter(s => s.length > 0 && !skillTags.includes(s));
        setSkillTags([...skillTags, ...newSkills]);
        setSkills('');
    };

    const removeSkill = (skill: string) => {
        setSkillTags(skillTags.filter(s => s !== skill));
    };

    const handleContinue = () => {
        if (role === 'MERCHANT') {
            if (!businessName.trim()) {
                Alert.alert('Details Required', 'Please enter your business name.');
                return;
            }
            if (!businessCategory) {
                Alert.alert('Details Required', 'Please select a business category.');
                return;
            }
            if (!panNumber.trim() || panNumber.length !== 10) {
                Alert.alert('Details Required', 'Please enter a valid 10-digit PAN number.');
                return;
            }
        }

        if (role === 'AGENT' && skillTags.length === 0) {
            Alert.alert('Details Required', 'Please add at least one skill.');
            return;
        }

        router.push({
            pathname: '/(onboarding)/location',
            params: {
                role,
                email,
                businessName: businessName.trim(),
                businessCategory,
                description: description.trim(),
                panNumber: panNumber.toUpperCase(),
                gstNumber: gstNumber.toUpperCase(),
                skills: skillTags.join(','),
            }
        });
    };

    const renderRoleContent = () => {
        if (role === 'MERCHANT') {
            return (
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Business Name</Text>
                        <Input
                            placeholder="e.g. Acme Plumbing Services"
                            value={businessName}
                            onChangeText={setBusinessName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Category</Text>
                        <View style={styles.categoryGrid}>
                            {BUSINESS_CATEGORIES.map((cat) => (
                                <Pressable
                                    key={cat}
                                    onPress={() => setBusinessCategory(cat)}
                                    style={[
                                        styles.categoryChip,
                                        businessCategory === cat && styles.categoryChipActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.categoryText,
                                        businessCategory === cat && styles.categoryTextActive
                                    ]}>{cat}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>PAN Number</Text>
                            <Input
                                placeholder="ABCDE1234F"
                                value={panNumber}
                                onChangeText={setPanNumber}
                                autoCapitalize="characters"
                                maxLength={10}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>GST (Optional)</Text>
                            <Input
                                placeholder="22AAAAA0000A1Z5"
                                value={gstNumber}
                                onChangeText={setGstNumber}
                                autoCapitalize="characters"
                                maxLength={15}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <View style={styles.textAreaWrapper}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Tell customers about your services..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                    </View>
                </View>
            );
        }

        if (role === 'AGENT') {
            return (
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Your Skills</Text>
                        <Text style={styles.description}>Add skills you are proficient in (e.g. Electrician, Plumbing)</Text>
                        <View style={styles.skillInputRow}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    placeholder="Add a skill..."
                                    value={skills}
                                    onChangeText={setSkills}
                                    onSubmitEditing={handleAddSkill}
                                />
                            </View>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.addButton,
                                    pressed && { opacity: 0.8 }
                                ]}
                                onPress={handleAddSkill}
                            >
                                <Ionicons name="add" size={28} color="#FFFFFF" />
                            </Pressable>
                        </View>

                        <View style={styles.tagsContainer}>
                            {skillTags.map((tag) => (
                                <View key={tag} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                    <Pressable onPress={() => removeSkill(tag)} style={styles.removeTag}>
                                        <Ionicons name="close-circle" size={18} color={Colors.primary} />
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.emptyContent}>
                <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
                <Text style={styles.readyText}>You're all set!</Text>
                <Text style={styles.readySubtext}>Click continue to set your service location.</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background Decorations */}
            <View style={styles.bgContainer}>
                <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.decorationCircle1} />
                <View style={styles.decorationCircle2} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 100 }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backButton}
                        hitSlop={12}
                    >
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </Pressable>

                    <View style={styles.header}>
                        <Text style={styles.title}>Business Profile</Text>
                        <Text style={styles.subtitle}>
                            Complete your professional details to attract more customers.
                        </Text>
                    </View>

                    {renderRoleContent()}

                </ScrollView>
            </KeyboardAvoidingView>
            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
                <Button title="Continue" onPress={handleContinue} variant="primary" style={styles.actionBtn} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    bgContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'scroll',
    },
    decorationCircle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.primary + '03',
    },
    decorationCircle2: {
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.primary + '05',
    },
    flex: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 8,
        lineHeight: 24,
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 24,
        // Shadow for premium card feel
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
        // elevation: 2,
    },
    inputGroup: {
        gap: 8,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 4,
        marginLeft: 4,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    categoryChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },
    textAreaWrapper: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 120,
    },
    textArea: {
        fontSize: 16,
        color: '#0F172A',
        height: '100%',
        textAlignVertical: 'top',
    },
    skillInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.primary + '15',
    },
    tagText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '600',
    },
    removeTag: {
        marginLeft: 6,
    },
    emptyContent: {
        alignItems: 'center',
        marginTop: 40,
    },
    readyText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 20,
    },
    readySubtext: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xl,
        paddingTop: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    actionBtn: {
        height: 10,
        borderRadius: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 2,
    },
});
