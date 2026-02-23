import React, { useState } from 'react';
import { format } from 'date-fns';

/**
 * Modal dialog for booking a selected time slot.
 */
export default function BookingModal({ slot, onConfirm, onClose, loading }) {
    const [form, setForm] = useState({
        client_name: '',
        client_email: '',
        client_phone: '',
        notes: '',
    });

    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!form.client_name.trim()) e.client_name = 'Name is required';
        if (!form.client_email.trim()) {
            e.client_email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_email)) {
            e.client_email = 'Enter a valid email address';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        onConfirm(form);
    };

    if (!slot) return null;

    const startTime = slot.start_time?.slice(0, 5);
    const endTime = slot.end_time?.slice(0, 5);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" role="dialog" aria-modal="true" aria-label="Book Appointment">
                <div className="modal-header">
                    <div>
                        <div className="modal-title">📋 Book Appointment</div>
                        <div className="modal-subtitle">Fill in your details to confirm</div>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        ×
                    </button>
                </div>

                {/* Slot Preview */}
                <div className="modal-slot-preview">
                    <div>
                        <div className="modal-slot-time">
                            {startTime} – {endTime}
                        </div>
                        <div className="modal-slot-meta">
                            {slot.title} · {slot.duration_minutes} min
                        </div>
                    </div>
                    <span
                        className="slot-status-badge badge-available"
                        style={{ marginLeft: 'auto' }}
                    >
                        Available
                    </span>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                            id="booking-name"
                            className="form-input"
                            type="text"
                            value={form.client_name}
                            onChange={(e) => handleChange('client_name', e.target.value)}
                            placeholder="John Doe"
                            autoFocus
                        />
                        {errors.client_name && (
                            <span style={{ color: 'var(--accent-rose)', fontSize: '0.75rem' }}>
                                {errors.client_name}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                            id="booking-email"
                            className="form-input"
                            type="email"
                            value={form.client_email}
                            onChange={(e) => handleChange('client_email', e.target.value)}
                            placeholder="john@example.com"
                        />
                        {errors.client_email && (
                            <span style={{ color: 'var(--accent-rose)', fontSize: '0.75rem' }}>
                                {errors.client_email}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number (optional)</label>
                        <input
                            id="booking-phone"
                            className="form-input"
                            type="tel"
                            value={form.client_phone}
                            onChange={(e) => handleChange('client_phone', e.target.value)}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Additional Notes (optional)</label>
                        <textarea
                            id="booking-notes"
                            className="form-textarea"
                            value={form.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Anything you'd like us to know..."
                            rows={2}
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            style={{ flex: '0 0 auto', minWidth: 100 }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            id="booking-confirm-btn"
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner" />
                                    Confirming...
                                </>
                            ) : (
                                '✓ Confirm Booking'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
