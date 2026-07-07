import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { APP_PALETTE as THEME } from '../theme/colors';

// TODO: Replace these placeholders with real hosted URLs before publishing to EU stores
const PRIVACY_URL = 'https://sebitacasa.github.io/CastleApp-backend/privacy';
const TERMS_URL   = 'https://sebitacasa.github.io/CastleApp-backend/terms';
const CONTACT_EMAIL = 'blackwilson1495@gmail.com';

const open = (url) => Linking.openURL(url).catch(() => {});

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <View style={styles.container}>

      {/* Branding */}
      <MaterialCommunityIcons name="compass-outline" size={30} color={THEME.gold} />
      <Text style={styles.brand}>Echoes&Paths</Text>
      <Text style={styles.tagline}>Discovering the past, one place at a time.</Text>

      <View style={styles.divider} />

      {/* Data sources / attribution */}
      <Text style={styles.sectionTitle}>DATA SOURCES</Text>

      <View style={styles.row}>
        <Ionicons name="logo-google" size={13} color={THEME.subText} style={styles.icon} />
        <Text style={styles.attrText}>
          Location data & photos:{' '}
          <Text style={styles.link} onPress={() => open('https://maps.google.com')}>
            Powered by Google
          </Text>
        </Text>
      </View>

      <View style={styles.row}>
        <MaterialCommunityIcons name="wikipedia" size={13} color={THEME.subText} style={styles.icon} />
        <Text style={styles.attrText}>
          Historical descriptions:{' '}
          <Text style={styles.link} onPress={() => open('https://wikipedia.org')}>Wikipedia</Text>
          {' '}under{' '}
          <Text style={styles.link} onPress={() => open('https://creativecommons.org/licenses/by-sa/4.0/')}>
            CC BY-SA 4.0
          </Text>
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="image-outline" size={13} color={THEME.subText} style={styles.icon} />
        <Text style={styles.attrText}>
          Default imagery:{' '}
          <Text style={styles.link} onPress={() => open('https://unsplash.com')}>Unsplash</Text>
          {' '}·{' '}
          <Text style={styles.link} onPress={() => open('https://cloudinary.com')}>Cloudinary</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      {/* GDPR / Privacy */}
      <Text style={styles.sectionTitle}>YOUR PRIVACY (GDPR)</Text>

      <Text style={styles.gdprText}>
        We collect your GPS location to show nearby historic sites, and your account info (name and email
        via Google Sign-In). Any photos or descriptions you submit are stored linked to your account.
      </Text>

      <Text style={styles.gdprText}>
        Under the EU General Data Protection Regulation you have the right to{' '}
        <Text style={styles.bold}>access, rectify, export or delete</Text> your personal data at any time.
        To exercise these rights contact:{' '}
        <Text style={styles.link} onPress={() => open(`mailto:${CONTACT_EMAIL}`)}>
          {CONTACT_EMAIL}
        </Text>
      </Text>

      <Text style={styles.gdprText}>
        You may also lodge a complaint with your national data protection authority (e.g. CNIL, BfDI, AEPD, Garante).
      </Text>

      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => open(PRIVACY_URL)} style={styles.legalBtn}>
          <Text style={styles.legalBtnText}>Privacy Policy</Text>
        </TouchableOpacity>
        <View style={styles.dot} />
        <TouchableOpacity onPress={() => open(TERMS_URL)} style={styles.legalBtn}>
          <Text style={styles.legalBtnText}>Terms of Use</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <Text style={styles.copyright}>© {year} Echoes&Paths. All rights reserved.</Text>
      <Text style={styles.version}>GDPR-compliant · EU Digital Services Act</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.bg,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  brand: {
    fontSize: 20,
    fontFamily: 'BerkshireSwash_400Regular',
    color: THEME.text,
    marginTop: 8,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 12,
    color: THEME.subText,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: THEME.subText,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    alignSelf: 'stretch',
  },
  icon: {
    marginTop: 1,
    marginRight: 8,
    width: 16,
  },
  attrText: {
    flex: 1,
    fontSize: 12,
    color: THEME.subText,
    lineHeight: 18,
  },
  link: {
    color: THEME.gold,
    textDecorationLine: 'underline',
  },
  gdprText: {
    fontSize: 12,
    color: THEME.subText,
    lineHeight: 18,
    marginBottom: 10,
    alignSelf: 'stretch',
    textAlign: 'left',
  },
  bold: {
    fontWeight: '600',
    color: THEME.text,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  legalBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
  },
  legalBtnText: {
    fontSize: 12,
    color: THEME.text,
    fontWeight: '600',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: THEME.border,
    marginHorizontal: 12,
  },
  copyright: {
    fontSize: 11,
    color: THEME.subText,
    marginBottom: 4,
  },
  version: {
    fontSize: 10,
    color: THEME.border,
    letterSpacing: 0.5,
  },
});
