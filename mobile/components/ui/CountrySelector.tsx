import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    Pressable,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/theme';
import { COUNTRIES, Country } from '../../constants/countries';

interface CountrySelectorProps {
    onSelect: (country: Country) => void;
    selectedCountry: Country;
}

export const CountrySelector = ({ onSelect, selectedCountry }: CountrySelectorProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCountries = COUNTRIES.filter(
        (country) =>
            country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            country.callingCode.includes(searchQuery)
    );

    const handleSelect = (country: Country) => {
        onSelect(country);
        setModalVisible(false);
        setSearchQuery('');
    };

    return (
        <View>
            <Pressable
                onPress={() => setModalVisible(true)}
                style={styles.trigger}
            >
                <Text style={styles.triggerText}>{selectedCountry.flag} +{selectedCountry.callingCode}</Text>
                <Ionicons name="chevron-down" size={14} color={Colors.textMuted} style={styles.chevron} />
            </Pressable>

            <Modal
                visible={modalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.header}>
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.modalTitle}>Select Country</Text>
                                <Pressable
                                    onPress={() => setModalVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close" size={24} color={Colors.textDark} />
                                </Pressable>
                            </View>

                            <View style={styles.searchBar}>
                                <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
                                <TextInput
                                    placeholder="Search country or code"
                                    style={styles.searchInput}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor="#94A3B8"
                                    autoFocus
                                />
                                {searchQuery.length > 0 && (
                                    <Pressable onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                                    </Pressable>
                                )}
                            </View>
                        </View>

                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.countryItem,
                                        selectedCountry.code === item.code && styles.selectedItem
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <View style={styles.countryInfo}>
                                        <Text style={styles.flag}>{item.flag}</Text>
                                        <Text style={[
                                            styles.countryName,
                                            selectedCountry.code === item.code && styles.selectedText
                                        ]}>{item.name}</Text>
                                    </View>
                                    <Text style={[
                                        styles.callingCode,
                                        selectedCountry.code === item.code && styles.selectedText
                                    ]}>+{item.callingCode}</Text>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                        />
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
        borderRightWidth: 1.5,
        borderRightColor: '#E2E8F0',
        marginRight: 12,
        height: 24,
    },
    triggerText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    chevron: {
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '80%',
        paddingBottom: 20,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    countryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
    },
    selectedItem: {
        backgroundColor: Colors.primary + '05',
        marginHorizontal: -24,
        paddingHorizontal: 24,
    },
    countryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flag: {
        fontSize: 24,
        marginRight: 16,
    },
    countryName: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '600',
    },
    callingCode: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '700',
    },
    selectedText: {
        color: Colors.primary,
    },
    separator: {
        height: 1,
        backgroundColor: '#F1F5F9',
    },
});
