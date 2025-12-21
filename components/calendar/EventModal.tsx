import { useApp } from '@/context/AppContext';
import { Event } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EventModalProps {
    date: string;
    time: string;
    event?: Event | null;
    onClose: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function EventModal({ date, time, event, onClose }: EventModalProps) {
    const { data, addEvent, updateEvent, deleteEvent, createSeries, markEventSkipped } = useApp();

    const [eventType, setEventType] = useState<'person' | 'group'>(event?.type || 'person');
    const [selectedMemberId, setSelectedMemberId] = useState(event?.memberId || '');
    const [groupName, setGroupName] = useState('');
    const [groupColor, setGroupColor] = useState(COLORS[0]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [sessionsTotal, setSessionsTotal] = useState('12');
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([new Date(date).getDay()]);
    const [startDate, setStartDate] = useState(date);
    const [eventTime, setEventTime] = useState(time);
    const [duration, setDuration] = useState('60');
    const [notes, setNotes] = useState(event?.notes || '');
    const [isClosing, setIsClosing] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    const isEditing = !!event;

    // Slide up animation on mount
    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [slideAnim, overlayOpacity]);

    // Handle close with animation
    const handleClose = () => {
        setIsClosing(true);
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    const toggleWeekday = (day: number) => {
        setSelectedWeekdays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const toggleMember = (id: string) => {
        setSelectedMemberIds((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    };

    const handleSave = () => {
        const sessionsNum = parseInt(sessionsTotal) || 1;
        const durationNum = parseInt(duration) || 60;

        if (eventType === 'person') {
            if (!selectedMemberId) {
                Alert.alert('Error', 'Please select a member');
                return;
            }

            if (sessionsNum === 1) {
                addEvent({
                    type: 'person',
                    memberId: selectedMemberId,
                    date: startDate,
                    time: eventTime,
                    duration: durationNum,
                    notes,
                    status: 'scheduled',
                });
            } else {
                createSeries({
                    type: 'person',
                    memberId: selectedMemberId,
                    weekdays: selectedWeekdays,
                    startDate,
                    time: eventTime,
                    duration: durationNum,
                    sessionsTotal: sessionsNum,
                    notes,
                });
            }
        } else {
            if (!groupName.trim()) {
                Alert.alert('Error', 'Please enter group name');
                return;
            }

            // For groups, we'd need to add group first, then create events
            // Simplified: create single event for now
            addEvent({
                type: 'group',
                date: startDate,
                time: eventTime,
                duration: durationNum,
                notes,
                status: 'scheduled',
            });
        }

        onClose();
    };

    const handleDelete = () => {
        if (event) {
            Alert.alert('Delete Event', 'Are you sure?', [
                { text: 'Cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => { deleteEvent(event.id); handleClose(); } },
            ]);
        }
    };

    const handleSkip = () => {
        if (event) {
            markEventSkipped(event.id);
            handleClose();
        }
    };

    const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            setEventTime(`${hours}:${minutes}`);
        }
    };

    // Convert eventTime string to Date for the picker
    const getTimeAsDate = () => {
        const [hours, minutes] = eventTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours || 0, minutes || 0, 0, 0);
        return date;
    };

    return (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <Animated.View style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
                    <TouchableOpacity onPress={handleClose}>
                        <Ionicons name="close" size={24} color="#888" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 150 }}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Event Type Toggle */}
                    {!isEditing && (
                        <View style={styles.typeToggle}>
                            <TouchableOpacity
                                style={[styles.typeBtn, eventType === 'person' && styles.typeBtnActive]}
                                onPress={() => setEventType('person')}
                            >
                                <Ionicons name="person" size={20} color={eventType === 'person' ? '#fff' : '#888'} />
                                <Text style={[styles.typeText, eventType === 'person' && styles.typeTextActive]}>
                                    Person
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, eventType === 'group' && styles.typeBtnActive]}
                                onPress={() => setEventType('group')}
                            >
                                <Ionicons name="people" size={20} color={eventType === 'group' ? '#fff' : '#888'} />
                                <Text style={[styles.typeText, eventType === 'group' && styles.typeTextActive]}>
                                    Group
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {eventType === 'person' ? (
                        <>
                            <Text style={styles.label}>Select Member</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberList}>
                                {data.members.map((member) => (
                                    <TouchableOpacity
                                        key={member.id}
                                        style={[styles.memberChip, selectedMemberId === member.id && styles.memberChipActive]}
                                        onPress={() => setSelectedMemberId(member.id)}
                                    >
                                        <Text style={[styles.memberChipText, selectedMemberId === member.id && styles.activeText]}>
                                            {member.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>Group Name</Text>
                            <TextInput
                                style={styles.input}
                                value={groupName}
                                onChangeText={setGroupName}
                                placeholder="Enter group name"
                                placeholderTextColor="#666"
                            />

                            <Text style={styles.label}>Color</Text>
                            <View style={styles.colorRow}>
                                {COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[styles.colorDot, { backgroundColor: color }, groupColor === color && styles.colorSelected]}
                                        onPress={() => setGroupColor(color)}
                                    />
                                ))}
                            </View>

                            <Text style={styles.label}>Members</Text>
                            <View style={styles.memberGrid}>
                                {data.members.map((member) => (
                                    <TouchableOpacity
                                        key={member.id}
                                        style={[styles.memberChip, selectedMemberIds.includes(member.id) && styles.memberChipActive]}
                                        onPress={() => toggleMember(member.id)}
                                    >
                                        <Text style={[styles.memberChipText, selectedMemberIds.includes(member.id) && styles.activeText]}>
                                            {member.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {!isEditing && (
                        <>
                            <Text style={styles.label}>Sessions Total</Text>
                            <TextInput
                                style={styles.input}
                                value={sessionsTotal}
                                onChangeText={setSessionsTotal}
                                keyboardType="number-pad"
                            />

                            <Text style={styles.label}>Weekdays</Text>
                            <View style={styles.weekdayRow}>
                                {WEEKDAYS.map((day, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.weekdayBtn, selectedWeekdays.includes(i) && styles.weekdayBtnActive]}
                                        onPress={() => toggleWeekday(i)}
                                    >
                                        <Text style={[styles.weekdayText, selectedWeekdays.includes(i) && styles.activeText]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Time</Text>
                            <TouchableOpacity
                                style={styles.input}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Text style={styles.timeText}>{eventTime || 'HH:MM'}</Text>
                            </TouchableOpacity>
                            {showTimePicker && (
                                <DateTimePicker
                                    value={getTimeAsDate()}
                                    mode="time"
                                    is24Hour={true}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    themeVariant={Platform.OS === 'ios' ? 'dark' : undefined}
                                    textColor={Platform.OS === 'ios' ? '#fff' : undefined}
                                    onChange={handleTimeChange}
                                />
                            )}
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Duration (min)</Text>
                            <TextInput
                                style={styles.input}
                                value={duration}
                                onChangeText={setDuration}
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Notes (optional)</Text>
                    <TextInput
                        style={[styles.input, styles.notesInput]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Add notes..."
                        placeholderTextColor="#666"
                        multiline
                    />
                </ScrollView>

                <View style={styles.actions}>
                    {isEditing && (
                        <>
                            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                                <Text style={styles.skipText}>Skip</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveText}>{isEditing ? 'Update' : 'Create'}</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#111',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    typeToggle: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
    },
    typeBtnActive: {
        backgroundColor: '#4f46e5',
    },
    typeText: {
        fontSize: 14,
        color: '#888',
    },
    typeTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        color: '#fff',
    },
    timeText: {
        fontSize: 16,
        color: '#fff',
    },
    notesInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    memberList: {
        flexDirection: 'row',
    },
    memberGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    memberChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        marginRight: 8,
    },
    memberChipActive: {
        backgroundColor: '#4f46e5',
    },
    memberChipText: {
        color: '#888',
        fontSize: 14,
    },
    activeText: {
        color: '#fff',
    },
    colorRow: {
        flexDirection: 'row',
        gap: 12,
    },
    colorDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: '#fff',
    },
    weekdayRow: {
        flexDirection: 'row',
        gap: 6,
    },
    weekdayBtn: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        alignItems: 'center',
    },
    weekdayBtnActive: {
        backgroundColor: '#4f46e5',
    },
    weekdayText: {
        fontSize: 12,
        color: '#888',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    deleteBtn: {
        width: 48,
        height: 48,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipBtn: {
        paddingHorizontal: 20,
        height: 48,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipText: {
        color: '#888',
        fontSize: 14,
    },
    saveBtn: {
        flex: 1,
        height: 48,
        backgroundColor: '#4f46e5',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
