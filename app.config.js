import 'dotenv/config';

export default {
  "expo": {
    "name": "Echoes&Paths",
    "slug": "castleapp-dev",
    "owner": "sebita1495",
    "scheme": "castleapp-dev",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/Images/brujula.png",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sebit.castleapp"
    },
    "android": {
      "package": "com.sebit.castleapp",
      "adaptiveIcon": {
        "backgroundColor": "#ffffff",
        "foregroundImage": "./assets/Images/brujula-adaptive.png"
      },
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ],
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-web-browser",
      "@react-native-google-signin/google-signin",
      [
        "expo-splash-screen",
        {
          "image": "./assets/Images/brujula.png",
          "imageWidth": 180,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "f89970b0-4070-454b-9287-d8f5ea4fd943"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/f89970b0-4070-454b-9287-d8f5ea4fd943"
    }
  }
};