import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider, MD3LightTheme} from 'react-native-paper';
import Purchases from 'react-native-purchases';
import {RootNavigator} from './src/navigation';
import {config} from './src/config';
import {useStore} from './src/store';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D32',
    secondary: '#4CAF50',
  },
};

const App: React.FC = () => {
  const {user} = useStore();

  useEffect(() => {
    // Initialize RevenueCat
    if (config.revenueCatApiKey) {
      Purchases.configure({apiKey: config.revenueCatApiKey});
    }
  }, []);

  useEffect(() => {
    // Identify user with RevenueCat when logged in
    if (user && config.revenueCatApiKey) {
      Purchases.logIn(user.id);
    }
  }, [user]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
