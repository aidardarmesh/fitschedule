import SessionModal from '@/components/SessionModal';
import { useApp } from '@/context/AppContext';
import { Session } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SessionWithMember extends Session {
    memberName: string;
    memberWhatsapp: string;
}

export default function SessionsScreen() {
    const { data } = useApp();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);

    // Join sessions with member data
    const sessionsWithMembers: SessionWithMember[] = data.sessions
        .map((session) => {
            const member = data.members.find((m) => m.id === session.memberId);
            if (!member) return null;
            return {
                ...session,
                memberName: member.name,
                memberWhatsapp: member.whatsapp,
            };
        })
        .filter((s): s is SessionWithMember => s !== null)
        .sort((a, b) => a.remaining - b.remaining); // Sort by remaining (ascending)

    const openWhatsApp = (phone: string) => {
        const url = `whatsapp://send?phone=${phone.replace(/\D/g, '')}`;
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Could not open WhatsApp');
        });
    };

    const getStatusColor = (remaining: number) => {
        if (remaining <= 0) return '#ef4444';
        if (remaining <= 3) return '#f59e0b';
        return '#22c55e';
    };

    const handleAdd = () => {
        setSelectedSession(undefined);
        setModalVisible(true);
    };

    const handleEdit = (session: Session) => {
        setSelectedSession(session);
        setModalVisible(true);
    };

    const renderSession = ({ item }: { item: SessionWithMember }) => (
        <View style={styles.card}>
            <View style={styles.leftSection}>
                <View
                    style={[
                        styles.indicator,
                        { backgroundColor: getStatusColor(item.remaining) },
                    ]}
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.memberName}</Text>
                    <Text
                        style={[
                            styles.sessions,
                            item.remaining <= 0 && styles.negative,
                        ]}
                    >
                        {item.remaining} / {item.total} sessions
                    </Text>
                </View>
            </View>

            <View style={styles.memberActions}>
                {item.memberWhatsapp && (
                    <TouchableOpacity
                        style={styles.whatsappBtn}
                        onPress={() => openWhatsApp(item.memberWhatsapp)}
                    >
                        <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleEdit(item)}
                >
                    <Ionicons name="create-outline" size={20} color="#4f46e5" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Sessions</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAdd}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={sessionsWithMembers}
                keyExtractor={(item) => item.id}
                renderItem={renderSession}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="fitness-outline" size={64} color="#333" />
                        <Text style={styles.emptyText}>No sessions yet</Text>
                        <Text style={styles.emptySubtext}>
                            Tap the + button to add a session
                        </Text>
                    </View>
                }
            />

            <SessionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                session={selectedSession}
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
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    indicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    sessions: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    negative: {
        color: '#ef4444',
    },
    memberActions: {
        flexDirection: 'row',
        gap: 8,
    },
    whatsappBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#1a1a1a',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: '#666',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#444',
        fontSize: 14,
        marginTop: 8,
    },
});
