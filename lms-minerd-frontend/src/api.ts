import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(config => {
    const token = localStorage.getItem('lms_minerd_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    r => r,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('lms_minerd_session');
            localStorage.removeItem('lms_minerd_token');
            window.dispatchEvent(new Event('lms:unauthorized'));
        }
        return Promise.reject(err);
    }
);

export default api;
