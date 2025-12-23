import { AppData, AppSettings, Event, GroupSession, Member, Series, Session, UserProfile } from '@/types';
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
    addMembers: (members: Omit<Member, 'id' | 'createdAt'>[]) => void;
    updateMember: (id: string, updates: Partial<Member>) => void;
    deleteMember: (id: string) => void;

    // Sessions
    addSession: (session: Omit<Session, 'id' | 'createdAt'>) => void;
    updateSession: (id: string, updates: Partial<Session>) => void;
    deleteSession: (id: string) => void;

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
        sessions: [],
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
            id: generateId(),
            name: member.name,
            whatsapp: member.whatsapp,
            createdAt: new Date().toISOString(),
        };
        persistData({ ...data, members: [...data.members, newMember] });
    }, [data, persistData]);

    const addMembers = useCallback((members: Omit<Member, 'id' | 'createdAt'>[]) => {
        const newMembers: Member[] = members.map((member) => ({
            id: generateId(),
            name: member.name,
            whatsapp: member.whatsapp,
            createdAt: new Date().toISOString(),
        }));
        persistData({ ...data, members: [...data.members, ...newMembers] });
    }, [data, persistData]);

    const updateMember = useCallback((id: string, updates: Partial<Member>) => {
        persistData({
            ...data,
            members: data.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        });
    }, [data, persistData]);

    const deleteMember = useCallback((id: string) => {
        // Remove the member
        const updatedMembers = data.members.filter((m) => m.id !== id);
        
        // Remove all events associated with this member
        const updatedEvents = data.events.filter((e) => e.memberId !== id);
        
        // Remove all series associated with this member
        const updatedSeries = data.series.filter((s) => s.memberId !== id);
        
        // Remove all sessions associated with this member
        const updatedSessions = data.sessions.filter((s) => s.memberId !== id);
        
        // Remove member from all groups and clean up orphaned groups
        const updatedGroups = data.groups
            .map((g) => ({
                ...g,
                memberIds: g.memberIds.filter((memberId) => memberId !== id),
            }))
            .filter((g) => g.memberIds.length > 0); // Remove groups with no members
        
        // Remove events for orphaned groups (groups that were deleted)
        const remainingGroupIds = new Set(updatedGroups.map((g) => g.id));
        const finalEvents = updatedEvents.filter((e) => 
            !e.groupId || remainingGroupIds.has(e.groupId)
        );
        
        // Remove series for orphaned groups
        const finalSeries = updatedSeries.filter((s) => 
            !s.groupId || remainingGroupIds.has(s.groupId)
        );
        
        persistData({
            ...data,
            members: updatedMembers,
            events: finalEvents,
            series: finalSeries,
            groups: updatedGroups,
            sessions: updatedSessions,
        });
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

        // Get member IDs associated with this event
        let memberIds: string[] = [];
        if (event.type === 'person' && event.memberId) {
            memberIds = [event.memberId];
        } else if (event.type === 'group' && event.groupId) {
            const group = data.groups.find((g) => g.id === event.groupId);
            if (group) {
                memberIds = group.memberIds;
            }
        }

        // Deduct 1 from remaining sessions for all associated members
        const updatedSessions = data.sessions.map((session) => {
            if (memberIds.includes(session.memberId) && session.remaining > 0) {
                return { ...session, remaining: session.remaining - 1 };
            }
            return session;
        });
        
        persistData({
            ...data,
            events: data.events.map((e) => (e.id === id ? { ...e, status: 'completed' } : e)),
            sessions: updatedSessions,
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
        const completedEventIds: string[] = [];
        
        const updatedEvents = data.events.map((event) => {
            if (event.status !== 'scheduled') return event;

            const eventDateTime = new Date(`${event.date}T${event.time}`);
            eventDateTime.setMinutes(eventDateTime.getMinutes() + event.duration);

            if (eventDateTime < now) {
                completedEventIds.push(event.id);
                return { ...event, status: 'completed' as const };
            }
            return event;
        });

        if (completedEventIds.length === 0) return;

        // Get all member IDs from completed events
        const affectedMemberIds = new Set<string>();
        completedEventIds.forEach((eventId) => {
            const event = data.events.find((e) => e.id === eventId);
            if (!event) return;

            if (event.type === 'person' && event.memberId) {
                affectedMemberIds.add(event.memberId);
            } else if (event.type === 'group' && event.groupId) {
                const group = data.groups.find((g) => g.id === event.groupId);
                if (group) {
                    group.memberIds.forEach((memberId) => affectedMemberIds.add(memberId));
                }
            }
        });

        // Deduct sessions for affected members (once per member, not per event)
        const updatedSessions = data.sessions.map((session) => {
            if (affectedMemberIds.has(session.memberId) && session.remaining > 0) {
                // Count how many events this member was in
                const memberEventCount = completedEventIds.filter((eventId) => {
                    const event = data.events.find((e) => e.id === eventId);
                    if (!event) return false;
                    if (event.type === 'person') return event.memberId === session.memberId;
                    if (event.type === 'group' && event.groupId) {
                        const group = data.groups.find((g) => g.id === event.groupId);
                        return group?.memberIds.includes(session.memberId);
                    }
                    return false;
                }).length;

                return { 
                    ...session, 
                    remaining: Math.max(0, session.remaining - memberEventCount)
                };
            }
            return session;
        });

        persistData({ ...data, events: updatedEvents, sessions: updatedSessions });
    }, [data, persistData]);

    const addSession = useCallback((session: Omit<Session, 'id' | 'createdAt'>) => {
        const newSession: Session = {
            id: generateId(),
            memberId: session.memberId,
            total: session.total,
            remaining: session.remaining,
            createdAt: new Date().toISOString(),
        };
        persistData({ ...data, sessions: [...data.sessions, newSession] });
    }, [data, persistData]);

    const updateSession = useCallback((id: string, updates: Partial<Session>) => {
        persistData({
            ...data,
            sessions: data.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        });
    }, [data, persistData]);

    const deleteSession = useCallback((id: string) => {
        persistData({ ...data, sessions: data.sessions.filter((s) => s.id !== id) });
    }, [data, persistData]);

    return (
        <AppContext.Provider
            value={{
                data,
                isLoading,
                updateProfile,
                updateSettings,
                addMember,
                addMembers,
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
                addSession,
                updateSession,
                deleteSession,
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
