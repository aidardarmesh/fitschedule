import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import React, { useState, useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export interface ContactPickerItem {
    id: string;
    name: string;
    phoneNumber?: string;
}

interface ContactPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (contacts: ContactPickerItem[]) => void;
}

export default function ContactPicker({ visible, onClose, onSelect }: ContactPickerProps) {
    const [contacts, setContacts] = useState<ContactPickerItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Load contacts when modal opens
    React.useEffect(() => {
        if (visible) {
            loadContacts();
        } else {
            // Reset state when modal closes
            setSelectedIds(new Set());
            setSearchQuery('');
        }
    }, [visible]);

    const loadContacts = async () => {
        setLoading(true);
        try {
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
            });

            const formattedContacts: ContactPickerItem[] = data
                .filter((contact) => contact.name) // Only include contacts with names
                .map((contact) => {
                    // Get the first phone number if available
                    const phoneNumber = contact.phoneNumbers?.[0]?.number;
                    return {
                        id: contact.id,
                        name: contact.name || 'Unknown',
                        phoneNumber: phoneNumber ? cleanPhoneNumber(phoneNumber) : undefined,
                    };
                })
                .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

            setContacts(formattedContacts);
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const cleanPhoneNumber = (phone: string): string => {
        // Remove spaces, dashes, parentheses, and other formatting
        return phone.replace(/[\s\-\(\)]/g, '');
    };

    const filteredContacts = useMemo(() => {
        if (!searchQuery.trim()) return contacts;
        const query = searchQuery.toLowerCase();
        return contacts.filter((contact) =>
            contact.name.toLowerCase().includes(query)
        );
    }, [contacts, searchQuery]);

    const toggleContact = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleImport = () => {
        const selectedContacts = contacts.filter((c) => selectedIds.has(c.id));
        onSelect(selectedContacts);
    };

    const renderContact = ({ item }: { item: ContactPickerItem }) => {
        const isSelected = selectedIds.has(item.id);
        return (
            <TouchableOpacity
                style={[styles.contactItem, isSelected && styles.contactItemSelected]}
                onPress={() => toggleContact(item.id)}
            >
                <View style={styles.checkbox}>
                    {isSelected && (
                        <Ionicons name="checkmark" size={18} color="#4f46e5" />
                    )}
                </View>
                <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    {item.phoneNumber ? (
                        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
                    ) : (
                        <Text style={styles.contactPhoneEmpty}>No phone number</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Select Contacts</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search contacts..."
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {selectedIds.size > 0 && (
                    <View style={styles.selectedBar}>
                        <Text style={styles.selectedText}>
                            {selectedIds.size} contact{selectedIds.size !== 1 ? 's' : ''} selected
                        </Text>
                    </View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                        <Text style={styles.loadingText}>Loading contacts...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredContacts}
                        keyExtractor={(item) => item.id}
                        renderItem={renderContact}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={64} color="#333" />
                                <Text style={styles.emptyText}>
                                    {searchQuery ? 'No contacts found' : 'No contacts available'}
                                </Text>
                            </View>
                        }
                    />
                )}

                {selectedIds.size > 0 && (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.importBtn}
                            onPress={handleImport}
                        >
                            <Text style={styles.importText}>
                                Import {selectedIds.size} Contact{selectedIds.size !== 1 ? 's' : ''}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        margin: 16,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#fff',
    },
    selectedBar: {
        backgroundColor: '#4f46e5',
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    selectedText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    contactItemSelected: {
        backgroundColor: '#1a1a2e',
        borderWidth: 1,
        borderColor: '#4f46e5',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#333',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    contactPhone: {
        fontSize: 14,
        color: '#999',
    },
    contactPhoneEmpty: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
    },
    importBtn: {
        backgroundColor: '#4f46e5',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    importText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

