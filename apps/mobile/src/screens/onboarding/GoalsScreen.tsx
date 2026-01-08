import React, {useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, Button, Chip} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OnboardingStackParamList} from '../../navigation/types';
import {useStore} from '../../store';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'Goals'
>;

const GOALS = [
  {id: 'consistency', label: 'More Consistency'},
  {id: 'distance', label: 'More Distance'},
  {id: 'reduce_slice', label: 'Reduce Slice'},
  {id: 'reduce_hook', label: 'Reduce Hook'},
  {id: 'lower_handicap', label: 'Lower Handicap'},
  {id: 'ball_striking', label: 'Better Ball Striking'},
  {id: 'short_game', label: 'Improve Short Game'},
  {id: 'putting', label: 'Better Putting'},
];

const GoalsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {onboardingData, updateOnboardingData} = useStore();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    onboardingData.goals,
  );

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId],
    );
  };

  const handleNext = () => {
    updateOnboardingData({goals: selectedGoals});
    navigation.navigate('SkillLevel');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 1 of 9</Text>
          <Text style={styles.title}>What are your goals?</Text>
          <Text style={styles.subtitle}>
            Select all that apply. This helps us personalize your analysis.
          </Text>
        </View>

        <View style={styles.chips}>
          {GOALS.map(goal => (
            <Chip
              key={goal.id}
              selected={selectedGoals.includes(goal.id)}
              onPress={() => toggleGoal(goal.id)}
              style={styles.chip}
              selectedColor="#2E7D32"
              showSelectedCheck>
              {goal.label}
            </Chip>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={selectedGoals.length === 0}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor="#2E7D32">
          Continue
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
    marginBottom: 32,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    marginBottom: 8,
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

export default GoalsScreen;
