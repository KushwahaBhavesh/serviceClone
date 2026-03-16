import React from 'react';
import {
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    PressableProps
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

interface ButtonProps extends PressableProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button = ({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    style,
    textStyle,
    icon,
    disabled,
    ...props
}: ButtonProps) => {
    const isSecondary = variant === 'secondary';
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';
    const isSuccess = variant === 'success';

    return (
        <Pressable
            style={({ pressed }) => [
                styles.base,
                styles[variant],
                styles[size],
                (disabled || loading) && styles.disabled,
                pressed && !disabled && !loading && styles.pressed,
                style,
            ]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={isOutline || isGhost || isSecondary || isSuccess ? Colors.primary : Colors.textOnPrimary} />
            ) : (
                <>
                    {icon && <React.Fragment>{icon}</React.Fragment>}
                    <Text
                        style={[
                            styles.textBase,
                            styles[`${variant}Text` as keyof typeof styles],
                            styles[`${size}Text` as keyof typeof styles],
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: BorderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    primary: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    secondary: {
        backgroundColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    ghost: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    success: {
        backgroundColor: Colors.success,
        shadowColor: Colors.success,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    sm: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        minHeight: 44,
    },
    md: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        minHeight: 58,
    },
    lg: {
        paddingVertical: 18,
        paddingHorizontal: 32,
        minHeight: 70,
    },
    pressed: {
        opacity: 0.85,
    },
    disabled: {
        opacity: 0.4,
    },
    textBase: {
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    primaryText: {
        color: Colors.textOnPrimary,
    },
    secondaryText: {
        color: Colors.textOnHighlight,
    },
    outlineText: {
        color: Colors.primary,
    },
    ghostText: {
        color: '#1E293B',
        fontWeight: '700',
    },
    successText: {
        color: '#FFF',
    },
    smText: {
        fontSize: FontSize.sm,
    },
    mdText: {
        fontSize: FontSize.md,
    },
    lgText: {
        fontSize: FontSize.lg,
    },
});
