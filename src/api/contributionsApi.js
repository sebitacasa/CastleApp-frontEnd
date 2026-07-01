import axios from 'axios';

const BASE_URL = 'https://castleapp-backend-production.up.railway.app/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// ==========================================
// 📥 SUBIR APORTE (foto y/o info) -- requiere estar logeado
// ==========================================
// place: { google_place_id } o { location_id } (solo uno de los dos)
// data: { photo_url } y/o { info_text }
export const submitContribution = async (place, data, token) => {
    const response = await api.post(
        '/contributions',
        { ...place, ...data },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

// ==========================================
// 🔎 APORTE APROBADO DE UN LUGAR (público)
// ==========================================
export const getContributionForPlace = async (place) => {
    try {
        const response = await api.get('/contributions', { params: place });
        return response.data.contribution;
    } catch (error) {
        console.error("Error trayendo aporte de la comunidad:", error.message);
        return null;
    }
};

// ==========================================
// 🔎 MI PROPIO APORTE PARA UN LUGAR (requiere login)
// ==========================================
export const getMyContribution = async (place, token) => {
    try {
        const response = await api.get('/contributions/mine', {
            params: place,
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.contribution;
    } catch (error) {
        console.error("Error trayendo mi aporte:", error.message);
        return null;
    }
};
