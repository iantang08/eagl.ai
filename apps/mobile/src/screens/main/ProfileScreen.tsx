import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {Text, Button, Card, Divider} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useStore} from '../../store';
import {getOnboardingProfile, getSubscriptionStatus} from '../../api';
import {OnboardingProfile, SubscriptionStatus} from '../../types';

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
  if (!id) return 'Not set';
  return LABELS[id] || id;
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {user, logout, setSubscription} = useStore();

  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [subscription, setLocalSubscription] =
    useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileData, subStatus] = await Promise.all([
        getOnboardingProfile().catch(() => null),
        getSubscriptionStatus().catch(() => null),
      ]);

      setProfile(profileData);
      setLocalSubscription(subStatus);
      if (subStatus) {
        setSubscription(subStatus);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'Onboarding'}],
            }),
          );
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email || 'Not set'}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <Text
                style={[
                  styles.value,
                  subscription?.is_active
                    ? styles.activeStatus
                    : styles.inactiveStatus,
                ]}>
                {subscription?.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            {subscription?.plan && (
              <View style={styles.row}>
                <Text style={styles.label}>Plan</Text>
                <Text style={styles.value}>{subscription.plan}</Text>
              </View>
            )}
            {subscription?.expires_at && (
              <View style={styles.row}>
                <Text style={styles.label}>Expires</Text>
                <Text style={styles.value}>
                  {new Date(subscription.expires_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {profile && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Golf Profile</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Goals</Text>
                <Text style={styles.value}>
                  {profile.goals.map(g => getLabel(g)).join(', ') || 'Not set'}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Skill Level</Text>
                <Text style={styles.value}>
                  {getLabel(profile.skill_level)}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Dominant Hand</Text>
                <Text style={styles.value}>
                  {getLabel(profile.dominant_hand)}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Typical Miss</Text>
                <Text style={styles.value}>
                  {getLabel(profile.typical_miss)}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Equipment Focus</Text>
                <Text style={styles.value}>
                  {profile.equipment_focus.map(e => getLabel(e)).join(', ') ||
                    'Not set'}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Practice Frequency</Text>
                <Text style={styles.value}>
                  {getLabel(profile.practice_frequency)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#D32F2F">
          Logout
        </Button>

        <Text style={styles.version}>eagl.ai v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  activeStatus: {
    color: '#2E7D32',
  },
  inactiveStatus: {
    color: '#D32F2F',
  },
  divider: {
    marginVertical: 4,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: '#D32F2F',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
    marginBottom: 16,
  },
});

export default ProfileScreen;
