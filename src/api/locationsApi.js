import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🌍 URL BASE: Apunta a tu servidor en Railway
const BASE_URL = 'https://castleapp-backend-production.up.railway.app/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 60000, 
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- 🎨 GALERÍA DE RESPALDO (Por si falla la imagen oficial) ---
const BACKUP_GALLERY = {
    'Castles': ['https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'Museums': ['https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'Ruins': ['https://images.pexels.com/photos/235942/pexels-photo-235942.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'Others': ['https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800']
};

// --- 🛠️ HELPER: Formateo y Limpieza de Datos ---
const formatLocations = (list) => {
    if (!Array.isArray(list)) return [];
    
    return list.map((item, index) => {
        const cat = item.category || 'Castles';
        const pool = BACKUP_GALLERY[cat] || BACKUP_GALLERY['Castles'];
        const placeholder = pool[(item.name || '').length % pool.length];

        // 🛡️ VALIDACIÓN DE IMAGEN
        const isValidUrl = item.image_url && (
            item.image_url.includes('googleapis') || 
            item.image_url.includes('wikimedia') ||
            item.image_url.includes('mapillary') ||
            (item.image_url.startsWith('http') && !item.image_url.includes('example.com'))
        );
        
        const finalUrl = isValidUrl ? item.image_url : placeholder;

        return {
            ...item,
            id: String(item.id || index), 
            image_url: finalUrl,
            // Aseguramos números para el mapa
            latitude: parseFloat(item.latitude || item.lat || 0),
            longitude: parseFloat(item.longitude || item.lon || 0),
            // Bandera de origen
            source: item.source || 'db' 
        };
    });
};

export const getLocations = async (lat, lon) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        
        // Armamos la URL con las coordenadas
        // Si no hay coords, mandamos 0,0 para que no explote (o manejalo como quieras)
        const url = `${BASE_URL}/?lat=${lat}&lon=${lon}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        if (!response.ok) throw new Error('Error al obtener feed');

        return await response.json();
    } catch (error) {
        console.error("Error fetching locations:", error);
        return [];
    }
};

// ==========================================
// 🗺️ 1. MAPA PRINCIPAL (FeedScreen / MapScreen)
// ==========================================
// Endpoint: GET /?lat=...&lon=...&category=...
export const getMapLocations = async (lat, lon, category = 'All') => {
    try {
        const response = await api.get('/', {
            params: { lat, lon, category }
        });
        // El backend devuelve { data: [...], nextGoogleToken }
        return formatLocations(response.data?.data || []);
    } catch (error) {
        console.error("🔥 Error cargando mapa:", error.message);
        return [];
    }
};

// ==========================================
// 🔭 2. ESCÁNER (SearchScreen)
// ==========================================
// Endpoint: GET /external/search?q=...
// Busca lugares nuevos en Google Maps para agregarlos.
export const searchNewLocations = async (query, lat = 0, lon = 0) => {
    try {
        const response = await api.get('/external/search', { 
            params: { q: query, lat, lon } 
        });
        // El backend devuelve { data: [...] }
        const lista = response.data.data || [];
        return formatLocations(lista);
    } catch (error) {
        console.error("🔥 Error buscando en Google:", error.message);
        return [];
    }
};

// ==========================================
// 🚩 3. SUGERIR / GUARDAR (SearchScreen -> "Conquistar")
// ==========================================
// Endpoint: POST /suggest
export const suggestLocation = async (locationData) => {
    try {
        // Ya no deconstruimos ni rearmamos nada.
        // 'locationData' ya viene con { name, user_id, latitude, etc... } listo desde el SearchScreen.
        
        const response = await api.post('/suggest', locationData);
        return response.data;

    } catch (error) {
        console.error("🔥 Error sugiriendo lugar:", error.response?.data || error.message);
        throw error;
    }
};

// ==========================================
// 📖 4. DETALLES WIKI (DetailScreen)
// ==========================================
// Endpoint: GET /external/wiki?title=...
export const getWikiDetails = async (title) => {
    try {
        const response = await api.get('/external/wiki', { 
            params: { title } 
        });
        // Devuelve { full_description: "...", wiki_url: "..." }
        return response.data;
    } catch (error) {
        return { full_description: "Detalles no disponibles." };
    }
};

// Exportamos también la instancia base por si acaso
export default api;