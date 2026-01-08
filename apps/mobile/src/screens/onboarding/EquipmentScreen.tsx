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
  'Equipment'
>;

const EQUIPMENT = [
  {id: 'driver', label: 'Driver'},
  {id: 'woods', label: 'Fairway Woods'},
  {id: 'hybrids', label: 'Hybrids'},
  {id: 'long_irons', label: 'Long Irons (3-5)'},
  {id: 'mid_irons', label: 'Mid Irons (6-8)'},
  {id: 'short_irons', label: 'Short Irons (9-PW)'},
  {id: 'wedges', label: 'Wedges'},
  {id: 'putter', label: 'Putter'},
];

const EquipmentScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {onboardingData, updateOnboardingData} = useStore();
  const [selected, setSelected] = useState<string[]>(
    onboardingData.equipmentFocus,
  );

  const toggleEquipment = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    updateOnboardingData({equipmentFocus: selected});
    navigation.navigate('PracticeFrequency');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 5 of 9</Text>
          <Text style={styles.title}>Equipment focus</Text>
          <Text style={styles.subtitle}>
            Which clubs do you want to focus on improving? Select all that
            apply.
          </Text>
        </View>

        <View style={styles.chips}>
          {EQUIPMENT.map(item => (
            <Chip
              key={item.id}
              selected={selected.includes(item.id)}
              onPress={() => toggleEquipment(item.id)}
              style={styles.chip}
              selectedColor="#2E7D32"
              showSelectedCheck>
              {item.label}
            </Chip>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={selected.length === 0}
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

export default EquipmentScreen;
