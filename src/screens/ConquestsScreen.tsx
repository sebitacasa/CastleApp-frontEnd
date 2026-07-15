import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { APP_PALETTE as THEME } from '../theme/colors';
import type { RootStackParamList, LocationData } from '../types';

type Props = StackScreenProps<RootStackParamList, 'Conquests'>;

const API = 'https://castleapp-backend-production.up.railway.app';

interface RankDef {
  title: string;
  emoji: string;
  min: number;
}

interface RankResult extends RankDef {
  next: RankDef | null;
  nextCount: number | null;
}

const RANKS: RankDef[] = [
  { title: 'Peasant', emoji: '🌾', min: 0 },
  { title: 'Squire', emoji: '🗡️', min: 1 },
  { title: 'Knight', emoji: '⚔️', min: 5 },
  { title: 'Baron', emoji: '🛡️', min: 15 },
  { title: 'Count', emoji: '⚔️', min: 30 },
  { title: 'Duke', emoji: '🏰', min: 50 },
  { title: 'High King', emoji: '👑', min: 100 },
];

function getRank(total: number): RankResult {
  let rank = RANKS[0];
  for (const r of RANKS) { if (total >= r.min) rank = r; }
  const idx = RANKS.indexOf(rank);
  const next = RANKS[idx + 1] || null;
  return { ...rank, next, nextCount: next?.min ?? null };
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface ConquestItem {
  id: number | string;
  place_name?: string;
  place_lat?: number;
  place_lon?: number;
  image_url?: string | null;
  category?: string;
  google_place_id?: string;
  location_id?: string;
  conquered_at?: string;
}

export default function ConquestsScreen({ navigation, route }: Props): React.ReactElement {
  const { userToken } = useContext(AuthContext);
  const { t } = useTranslation();
  const friendId = route?.params?.friendId || null;
  const friendName = route?.params?.friendName || null;

  const [conquests, setConquests] = useState<ConquestItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [rank, setRank] = useState<RankResult>(getRank(0));
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent: boolean = false): Promise<void> => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const url = friendId
        ? `${API}/api/friends/${friendId}/conquests`
        : `${API}/api/conquests/mine`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setConquests(data.conquests || []);
      setTotal(data.total || 0);
      setRank(data.rank || getRank(data.total || 0));
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken, friendId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = (): void => { setRefreshing(true); load(true); };

  const rankIndex = RANKS.findIndex(r => r.title === rank.title);
  const progress = rank.nextCount
    ? (total - rank.min) / (rank.nextCount - rank.min)
    : 1;

  const renderItem = ({ item }: { item: ConquestItem }) => {
    const locationData: LocationData = {
      id: String(item.location_id || item.google_place_id || item.id),
      name: item.place_name || '',
      latitude: item.place_lat,
      longitude: item.place_lon,
      image_url: item.image_url,
      category: item.category,
      google_place_id: item.google_place_id,
      source: item.location_id ? 'db' : 'google',
    };

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Detail', { locationData })}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.noImg]}>
            <MaterialCommunityIcons name="castle" size={24} color={THEME.border} />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.place_name}</Text>
          <View style={styles.row}>
            <MaterialCommunityIcons name="bookmark" size={11} color={THEME.gold} style={{ marginRight: 3 }} />
            <Text style={styles.cardCat}>{item.category || 'Historic Site'}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={11} color={THEME.subText} style={{ marginRight: 3 }} />
            <Text style={styles.cardDate}>{formatDate(item.conquered_at)}</Text>
          </View>
        </View>
        <View style={styles.swordBadge}>
          <Text style={styles.swordEmoji}>⚔️</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {friendName ? `${friendName}'s Conquests` : 'My Conquests'}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.rankCard}>
        <Text style={styles.rankEmoji}>{rank.emoji}</Text>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.rankTitle}>{rank.title}</Text>
          <Text style={styles.rankSub}>
            {total} {total === 1 ? 'conquest' : 'conquests'}
            {rank.nextCount ? ` · ${rank.nextCount - total} to ${rank.next?.title}` : ' · Max rank!'}
          </Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
          </View>
          <View style={styles.rankSteps}>
            {RANKS.map((r, i) => (
              <View key={r.title} style={[styles.rankDot, i <= rankIndex && styles.rankDotActive]} />
            ))}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.gold} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={THEME.border} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : conquests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56 }}>🗺️</Text>
          <Text style={styles.emptyTitle}>No conquests yet</Text>
          <Text style={styles.emptySub}>
            Visit a historic site and tap "Conquer" on its detail page to claim it — you must be within 150m.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conquests}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.gold} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingHorizontal: 20, paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: THEME.text,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  iconBtn: { width: 34 },
  rankCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME.card, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, borderWidth: 1, borderColor: THEME.border, padding: 18,
  },
  rankEmoji: { fontSize: 42 },
  rankTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.text, fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif' },
  rankSub: { fontSize: 12, color: THEME.subText, marginBottom: 8 },
  progressBg: { height: 6, backgroundColor: THEME.border, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: THEME.gold, borderRadius: 3 },
  rankSteps: { flexDirection: 'row', gap: 4 },
  rankDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: THEME.border },
  rankDotActive: { backgroundColor: THEME.gold },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME.card, borderRadius: 14,
    borderWidth: 1, borderColor: THEME.border,
    padding: 12, marginBottom: 10,
  },
  thumb: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
  noImg: { backgroundColor: THEME.border, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: THEME.text, marginBottom: 4 },
  cardCat: { fontSize: 11, color: THEME.subText },
  cardDate: { fontSize: 11, color: THEME.subText },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  swordBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: THEME.bg, borderWidth: 1, borderColor: THEME.border,
    justifyContent: 'center', alignItems: 'center',
  },
  swordEmoji: { fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: THEME.subText, marginTop: 12 },
  retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: THEME.gold, borderRadius: 20 },
  retryText: { color: THEME.bg, fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.text, marginTop: 16, marginBottom: 10 },
  emptySub: { fontSize: 13, color: THEME.subText, textAlign: 'center', lineHeight: 20 },
});
