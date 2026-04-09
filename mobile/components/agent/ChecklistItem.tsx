import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

interface ChecklistItemProps {
    label: string;
    checked: boolean;
    onToggle: () => void;
    disabled?: boolean;
}

export default function ChecklistItem({ label, checked, onToggle, disabled }: ChecklistItemProps) {
    return (
        <Pressable
            onPress={disabled ? undefined : onToggle}
            style={({ pressed }) => [
                styles.container,
                checked && styles.containerChecked,
                pressed && !disabled && { opacity: 0.8 },
                disabled && { opacity: 0.5 },
            ]}
        >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.backgroundAlt,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    containerChecked: {
        backgroundColor: '#10B98110',
        borderColor: '#10B98130',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    checkboxChecked: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    label: {
        flex: 1,
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.text,
    },
    labelChecked: {
        color: '#10B981',
        textDecorationLine: 'line-through',
    },
});
