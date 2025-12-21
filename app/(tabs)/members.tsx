import ContactPicker, { ContactPickerItem } from '@/components/ContactPicker';
import PhoneEntryModal from '@/components/PhoneEntryModal';
import { useApp } from '@/context/AppContext';
import { Member } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MembersScreen() {
    const { data, addMember, addMembers, updateMember, deleteMember } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [addMode, setAddMode] = useState<'manual' | 'contacts' | null>(null);
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    
    // Contact import state
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [showPhoneEntry, setShowPhoneEntry] = useState(false);
    const [pendingContacts, setPendingContacts] = useState<ContactPickerItem[]>([]);
    const [currentContactIndex, setCurrentContactIndex] = useState(0);
    const [importedMembers, setImportedMembers] = useState<Omit<Member, 'id' | 'createdAt'>[]>([]);

    const handleAddFromContacts = async () => {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Denied',
                'Please allow contacts access in settings to import contacts.',
                [{ text: 'OK' }]
            );
            return;
        }

        setShowAddModal(false);
        setShowContactPicker(true);
    };

    const handleContactsSelected = (selectedContacts: ContactPickerItem[]) => {
        setShowContactPicker(false);
        
        if (selectedContacts.length === 0) {
            return;
        }

        // Reset imported members array and start processing
        setImportedMembers([]);
        setPendingContacts(selectedContacts);
        setCurrentContactIndex(0);
        processNextContact(selectedContacts, 0, []);
    };

    const processNextContact = (contacts: ContactPickerItem[], index: number, accumulated: Omit<Member, 'id' | 'createdAt'>[]) => {
        if (index >= contacts.length) {
            // All contacts processed - now import them all at once
            if (accumulated.length > 0) {
                addMembers(accumulated);
                Alert.alert(
                    'Import Complete',
                    `Successfully imported ${accumulated.length} contact${accumulated.length !== 1 ? 's' : ''}.`,
                    [{ text: 'OK' }]
                );
            }
            setPendingContacts([]);
            setCurrentContactIndex(0);
            setImportedMembers([]);
            return;
        }

        const contact = contacts[index];
        
        if (contact.phoneNumber) {
            // Has phone number, add to accumulated array
            const newAccumulated = [
                ...accumulated,
                {
                    name: contact.name,
                    whatsapp: contact.phoneNumber,
                }
            ];
            setImportedMembers(newAccumulated);
            // Process next contact
            processNextContact(contacts, index + 1, newAccumulated);
        } else {
            // No phone number, show entry modal
            setCurrentContactIndex(index);
            setImportedMembers(accumulated);
            setShowPhoneEntry(true);
        }
    };

    const handlePhoneSave = (phoneNumber: string) => {
        const contact = pendingContacts[currentContactIndex];
        setShowPhoneEntry(false);
        
        // Add to accumulated members
        const newAccumulated = [
            ...importedMembers,
            {
                name: contact.name,
                whatsapp: phoneNumber,
            }
        ];
        
        // Process next contact with updated accumulated array
        processNextContact(pendingContacts, currentContactIndex + 1, newAccumulated);
    };

    const handlePhoneSkip = () => {
        setShowPhoneEntry(false);
        
        // Skip this contact and process next with current accumulated array
        processNextContact(pendingContacts, currentContactIndex + 1, importedMembers);
    };

    const handlePhoneEntryClose = () => {
        setShowPhoneEntry(false);
        
        // Cancel the entire import process
        Alert.alert(
            'Import Cancelled',
            'Contact import has been cancelled.',
            [{ text: 'OK' }]
        );
        
        setPendingContacts([]);
        setCurrentContactIndex(0);
        setImportedMembers([]);
    };

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        addMember({
            name: name.trim(),
            whatsapp: whatsapp.trim(),
        });

        setName('');
        setWhatsapp('');
        setShowAddModal(false);
        setAddMode(null);
    };

    const handleEdit = (member: Member) => {
        setEditingMember(member);
        setName(member.name);
        setWhatsapp(member.whatsapp);
        setShowEditModal(true);
    };

    const handleEditSave = () => {
        if (!editingMember) return;
        
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        updateMember(editingMember.id, {
            name: name.trim(),
            whatsapp: whatsapp.trim(),
        });

        setName('');
        setWhatsapp('');
        setEditingMember(null);
        setShowEditModal(false);
    };

    const handleDelete = (member: Member) => {
        Alert.alert(
            'Delete Contact',
            `Are you sure you want to remove ${member.name}? This will also delete all their scheduled sessions.`,
            [
                { text: 'Cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteMember(member.id);
                        setName('');
                        setWhatsapp('');
                        setEditingMember(null);
                        setShowEditModal(false);
                    },
                },
            ]
        );
    };

    const renderMember = ({ item }: { item: Member }) => (
        <View style={styles.memberCard}>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
            </View>
            <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleEdit(item)}
            >
                <Ionicons name="create-outline" size={20} color="#4f46e5" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Members</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={data.members}
                keyExtractor={(item) => item.id}
                renderItem={renderMember}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No members yet. Tap + to add.</Text>
                }
            />

            {showAddModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        {!addMode ? (
                            <>
                                <Text style={styles.modalTitle}>Add Member</Text>
                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={handleAddFromContacts}
                                >
                                    <Ionicons name="people-outline" size={24} color="#4f46e5" />
                                    <Text style={styles.modalOptionText}>Choose from Contacts</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={() => setAddMode('manual')}
                                >
                                    <Ionicons name="create-outline" size={24} color="#4f46e5" />
                                    <Text style={styles.modalOptionText}>Add Manually</Text>
                                </TouchableOpacity>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => setShowAddModal(false)}
                                    >
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>New Member</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Name"
                                    placeholderTextColor="#666"
                                    value={name}
                                    onChangeText={setName}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="WhatsApp (with country code)"
                                    placeholderTextColor="#666"
                                    value={whatsapp}
                                    onChangeText={setWhatsapp}
                                    keyboardType="phone-pad"
                                />
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => setAddMode(null)}
                                    >
                                        <Text style={styles.cancelText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                        <Text style={styles.saveText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            )}

            {showEditModal && editingMember && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Edit Contact</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            placeholderTextColor="#666"
                            value={name}
                            onChangeText={setName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="WhatsApp (with country code)"
                            placeholderTextColor="#666"
                            value={whatsapp}
                            onChangeText={setWhatsapp}
                            keyboardType="phone-pad"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleEditSave}
                            >
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteContactBtn}
                            onPress={() => handleDelete(editingMember)}
                        >
                            <Text style={styles.deleteContactText}>Delete Contact</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <ContactPicker
                visible={showContactPicker}
                onClose={() => setShowContactPicker(false)}
                onSelect={handleContactsSelected}
            />

            <PhoneEntryModal
                visible={showPhoneEntry}
                contactName={pendingContacts[currentContactIndex]?.name || ''}
                onSave={handlePhoneSave}
                onSkip={handlePhoneSkip}
                onClose={handlePhoneEntryClose}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    addButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 20,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    memberActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 60,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '85%',
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: '#222',
        borderRadius: 12,
        marginBottom: 12,
    },
    modalOptionText: {
        fontSize: 16,
        color: '#fff',
    },
    input: {
        backgroundColor: '#222',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        color: '#fff',
        marginBottom: 12,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        padding: 14,
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 8,
    },
    cancelText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#4f46e5',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteContactBtn: {
        marginTop: 12,
        padding: 14,
        alignItems: 'center',
        backgroundColor: '#dc2626',
        borderRadius: 8,
    },
    deleteContactText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
