import Config from 'react-native-config';

export const config = {
  apiBaseUrl: Config.API_BASE_URL || 'http://localhost:8000',
  devMode: Config.DEV_MODE === 'true',
  devSkipPaywall: Config.DEV_SKIP_PAYWALL === 'true',
  devSkipAnalysis: Config.DEV_SKIP_ANALYSIS === 'true',
  revenueCatApiKey: Config.REVENUECAT_IOS_API_KEY || '',
};
