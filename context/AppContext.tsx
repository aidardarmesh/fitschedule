import { AppData, AppSettings, Event, GroupSession, Member, Series, UserProfile } from '@/types';
import { generateId, loadAppData, saveAppData } from '@/utils/storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AppContextType {
    data: AppData;
    isLoading: boolean;

    // Profile
    updateProfile: (profile: Partial<UserProfile>) => void;

    // Settings
    updateSettings: (settings: Partial<AppSettings>) => void;

    // Members
    addMember: (member: Omit<Member, 'id' | 'createdAt'>) => void;
    updateMember: (id: string, updates: Partial<Member>) => void;
    deleteMember: (id: string) => void;

    // Groups
    addGroup: (group: Omit<GroupSession, 'id'>) => void;
    updateGroup: (id: string, updates: Partial<GroupSession>) => void;
    deleteGroup: (id: string) => void;

    // Events
    addEvent: (event: Omit<Event, 'id'>) => void;
    updateEvent: (id: string, updates: Partial<Event>) => void;
    deleteEvent: (id: string) => void;
    markEventCompleted: (id: string) => void;
    markEventSkipped: (id: string) => void;

    // Series
    createSeries: (series: Omit<Series, 'id'>) => void;

    // Group creation helpers (persist group + schedule in a single state update)
    createGroupEvent: (payload: {
        name: string;
        color: string;
        memberIds: string[];
        sessionsTotal: number;
        date: string;
        time: string;
        duration: number;
        notes?: string;
    }) => void;
    createGroupSeries: (payload: {
        name: string;
        color: string;
        memberIds: string[];
        sessionsTotal: number;
        weekdays: number[];
        startDate: string;
        time: string;
        duration: number;
        notes?: string;
    }) => void;

    // Session management
    processCompletedEvents: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<AppData>({
        profile: { name: '', onboardingComplete: false },
        settings: { calendarViewType: 'day' },
        members: [],
        groups: [],
        events: [],
        series: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAppData().then((loaded) => {
            setData(loaded);
            setIsLoading(false);
        });
    }, []);

    const persistData = useCallback((newData: AppData) => {
        setData(newData);
        saveAppData(newData);
    }, []);

    const updateProfile = useCallback((profile: Partial<UserProfile>) => {
        persistData({ ...data, profile: { ...data.profile, ...profile } });
    }, [data, persistData]);

    const updateSettings = useCallback((settings: Partial<AppSettings>) => {
        persistData({ ...data, settings: { ...data.settings, ...settings } });
    }, [data, persistData]);

    const addMember = useCallback((member: Omit<Member, 'id' | 'createdAt'>) => {
        const newMember: Member = {
            ...member,
            id: generateId(),
            createdAt: new Date().toISOString(),
        };
        persistData({ ...data, members: [...data.members, newMember] });
    }, [data, persistData]);

    const updateMember = useCallback((id: string, updates: Partial<Member>) => {
        persistData({
            ...data,
            members: data.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        });
    }, [data, persistData]);

    const deleteMember = useCallback((id: string) => {
        persistData({ ...data, members: data.members.filter((m) => m.id !== id) });
    }, [data, persistData]);

    const addGroup = useCallback((group: Omit<GroupSession, 'id'>) => {
        const newGroup: GroupSession = { ...group, id: generateId() };
        persistData({ ...data, groups: [...data.groups, newGroup] });
    }, [data, persistData]);

    const updateGroup = useCallback((id: string, updates: Partial<GroupSession>) => {
        persistData({
            ...data,
            groups: data.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        });
    }, [data, persistData]);

    const deleteGroup = useCallback((id: string) => {
        persistData({ ...data, groups: data.groups.filter((g) => g.id !== id) });
    }, [data, persistData]);

    const addEvent = useCallback((event: Omit<Event, 'id'>) => {
        const newEvent: Event = { ...event, id: generateId() };
        persistData({ ...data, events: [...data.events, newEvent] });
    }, [data, persistData]);

    const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
        persistData({
            ...data,
            events: data.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        });
    }, [data, persistData]);

    const deleteEvent = useCallback((id: string) => {
        persistData({ ...data, events: data.events.filter((e) => e.id !== id) });
    }, [data, persistData]);

    const markEventCompleted = useCallback((id: string) => {
        const event = data.events.find((e) => e.id === id);
        if (!event || event.status === 'completed') return;

        let updatedMembers = [...data.members];

        if (event.type === 'person' && event.memberId) {
            updatedMembers = updatedMembers.map((m) =>
                m.id === event.memberId ? { ...m, sessionsRemaining: m.sessionsRemaining - 1 } : m
            );
        } else if (event.type === 'group' && event.groupId) {
            const group = data.groups.find((g) => g.id === event.groupId);
            if (group) {
                updatedMembers = updatedMembers.map((m) =>
                    group.memberIds.includes(m.id) ? { ...m, sessionsRemaining: m.sessionsRemaining - 1 } : m
                );
            }
        }

        persistData({
            ...data,
            members: updatedMembers,
            events: data.events.map((e) => (e.id === id ? { ...e, status: 'completed' } : e)),
        });
    }, [data, persistData]);

    const markEventSkipped = useCallback((id: string) => {
        updateEvent(id, { status: 'skipped' });
    }, [updateEvent]);

    const createSeries = useCallback((series: Omit<Series, 'id'>) => {
        const newSeries: Series = { ...series, id: generateId() };
        const events: Event[] = [];

        const startDate = new Date(series.startDate);
        let eventsCreated = 0;
        let currentDate = new Date(startDate);

        // Generate events for the series (up to sessionsTotal)
        while (eventsCreated < series.sessionsTotal) {
            const dayOfWeek = currentDate.getDay();
            if (series.weekdays.includes(dayOfWeek)) {
                events.push({
                    id: generateId(),
                    type: series.type,
                    memberId: series.memberId,
                    groupId: series.groupId,
                    date: currentDate.toISOString().split('T')[0],
                    time: series.time,
                    duration: series.duration,
                    notes: series.notes,
                    status: 'scheduled',
                    seriesId: newSeries.id,
                });
                eventsCreated++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        persistData({
            ...data,
            series: [...data.series, newSeries],
            events: [...data.events, ...events],
        });
    }, [data, persistData]);

    const createGroupEvent = useCallback((payload: {
        name: string;
        color: string;
        memberIds: string[];
        sessionsTotal: number;
        date: string;
        time: string;
        duration: number;
        notes?: string;
    }) => {
        const groupId = generateId();
        const newGroup: GroupSession = {
            id: groupId,
            name: payload.name,
            color: payload.color,
            memberIds: payload.memberIds,
            sessionsTotal: payload.sessionsTotal,
        };

        const newEvent: Event = {
            id: generateId(),
            type: 'group',
            groupId,
            date: payload.date,
            time: payload.time,
            duration: payload.duration,
            notes: payload.notes,
            status: 'scheduled',
        };

        persistData({
            ...data,
            groups: [...data.groups, newGroup],
            events: [...data.events, newEvent],
        });
    }, [data, persistData]);

    const createGroupSeries = useCallback((payload: {
        name: string;
        color: string;
        memberIds: string[];
        sessionsTotal: number;
        weekdays: number[];
        startDate: string;
        time: string;
        duration: number;
        notes?: string;
    }) => {
        const groupId = generateId();
        const newGroup: GroupSession = {
            id: groupId,
            name: payload.name,
            color: payload.color,
            memberIds: payload.memberIds,
            sessionsTotal: payload.sessionsTotal,
        };

        const newSeries: Series = {
            id: generateId(),
            type: 'group',
            groupId,
            weekdays: payload.weekdays,
            startDate: payload.startDate,
            time: payload.time,
            duration: payload.duration,
            sessionsTotal: payload.sessionsTotal,
            notes: payload.notes,
        };

        const events: Event[] = [];
        const startDate = new Date(payload.startDate);
        let eventsCreated = 0;
        let currentDate = new Date(startDate);

        while (eventsCreated < payload.sessionsTotal) {
            const dayOfWeek = currentDate.getDay();
            if (payload.weekdays.includes(dayOfWeek)) {
                events.push({
                    id: generateId(),
                    type: 'group',
                    groupId,
                    date: currentDate.toISOString().split('T')[0],
                    time: payload.time,
                    duration: payload.duration,
                    notes: payload.notes,
                    status: 'scheduled',
                    seriesId: newSeries.id,
                });
                eventsCreated++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        persistData({
            ...data,
            groups: [...data.groups, newGroup],
            series: [...data.series, newSeries],
            events: [...data.events, ...events],
        });
    }, [data, persistData]);

    const processCompletedEvents = useCallback(() => {
        const now = new Date();
        const updatedEvents = data.events.map((event) => {
            if (event.status !== 'scheduled') return event;

            const eventDateTime = new Date(`${event.date}T${event.time}`);
            eventDateTime.setMinutes(eventDateTime.getMinutes() + event.duration);

            if (eventDateTime < now) {
                return { ...event, status: 'completed' as const };
            }
            return event;
        });

        // Calculate session decreases
        let updatedMembers = [...data.members];
        updatedEvents.forEach((event, index) => {
            const original = data.events[index];
            if (original?.status === 'scheduled' && event.status === 'completed') {
                if (event.type === 'person' && event.memberId) {
                    updatedMembers = updatedMembers.map((m) =>
                        m.id === event.memberId ? { ...m, sessionsRemaining: m.sessionsRemaining - 1 } : m
                    );
                } else if (event.type === 'group' && event.groupId) {
                    const group = data.groups.find((g) => g.id === event.groupId);
                    if (group) {
                        updatedMembers = updatedMembers.map((m) =>
                            group.memberIds.includes(m.id) ? { ...m, sessionsRemaining: m.sessionsRemaining - 1 } : m
                        );
                    }
                }
            }
        });

        if (JSON.stringify(updatedEvents) !== JSON.stringify(data.events)) {
            persistData({ ...data, events: updatedEvents, members: updatedMembers });
        }
    }, [data, persistData]);

    return (
        <AppContext.Provider
            value={{
                data,
                isLoading,
                updateProfile,
                updateSettings,
                addMember,
                updateMember,
                deleteMember,
                addGroup,
                updateGroup,
                deleteGroup,
                addEvent,
                updateEvent,
                deleteEvent,
                markEventCompleted,
                markEventSkipped,
                createSeries,
                createGroupEvent,
                createGroupSeries,
                processCompletedEvents,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
