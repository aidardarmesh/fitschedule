import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function OnboardingScreen() {
    const { updateProfile } = useApp();
    const [name, setName] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | undefined>();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const handleContinue = () => {
        if (name.trim()) {
            updateProfile({
                name: name.trim(),
                avatarUri,
                onboardingComplete: true,
            });
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Welcome to FitSchedule</Text>
                <Text style={styles.subtitle}>Let's set up your profile</Text>

                <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="camera" size={40} color="#666" />
                            <Text style={styles.avatarText}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                />

                <TouchableOpacity
                    style={[styles.button, !name.trim() && styles.buttonDisabled]}
                    onPress={handleContinue}
                    disabled={!name.trim()}
                >
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>
                    <Ionicons name="shield-checkmark-outline" size={14} color="#666" /> All application data is saved only on this device
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginBottom: 48,
    },
    avatarContainer: {
        marginBottom: 32,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1a1a1a',
        borderWidth: 2,
        borderColor: '#333',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    input: {
        width: '100%',
        height: 56,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#fff',
        marginBottom: 24,
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: '#4f46e5',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#333',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footerText: {
        fontSize: 12,
        color: '#666',
        marginTop: 24,
        textAlign: 'center',
    },
});
