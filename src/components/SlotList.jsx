import React from 'react';
import { format, parseISO } from 'date-fns';

/**
 * Renders a list of time slots for the currently selected date.
 */
export default function SlotList({ date, slots, loading, onSlotClick, onDeleteSlot }) {
    if (!date) {
        return (
            <div className="empty-state fade-in">
                <div className="icon">📅</div>
                <h3>Select a Date</h3>
                <p>Click any day on the calendar to view or manage time slots.</p>
            </div>
        );
    }

    const formattedDate = format(date, 'EEEE, MMMM d, yyyy');

    if (loading) {
        return (
            <div>
                <div className="selected-date-label">
                    <strong>{formattedDate}</strong>
                </div>
                <div className="slots-list">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="skeleton"
                            style={{ height: 56, borderRadius: 12, marginBottom: 8 }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!slots || slots.length === 0) {
        return (
            <div>
                <div className="selected-date-label">
                    📅 <strong>{formattedDate}</strong>
                </div>
                <div className="no-slots-state fade-in">
                    <div className="empty-icon">🕐</div>
                    <p>No time slots for this date.</p>
                    <span>Use the panel below to add availability.</span>
                </div>
            </div>
        );
    }

    const available = slots.filter((s) => s.status === 'available').length;
    const booked = slots.filter((s) => s.status === 'booked').length;

    return (
        <div className="fade-in">
            <div className="selected-date-label" style={{ justifyContent: 'space-between' }}>
                <span>
                    📅 <strong>{formattedDate}</strong>
                </span>
                <span style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--accent-emerald)', marginRight: 8 }}>
                        ● {available} free
                    </span>
                    <span style={{ color: 'var(--accent-rose)' }}>
                        ● {booked} booked
                    </span>
                </span>
            </div>

            <div className="slots-list">
                {slots.map((slot) => {
                    const isBooked = slot.status === 'booked';
                    const isBlocked = slot.status === 'blocked';
                    const startTime = slot.start_time?.slice(0, 5); // HH:MM
                    const endTime = slot.end_time?.slice(0, 5);

                    let cardClass = 'slot-card';
                    if (isBooked) cardClass += ' booked-slot';
                    if (isBlocked) cardClass += ' blocked-slot';

                    return (
                        <div
                            key={slot.id}
                            className={cardClass}
                            onClick={() => !isBooked && !isBlocked && onSlotClick && onSlotClick(slot)}
                        >
                            <span className="slot-time">
                                {startTime} – {endTime}
                            </span>

                            <div className="slot-info">
                                <div className="slot-title">{slot.title || 'Appointment Slot'}</div>
                                <div className="slot-duration">{slot.duration_minutes} min</div>
                                {isBooked && slot.booked_by && (
                                    <div className="slot-duration" style={{ color: 'var(--accent-rose)' }}>
                                        {slot.booked_by}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className={`slot-status-badge badge-${slot.status}`}>
                                    {slot.status}
                                </span>
                                {!isBooked && (
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSlot && onDeleteSlot(slot.id);
                                        }}
                                        title="Delete slot"
                                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
