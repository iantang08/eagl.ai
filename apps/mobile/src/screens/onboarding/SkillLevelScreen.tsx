import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text, Button} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OnboardingStackParamList} from '../../navigation/types';
import {useStore} from '../../store';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'SkillLevel'
>;

const SKILL_LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'New to golf or still learning the basics',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Comfortable with fundamentals, looking to improve',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Low handicap, focused on fine-tuning',
  },
];

const SkillLevelScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {onboardingData, updateOnboardingData} = useStore();
  const [selected, setSelected] = useState<string | null>(
    onboardingData.skillLevel,
  );

  const handleNext = () => {
    if (selected) {
      updateOnboardingData({skillLevel: selected});
      navigation.navigate('Handedness');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 9</Text>
          <Text style={styles.title}>What's your skill level?</Text>
          <Text style={styles.subtitle}>
            This helps us tailor the analysis feedback for you.
          </Text>
        </View>

        <View style={styles.options}>
          {SKILL_LEVELS.map(level => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.option,
                selected === level.id && styles.optionSelected,
              ]}
              onPress={() => setSelected(level.id)}>
              <Text
                style={[
                  styles.optionLabel,
                  selected === level.id && styles.optionLabelSelected,
                ]}>
                {level.label}
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  selected === level.id && styles.optionDescriptionSelected,
                ]}>
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!selected}
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
    flex: 1,
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
  options: {
    gap: 16,
  },
  option: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: '#2E7D32',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  optionDescriptionSelected: {
    color: '#2E7D32',
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

export default SkillLevelScreen;
