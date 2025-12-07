import { useApp } from '@/context/AppContext';
import { Member } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Linking,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MembersScreen() {
    const { data, addMember, deleteMember } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [addMode, setAddMode] = useState<'manual' | 'contacts' | null>(null);
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [sessions, setSessions] = useState('');

    const handleAddFromContacts = async () => {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please allow contacts access in settings.');
            return;
        }

        const { data: contacts } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });

        if (contacts.length > 0) {
            Alert.alert(
                'Select Contact',
                'This would show a contact picker. For now, add manually.',
                [{ text: 'OK', onPress: () => setAddMode('manual') }]
            );
        }
    };

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        addMember({
            name: name.trim(),
            whatsapp: whatsapp.trim(),
            sessionsTotal: parseInt(sessions) || 0,
            sessionsRemaining: parseInt(sessions) || 0,
        });

        setName('');
        setWhatsapp('');
        setSessions('');
        setShowAddModal(false);
        setAddMode(null);
    };

    const openWhatsApp = (phone: string) => {
        const url = `whatsapp://send?phone=${phone.replace(/\D/g, '')}`;
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Could not open WhatsApp');
        });
    };

    const renderMember = ({ item }: { item: Member }) => (
        <View style={styles.memberCard}>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberSessions}>
                    {item.sessionsRemaining} sessions remaining
                </Text>
            </View>
            <View style={styles.memberActions}>
                {item.whatsapp && (
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openWhatsApp(item.whatsapp)}
                    >
                        <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                        Alert.alert('Delete Member', `Remove ${item.name}?`, [
                            { text: 'Cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteMember(item.id) },
                        ]);
                    }}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
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
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setShowAddModal(false)}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
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
                                <TextInput
                                    style={styles.input}
                                    placeholder="Sessions Purchased"
                                    placeholderTextColor="#666"
                                    value={sessions}
                                    onChangeText={setSessions}
                                    keyboardType="number-pad"
                                />
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => {
                                            setAddMode(null);
                                            setShowAddModal(false);
                                        }}
                                    >
                                        <Text style={styles.cancelText}>Cancel</Text>
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
        width: 44,
        height: 44,
        backgroundColor: '#4f46e5',
        borderRadius: 22,
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
    memberSessions: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
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
    },
    cancelText: {
        color: '#888',
        fontSize: 16,
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
});
