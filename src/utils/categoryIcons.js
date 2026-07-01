// Color del pin por categoría, para que los pines del mapa se distingan de
// un vistazo (antes solo había dos colores: azul para Museums, rojo para
// todo el resto). Se probó un pin con ícono custom (badge + flecha) pero
// tenía problemas de renderizado en Android sin solución confiable, así que
// se usa el pin nativo de Google Maps (pinColor) con estos colores.
const CATEGORY_COLORS = {
    Castles: '#8B5E3C',
    Museums: '#3B82F6',
    'Historic Site': '#F59E0B',
    Ruins: '#78716C',
    Religious: '#7C3AED',
    Statues: '#059669',
};

const DEFAULT_COLOR = '#EF4444';

export const getCategoryColor = (category) => CATEGORY_COLORS[category] || DEFAULT_COLOR;
