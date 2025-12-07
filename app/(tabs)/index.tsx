import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import EventModal from '@/components/calendar/EventModal';
import { useApp } from '@/context/AppContext';
import { Event } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HOUR_HEIGHT = 60;
const TIME_COLUMN_WIDTH = 50;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CalendarScreen() {
  const { data, processCompletedEvents } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<{ date: string; time: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          // Swipe right - go to previous day(s)
          navigateDays(-1);
        } else if (gestureState.dx < -50) {
          // Swipe left - go to next day(s)
          navigateDays(1);
        }
      },
    })
  ).current;

  function navigateDays(direction: number) {
    const viewType = data.settings.calendarViewType;
    const daysToMove = viewType === 'day' ? 1 : viewType === '3day' ? 3 : 7;
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + direction * daysToMove);
      return newDate;
    });
  }

  // Process completed events on app open
  useEffect(() => {
    processCompletedEvents();
    const interval = setInterval(processCompletedEvents, 60000);
    return () => clearInterval(interval);
  }, [processCompletedEvents]);

  // Scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const scrollToY = now.getHours() * HOUR_HEIGHT - 100;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, scrollToY), animated: false });
    }, 100);
  }, []);

  const viewType = data.settings.calendarViewType;
  const days = getDaysToShow(currentDate, viewType);
  const currentTimePosition = getCurrentTimePosition();

  function getDaysToShow(date: Date, view: 'day' | '3day' | 'week'): Date[] {
    const result: Date[] = [];
    const count = view === 'day' ? 1 : view === '3day' ? 3 : 7;

    const start = new Date(date);
    if (view === 'week') {
      start.setDate(start.getDate() - start.getDay());
    }

    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      result.push(d);
    }
    return result;
  }

  function getCurrentTimePosition(): number {
    const now = new Date();
    return now.getHours() * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT;
  }

  function handleTimeSlotPress(date: Date, hour: number, minute: number) {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    setSelectedTime({ date: dateStr, time: timeStr });
  }

  function getEventsForDay(date: Date): Event[] {
    const dateStr = date.toISOString().split('T')[0];
    return data.events.filter((e) => e.date === dateStr);
  }

  const dayWidth = (SCREEN_WIDTH - TIME_COLUMN_WIDTH) / days.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar
        onMenuPress={() => setSidebarOpen(true)}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
      />

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        <View style={{ width: TIME_COLUMN_WIDTH }} />
        {days.map((day, i) => {
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <View key={i} style={[styles.dayHeader, { width: dayWidth }]}>
              <Text style={[styles.dayName, isToday && styles.todayText]}>
                {day.toLocaleDateString('en', { weekday: 'short' })}
              </Text>
              <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
                {day.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        {...panResponder.panHandlers}
      >
        <View style={styles.grid}>
          {/* Time column */}
          <View style={styles.timeColumn}>
            {Array.from({ length: 24 }).map((_, hour) => (
              <View key={hour} style={styles.timeSlot}>
                <Text style={styles.timeText}>
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {days.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <View key={dayIndex} style={[styles.dayColumn, { width: dayWidth }]}>
                {Array.from({ length: 48 }).map((_, slotIndex) => {
                  const hour = Math.floor(slotIndex / 2);
                  const minute = (slotIndex % 2) * 30;
                  return (
                    <TouchableOpacity
                      key={slotIndex}
                      style={styles.slot}
                      onPress={() => handleTimeSlotPress(day, hour, minute)}
                    />
                  );
                })}

                {/* Render events */}
                {dayEvents.map((event) => {
                  const [hours, mins] = event.time.split(':').map(Number);
                  const top = hours * HOUR_HEIGHT + (mins / 60) * HOUR_HEIGHT;
                  const height = (event.duration / 60) * HOUR_HEIGHT;
                  const isSkipped = event.status === 'skipped';

                  const member = data.members.find((m) => m.id === event.memberId);
                  const group = data.groups.find((g) => g.id === event.groupId);
                  const eventName = event.type === 'person' ? member?.name : group?.name;

                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={[
                        styles.event,
                        { top, height: Math.max(height, 30) },
                        isSkipped && styles.skippedEvent,
                        event.type === 'group' && styles.groupEvent,
                      ]}
                      onPress={() => setSelectedEvent(event)}
                    >
                      <View style={styles.eventContent}>
                        <Ionicons
                          name={event.type === 'person' ? 'person' : 'people'}
                          size={12}
                          color={isSkipped ? '#888' : '#fff'}
                          style={styles.eventIcon}
                        />
                        <Text
                          style={[styles.eventText, isSkipped && styles.skippedText]}
                          numberOfLines={1}
                        >
                          {eventName || 'Unnamed'}
                        </Text>
                      </View>
                      {height >= 40 && (
                        <Text style={[styles.eventTime, isSkipped && styles.skippedText]}>
                          {event.time}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Current time line */}
                {isToday && (
                  <View style={[styles.currentTimeLine, { top: currentTimePosition }]}>
                    <View style={styles.currentTimeDot} />
                    <View style={styles.currentTimeBar} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {(selectedTime || selectedEvent) && (
        <EventModal
          date={selectedTime?.date || selectedEvent?.date || ''}
          time={selectedTime?.time || selectedEvent?.time || ''}
          event={selectedEvent}
          onClose={() => {
            setSelectedTime(null);
            setSelectedEvent(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  dayHeaders: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingVertical: 8,
  },
  dayHeader: {
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    color: '#888',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  todayText: {
    color: '#4f46e5',
  },
  todayNumber: {
    color: '#fff',
    backgroundColor: '#4f46e5',
    width: 32,
    height: 32,
    lineHeight: 32,
    borderRadius: 16,
    textAlign: 'center',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: TIME_COLUMN_WIDTH,
  },
  timeSlot: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingRight: 8,
  },
  timeText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  dayColumn: {
    borderLeftWidth: 1,
    borderLeftColor: '#1a1a1a',
    position: 'relative',
  },
  slot: {
    height: HOUR_HEIGHT / 2,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  event: {
    position: 'absolute',
    left: 2,
    right: 2,
    backgroundColor: '#4f46e5',
    borderRadius: 6,
    padding: 6,
    overflow: 'hidden',
  },
  groupEvent: {
    backgroundColor: '#22c55e',
  },
  skippedEvent: {
    backgroundColor: '#333',
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    marginRight: 4,
  },
  eventText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  eventTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  skippedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginLeft: -4,
  },
  currentTimeBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#ef4444',
  },
});
