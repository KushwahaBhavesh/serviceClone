import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

interface PhotoCaptureGridProps {
    photos: string[];
    onAdd: (uris: string[]) => void;
    onRemove: (uri: string) => void;
    maxPhotos?: number;
    label?: string;
    useCamera?: boolean;
}

export default function PhotoCaptureGrid({
    photos,
    onAdd,
    onRemove,
    maxPhotos = 5,
    label = 'Photos',
    useCamera = false,
}: PhotoCaptureGridProps) {
    const canAdd = photos.length < maxPhotos;

    const handleCapture = async () => {
        try {
            // Request permissions
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Camera Permission Required',
                        'Please enable camera access in your device settings to capture photos.',
                        [{ text: 'OK' }]
                    );
                    return;
                }
            }

            const result = useCamera
                ? await ImagePicker.launchCameraAsync({
                    mediaTypes: 'images',
                    quality: 0.7,
                    allowsEditing: false,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: 'images',
                    allowsMultipleSelection: true,
                    quality: 0.7,
                    selectionLimit: maxPhotos - photos.length,
                });

            if (!result.canceled && result.assets.length > 0) {
                const remaining = maxPhotos - photos.length;
                const newUris = result.assets.slice(0, remaining).map((a) => a.uri);
                onAdd(newUris);
            }
        } catch (error) {
            console.error('Photo capture error:', error);
            Alert.alert('Error', 'Could not capture photo. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.counter}>
                    {photos.length}/{maxPhotos}
                </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
                {photos.map((uri) => (
                    <View key={uri} style={styles.photoWrapper}>
                        <Image source={{ uri }} style={styles.photo} />
                        <Pressable
                            style={styles.removeBtn}
                            onPress={() => onRemove(uri)}
                            hitSlop={8}
                        >
                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                        </Pressable>
                    </View>
                ))}

                {canAdd && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.addBtn,
                            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                        ]}
                        onPress={handleCapture}
                    >
                        <Ionicons
                            name={useCamera ? 'camera' : 'images'}
                            size={28}
                            color={Colors.primary}
                        />
                        <Text style={styles.addText}>
                            {useCamera ? 'Take Photo' : 'Add Photo'}
                        </Text>
                    </Pressable>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.text,
    },
    counter: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    scrollRow: {
        flexDirection: 'row',
    },
    photoWrapper: {
        marginRight: Spacing.sm,
        position: 'relative',
    },
    photo: {
        width: 100,
        height: 100,
        borderRadius: BorderRadius.md,
    },
    removeBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FFF',
        borderRadius: 11,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    addBtn: {
        width: 100,
        height: 100,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.backgroundAlt,
        borderStyle: 'dashed',
        borderWidth: 1.5,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    addText: {
        fontSize: 10,
        color: Colors.primary,
        fontWeight: '700',
    },
});
