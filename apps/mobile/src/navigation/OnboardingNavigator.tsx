import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {OnboardingStackParamList} from './types';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import GoalsScreen from '../screens/onboarding/GoalsScreen';
import SkillLevelScreen from '../screens/onboarding/SkillLevelScreen';
import HandednessScreen from '../screens/onboarding/HandednessScreen';
import TypicalMissScreen from '../screens/onboarding/TypicalMissScreen';
import EquipmentScreen from '../screens/onboarding/EquipmentScreen';
import PracticeFrequencyScreen from '../screens/onboarding/PracticeFrequencyScreen';
import FilmingTipsScreen from '../screens/onboarding/FilmingTipsScreen';
import AuthScreen from '../screens/onboarding/AuthScreen';
import SummaryScreen from '../screens/onboarding/SummaryScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="SkillLevel" component={SkillLevelScreen} />
      <Stack.Screen name="Handedness" component={HandednessScreen} />
      <Stack.Screen name="TypicalMiss" component={TypicalMissScreen} />
      <Stack.Screen name="Equipment" component={EquipmentScreen} />
      <Stack.Screen name="PracticeFrequency" component={PracticeFrequencyScreen} />
      <Stack.Screen name="FilmingTips" component={FilmingTipsScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Summary" component={SummaryScreen} />
    </Stack.Navigator>
  );
};
