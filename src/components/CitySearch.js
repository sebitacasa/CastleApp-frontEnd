import React, { useState, useEffect } from 'react';
import { 
  View, TextInput, FlatList, Text, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Keyboard 
} from 'react-native';
import { TOP_CITIES } from '../data/topCities'; // <--- IMPORTA TU DATA LOCAL

const CitySearch = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [shouldSearch, setShouldSearch] = useState(true);

  // Lista de países permitidos
  const WESTERN_COUNTRIES = [
    'DE', 'AT', 'CH', 'NL', 'BE', 'LU', 'LI', 
    'ES', 'FR', 'IT', 'PT', 'GB', 'IE', 'AD', 'MC', 'MT', 'SM', 'VA', 
    'GR', 'CY', 'DK', 'SE', 'NO', 'FI', 'IS', 
    'PL', 'CZ', 'SK', 'HU', 'EE', 'LV', 'LT', 
    'RO', 'BG', 'MD', 'UA', 'BY', 'RU', 
    'AL', 'HR', 'BA', 'RS', 'ME', 'MK', 'SI', 'XK',
    'US', 'CA', 'MX', 'AR', 'BR', 'CL', 'CO', 'PE', 'UY', 'EC', 'BO', 'PY', 'VE', 'CR', 'PA'
  ];

  useEffect(() => {
    if (!shouldSearch) return;

    // LÓGICA HÍBRIDA:
    // 1. Si el texto es corto (2-3 letras), buscar SOLO localmente (Es instantáneo).
    // 2. Si el texto es largo o no hay resultados locales, llamar a la API.

    if (query.length > 1) {
       // A. Búsqueda Local (Instantánea)
       const localResults = TOP_CITIES.filter(city => 
           city.name.toLowerCase().startsWith(query.toLowerCase())
       ).map(city => ({
           properties: {
               name: city.name,
               country: city.country,
               countrycode: city.countryCode,
               source: 'local' // Marca para identificar
           },
           geometry: { coordinates: [city.lon, city.lat] }
       }));

       if (localResults.length > 0) {
           setSuggestions(localResults);
           setShowList(true);
           // Si encontramos coincidencias exactas locales, quizás no necesitemos llamar a la API inmediatamente
       }
    }

    // B. Búsqueda API (Con Debounce) para lugares no populares
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        // Solo llamamos a la API si queremos refinar o si no encontramos suficientes locales
        fetchPlaces(query);
      } else if (query.length === 0) {
        setSuggestions([]); 
        setShowList(false);
      }
    }, 400); // Reduje un poco el tiempo a 400ms

    return () => clearTimeout(delayDebounceFn);
  }, [query, shouldSearch]);

  // --- PHOTON (INGLÉS) ---
  const fetchPlaces = async (text) => {
    setLoading(true);
    try {
      // CAMBIO: lang=en para inglés
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&lang=en&limit=10`;
      const response = await fetch(url, { headers: { 'User-Agent': 'CastleApp/1.0' } });

      if (!response.ok) throw new Error("Fallo Photon");

      const json = await response.json();
      const features = json.features || [];
      
      const apiFiltered = features.filter(item => {
        const code = item?.properties?.countrycode?.toUpperCase();
        return code && WESTERN_COUNTRIES.includes(code);
      });

      // MEZCLA INTELIGENTE:
      // Si ya teníamos resultados locales, intentamos no duplicarlos.
      // O simplemente reemplazamos con los de la API que suelen ser más completos si es una búsqueda específica.
      if (apiFiltered.length > 0) {
          setSuggestions(prev => {
              // Opción: Combinar locales y API (evitando duplicados por nombre)
              const existingNames = new Set(prev.filter(p => p.properties.source === 'local').map(p => p.properties.name));
              const newFromApi = apiFiltered.filter(item => !existingNames.has(item.properties.name));
              
              // Prioridad: Locales primero (son instantáneos), luego API
              // Pero si el usuario escribió mucho, la API es más precisa.
              return [...prev.filter(p => p.properties.source === 'local'), ...newFromApi];
          });
          setShowList(true);
      } 
    } catch (error) {
      fetchNominatimFallback(text);
    } finally {
        setLoading(false);
    }
  };

  // --- NOMINATIM (INGLÉS) ---
  const fetchNominatimFallback = async (text) => {
    try {
        // CAMBIO: accept-language=en
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5&accept-language=en`;
        const res = await fetch(nominatimUrl, { headers: { 'User-Agent': 'CastleApp/1.0' } });

        if (!res.ok) throw new Error("Fallo Nominatim");

        const data = await res.json();
        
        const adaptedSuggestions = data.map(item => ({
            properties: {
                name: item.name || item.display_name.split(',')[0],
                // Nominatim a veces devuelve 'state' o 'town' si no es ciudad grande
                country: item.address?.country,
                countrycode: item.address?.country_code?.toUpperCase()
            },
            geometry: { coordinates: [parseFloat(item.lon), parseFloat(item.lat)] }
        })).filter(item => item.properties.countrycode && WESTERN_COUNTRIES.includes(item.properties.countrycode));

        if (adaptedSuggestions.length > 0) {
            setSuggestions(adaptedSuggestions);
            setShowList(true);
        }

    } catch (e) {
       // Silencioso
    } finally {
        setLoading(false);
    }
  };

  const handleSelect = (item) => {
    Keyboard.dismiss();
    setShouldSearch(false); 

    const cityName = item?.properties?.name || "Location";
    const countryName = item?.properties?.country || "";
    // Aseguramos formato limpio
    const fullName = countryName ? `${cityName}, ${countryName}` : cityName;
    
    setQuery(fullName);
    setSuggestions([]);
    setShowList(false);

    if (onLocationSelect && item?.geometry?.coordinates) {
      onLocationSelect(item.geometry.coordinates, fullName); 
    }
  };

  const handleTextChange = (text) => {
      setShouldSearch(true);
      setQuery(text);
      if (text.length === 0) setShowList(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search City (e.g. Vienna, London)..." // Placeholder en inglés
          value={query}
          onChangeText={handleTextChange}
          placeholderTextColor="#666"
        />
        {loading && <ActivityIndicator style={{marginLeft: 10}} size="small" color="#38761D" />}
      </View>

      {showList && suggestions.length > 0 && (
        <View style={styles.listContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.properties.name}-${index}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                <View>
                    <Text style={styles.cityText}>{item?.properties?.name}</Text>
                    <Text style={styles.countryText}>{item?.properties?.country}</Text>
                </View>
                {/* Indicador visual opcional si es resultado local */}
                {/* {item.properties.source === 'local' && <Text style={{fontSize:10, color:'green'}}>⚡</Text>} */}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

// ... (Tus estilos se mantienen igual)
const styles = StyleSheet.create({
  container: { width: '100%', position: 'relative', zIndex: 9999 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 25, paddingHorizontal: 15, height: 50, elevation: 4, 
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width:0, height:2}
  },
  input: { flex: 1, fontSize: 16, color: '#333' },
  listContainer: {
    position: 'absolute', top: 55, left: 10, right: 10,
    backgroundColor: '#fff', borderRadius: 15, maxHeight: 220,
    elevation: 10, zIndex: 9999, overflow: 'hidden'
  },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cityText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  countryText: { fontSize: 14, color: '#666' }
});

export default CitySearch;