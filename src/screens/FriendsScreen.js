import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, StatusBar,
  TextInput, Alert, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { APP_PALETTE as THEME } from '../theme/colors';

const API = 'https://castleapp-backend-production.up.railway.app';

const RANKS = [
  { title: 'Peasant', emoji: '🌾', min: 0 },
  { title: 'Squire', emoji: '🗡️', min: 1 },
  { title: 'Knight', emoji: '⚔️', min: 5 },
  { title: 'Baron', emoji: '🛡️', min: 15 },
  { title: 'Count', emoji: '⚔️', min: 30 },
  { title: 'Duke', emoji: '🏰', min: 50 },
  { title: 'High King', emoji: '👑', min: 100 },
];

function getRankEmoji(count) {
  let r = RANKS[0];
  for (const rank of RANKS) { if (count >= rank.min) r = rank; }
  return r.emoji;
}

function getRankTitle(count) {
  let r = RANKS[0];
  for (const rank of RANKS) { if (count >= rank.min) r = rank; }
  return r.title;
}

function Avatar({ uri, name, size = 44 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: THEME.gold, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: THEME.bg, fontWeight: 'bold', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export default function FriendsScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const [tab, setTab] = useState(route?.params?.initialTab || 'friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  const headers = { Authorization: `Bearer ${userToken}` };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [fr, rq] = await Promise.all([
        axios.get(`${API}/api/friends`, { headers }),
        axios.get(`${API}/api/friends/requests`, { headers }),
      ]);
      setFriends(fr.data.friends || []);
      setRequests(rq.data.requests || []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (query.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await axios.get(`${API}/api/friends/search?q=${encodeURIComponent(query.trim())}`, { headers });
        setSearchResults(data.users || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  const sendRequest = async (user) => {
    try {
      await axios.post(`${API}/api/friends/request`, { addresseeId: user.id }, { headers });
      setSearchResults(prev => prev.map(u =>
        u.id === user.id ? { ...u, friendship_status: 'pending', requester_id: -1 } : u
      ));
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error === 'already_exists' ? 'Request already sent.' : 'Could not send request.');
    }
  };

  const acceptRequest = async (friendship_id) => {
    try {
      await axios.put(`${API}/api/friends/request/${friendship_id}`, { action: 'accept' }, { headers });
      load(true);
    } catch { Alert.alert('Error', 'Could not accept request.'); }
  };

  const rejectRequest = async (friendship_id) => {
    try {
      await axios.put(`${API}/api/friends/request/${friendship_id}`, { action: 'reject' }, { headers });
      setRequests(prev => prev.filter(r => r.id !== friendship_id));
    } catch { Alert.alert('Error', 'Could not decline request.'); }
  };

  const removeFriendConfirm = (friendship_id, name) => {
    Alert.alert('Remove friend', `Remove ${name} from friends?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API}/api/friends/${friendship_id}`, { headers });
            setFriends(prev => prev.filter(f => f.friendship_id !== friendship_id));
          } catch { Alert.alert('Error', 'Could not remove friend.'); }
        }
      }
    ]);
  };

  const viewConquests = (friendId, friendName) => {
    navigation.navigate('Conquests', { friendId, friendName });
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderSearchResult = ({ item }) => {
    const isFriend = item.friendship_status === 'accepted';
    const isPending = item.friendship_status === 'pending';
    const isIncoming = isPending && item.requester_id !== -1;

    let actionBtn;
    if (isFriend) {
      actionBtn = (
        <TouchableOpacity style={[styles.actionBtn, styles.btnGreen]} onPress={() => viewConquests(item.id, item.username || item.name)}>
          <Text style={styles.actionBtnText}>Friends ⚔️</Text>
        </TouchableOpacity>
      );
    } else if (isPending && !isIncoming) {
      actionBtn = (
        <View style={[styles.actionBtn, styles.btnGray]}>
          <Text style={styles.actionBtnText}>Pending…</Text>
        </View>
      );
    } else if (isIncoming) {
      actionBtn = (
        <TouchableOpacity style={[styles.actionBtn, styles.btnGold]} onPress={() => acceptRequest(item.friendship_id)}>
          <Text style={styles.actionBtnText}>Accept</Text>
        </TouchableOpacity>
      );
    } else {
      actionBtn = (
        <TouchableOpacity style={[styles.actionBtn, styles.btnGold]} onPress={() => sendRequest(item)}>
          <Text style={styles.actionBtnText}>+ Add</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.card}>
        <Avatar uri={item.avatar} name={item.name} />
        <View style={styles.cardInfo}>
          {item.username
            ? <Text style={styles.username}>@{item.username}</Text>
            : null}
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        </View>
        {actionBtn}
      </View>
    );
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onLongPress={() => removeFriendConfirm(item.friendship_id, item.username || item.name)}
    >
      <Avatar uri={item.avatar} name={item.name} />
      <View style={styles.cardInfo}>
        {item.username ? <Text style={styles.username}>@{item.username}</Text> : null}
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.row}>
          <Text style={{ fontSize: 13 }}>{getRankEmoji(item.conquest_count)}</Text>
          <Text style={styles.rankText}> {getRankTitle(item.conquest_count)}</Text>
          <Text style={styles.countText}> · {item.conquest_count} conquests</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.actionBtn, styles.btnGold]}
        onPress={() => viewConquests(item.id, item.username || item.name)}
      >
        <Text style={styles.actionBtnText}>⚔️ View</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRequest = ({ item }) => (
    <View style={styles.card}>
      <Avatar uri={item.avatar} name={item.name} />
      <View style={styles.cardInfo}>
        {item.username ? <Text style={styles.username}>@{item.username}</Text> : null}
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.subText}>wants to be your friend</Text>
      </View>
      <View style={{ gap: 6 }}>
        <TouchableOpacity style={[styles.actionBtn, styles.btnGold]} onPress={() => acceptRequest(item.id)}>
          <Text style={styles.actionBtnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.btnGray]} onPress={() => rejectRequest(item.id)}>
          <Text style={[styles.actionBtnText, { color: THEME.subText }]}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const isSearchActive = query.trim().length >= 2;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.iconBtn} />
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={THEME.subText} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username or name…"
          placeholderTextColor={THEME.subText}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setSearchResults([]); }}>
            <Ionicons name="close-circle" size={18} color={THEME.subText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isSearchActive ? (
        searching ? (
          <View style={styles.center}>
            <ActivityIndicator color={THEME.gold} />
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-search-outline" size={56} color={THEME.border} />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySub}>Try a different username or name.</Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => String(item.id)}
            renderItem={renderSearchResult}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === 'friends' && styles.tabActive]}
              onPress={() => setTab('friends')}
            >
              <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
                Friends{friends.length > 0 ? ` (${friends.length})` : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'requests' && styles.tabActive]}
              onPress={() => setTab('requests')}
            >
              <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
                Requests{requests.length > 0 ? ` (${requests.length})` : ''}
              </Text>
              {requests.length > 0 && tab !== 'requests' && (
                <View style={styles.badge}><Text style={styles.badgeText}>{requests.length}</Text></View>
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={THEME.gold} /></View>
          ) : tab === 'friends' ? (
            friends.length === 0 ? (
              <View style={styles.empty}>
                <Text style={{ fontSize: 52 }}>🏰</Text>
                <Text style={styles.emptyTitle}>No friends yet</Text>
                <Text style={styles.emptySub}>Search for a username above to send a friend request.</Text>
              </View>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={item => String(item.id)}
                renderItem={renderFriend}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={THEME.gold} />}
              />
            )
          ) : (
            requests.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="mail-open-outline" size={56} color={THEME.border} />
                <Text style={styles.emptyTitle}>No pending requests</Text>
                <Text style={styles.emptySub}>When someone adds you, their request will appear here.</Text>
              </View>
            ) : (
              <FlatList
                data={requests}
                keyExtractor={item => String(item.id)}
                renderItem={renderRequest}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={THEME.gold} />}
              />
            )
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingHorizontal: 20, paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: THEME.text,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  iconBtn: { width: 34 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME.card, borderRadius: 12,
    borderWidth: 1, borderColor: THEME.border,
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: THEME.text, fontSize: 14 },

  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: THEME.card, borderRadius: 12,
    borderWidth: 1, borderColor: THEME.border, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9, flexDirection: 'row', justifyContent: 'center' },
  tabActive: { backgroundColor: THEME.gold },
  tabText: { fontSize: 13, fontWeight: '600', color: THEME.subText },
  tabTextActive: { color: THEME.bg },
  badge: {
    backgroundColor: '#C0392B', borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', marginLeft: 4, paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME.card, borderRadius: 14,
    borderWidth: 1, borderColor: THEME.border,
    padding: 12, marginBottom: 10,
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  username: { fontSize: 11, color: THEME.gold, fontWeight: '600', marginBottom: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: THEME.text },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  rankText: { fontSize: 12, color: THEME.text, fontWeight: '600' },
  countText: { fontSize: 12, color: THEME.subText },
  subText: { fontSize: 12, color: THEME.subText, marginTop: 2 },

  actionBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 12, fontWeight: 'bold', color: THEME.bg },
  btnGold: { backgroundColor: THEME.gold },
  btnGreen: { backgroundColor: '#2E7D32' },
  btnGray: { backgroundColor: THEME.border },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 13, color: THEME.subText, textAlign: 'center', lineHeight: 20 },
});
