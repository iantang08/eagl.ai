import React from 'react';
import {View, StyleSheet, Image} from 'react-native';
import {Text, Button} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OnboardingStackParamList} from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'Welcome'
>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>eagl.ai</Text>
          <Text style={styles.tagline}>AI-Powered Golf Swing Analysis</Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="video"
            title="Upload Your Swing"
            description="Record and upload videos of your golf swing"
          />
          <FeatureItem
            icon="robot"
            title="AI Analysis"
            description="Get detailed feedback powered by computer vision"
          />
          <FeatureItem
            icon="chart-line"
            title="Track Progress"
            description="See your improvement over time"
          />
        </View>

        <Button
          mode="contained"
          onPress={() => navigation.navigate('Goals')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor="#2E7D32">
          Get Started
        </Button>
      </View>
    </SafeAreaView>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({title, description}) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  features: {
    marginVertical: 32,
  },
  featureItem: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default WelcomeScreen;
