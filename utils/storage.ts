import { AppData } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'fitschedule_data';

const defaultData: AppData = {
    profile: {
        name: '',
        avatarUri: undefined,
        onboardingComplete: false,
    },
    settings: {
        calendarViewType: 'day',
    },
    members: [],
    groups: [],
    events: [],
    series: [],
    sessions: [],
};

export async function loadAppData(): Promise<AppData> {
    try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
            return { ...defaultData, ...JSON.parse(json) };
        }
        return defaultData;
    } catch (error) {
        console.error('Error loading app data:', error);
        return defaultData;
    }
}

export async function saveAppData(data: AppData): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving app data:', error);
    }
}

export async function clearAppData(): Promise<void> {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing app data:', error);
    }
}

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
