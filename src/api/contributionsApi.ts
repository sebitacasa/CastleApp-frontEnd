import axios from 'axios';

const BASE_URL = 'https://castleapp-backend-production.up.railway.app/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

type PlaceRef =
    | { google_place_id: string; location_id?: never }
    | { location_id: string; google_place_id?: never };

interface ContributionData {
    photo_url?: string;
    info_text?: string;
}

export const submitContribution = async (
    place: PlaceRef,
    data: ContributionData,
    token: string,
): Promise<any> => {
    const response = await api.post(
        '/contributions',
        { ...place, ...data },
        { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
};

export const getContributionForPlace = async (place: PlaceRef): Promise<any> => {
    try {
        const response = await api.get('/contributions', { params: place });
        return response.data.contribution;
    } catch (error: any) {
        console.error('Error trayendo aporte de la comunidad:', error.message);
        return null;
    }
};

export const getMyContribution = async (place: PlaceRef, token: string): Promise<any> => {
    try {
        const response = await api.get('/contributions/mine', {
            params: place,
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.contribution;
    } catch (error: any) {
        console.error('Error trayendo mi aporte:', error.message);
        return null;
    }
};
