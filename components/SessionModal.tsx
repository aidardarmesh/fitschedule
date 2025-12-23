import { useApp } from '@/context/AppContext';
import { Session } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SessionModalProps {
    visible: boolean;
    onClose: () => void;
    session?: Session; // If provided, we're editing; otherwise, creating
}

export default function SessionModal({ visible, onClose, session }: SessionModalProps) {
    const { data, addSession, updateSession, deleteSession } = useApp();
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const [total, setTotal] = useState<string>('');
    const [remaining, setRemaining] = useState<string>('');
    const [showMemberPicker, setShowMemberPicker] = useState(false);

    useEffect(() => {
        if (session) {
            // Editing mode
            setSelectedMemberId(session.memberId);
            setTotal(session.total.toString());
            setRemaining(session.remaining.toString());
            setShowMemberPicker(false);
        } else {
            // Creating mode
            setSelectedMemberId('');
            setTotal('12');
            setRemaining('12');
            setShowMemberPicker(false);
        }
    }, [session, visible]);

    const selectedMember = data.members.find((m) => m.id === selectedMemberId);

    const handleSave = () => {
        // Validation
        if (!selectedMemberId) {
            Alert.alert('Error', 'Please select a member');
            return;
        }

        const totalNum = parseInt(total, 10);
        const remainingNum = parseInt(remaining, 10);

        if (isNaN(totalNum) || totalNum <= 0) {
            Alert.alert('Error', 'Total sessions must be a positive number');
            return;
        }

        if (isNaN(remainingNum) || remainingNum < 0) {
            Alert.alert('Error', 'Remaining sessions must be a non-negative number');
            return;
        }

        if (remainingNum > totalNum) {
            Alert.alert('Error', 'Remaining sessions cannot exceed total sessions');
            return;
        }

        if (session) {
            // Update existing session
            updateSession(session.id, {
                total: totalNum,
                remaining: remainingNum,
            });
        } else {
            // Create new session
            addSession({
                memberId: selectedMemberId,
                total: totalNum,
                remaining: remainingNum,
            });
        }

        onClose();
    };

    const handleDelete = () => {
        if (!session) return;

        Alert.alert(
            'Delete Session',
            'Are you sure you want to delete this session?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteSession(session.id);
                        onClose();
                    },
                },
            ]
        );
    };

    const handleTotalChange = (value: string) => {
        setTotal(value);
        // Auto-set remaining to total for new sessions
        if (!session && value) {
            setRemaining(value);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modal}>
                <Text style={styles.modalTitle}>
                    {session ? 'Edit Session' : 'New Session'}
                </Text>

                {/* Member Picker */}
                {!session && (
                    <>
                        <TouchableOpacity
                            style={styles.picker}
                            onPress={() => setShowMemberPicker(!showMemberPicker)}
                        >
                            <Text style={[styles.pickerText, !selectedMember && styles.placeholder]}>
                                {selectedMember ? selectedMember.name : 'Select Member'}
                            </Text>
                            <Ionicons
                                name={showMemberPicker ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color="#888"
                            />
                        </TouchableOpacity>

                        {showMemberPicker && (
                            <ScrollView style={styles.memberList}>
                                {data.members.map((member) => (
                                    <TouchableOpacity
                                        key={member.id}
                                        style={styles.memberItem}
                                        onPress={() => {
                                            setSelectedMemberId(member.id);
                                            setShowMemberPicker(false);
                                        }}
                                    >
                                        <Text style={styles.memberName}>{member.name}</Text>
                                        {selectedMemberId === member.id && (
                                            <Ionicons name="checkmark" size={20} color="#4f46e5" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </>
                )}

                {session && (
                    <View style={styles.memberInfoBox}>
                        <Text style={styles.memberInfoLabel}>Member:</Text>
                        <Text style={styles.memberInfoText}>{selectedMember?.name}</Text>
                    </View>
                )}

                {/* Total and Remaining in one row */}
                <View style={styles.rowFields}>
                    <View style={styles.halfField}>
                        <Text style={styles.label}>Total</Text>
                        <TextInput
                            style={styles.input}
                            value={total}
                            onChangeText={handleTotalChange}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.halfField}>
                        <Text style={styles.label}>Remaining</Text>
                        <TextInput
                            style={styles.input}
                            value={remaining}
                            onChangeText={setRemaining}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor="#666"
                        />
                    </View>
                </View>

                {session ? (
                    // Editing: Show Save and Delete buttons
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                            <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Creating: Show Save and Cancel buttons
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    picker: {
        backgroundColor: '#222',
        borderRadius: 8,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    pickerText: {
        fontSize: 16,
        color: '#fff',
    },
    placeholder: {
        color: '#666',
    },
    memberList: {
        backgroundColor: '#222',
        borderRadius: 8,
        marginBottom: 12,
        maxHeight: 200,
    },
    memberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    memberName: {
        fontSize: 16,
        color: '#fff',
    },
    memberInfoBox: {
        backgroundColor: '#222',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    memberInfoLabel: {
        fontSize: 14,
        color: '#888',
    },
    memberInfoText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    rowFields: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    halfField: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#222',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        color: '#fff',
    },
    modalActions: {
        flexDirection: 'column',
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
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
    deleteBtn: {
        backgroundColor: '#dc2626',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    deleteText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
