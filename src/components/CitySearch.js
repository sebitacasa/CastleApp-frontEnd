import React, { useState, useEffect, useRef } from 'react'; // 1. IMPORTAMOS useRef
import { 
  View, TextInput, FlatList, Text, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Keyboard 
} from 'react-native';
import { TOP_CITIES } from '../data/topCities'; // Asegúrate de tener este archivo creado

const CitySearch = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  
  const [shouldSearch, setShouldSearch] = useState(true);
  
  // 2. CREAMOS EL SEMÁFORO (REF)
  // Esto nos permite leer el valor "real" actual dentro de funciones asíncronas
  const shouldSearchRef = useRef(shouldSearch);

  // 3. MANTENER EL SEMÁFORO SINCRONIZADO
  useEffect(() => {
    shouldSearchRef.current = shouldSearch;
  }, [shouldSearch]);

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

    // A. BÚSQUEDA LOCAL (Instantánea)
    if (query.length > 1) {
       const localResults = TOP_CITIES.filter(city => 
           city.name.toLowerCase().startsWith(query.toLowerCase())
       ).map(city => ({
           properties: {
               name: city.name,
               country: city.country,
               countrycode: city.countryCode,
               source: 'local'
           },
           geometry: { coordinates: [city.lon, city.lat] }
       }));

       if (localResults.length > 0) {
           setSuggestions(localResults);
           setShowList(true);
       }
    }

    // B. BÚSQUEDA API (Con Debounce)
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        fetchPlaces(query);
      } else if (query.length === 0) {
        setSuggestions([]); 
        setShowList(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, shouldSearch]);

  // --- PHOTON ---
  const fetchPlaces = async (text) => {
    setLoading(true);
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&lang=en&limit=10`;
      const response = await fetch(url, { headers: { 'User-Agent': 'CastleApp/1.0' } });

      if (!response.ok) throw new Error("Fallo Photon");

      const json = await response.json();
      
      // 🚨 4. EL GUARDIÁN: Si el usuario ya seleccionó algo, ¡ABORTAR!
      if (!shouldSearchRef.current) return; 

      const features = json.features || [];
      const apiFiltered = features.filter(item => {
        const code = item?.properties?.countrycode?.toUpperCase();
        return code && WESTERN_COUNTRIES.includes(code);
      });

      if (apiFiltered.length > 0) {
          setSuggestions(prev => {
              const existingNames = new Set(prev.filter(p => p.properties.source === 'local').map(p => p.properties.name));
              const newFromApi = apiFiltered.filter(item => !existingNames.has(item.properties.name));
              return [...prev.filter(p => p.properties.source === 'local'), ...newFromApi];
          });
          setShowList(true);
      } 
    } catch (error) {
      if (shouldSearchRef.current) fetchNominatimFallback(text);
    } finally {
        if (shouldSearchRef.current) setLoading(false);
    }
  };

  // --- NOMINATIM ---
  const fetchNominatimFallback = async (text) => {
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5&accept-language=en`;
        const res = await fetch(nominatimUrl, { headers: { 'User-Agent': 'CastleApp/1.0' } });
        if (!res.ok) throw new Error("Fallo Nominatim");
        const data = await res.json();
        
        // 🚨 EL GUARDIÁN TAMBIÉN AQUÍ
        if (!shouldSearchRef.current) return;

        const adaptedSuggestions = data.map(item => ({
            properties: {
                name: item.name || item.display_name.split(',')[0],
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
        if (shouldSearchRef.current) setLoading(false);
    }
  };

  const handleSelect = (item) => {
    Keyboard.dismiss();
    setShouldSearch(false); // Esto actualiza el estado y el Ref

    const cityName = item?.properties?.name || "Location";
    const countryName = item?.properties?.country || "";
    const fullName = countryName ? `${cityName}, ${countryName}` : cityName;
    
    setQuery(fullName);
    setSuggestions([]);
    setShowList(false); // Cerramos la lista

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
          placeholder="Search City (e.g. Vienna, Salzburg)..." 
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
                {item?.properties?.source === 'local' && <Text style={{fontSize:10, color:'#38761D'}}>⚡</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

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