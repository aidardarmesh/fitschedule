import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface PhoneEntryModalProps {
    visible: boolean;
    contactName: string;
    onSave: (phoneNumber: string) => void;
    onSkip: () => void;
    onClose: () => void;
}

export default function PhoneEntryModal({
    visible,
    contactName,
    onSave,
    onSkip,
    onClose,
}: PhoneEntryModalProps) {
    const [phoneNumber, setPhoneNumber] = useState('');

    const handleSave = () => {
        if (phoneNumber.trim()) {
            onSave(phoneNumber.trim());
            setPhoneNumber('');
        }
    };

    const handleSkip = () => {
        onSkip();
        setPhoneNumber('');
    };

    const handleClose = () => {
        onClose();
        setPhoneNumber('');
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Ionicons name="phone-portrait-outline" size={32} color="#4f46e5" />
                    </View>

                    <Text style={styles.title}>Missing Phone Number</Text>
                    <Text style={styles.subtitle}>
                        <Text style={styles.contactName}>{contactName}</Text> doesn't have a phone number.
                        {'\n'}Enter a WhatsApp number or skip this contact.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="WhatsApp (with country code)"
                        placeholderTextColor="#666"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        autoFocus
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.skipButton]}
                            onPress={handleSkip}
                        >
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.saveButton,
                                !phoneNumber.trim() && styles.saveButtonDisabled,
                            ]}
                            onPress={handleSave}
                            disabled={!phoneNumber.trim()}
                        >
                            <Text
                                style={[
                                    styles.saveText,
                                    !phoneNumber.trim() && styles.saveTextDisabled,
                                ]}
                            >
                                Save
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                        <Text style={styles.cancelText}>Cancel Import</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    header: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2a2a3e',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    contactName: {
        fontWeight: '600',
        color: '#fff',
    },
    input: {
        width: '100%',
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#fff',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    actions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
        marginBottom: 12,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipButton: {
        backgroundColor: '#333',
    },
    skipText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#4f46e5',
    },
    saveButtonDisabled: {
        backgroundColor: '#2a2a3e',
        opacity: 0.5,
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    saveTextDisabled: {
        color: '#666',
    },
    cancelButton: {
        padding: 12,
    },
    cancelText: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
    },
});

