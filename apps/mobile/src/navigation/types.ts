import {NavigatorScreenParams} from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Paywall: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  AnalysisDetail: {jobId: string; resultId?: string};
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Goals: undefined;
  SkillLevel: undefined;
  Handedness: undefined;
  TypicalMiss: undefined;
  Equipment: undefined;
  PracticeFrequency: undefined;
  FilmingTips: undefined;
  Auth: undefined;
  Summary: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
