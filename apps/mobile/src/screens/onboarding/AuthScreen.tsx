import React, {useState} from 'react';
import {View, StyleSheet, KeyboardAvoidingView, Platform} from 'react-native';
import {Text, Button, TextInput, HelperText} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OnboardingStackParamList} from '../../navigation/types';
import {useStore} from '../../store';
import {signup, login} from '../../api';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'Auth'
>;

const AuthScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {setUser, setToken} = useStore();

  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isValidPassword = (p: string) => p.length >= 6;

  const handleSubmit = async () => {
    setError(null);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isValidPassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response =
        mode === 'signup'
          ? await signup(email, password)
          : await login(email, password);

      setToken(response.access_token);
      setUser(response.user);
      navigation.navigate('Summary');
    } catch (err: any) {
      let message = 'Something went wrong. Please try again.';

      if (err.response?.status === 400) {
        if (err.response?.data?.detail?.includes('already registered')) {
          message = 'This email is already registered. Try signing in instead.';
        } else {
          message = err.response?.data?.detail || 'Invalid email or password.';
        }
      } else if (err.response?.status === 401) {
        message = 'Incorrect email or password. Please try again.';
      } else if (err.response?.status === 422) {
        message = 'Please check your email and password format.';
      } else if (!err.response) {
        message = 'Could not connect to the server. Please check your internet connection.';
      } else if (err.response?.data?.detail) {
        message = err.response.data.detail;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.step}>Step 8 of 9</Text>
            <Text style={styles.title}>
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signup'
                ? 'Sign up to save your progress and analysis history.'
                : 'Sign in to continue to your account.'}
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              outlineColor="#E0E0E0"
              activeOutlineColor="#2E7D32"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              outlineColor="#E0E0E0"
              activeOutlineColor="#2E7D32"
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            {error && (
              <HelperText type="error" visible={true}>
                {error}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
              buttonColor="#2E7D32">
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>

            <Button
              mode="text"
              onPress={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setError(null);
              }}
              textColor="#2E7D32">
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
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
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  submitButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default AuthScreen;
