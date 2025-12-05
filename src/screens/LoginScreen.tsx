import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {registerUser, loginUser} from '../services/AuthService';

const {width, height} = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const validateEmail = (emailToValidate: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToValidate);
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    if (isRegister && !name.trim()) {
      Alert.alert('Error', 'Nama harus diisi untuk registrasi');
      return;
    }

    setLoading(true);

    try {
      let user;
      if (isRegister) {
        user = await registerUser(email, password, name);
        Alert.alert('Sukses', 'Registrasi berhasil!');
      } else {
        user = await loginUser(email, password);
      }

      if (user) {
        const displayName = user.displayName || name || email.split('@')[0];
        navigation.replace('Chat', {name: displayName});
      }
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email sudah terdaftar';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password terlalu lemah';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email tidak terdaftar';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password salah';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email atau password salah';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#075E54" />
      
      {/* Header Wave */}
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Icon name="chat" size={45} color="#fff" />
          </View>
          <Text style={styles.title}>ChatKu</Text>
          <Text style={styles.tagline}>Ngobrol Tanpa Batas</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>
            {isRegister ? 'Buat Akun Baru' : 'Selamat Datang Kembali'}
          </Text>

          {isRegister && (
            <View style={styles.inputContainer}>
              <Icon name="account-outline" size={22} color="#128C7E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nama Lengkap"
                placeholderTextColor="#A0A0A0"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Icon name="email-outline" size={22} color="#128C7E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-outline" size={22} color="#128C7E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Icon 
                  name={isRegister ? 'account-plus' : 'login'} 
                  size={22} 
                  color="#fff" 
                  style={styles.buttonIcon} 
                />
                <Text style={styles.buttonText}>
                  {isRegister ? 'Daftar Sekarang' : 'Masuk'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsRegister(!isRegister)}
            disabled={loading}
            activeOpacity={0.7}>
            <Text style={styles.switchText}>
              {isRegister
                ? 'Sudah punya akun? '
                : 'Belum punya akun? '}
              <Text style={styles.switchTextBold}>
                {isRegister ? 'Masuk' : 'Daftar'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F3',
  },
  headerContainer: {
    height: height * 0.30,
    backgroundColor: '#075E54',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: '#075E54',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
  },
  iconCircle: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    letterSpacing: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  subtitle: {
    fontSize: 22,
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 24,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  button: {
    backgroundColor: '#128C7E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#128C7E',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#93C5C0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    color: '#6B7280',
    fontSize: 15,
  },
  switchTextBold: {
    color: '#128C7E',
    fontWeight: '700',
  },
});
