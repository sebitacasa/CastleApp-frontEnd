import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { APP_PALETTE as THEME } from '../theme/colors';

// TODO: Replace these placeholders with real hosted URLs before publishing to EU stores
const PRIVACY_URL = 'https://sebitacasa.github.io/CastleApp-backend/privacy';
const TERMS_URL   = 'https://sebitacasa.github.io/CastleApp-backend/terms';
const CONTACT_EMAIL = 'castleapp.tester@gmail.com';

const open = (url) => Linking.openURL(url).catch(() => {});

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <View style={styles.container}>

      {/* Branding */}
      <MaterialCommunityIcons name="compass-outline" size={30} color={THEME.gold} />
      <Text style={styles.brand}>Echoes&Paths</Text>
      <Text style={styles.tagline}>{t('footer.tagline')}</Text>

      <View style={styles.divider} />

      {/* Data sources / attribution */}
      <Text style={styles.sectionTitle}>{t('footer.dataSources')}</Text>

      <View style={styles.row}>
        <Ionicons name="logo-google" size={13} color={THEME.subText} style={styles.icon} />
        <Text style={styles.attrText}>
          {t('footer.googleAttr')}{' '}
          <Text style={styles.link} onPress={() => open('https://maps.google.com')}>
            {t('footer.poweredByGoogle')}
          </Text>
        </Text>
      </View>

      <View style={styles.row}>
        <MaterialCommunityIcons name="wikipedia" size={13} color={THEME.subText} style={styles.icon} />
        <Text style={styles.attrText}>
          {t('footer.wikiAttr')}{' '}
          <Text style={styles.link} onPress={() => open('https://wikipedia.org')}>Wikipedia</Text>
          {' '}{t('footer.wikiLicense')}{' '}
          <Text style={styles.link} onPress={() => open('https://creativecommons.org/licenses/by-sa/4.0/')}>
            CC BY-SA 4.0
          </Text>
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="image-outline" size={13} color={THEME.subText} style={styles.icon} />
        <Text style={styles.attrText}>
          {t('footer.defaultImagery')}{' '}
          <Text style={styles.link} onPress={() => open('https://unsplash.com')}>Unsplash</Text>
          {' '}·{' '}
          <Text style={styles.link} onPress={() => open('https://cloudinary.com')}>Cloudinary</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      {/* GDPR / Privacy */}
      <Text style={styles.sectionTitle}>{t('footer.privacy')}</Text>

      <Text style={styles.gdprText}>{t('footer.gdprText1')}</Text>

      <Text style={styles.gdprText}>
        {t('footer.gdprText2')}{' '}
        <Text style={styles.bold}>{t('footer.gdprRights')}</Text>
        {' '}{t('footer.gdprText3')}{' '}
        <Text style={styles.link} onPress={() => open(`mailto:${CONTACT_EMAIL}`)}>
          {CONTACT_EMAIL}
        </Text>
      </Text>

      <Text style={styles.gdprText}>{t('footer.gdprText4')}</Text>

      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => open(PRIVACY_URL)} style={styles.legalBtn}>
          <Text style={styles.legalBtnText}>{t('footer.privacyPolicy')}</Text>
        </TouchableOpacity>
        <View style={styles.dot} />
        <TouchableOpacity onPress={() => open(TERMS_URL)} style={styles.legalBtn}>
          <Text style={styles.legalBtnText}>{t('footer.termsOfUse')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <Text style={styles.copyright}>© {year} Echoes&Paths. {t('footer.rights')}</Text>
      <Text style={styles.version}>{t('footer.compliance')}</Text>

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
