import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const APP_VERSION = '1.0.0';
const AUTHOR = 'FitSchedule Team';
const SIDEBAR_WIDTH = 280;
const ANIMATION_DURATION = 300;

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { data, updateSettings, resetAllData } = useApp();
    const { calendarViewType } = data.settings;
    const insets = useSafeAreaInsets();

    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Animate in: slide from left, fade in overlay
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: ANIMATION_DURATION,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 1,
                    duration: ANIMATION_DURATION,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Reset to initial state
            slideAnim.setValue(-SIDEBAR_WIDTH);
            overlayAnim.setValue(0);
        }
    }, [isOpen]);

    const handleClose = () => {
        // Animate out: slide to left, fade out overlay
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -SIDEBAR_WIDTH,
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(overlayAnim, {
                toValue: 0,
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    if (!isOpen) return null;

    const viewOptions: { key: 'day' | '3day' | 'week'; label: string }[] = [
        { key: 'day', label: 'Day' },
        { key: '3day', label: '3 Day' },
        { key: 'week', label: 'Week' },
    ];

    const handleFeedback = () => {
        Linking.openURL('https://forms.gle/PrefXnsavdF4QBKC8');
    };

    const handleDeleteAccount = () => {
        // Reset all app data atomically (profile, members, events, sessions, etc.)
        resetAllData();

        // Close the sidebar and confirmation dialog
        setShowDeleteConfirmation(false);
        onClose();
    };

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={styles.modalContainer}>
                <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
                </Animated.View>
                <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }], paddingTop: insets.top + 12 }]}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {data.profile.onboardingComplete && (
                        <View style={styles.section}>
                            <View style={styles.profileContainer}>
                                {data.profile.avatarUri ? (
                                    <Image
                                        source={{ uri: data.profile.avatarUri }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Ionicons name="person" size={32} color="#666" />
                                    </View>
                                )}
                                <Text style={styles.profileName}>{data.profile.name}</Text>
                            </View>
                        </View>
                    )}

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

                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.dangerOptionRow}
                            onPress={() => setShowDeleteConfirmation(true)}
                        >
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            <Text style={styles.dangerOptionText}>Delete Account</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Delete Confirmation Modal */}
                    <Modal
                        visible={showDeleteConfirmation}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowDeleteConfirmation(false)}
                    >
                        <View style={styles.confirmationOverlay}>
                            <View style={styles.confirmationDialog}>
                                <Ionicons name="warning" size={48} color="#ef4444" style={styles.warningIcon} />
                                <Text style={styles.confirmationTitle}>Delete Account?</Text>
                                <Text style={styles.confirmationMessage}>
                                    This will permanently delete all your data including:
                                </Text>
                                <View style={styles.dataList}>
                                    <Text style={styles.dataListItem}>• Profile (name and avatar)</Text>
                                    <Text style={styles.dataListItem}>• All contacts</Text>
                                    <Text style={styles.dataListItem}>• All events and sessions</Text>
                                </View>
                                <Text style={styles.confirmationWarning}>
                                    This action cannot be undone.
                                </Text>
                                <View style={styles.confirmationButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowDeleteConfirmation(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={handleDeleteAccount}
                                    >
                                        <Text style={styles.deleteButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Version {APP_VERSION}</Text>
                        <Text style={styles.footerText}>{AUTHOR}</Text>
                    </View>
                </Animated.View>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
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
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#1a1a1a',
        borderWidth: 2,
        borderColor: '#4f46e5',
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#333',
    },
    profileName: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
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
    dangerOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 12,
    },
    dangerOptionText: {
        flex: 1,
        fontSize: 16,
        color: '#ef4444',
        fontWeight: '500',
    },
    confirmationOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    confirmationDialog: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#333',
    },
    warningIcon: {
        alignSelf: 'center',
        marginBottom: 16,
    },
    confirmationTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    confirmationMessage: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
    },
    dataList: {
        backgroundColor: '#0a0a0a',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    dataListItem: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 8,
        lineHeight: 20,
    },
    confirmationWarning: {
        fontSize: 14,
        color: '#ef4444',
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 24,
    },
    confirmationButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        backgroundColor: '#333',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        flex: 1,
        height: 48,
        backgroundColor: '#ef4444',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
