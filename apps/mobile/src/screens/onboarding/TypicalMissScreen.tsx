import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import {Text, Button} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OnboardingStackParamList} from '../../navigation/types';
import {useStore} from '../../store';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'TypicalMiss'
>;

const MISS_TYPES = [
  {id: 'slice', label: 'Slice', description: 'Ball curves right (for righties)'},
  {id: 'hook', label: 'Hook', description: 'Ball curves left (for righties)'},
  {id: 'thin', label: 'Thin/Top', description: 'Ball contact too high on face'},
  {id: 'fat', label: 'Fat/Chunk', description: 'Hitting the ground first'},
  {id: 'push', label: 'Push', description: 'Ball goes straight right'},
  {id: 'pull', label: 'Pull', description: 'Ball goes straight left'},
];

const TypicalMissScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {onboardingData, updateOnboardingData} = useStore();
  const [selected, setSelected] = useState<string | null>(
    onboardingData.typicalMiss,
  );

  const handleNext = () => {
    if (selected) {
      updateOnboardingData({typicalMiss: selected});
      navigation.navigate('Equipment');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 4 of 9</Text>
          <Text style={styles.title}>What's your typical miss?</Text>
          <Text style={styles.subtitle}>
            Select the shot pattern you struggle with most.
          </Text>
        </View>

        <View style={styles.options}>
          {MISS_TYPES.map(miss => (
            <TouchableOpacity
              key={miss.id}
              style={[
                styles.option,
                selected === miss.id && styles.optionSelected,
              ]}
              onPress={() => setSelected(miss.id)}>
              <Text
                style={[
                  styles.optionLabel,
                  selected === miss.id && styles.optionLabelSelected,
                ]}>
                {miss.label}
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  selected === miss.id && styles.optionDescriptionSelected,
                ]}>
                {miss.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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

export default TypicalMissScreen;
