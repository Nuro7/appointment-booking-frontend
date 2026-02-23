import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { format, getMonth, getYear } from 'date-fns';

import Calendar from './components/Calendar';
import SlotList from './components/SlotList';
import AddSlotForm from './components/AddSlotForm';
import BookingModal from './components/BookingModal';
import { slotApi } from './api/slotApi';

const TOAST_STYLE = {
  background: '#1a1f35',
  color: '#f8fafc',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: '12px',
  fontSize: '0.875rem',
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [availability, setAvailability] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [savingSlot, setSavingSlot] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(false);

  const [currentViewMonth, setCurrentViewMonth] = useState({
    year: getYear(new Date()),
    month: getMonth(new Date()) + 1,
  });

  // ─── Load availability for month ────────────────────────────────────────────
  const fetchMonthAvailability = useCallback(async (year, month) => {
    setLoadingAvail(true);
    try {
      const res = await slotApi.getMonthAvailability(year, month);
      setAvailability(res.data.data || {});
    } catch (err) {
      console.error('Could not load availability:', err.message);
    } finally {
      setLoadingAvail(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthAvailability(currentViewMonth.year, currentViewMonth.month);
  }, [currentViewMonth, fetchMonthAvailability]);

  // ─── Load slots for selected date ───────────────────────────────────────────
  const fetchSlots = useCallback(async (date) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await slotApi.getByDate(dateStr);
      setSlots(res.data.data || []);
    } catch (err) {
      toast.error(`Failed to load slots: ${err.message}`, { style: TOAST_STYLE });
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const handleDateSelect = useCallback(
    (date) => {
      setSelectedDate(date);
      fetchSlots(date);
      // Update month view tracker
      setCurrentViewMonth({ year: getYear(date), month: getMonth(date) + 1 });
    },
    [fetchSlots]
  );

  // ─── Add slot(s) ────────────────────────────────────────────────────────────
  const handleAddSlots = useCallback(
    async (slotsToAdd) => {
      setSavingSlot(true);
      try {
        let created;
        if (slotsToAdd.length === 1) {
          const res = await slotApi.create(slotsToAdd[0]);
          created = [res.data.data];
        } else {
          const res = await slotApi.createBulk(slotsToAdd);
          created = res.data.data;
        }
        toast.success(
          slotsToAdd.length === 1
            ? '✅ Time slot added!'
            : `✅ ${created.length} slots created!`,
          { style: TOAST_STYLE }
        );
        // Refresh
        await fetchSlots(selectedDate);
        await fetchMonthAvailability(currentViewMonth.year, currentViewMonth.month);
      } catch (err) {
        toast.error(`Failed to add slot: ${err.message}`, { style: TOAST_STYLE });
      } finally {
        setSavingSlot(false);
      }
    },
    [selectedDate, currentViewMonth, fetchSlots, fetchMonthAvailability]
  );

  // ─── Delete slot ─────────────────────────────────────────────────────────────
  const handleDeleteSlot = useCallback(
    async (id) => {
      if (!window.confirm('Delete this time slot?')) return;
      try {
        await slotApi.delete(id);
        toast.success('🗑️ Slot deleted', { style: TOAST_STYLE });
        await fetchSlots(selectedDate);
        await fetchMonthAvailability(currentViewMonth.year, currentViewMonth.month);
      } catch (err) {
        toast.error(`Failed to delete: ${err.message}`, { style: TOAST_STYLE });
      }
    },
    [selectedDate, currentViewMonth, fetchSlots, fetchMonthAvailability]
  );

  // ─── Book an appointment ─────────────────────────────────────────────────────
  const handleBookSlot = useCallback(
    async (formData) => {
      if (!selectedSlot) return;
      setBookingSlot(true);
      try {
        await slotApi.book(selectedSlot.id, formData);
        toast.success('🎉 Appointment confirmed!', { style: TOAST_STYLE, duration: 4000 });
        setSelectedSlot(null);
        await fetchSlots(selectedDate);
        await fetchMonthAvailability(currentViewMonth.year, currentViewMonth.month);
      } catch (err) {
        toast.error(`Booking failed: ${err.message}`, { style: TOAST_STYLE });
      } finally {
        setBookingSlot(false);
      }
    },
    [selectedSlot, selectedDate, currentViewMonth, fetchSlots, fetchMonthAvailability]
  );

  // ─── Derived stats ────────────────────────────────────────────────────────────
  const totalSlots = slots.length;
  const availableSlots = slots.filter((s) => s.status === 'available').length;
  const bookedSlots = slots.filter((s) => s.status === 'booked').length;

  return (
    <div className="app-wrapper">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3000 }}
      />

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo-icon">📅</div>
          <div>
            <div className="navbar-title">AppointEase</div>
            <div className="navbar-subtitle">Scheduling Made Simple</div>
          </div>
        </div>
        <div className="navbar-status">
          <span className="status-dot" />
          API Connected
        </div>
      </nav>

      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <h1>Appointment Scheduler</h1>
          <p>Manage your availability and bookings with ease.</p>
        </div>

        {/* Stats Row (for selected date) */}
        {selectedDate && (
          <div className="stats-row fade-in">
            <div className="stat-card purple">
              <div className="stat-number">{totalSlots}</div>
              <div className="stat-label">Total Slots</div>
            </div>
            <div className="stat-card emerald">
              <div className="stat-number">{availableSlots}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="stat-card rose">
              <div className="stat-number">{bookedSlots}</div>
              <div className="stat-label">Booked</div>
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="booking-layout">
          {/* Left: Calendar + Slot List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Calendar */}
            <div className="glass-card">
              <div className="card-title">
                <div className="card-title-icon icon-purple">🗓</div>
                Select Date
              </div>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                availability={availability}
                loading={loadingAvail}
              />
            </div>

            {/* Slots for selected date */}
            <div className="glass-card">
              <div className="card-title">
                <div className="card-title-icon icon-cyan">🕐</div>
                Time Slots
                {selectedDate && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                    }}
                  >
                    {format(selectedDate, 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              <SlotList
                date={selectedDate}
                slots={slots}
                loading={loadingSlots}
                onSlotClick={(slot) => setSelectedSlot(slot)}
                onDeleteSlot={handleDeleteSlot}
              />
            </div>
          </div>

          {/* Right: Add Slot Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card slide-in-right">
              <div className="card-title">
                <div className="card-title-icon icon-emerald">✚</div>
                Add Time Slots
                {selectedDate && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.75rem',
                      color: 'var(--accent-purple-light)',
                      fontWeight: 600,
                    }}
                  >
                    {format(selectedDate, 'MMM d')}
                  </span>
                )}
              </div>
              <AddSlotForm
                selectedDate={selectedDate}
                onAddSlots={handleAddSlots}
                loading={savingSlot}
              />
            </div>

            {/* Info Card */}
            <div className="glass-card">
              <div className="card-title">
                <div className="card-title-icon icon-blue">ℹ</div>
                How It Works
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {[
                  { icon: '1️⃣', text: 'Select a date from the calendar' },
                  { icon: '2️⃣', text: 'Add time slots using the form' },
                  { icon: '3️⃣', text: 'Click a slot to book an appointment' },
                  { icon: '4️⃣', text: 'Booked slots are marked and locked' },
                ].map(({ icon, text }) => (
                  <div
                    key={text}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onConfirm={handleBookSlot}
          onClose={() => setSelectedSlot(null)}
          loading={bookingSlot}
        />
      )}
    </div>
  );
}
