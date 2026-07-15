import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationData } from '../types';

const BASE_URL = 'https://castleapp-backend-production.up.railway.app/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const BACKUP_GALLERY: Record<string, string[]> = {
    Castles: ['https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&cs=tinysrgb&w=800'],
    Museums: ['https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=800'],
    Ruins: ['https://images.pexels.com/photos/235942/pexels-photo-235942.jpeg?auto=compress&cs=tinysrgb&w=800'],
    Others: ['https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800'],
};

const formatLocations = (list: any[]): LocationData[] => {
    if (!Array.isArray(list)) return [];

    return list.map((item: any, index: number) => {
        const cat: string = item.category || 'Castles';
        const pool = BACKUP_GALLERY[cat] || BACKUP_GALLERY['Castles'];
        const placeholder = pool[(item.name || '').length % pool.length];

        const isValidUrl =
            item.image_url &&
            (item.image_url.includes('googleapis') ||
                item.image_url.includes('wikimedia') ||
                item.image_url.includes('mapillary') ||
                (item.image_url.startsWith('http') && !item.image_url.includes('example.com')));

        const finalUrl = isValidUrl ? item.image_url : placeholder;

        return {
            ...item,
            id: String(item.id || index),
            image_url: finalUrl,
            latitude: parseFloat(item.latitude || item.lat || 0),
            longitude: parseFloat(item.longitude || item.lon || 0),
            source: item.source || 'db',
        } as LocationData;
    });
};

export const getLocations = async (lat?: number, lon?: number): Promise<any[]> => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const latVal = lat ?? 0;
        const lonVal = lon ?? 0;
        const url = `${BASE_URL}/?lat=${latVal}&lon=${lonVal}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Error al obtener feed');
        return await response.json();
    } catch (error) {
        console.error('Error fetching locations:', error);
        return [];
    }
};

export const getMapLocations = async (
    lat: number,
    lon: number,
    category: string = 'All',
): Promise<LocationData[]> => {
    try {
        const response = await api.get('/', {
            params: { lat, lon, category },
        });
        return formatLocations(response.data?.data || []);
    } catch (error: any) {
        console.error('Error cargando mapa:', error.message);
        return [];
    }
};

export const searchNewLocations = async (
    query: string,
    lat: number = 0,
    lon: number = 0,
): Promise<LocationData[]> => {
    try {
        const response = await api.get('/external/search', {
            params: { q: query, lat, lon },
        });
        const lista = response.data.data || [];
        return formatLocations(lista);
    } catch (error: any) {
        console.error('Error buscando en Google:', error.message);
        return [];
    }
};

export const suggestLocation = async (locationData: any): Promise<any> => {
    try {
        const response = await api.post('/suggest', locationData);
        return response.data;
    } catch (error: any) {
        console.error('Error sugiriendo lugar:', error.response?.data || error.message);
        throw error;
    }
};

export const getWikiDetails = async (title: string): Promise<any> => {
    try {
        const response = await api.get('/external/wiki', {
            params: { title },
        });
        return response.data;
    } catch (error) {
        return { full_description: 'Detalles no disponibles.' };
    }
};

export default api;
