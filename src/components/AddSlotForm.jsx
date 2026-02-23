import React, { useState } from 'react';
import { format, addMinutes, parse } from 'date-fns';

/**
 * Form panel for adding time slots to a selected date.
 * Supports both single-slot and bulk (repeating interval) creation.
 */
export default function AddSlotForm({ selectedDate, onAddSlots, loading }) {
    const [mode, setMode] = useState('single'); // 'single' | 'bulk'

    // Single slot state
    const [single, setSingle] = useState({
        start_time: '09:00',
        end_time: '09:30',
        title: 'Appointment Slot',
        description: '',
        duration_minutes: 30,
    });

    // Bulk generator state
    const [bulk, setBulk] = useState({
        start_time: '09:00',
        end_time: '17:00',
        duration_minutes: 30,
        gap_minutes: 0,
        title: 'Appointment Slot',
    });

    const handleSingleChange = (field, value) => {
        setSingle((prev) => ({ ...prev, [field]: value }));
        // Auto-calculate end_time when start or duration changes
        if (field === 'start_time' || field === 'duration_minutes') {
            const start = field === 'start_time' ? value : single.start_time;
            const dur = field === 'duration_minutes' ? parseInt(value) : single.duration_minutes;
            try {
                const base = parse(start, 'HH:mm', new Date());
                const endDate = addMinutes(base, dur);
                setSingle((prev) => ({
                    ...prev,
                    [field]: value,
                    end_time: format(endDate, 'HH:mm'),
                }));
            } catch (_) { }
        }
    };

    const handleBulkChange = (field, value) => {
        setBulk((prev) => ({ ...prev, [field]: value }));
    };

    // Generate slot list from bulk settings
    const generateBulkSlots = () => {
        const slots = [];
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        let current = parse(bulk.start_time, 'HH:mm', new Date());
        const endBoundary = parse(bulk.end_time, 'HH:mm', new Date());
        const duration = parseInt(bulk.duration_minutes);
        const gap = parseInt(bulk.gap_minutes) || 0;

        while (true) {
            const slotEnd = addMinutes(current, duration);
            if (slotEnd > endBoundary) break;

            slots.push({
                date: dateStr,
                start_time: format(current, 'HH:mm'),
                end_time: format(slotEnd, 'HH:mm'),
                title: bulk.title,
                duration_minutes: duration,
            });

            current = addMinutes(slotEnd, gap);
        }
        return slots;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedDate) return;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        if (mode === 'single') {
            onAddSlots([{
                date: dateStr,
                start_time: single.start_time,
                end_time: single.end_time,
                title: single.title,
                description: single.description || undefined,
                duration_minutes: single.duration_minutes,
            }]);
        } else {
            const slots = generateBulkSlots();
            if (slots.length === 0) {
                alert('No slots could be generated. Check your start/end times and duration.');
                return;
            }
            onAddSlots(slots);
        }
    };

    const preview = mode === 'bulk' && selectedDate ? generateBulkSlots() : [];

    if (!selectedDate) {
        return (
            <div className="empty-state">
                <div className="icon">📝</div>
                <h3>Pick a Date First</h3>
                <p>Select a date from the calendar to add time slots.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="fade-in">
            {/* Mode Tabs */}
            <div className="tab-nav">
                <button
                    type="button"
                    className={`tab-btn ${mode === 'single' ? 'active' : ''}`}
                    onClick={() => setMode('single')}
                >
                    ⊕ Single Slot
                </button>
                <button
                    type="button"
                    className={`tab-btn ${mode === 'bulk' ? 'active' : ''}`}
                    onClick={() => setMode('bulk')}
                >
                    ⚡ Bulk Generate
                </button>
            </div>

            {mode === 'single' ? (
                <>
                    <div className="form-group">
                        <label className="form-label">Slot Title</label>
                        <input
                            className="form-input"
                            type="text"
                            value={single.title}
                            onChange={(e) => handleSingleChange('title', e.target.value)}
                            placeholder="e.g. Consultation, Check-up..."
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Start Time</label>
                            <input
                                className="form-input"
                                type="time"
                                value={single.start_time}
                                onChange={(e) => handleSingleChange('start_time', e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Time</label>
                            <input
                                className="form-input"
                                type="time"
                                value={single.end_time}
                                onChange={(e) => setSingle((p) => ({ ...p, end_time: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Duration (minutes)</label>
                        <select
                            className="form-select"
                            value={single.duration_minutes}
                            onChange={(e) => handleSingleChange('duration_minutes', parseInt(e.target.value))}
                        >
                            {[15, 20, 30, 45, 60, 90, 120].map((d) => (
                                <option key={d} value={d}>{d} min</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <textarea
                            className="form-textarea"
                            value={single.description}
                            onChange={(e) => handleSingleChange('description', e.target.value)}
                            placeholder="Any extra details for this slot..."
                            rows={2}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div className="form-group">
                        <label className="form-label">Slot Title</label>
                        <input
                            className="form-input"
                            type="text"
                            value={bulk.title}
                            onChange={(e) => handleBulkChange('title', e.target.value)}
                            placeholder="e.g. Appointment Slot"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Day Start</label>
                            <input
                                className="form-input"
                                type="time"
                                value={bulk.start_time}
                                onChange={(e) => handleBulkChange('start_time', e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Day End</label>
                            <input
                                className="form-input"
                                type="time"
                                value={bulk.end_time}
                                onChange={(e) => handleBulkChange('end_time', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Slot Duration (min)</label>
                            <select
                                className="form-select"
                                value={bulk.duration_minutes}
                                onChange={(e) => handleBulkChange('duration_minutes', parseInt(e.target.value))}
                            >
                                {[15, 20, 30, 45, 60, 90].map((d) => (
                                    <option key={d} value={d}>{d} min</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Break Between (min)</label>
                            <select
                                className="form-select"
                                value={bulk.gap_minutes}
                                onChange={(e) => handleBulkChange('gap_minutes', parseInt(e.target.value))}
                            >
                                {[0, 5, 10, 15, 30].map((g) => (
                                    <option key={g} value={g}>{g} min</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Live Preview */}
                    {preview.length > 0 && (
                        <div
                            style={{
                                padding: '12px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(124, 58, 237, 0.06)',
                                border: '1px solid rgba(124, 58, 237, 0.15)',
                                marginBottom: '1rem',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--accent-purple-light)',
                                    fontWeight: 700,
                                    marginBottom: 8,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                }}
                            >
                                Preview — {preview.length} slots will be created
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                    maxHeight: 100,
                                    overflowY: 'auto',
                                }}
                            >
                                {preview.map((s, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            padding: '3px 8px',
                                            borderRadius: 6,
                                            background: 'rgba(124, 58, 237, 0.12)',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.7rem',
                                            fontFamily: 'var(--font-display)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {s.start_time}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <span className="loading-spinner" />
                        Saving...
                    </>
                ) : (
                    <>
                        {mode === 'single' ? '+ Add Time Slot' : `⚡ Generate ${preview.length} Slots`}
                    </>
                )}
            </button>
        </form>
    );
}
