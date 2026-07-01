// Ícono + color por categoría, para que los pines del mapa se distingan de
// un vistazo (antes solo había dos colores: azul para Museums, rojo para
// todo el resto). Nombres verificados contra el glyph map instalado de
// MaterialCommunityIcons.
const CATEGORY_ICONS = {
    Castles: { icon: 'castle', color: '#8B5E3C' },
    Museums: { icon: 'bank', color: '#3B82F6' },
    'Historic Site': { icon: 'city', color: '#F59E0B' },
    Ruins: { icon: 'pillar', color: '#78716C' },
    Religious: { icon: 'church', color: '#7C3AED' },
    Statues: { icon: 'human', color: '#059669' },
};

const DEFAULT_ICON = { icon: 'map-marker', color: '#EF4444' };

export const getCategoryIcon = (category) => CATEGORY_ICONS[category] || DEFAULT_ICON;
