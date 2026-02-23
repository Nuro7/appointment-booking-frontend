import React, { useState, useEffect, useCallback } from 'react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    getDay, isToday, isBefore, startOfDay, isSameDay,
    addMonths, subMonths, getYear, getMonth,
} from 'date-fns';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Calendar component with availability indicators.
 * @param {object} props
 * @param {Date}   props.selectedDate   - Currently selected date
 * @param {function} props.onDateSelect - Called with a Date when user picks a day
 * @param {object} props.availability   - { "YYYY-MM-DD": { available, booked, total } }
 * @param {boolean} props.loading       - Whether availability data is loading
 */
export default function Calendar({ selectedDate, onDateSelect, availability = {}, loading }) {
    const [viewDate, setViewDate] = useState(selectedDate || new Date());

    // Keep view in sync when external selectedDate changes month
    useEffect(() => {
        if (selectedDate) setViewDate(selectedDate);
    }, [selectedDate]);

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Leading empty cells to align the first day of month
    const startPad = getDay(monthStart); // 0 = Sunday

    const prevMonth = () => setViewDate((d) => subMonths(d, 1));
    const nextMonth = () => setViewDate((d) => addMonths(d, 1));

    const handleDayClick = useCallback((day) => {
        const today = startOfDay(new Date());
        if (isBefore(day, today)) return; // block past dates
        onDateSelect(day);
    }, [onDateSelect]);

    const getDayInfo = (day) => {
        const key = format(day, 'yyyy-MM-dd');
        return availability[key] || null;
    };

    const getDotStatus = (info) => {
        if (!info || info.total === 0) return null;
        if (info.booked === info.total) return 'booked';
        if (info.available > 0 && info.booked > 0) return 'mixed';
        return 'available';
    };

    return (
        <div>
            {/* Month Navigation */}
            <div className="calendar-nav">
                <button className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">
                    ‹
                </button>
                <span className="calendar-month-label">
                    {format(viewDate, 'MMMM yyyy')}
                </span>
                <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">
                    ›
                </button>
            </div>

            {/* Day Name Headers */}
            <div className="calendar-grid-header">
                {DAY_NAMES.map((d) => (
                    <div key={d} className="calendar-day-name">{d}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
                {/* Leading empty cells */}
                {Array.from({ length: startPad }).map((_, i) => (
                    <div key={`pad-${i}`} className="calendar-day empty" />
                ))}

                {/* Day cells */}
                {days.map((day) => {
                    const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isTodayDay = isToday(day);
                    const dayInfo = getDayInfo(day);
                    const dotStatus = getDotStatus(dayInfo);

                    let className = 'calendar-day';
                    if (isPast) className += ' past';
                    if (isTodayDay) className += ' today';
                    if (isSelected) className += ' selected';
                    if (dayInfo && dayInfo.total > 0) className += ' has-slots';

                    return (
                        <button
                            key={day.toISOString()}
                            className={className}
                            onClick={() => handleDayClick(day)}
                            disabled={isPast}
                            aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                            aria-pressed={isSelected}
                        >
                            <span>{format(day, 'd')}</span>
                            <div className="slot-indicator">
                                {loading ? (
                                    <span
                                        className="slot-dot skeleton"
                                        style={{ width: 4, height: 4 }}
                                    />
                                ) : dotStatus ? (
                                    <span className={`slot-dot ${dotStatus}`} />
                                ) : null}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="legend-dot" style={{ background: 'var(--accent-emerald)' }} />
                    Available
                </div>
                <div className="legend-item">
                    <span className="legend-dot" style={{ background: 'var(--accent-amber)' }} />
                    Partial
                </div>
                <div className="legend-item">
                    <span className="legend-dot" style={{ background: 'var(--accent-rose)' }} />
                    Full
                </div>
                <div className="legend-item">
                    <span className="legend-dot" style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 6px var(--accent-cyan)' }} />
                    Today
                </div>
            </div>
        </div>
    );
}
