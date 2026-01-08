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
  'Handedness'
>;

const OPTIONS = [
  {id: 'right', label: 'Right-Handed', icon: 'R'},
  {id: 'left', label: 'Left-Handed', icon: 'L'},
];

const HandednessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {onboardingData, updateOnboardingData} = useStore();
  const [selected, setSelected] = useState<string | null>(
    onboardingData.dominantHand,
  );

  const handleNext = () => {
    if (selected) {
      updateOnboardingData({dominantHand: selected});
      navigation.navigate('TypicalMiss');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 3 of 9</Text>
          <Text style={styles.title}>Which hand do you swing with?</Text>
          <Text style={styles.subtitle}>
            This affects how we analyze your swing mechanics.
          </Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                selected === option.id && styles.optionSelected,
              ]}
              onPress={() => setSelected(option.id)}>
              <View
                style={[
                  styles.iconContainer,
                  selected === option.id && styles.iconContainerSelected,
                ]}>
                <Text
                  style={[
                    styles.icon,
                    selected === option.id && styles.iconSelected,
                  ]}>
                  {option.icon}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  selected === option.id && styles.optionLabelSelected,
                ]}>
                {option.label}
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
    flexDirection: 'row',
    gap: 16,
  },
  option: {
    flex: 1,
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: '#2E7D32',
  },
  icon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  iconSelected: {
    color: '#fff',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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

export default HandednessScreen;
