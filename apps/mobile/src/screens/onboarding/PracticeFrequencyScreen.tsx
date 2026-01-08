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
  'PracticeFrequency'
>;

const FREQUENCIES = [
  {id: 'daily', label: 'Daily'},
  {id: 'few_times_week', label: 'Few times a week'},
  {id: 'weekly', label: 'Once a week'},
  {id: 'few_times_month', label: 'Few times a month'},
  {id: 'rarely', label: 'Rarely'},
];

const PracticeFrequencyScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {onboardingData, updateOnboardingData} = useStore();
  const [selected, setSelected] = useState<string | null>(
    onboardingData.practiceFrequency,
  );

  const handleNext = () => {
    if (selected) {
      updateOnboardingData({practiceFrequency: selected});
      navigation.navigate('FilmingTips');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 6 of 9</Text>
          <Text style={styles.title}>How often do you practice?</Text>
          <Text style={styles.subtitle}>
            This helps us understand your commitment level.
          </Text>
        </View>

        <View style={styles.options}>
          {FREQUENCIES.map(freq => (
            <TouchableOpacity
              key={freq.id}
              style={[
                styles.option,
                selected === freq.id && styles.optionSelected,
              ]}
              onPress={() => setSelected(freq.id)}>
              <Text
                style={[
                  styles.optionLabel,
                  selected === freq.id && styles.optionLabelSelected,
                ]}>
                {freq.label}
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
    gap: 12,
  },
  option: {
    padding: 16,
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
    textAlign: 'center',
  },
  optionLabelSelected: {
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

export default PracticeFrequencyScreen;
