import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {Text, Button, Card} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useStore} from '../../store';
import {saveOnboardingProfile} from '../../api';
import {config} from '../../config';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LABELS: Record<string, string> = {
  // Goals
  consistency: 'More Consistency',
  distance: 'More Distance',
  reduce_slice: 'Reduce Slice',
  reduce_hook: 'Reduce Hook',
  lower_handicap: 'Lower Handicap',
  ball_striking: 'Better Ball Striking',
  short_game: 'Improve Short Game',
  putting: 'Better Putting',
  // Skill levels
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  // Handedness
  right: 'Right-Handed',
  left: 'Left-Handed',
  // Miss types
  slice: 'Slice',
  hook: 'Hook',
  thin: 'Thin/Top',
  fat: 'Fat/Chunk',
  push: 'Push',
  pull: 'Pull',
  // Equipment
  driver: 'Driver',
  woods: 'Fairway Woods',
  hybrids: 'Hybrids',
  long_irons: 'Long Irons',
  mid_irons: 'Mid Irons',
  short_irons: 'Short Irons',
  wedges: 'Wedges',
  putter: 'Putter',
  // Practice frequency
  daily: 'Daily',
  few_times_week: 'Few times a week',
  weekly: 'Once a week',
  few_times_month: 'Few times a month',
  rarely: 'Rarely',
};

const getLabel = (id: string | null): string => {
  if (!id) return 'Not selected';
  return LABELS[id] || id;
};

const SummaryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {onboardingData, setOnboardingComplete} = useStore();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      await saveOnboardingProfile({
        goals: onboardingData.goals,
        skill_level: onboardingData.skillLevel,
        dominant_hand: onboardingData.dominantHand,
        typical_miss: onboardingData.typicalMiss,
        equipment_focus: onboardingData.equipmentFocus,
        practice_frequency: onboardingData.practiceFrequency,
      });

      setOnboardingComplete(true);

      // Navigate to Paywall or Main depending on config
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: config.devSkipPaywall ? 'Main' : 'Paywall'}],
        }),
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to save profile. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 9 of 9</Text>
          <Text style={styles.title}>Your profile summary</Text>
          <Text style={styles.subtitle}>
            Review your selections before continuing.
          </Text>
        </View>

        <View style={styles.cards}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Goals</Text>
              <Text style={styles.cardValue}>
                {onboardingData.goals.map(g => getLabel(g)).join(', ') ||
                  'None selected'}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Skill Level</Text>
              <Text style={styles.cardValue}>
                {getLabel(onboardingData.skillLevel)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Dominant Hand</Text>
              <Text style={styles.cardValue}>
                {getLabel(onboardingData.dominantHand)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Typical Miss</Text>
              <Text style={styles.cardValue}>
                {getLabel(onboardingData.typicalMiss)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Equipment Focus</Text>
              <Text style={styles.cardValue}>
                {onboardingData.equipmentFocus.map(e => getLabel(e)).join(', ') ||
                  'None selected'}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Practice Frequency</Text>
              <Text style={styles.cardValue}>
                {getLabel(onboardingData.practiceFrequency)}
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor="#2E7D32">
          Complete Setup
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  step: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  cards: {
    gap: 12,
  },
  card: {
    backgroundColor: '#F5F5F5',
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default SummaryScreen;
