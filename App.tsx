/**
 * ChatKu - React Native Chat App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet, Text, StatusBar} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import {getUserFromStorage} from './src/services/AuthService';

export type RootStackParamList = {
  Login: undefined;
  Chat: {name: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#075E54" />
      <View style={styles.splashIconCircle}>
        <Icon name="chat" size={55} color="#fff" />
      </View>
      <Text style={styles.splashTitle}>ChatKu</Text>
      <Text style={styles.splashTagline}>Ngobrol Tanpa Batas</Text>
      <ActivityIndicator size="large" color="#fff" style={styles.loader} />
    </View>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Chat'>('Login');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    checkAutoLogin();
  }, []);

  const checkAutoLogin = async () => {
    try {
      const savedUser = await getUserFromStorage();
      if (savedUser && savedUser.email) {
        const displayName =
          savedUser.displayName || savedUser.email.split('@')[0];
        setUserName(displayName);
        setInitialRoute('Chat');
      }
    } catch (error) {
      console.error('Auto login check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          initialParams={initialRoute === 'Chat' ? {name: userName} : undefined}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#075E54',
  },
  splashIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  splashTitle: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  splashTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    letterSpacing: 1,
  },
  loader: {
    marginTop: 50,
  },
});
