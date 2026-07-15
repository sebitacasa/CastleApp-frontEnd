import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { APP_PALETTE as THEME } from '../theme/colors';
import type { RootStackParamList } from '../types';

type Props = StackScreenProps<RootStackParamList, 'MyDiscoveries'>;

const API = 'https://castleapp-backend-production.up.railway.app';
const TABS = ['Places', 'Contributions'] as const;

interface PlaceItem {
  id: number | string;
  name?: string;
  image_url?: string | null;
  category?: string;
  created_at?: string;
}

interface ContributionItem {
  id: number | string;
  place_name?: string;
  google_place_id?: string;
  photo_url?: string | null;
  info_text?: string;
  is_approved?: boolean;
  created_at?: string;
}

const formatDate = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function MyDiscoveriesScreen({ navigation }: Props): React.ReactElement {
  const { userToken } = useContext(AuthContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('Places');
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/api/contributions/my-discoveries`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        setPlaces(data.places || []);
        setContributions(data.contributions || []);
      } catch {
        setError(t('discoveries.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isEmpty = activeTab === 'Places' ? places.length === 0 : contributions.length === 0;

  const renderPlace = ({ item }: { item: PlaceItem }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Detail', {
        locationData: { ...item, id: String(item.id), name: item.name || '', source: 'db' },
      })}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.noImage]}>
          <MaterialCommunityIcons name="image-off-outline" size={28} color={THEME.border} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.row}>
          <MaterialCommunityIcons name="bookmark" size={12} color={THEME.gold} style={{ marginRight: 4 }} />
          <Text style={styles.cardSub}>{item.category || 'Historic Site'}</Text>
        </View>
        <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={THEME.subText} />
    </TouchableOpacity>
  );

  const renderContribution = ({ item }: { item: ContributionItem }) => (
    <View style={styles.card}>
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.noImage]}>
          <Ionicons name="document-text-outline" size={28} color={THEME.border} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.place_name || item.google_place_id || 'Unknown place'}
        </Text>
        {item.info_text ? (
          <Text style={styles.cardSub} numberOfLines={2}>{item.info_text}</Text>
        ) : null}
        <View style={styles.row}>
          <View style={[styles.statusBadge, { backgroundColor: item.is_approved ? '#D4EDDA' : '#FFF3CD' }]}>
            <Text style={[styles.statusText, { color: item.is_approved ? '#2E7D32' : '#856404' }]}>
              {item.is_approved ? t('discoveries.approved') : t('discoveries.pending')}
            </Text>
          </View>
        </View>
        <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
      </View>
    </View>
  );

  const EmptyState = (): React.ReactElement => (
    <View style={styles.empty}>
      <MaterialCommunityIcons
        name={activeTab === 'Places' ? 'map-marker-plus-outline' : 'camera-plus-outline'}
        size={64}
        color={THEME.border}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'Places' ? t('discoveries.emptyPlacesTitle') : t('discoveries.emptyContribTitle')}
      </Text>
      <Text style={styles.emptySub}>
        {activeTab === 'Places' ? t('discoveries.emptyPlacesSub') : t('discoveries.emptyContribSub')}
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => navigation.navigate('MainTabs')}
      >
        <Text style={styles.emptyBtnText}>
          {activeTab === 'Places' ? t('discoveries.addPlace') : t('discoveries.contribute')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('discoveries.title')}</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'Places' ? t('discoveries.tabPlaces') : t('discoveries.tabContributions')}
              {tab === 'Places' && places.length > 0 ? ` (${places.length})` : ''}
              {tab === 'Contributions' && contributions.length > 0 ? ` (${contributions.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.gold} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={THEME.border} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <FlatList
          data={activeTab === 'Places' ? places : (contributions as any[])}
          keyExtractor={item => String(item.id)}
          renderItem={activeTab === 'Places'
            ? (renderPlace as any)
            : (renderContribution as any)
          }
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: THEME.bg,
  },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: THEME.text,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  iconBtn: { width: 34 },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: THEME.card, borderRadius: 12,
    borderWidth: 1, borderColor: THEME.border, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: THEME.gold },
  tabText: { fontSize: 13, fontWeight: '600', color: THEME.subText },
  tabTextActive: { color: THEME.bg },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME.card, borderRadius: 14,
    borderWidth: 1, borderColor: THEME.border, padding: 12, marginBottom: 12,
  },
  cardImage: { width: 64, height: 64, borderRadius: 10, marginRight: 12 },
  noImage: { backgroundColor: THEME.border, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: THEME.text, marginBottom: 3 },
  cardSub: { fontSize: 12, color: THEME.subText, marginBottom: 4 },
  cardDate: { fontSize: 11, color: THEME.border },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: THEME.subText, marginTop: 12, fontSize: 14 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.text, marginTop: 20, marginBottom: 10 },
  emptySub: { fontSize: 14, color: THEME.subText, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  emptyBtn: { backgroundColor: THEME.gold, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 25 },
  emptyBtnText: { color: THEME.bg, fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
});
