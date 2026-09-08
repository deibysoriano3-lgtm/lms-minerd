import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

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
