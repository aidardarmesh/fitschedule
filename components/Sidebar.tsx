import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const APP_VERSION = '1.0.0';
const AUTHOR = 'FitSchedule Team';

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { data, updateSettings } = useApp();
    const { calendarViewType } = data.settings;

    if (!isOpen) return null;

    const viewOptions: { key: 'day' | '3day' | 'week'; label: string }[] = [
        { key: 'day', label: 'Day' },
        { key: '3day', label: '3 Day' },
        { key: 'week', label: 'Week' },
    ];

    const handleFeedback = () => {
        Linking.openURL('mailto:feedback@fitschedule.app?subject=FitSchedule Feedback');
    };

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
                <View style={styles.sidebar}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Calendar View</Text>
                        {viewOptions.map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.optionRow,
                                    calendarViewType === option.key && styles.optionRowActive,
                                ]}
                                onPress={() => updateSettings({ calendarViewType: option.key })}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        calendarViewType === option.key && styles.optionTextActive,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                                {calendarViewType === option.key && (
                                    <Ionicons name="checkmark" size={20} color="#4f46e5" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <TouchableOpacity style={styles.optionRow} onPress={handleFeedback}>
                            <Ionicons name="mail-outline" size={20} color="#888" />
                            <Text style={styles.optionText}>Send Feedback</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Version {APP_VERSION}</Text>
                        <Text style={styles.footerText}>{AUTHOR}</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 280,
        backgroundColor: '#111',
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    section: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 12,
    },
    optionRowActive: {
        backgroundColor: '#1a1a2e',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#ccc',
    },
    optionTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#555',
        marginBottom: 4,
    },
});
