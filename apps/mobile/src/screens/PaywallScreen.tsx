import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, Linking, Alert} from 'react-native';
import {Text, Button, Card, ActivityIndicator} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CommonActions, useNavigation} from '@react-navigation/native';
import Purchases, {PurchasesOffering} from 'react-native-purchases';
import {RootStackParamList} from '../navigation/types';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useStore} from '../store';
import {config} from '../config';
import {devActivateSubscription, getSubscriptionStatus} from '../api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PaywallScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {setSubscription} = useStore();

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(
    'yearly',
  );

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      if (config.revenueCatApiKey) {
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          setOffering(offerings.current);
        }
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      if (!offering) {
        throw new Error('No offerings available');
      }

      const packageToPurchase =
        selectedPlan === 'monthly'
          ? offering.monthly
          : offering.annual;

      if (!packageToPurchase) {
        throw new Error('Selected plan not available');
      }

      await Purchases.purchasePackage(packageToPurchase);

      // Refresh subscription status from backend
      const status = await getSubscriptionStatus();
      setSubscription(status);

      // Navigate to main app
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Main'}],
        }),
      );
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      await Purchases.restorePurchases();

      const status = await getSubscriptionStatus();
      setSubscription(status);

      if (status.is_active) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Main'}],
          }),
        );
      } else {
        Alert.alert(
          'No Active Subscription',
          'No previous subscription was found.',
        );
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleDevActivate = async () => {
    setPurchasing(true);
    try {
      const status = await devActivateSubscription();
      setSubscription(status);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Main'}],
        }),
      );
    } catch (error: any) {
      Alert.alert(
        'Activation Failed',
        error.response?.data?.detail || 'Please try again.',
      );
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Unlock eagl.ai</Text>
          <Text style={styles.subtitle}>
            Get unlimited swing analysis and personalized feedback.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem text="Unlimited video uploads" />
          <FeatureItem text="AI-powered swing analysis" />
          <FeatureItem text="Detailed rubric scoring" />
          <FeatureItem text="Phase-by-phase breakdown" />
          <FeatureItem text="Progress tracking" />
        </View>

        <View style={styles.plans}>
          <PlanCard
            title="Yearly"
            price="$49.99/year"
            savings="Save 58%"
            selected={selectedPlan === 'yearly'}
            onPress={() => setSelectedPlan('yearly')}
          />
          <PlanCard
            title="Monthly"
            price="$9.99/month"
            selected={selectedPlan === 'monthly'}
            onPress={() => setSelectedPlan('monthly')}
          />
        </View>

        <Button
          mode="contained"
          onPress={handlePurchase}
          loading={purchasing}
          disabled={purchasing || !offering}
          style={styles.purchaseButton}
          contentStyle={styles.buttonContent}
          buttonColor="#2E7D32">
          Subscribe Now
        </Button>

        {config.devMode && (
          <Button
            mode="outlined"
            onPress={handleDevActivate}
            loading={purchasing}
            disabled={purchasing}
            style={styles.devButton}
            textColor="#2E7D32">
            [DEV] Simulate Purchase
          </Button>
        )}

        <Button
          mode="text"
          onPress={handleRestore}
          disabled={purchasing}
          textColor="#666">
          Restore Purchases
        </Button>

        <View style={styles.links}>
          <Button
            mode="text"
            compact
            onPress={() =>
              Linking.openURL('https://eagl.ai/terms')
            }
            textColor="#999">
            Terms of Service
          </Button>
          <Text style={styles.linkSeparator}>|</Text>
          <Button
            mode="text"
            compact
            onPress={() =>
              Linking.openURL('https://eagl.ai/privacy')
            }
            textColor="#999">
            Privacy Policy
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface FeatureItemProps {
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({text}) => (
  <View style={styles.featureItem}>
    <Text style={styles.checkmark}>✓</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

interface PlanCardProps {
  title: string;
  price: string;
  savings?: string;
  selected: boolean;
  onPress: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  title,
  price,
  savings,
  selected,
  onPress,
}) => (
  <Card
    style={[styles.planCard, selected && styles.planCardSelected]}
    onPress={onPress}>
    <Card.Content style={styles.planCardContent}>
      <View style={styles.planHeader}>
        <Text style={[styles.planTitle, selected && styles.planTitleSelected]}>
          {title}
        </Text>
        {savings && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>{savings}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>
        {price}
      </Text>
      <View
        style={[
          styles.radioOuter,
          selected && styles.radioOuterSelected,
        ]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </Card.Content>
  </Card>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkmark: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  plans: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  planCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planHeader: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  planTitleSelected: {
    color: '#2E7D32',
  },
  savingsBadge: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  savingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 16,
    color: '#666',
    marginRight: 12,
  },
  planPriceSelected: {
    color: '#2E7D32',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#2E7D32',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  purchaseButton: {
    marginBottom: 12,
  },
  devButton: {
    marginBottom: 12,
    borderColor: '#2E7D32',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  linkSeparator: {
    color: '#999',
    marginHorizontal: 8,
  },
});

export default PaywallScreen;
