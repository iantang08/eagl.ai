import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, Button} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OnboardingStackParamList} from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'FilmingTips'
>;

const TIPS = [
  {
    title: 'Camera Position',
    description:
      'Place your camera at hip height, about 10-15 feet away from the ball.',
  },
  {
    title: 'Down the Line View',
    description:
      'Position the camera directly behind you, looking down the target line.',
  },
  {
    title: 'Face On View',
    description:
      'Alternatively, position the camera facing you from the side for a face-on view.',
  },
  {
    title: 'Good Lighting',
    description:
      'Film in good natural light. Avoid filming with the sun directly behind you.',
  },
  {
    title: 'Stable Setup',
    description:
      'Use a tripod or prop your phone against something stable to avoid shaky video.',
  },
  {
    title: 'Full Swing Visible',
    description:
      'Make sure your entire body and club are visible throughout the swing.',
  },
];

const FilmingTipsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 7 of 9</Text>
          <Text style={styles.title}>How to film your swing</Text>
          <Text style={styles.subtitle}>
            Follow these tips for the best analysis results.
          </Text>
        </View>

        <View style={styles.tips}>
          {TIPS.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Auth')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor="#2E7D32">
          Got it, continue
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
  tips: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumberText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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

export default FilmingTipsScreen;
