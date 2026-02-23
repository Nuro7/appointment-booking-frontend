import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://appointment-booking-backend-ccgq.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

// ─── Response interceptor for error normalization ─────────────────────────────
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const message =
            err.response?.data?.message ||
            err.message ||
            'An unexpected error occurred';
        return Promise.reject(new Error(message));
    }
);

// ─── Slot API ─────────────────────────────────────────────────────────────────
export const slotApi = {
    /** Get all slots for a given date (YYYY-MM-DD) */
    getByDate: (date) => api.get('/slots', { params: { date } }),

    /** Get slots in a date range */
    getByRange: (startDate, endDate) =>
        api.get('/slots/range', { params: { startDate, endDate } }),

    /** Get availability summary for a month */
    getMonthAvailability: (year, month) =>
        api.get('/slots/availability', { params: { year, month } }),

    /** Get a single slot by ID */
    getById: (id) => api.get(`/slots/${id}`),

    /** Create a new time slot */
    create: (slotData) => api.post('/slots', slotData),

    /** Create multiple slots at once */
    createBulk: (slots) => api.post('/slots/bulk', { slots }),

    /** Update a slot */
    update: (id, updates) => api.put(`/slots/${id}`, updates),

    /** Delete a slot */
    delete: (id) => api.delete(`/slots/${id}`),

    /** Book a slot */
    book: (id, bookingData) => api.post(`/slots/${id}/book`, bookingData),
};

export default api;
