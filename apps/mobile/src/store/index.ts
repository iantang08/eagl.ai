import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {User, OnboardingProfile, SubscriptionStatus, AnalysisJob} from '../types';
import {setAuthToken} from '../api/client';

interface OnboardingData {
  goals: string[];
  skillLevel: string | null;
  dominantHand: string | null;
  typicalMiss: string | null;
  equipmentFocus: string[];
  practiceFrequency: string | null;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Onboarding
  onboardingComplete: boolean;
  onboardingData: OnboardingData;

  // Subscription
  subscription: SubscriptionStatus | null;
  isSubscribed: boolean;

  // Current analysis
  currentJob: AnalysisJob | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  resetOnboardingData: () => void;
  setSubscription: (status: SubscriptionStatus | null) => void;
  setCurrentJob: (job: AnalysisJob | null) => void;
  logout: () => void;
  loadPersistedState: () => Promise<void>;
}

const initialOnboardingData: OnboardingData = {
  goals: [],
  skillLevel: null,
  dominantHand: null,
  typicalMiss: null,
  equipmentFocus: [],
  practiceFrequency: null,
};

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  onboardingComplete: false,
  onboardingData: initialOnboardingData,
  subscription: null,
  isSubscribed: false,
  currentJob: null,

  // Actions
  setUser: user => set({user, isAuthenticated: !!user}),

  setToken: token => {
    setAuthToken(token);
    set({token});
    if (token) {
      AsyncStorage.setItem('auth_token', token);
    } else {
      AsyncStorage.removeItem('auth_token');
    }
  },

  setOnboardingComplete: complete => {
    set({onboardingComplete: complete});
    AsyncStorage.setItem('onboarding_complete', String(complete));
  },

  updateOnboardingData: data => {
    set(state => ({
      onboardingData: {...state.onboardingData, ...data},
    }));
  },

  resetOnboardingData: () => {
    set({onboardingData: initialOnboardingData});
  },

  setSubscription: status => {
    set({
      subscription: status,
      isSubscribed: status?.is_active ?? false,
    });
  },

  setCurrentJob: job => set({currentJob: job}),

  logout: () => {
    setAuthToken(null);
    AsyncStorage.multiRemove(['auth_token', 'onboarding_complete']);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      onboardingComplete: false,
      onboardingData: initialOnboardingData,
      subscription: null,
      isSubscribed: false,
      currentJob: null,
    });
  },

  loadPersistedState: async () => {
    try {
      const [token, onboardingComplete] = await AsyncStorage.multiGet([
        'auth_token',
        'onboarding_complete',
      ]);

      if (token[1]) {
        setAuthToken(token[1]);
        set({token: token[1]});
      }

      if (onboardingComplete[1] === 'true') {
        set({onboardingComplete: true});
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  },
}));
