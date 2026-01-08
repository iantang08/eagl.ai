import React, {useEffect, useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ActivityIndicator, View} from 'react-native';

import {RootStackParamList} from './types';
import {OnboardingNavigator} from './OnboardingNavigator';
import {MainNavigator} from './MainNavigator';
import PaywallScreen from '../screens/PaywallScreen';
import AnalysisDetailScreen from '../screens/main/AnalysisDetailScreen';
import {useStore} from '../store';
import {config} from '../config';
import {getMe, getSubscriptionStatus} from '../api';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  const {
    token,
    isAuthenticated,
    onboardingComplete,
    isSubscribed,
    setUser,
    setSubscription,
    loadPersistedState,
  } = useStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadPersistedState();
      } catch (error) {
        console.error('Error loading persisted state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const user = await getMe();
          setUser(user);

          const status = await getSubscriptionStatus();
          setSubscription(status);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [token]);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  // Determine initial route based on state
  const shouldShowPaywall =
    isAuthenticated &&
    onboardingComplete &&
    !isSubscribed &&
    !config.devSkipPaywall;

  const shouldShowMain =
    isAuthenticated &&
    onboardingComplete &&
    (isSubscribed || config.devSkipPaywall);

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!isAuthenticated || !onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : shouldShowPaywall ? (
        <Stack.Screen name="Paywall" component={PaywallScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="AnalysisDetail"
            component={AnalysisDetailScreen}
            options={{
              headerShown: true,
              title: 'Analysis Results',
              headerTintColor: '#2E7D32',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
