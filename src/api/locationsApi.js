import axios from 'axios';

//const BASE_URL = 'http://10.0.2.2:8080/api'; 
//const BASE_URL = 'http://192.168.1.33:8080/api';

const BASE_URL = 'https://castleapp-backend-production.up.railway.app/api';
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,
});

// --- 🎨 GALERÍA DE RESPALDO (URLs Estables de Pexels) ---
const BACKUP_GALLERY = {
    'Castles': ['https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'Museums': ['https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'Ruins': ['https://images.pexels.com/photos/235942/pexels-photo-235942.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'Others': ['https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800']
};

const formatLocations = (list) => {
    if (!Array.isArray(list)) return [];
    
    return list.map((item, index) => {
        const cat = item.category || 'Castles';
        const pool = BACKUP_GALLERY[cat] || BACKUP_GALLERY['Castles'];
        
        // Seleccionamos un placeholder basado en el nombre para consistencia
        const placeholder = pool[(item.name || '').length % pool.length];

        // 🛡️ VALIDACIÓN DE URL REAL:
        // Aceptamos la URL si viene de Mapillary o Wikipedia. 
        // Si es null, vacía o de Unsplash (vieja/rota), usamos Pexels.
        const isMapillary = item.image_url && item.image_url.includes('mapillary');
        const isWiki = item.image_url && item.image_url.includes('upload.wikimedia.org');
        
        const finalUrl = (isMapillary || isWiki) ? item.image_url : placeholder;

        return {
            ...item,
            id: String(item.id || index),
            image_url: finalUrl,
            category: cat,
            // Aseguramos que las coordenadas sean números para el Mapa
            latitude: parseFloat(item.latitude || item.lat || 0),
            longitude: parseFloat(item.longitude || item.lon || 0)
        };
    });
};

export const fetchLocations = async (searchTerm = 'castle') => {
    try {
        const response = await api.get('/localizaciones', { params: { q: searchTerm } });
        const listaDeLugares = response.data.data || response.data || [];
        return formatLocations(listaDeLugares);
    } catch (error) {
        console.error("🔥 Error en fetchLocations:", error.message);
        return [];
    }
};

// --- FUNCIÓN ADICIONAL: Para cargar datos por país/región ---
export const getRegionData = async (regionName) => {
    try {
        const response = await api.get('/localizaciones', { params: { q: regionName } });
        const rawList = response.data.data || response.data || [];
        return formatLocations(rawList);
    } catch (error) {
        console.error("🔥 Error en getRegionData:", error.message);
        return [];
    }
};

export default api;