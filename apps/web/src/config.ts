declare global {
    interface Window {
        __ENV__?: {
            VITE_API_URL?: string;
        };
    }
}

export const API_URL = window.__ENV__?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
