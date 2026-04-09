import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

interface Step {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface JobStepIndicatorProps {
    currentStep: number;
    steps: Step[];
}

export default function JobStepIndicator({ currentStep, steps }: JobStepIndicatorProps) {
    return (
        <View style={styles.container}>
            <View style={styles.stepsRow}>
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;
                    const isUpcoming = index > currentStep;

                    return (
                        <React.Fragment key={step.label}>
                            {/* Connector Line */}
                            {index > 0 && (
                                <View
                                    style={[
                                        styles.connector,
                                        isCompleted || isActive
                                            ? styles.connectorActive
                                            : styles.connectorInactive,
                                    ]}
                                />
                            )}

                            {/* Step Circle */}
                            <View style={styles.stepColumn}>
                                <View
                                    style={[
                                        styles.circle,
                                        isCompleted && styles.circleCompleted,
                                        isActive && styles.circleActive,
                                        isUpcoming && styles.circleUpcoming,
                                    ]}
                                >
                                    {isCompleted ? (
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    ) : (
                                        <Ionicons
                                            name={step.icon}
                                            size={16}
                                            color={isActive ? '#FFF' : Colors.textMuted}
                                        />
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.label,
                                        isActive && styles.labelActive,
                                        isCompleted && styles.labelCompleted,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {step.label}
                                </Text>
                            </View>
                        </React.Fragment>
                    );
                })}
            </View>

            <Text style={styles.stepCounter}>
                Step {currentStep + 1} of {steps.length}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.lg,
    },
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    stepColumn: {
        alignItems: 'center',
        width: 64,
    },
    circle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    circleCompleted: {
        backgroundColor: '#10B981',
    },
    circleActive: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    circleUpcoming: {
        backgroundColor: Colors.backgroundAlt,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    connector: {
        height: 2,
        flex: 1,
        marginTop: 18,
        borderRadius: 1,
    },
    connectorActive: {
        backgroundColor: '#10B981',
    },
    connectorInactive: {
        backgroundColor: Colors.border,
    },
    label: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    labelActive: {
        color: Colors.primary,
    },
    labelCompleted: {
        color: '#10B981',
    },
    stepCounter: {
        textAlign: 'center',
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginTop: Spacing.md,
    },
});
