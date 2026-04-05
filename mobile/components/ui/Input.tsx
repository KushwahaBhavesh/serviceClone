import React from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    prefix?: React.ReactNode;
    dark?: boolean;
}

export const Input = ({
    label,
    error,
    containerStyle,
    leftIcon,
    rightIcon,
    prefix,
    dark = false,
    ...props
}: InputProps) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {!!label && <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>}

            <View style={[
                styles.inputWrapper,
                dark && styles.inputWrapperDark,
                isFocused && styles.inputFocused,
                dark && isFocused && styles.inputFocusedDark,
                error && styles.inputError,
            ]}>
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
                {prefix && <View style={styles.prefixContainer}>{prefix}</View>}

                <TextInput
                    style={[styles.input, dark && styles.inputDark]}
                    placeholderTextColor={dark ? '#64748B' : Colors.textMuted}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.sm,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
        marginLeft: 4,
    },
    labelDark: {
        color: '#94A3B8',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',

        minHeight: 58,
        paddingHorizontal: Spacing.md,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
    },
    inputWrapperDark: {
        backgroundColor: '#FFFFFF08',
        borderColor: '#FFFFFF10',
    },
    inputFocused: {
        borderColor: Colors.primary,
        // shadowColor: Colors.primary,
        // shadowOpacity: 0.1,
        // shadowRadius: 8,
    },
    inputFocusedDark: {
        borderColor: Colors.primary,
        backgroundColor: '#FFFFFF10',
    },
    inputError: {
        borderColor: Colors.error,
        backgroundColor: Colors.error + '05',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        paddingVertical: 12,
        fontWeight: '500',
    },
    inputDark: {
        color: '#FFFFFF',
    },
    prefixContainer: {
        marginRight: 6,
        justifyContent: 'center',
    },
    iconLeft: {
        marginRight: 10,
    },
    iconRight: {
        marginLeft: 10,
    },
    errorText: {
        color: Colors.error,
        fontSize: 13,
        marginTop: 6,
        marginLeft: 6,
        fontWeight: '500',
    },
});
