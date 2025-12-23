// FitSchedule App Types

export interface Member {
    id: string;
    name: string;
    whatsapp: string;
    createdAt: string;
}

export interface Event {
    id: string;
    type: 'person' | 'group';
    memberId?: string; // For person events
    groupId?: string; // For group events
    date: string; // ISO date string
    time: string; // HH:mm format
    duration: number; // minutes
    notes?: string;
    status: 'scheduled' | 'completed' | 'skipped';
    seriesId?: string; // Links events in a series
}

export interface GroupSession {
    id: string;
    name: string;
    color: string;
    memberIds: string[];
    sessionsTotal: number;
}

export interface Session {
    id: string;
    memberId: string;
    total: number;
    remaining: number;
    createdAt: string;
}

export interface Series {
    id: string;
    type: 'person' | 'group';
    memberId?: string;
    groupId?: string;
    weekdays: number[]; // 0-6 (Sun-Sat)
    startDate: string;
    time: string;
    duration: number;
    sessionsTotal: number;
    notes?: string;
}

export interface UserProfile {
    name: string;
    avatarUri?: string;
    onboardingComplete: boolean;
}

export interface AppSettings {
    calendarViewType: 'day' | '3day' | 'week';
}

export interface AppData {
    profile: UserProfile;
    settings: AppSettings;
    members: Member[];
    groups: GroupSession[];
    events: Event[];
    series: Series[];
    sessions: Session[];
}
