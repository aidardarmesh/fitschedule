import { useApp } from '@/context/AppContext';
import { Member } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SessionsScreen() {
    const { data } = useApp();

    // Sort members by sessions remaining (least to most)
    const sortedMembers = [...data.members].sort(
        (a, b) => a.sessionsRemaining - b.sessionsRemaining
    );

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

    const renderMember = ({ item }: { item: Member }) => (
        <View style={styles.card}>
            <View style={styles.leftSection}>
                <View
                    style={[
                        styles.indicator,
                        { backgroundColor: getStatusColor(item.sessionsRemaining) },
                    ]}
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text
                        style={[
                            styles.sessions,
                            item.sessionsRemaining <= 0 && styles.negative,
                        ]}
                    >
                        {item.sessionsRemaining} / {item.sessionsTotal} sessions
                    </Text>
                </View>
            </View>

            {item.whatsapp && (
                <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={() => openWhatsApp(item.whatsapp)}
                >
                    <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Sessions Left</Text>
            </View>

            <FlatList
                data={sortedMembers}
                keyExtractor={(item) => item.id}
                renderItem={renderMember}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No members yet.</Text>
                }
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
    whatsappBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#1a1a1a',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 60,
    },
});
