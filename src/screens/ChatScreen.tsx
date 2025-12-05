import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {
  sendMessage as sendChatMessage,
  sendImageMessage,
  subscribeToMessages,
  MessageType,
  loadMessagesFromStorage,
} from '../services/ChatService';
import {showImagePickerOptions} from '../services/ImageService';
import {logoutUser} from '../services/AuthService';

const {width} = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({route, navigation}: Props) {
  const {name} = route.params;
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [sendingImage, setSendingImage] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load cached messages first for offline support
    const loadCachedMessages = async () => {
      const cached = await loadMessagesFromStorage();
      if (cached.length > 0) {
        setMessages(cached);
      }
    };
    loadCachedMessages();

    // Subscribe to real-time updates
    const unsub = subscribeToMessages(newMessages => {
      setMessages(newMessages);
      setIsOffline(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      await sendChatMessage(message, name);
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengirim pesan');
    }
  };

  const handleSendImage = async () => {
    const selectedImage = await showImagePickerOptions();
    if (!selectedImage) return;

    setSendingImage(true);
    try {
      await sendImageMessage(selectedImage.uri, name);
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Gagal mengirim gambar');
    } finally {
      setSendingImage(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Apakah Anda yakin ingin keluar?', [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const renderItem = ({item}: {item: MessageType}) => {
    const isMyMessage = item.user === name;

    return (
      <View
        style={[
          styles.msgBox,
          isMyMessage ? styles.myMsg : styles.otherMsg,
        ]}>
        <Text style={styles.sender}>{item.user}</Text>
        
        {item.imageUrl ? (
          <Image
            source={{uri: item.imageUrl}}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.messageText}>{item.text}</Text>
        )}
        
        <Text style={styles.timestamp}>
          {item.createdAt
            ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Mengirim...'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#075E54" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <Icon name="chat" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>ChatKu</Text>
            {isOffline && (
              <View style={styles.offlineContainer}>
                <Icon name="wifi-off" size={12} color="#FFD54F" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Icon name="account-circle" size={18} color="#128C7E" />
        <Text style={styles.userName}>Hai, {name}!</Text>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chat-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>Belum ada pesan</Text>
            <Text style={styles.emptySubtext}>Mulai percakapan baru!</Text>
          </View>
        }
      />

      {/* Image Sending Indicator */}
      {sendingImage && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#128C7E" />
          <Text style={styles.uploadingText}>Mengunggah gambar...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handleSendImage}
          disabled={sendingImage}>
          <Icon name="camera" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Ketik pesan..."
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!message.trim()}>
          <Icon name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#075E54',
    paddingTop: 45,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  offlineText: {
    fontSize: 11,
    color: '#FFD54F',
    marginLeft: 4,
    fontWeight: '500',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  msgBox: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 16,
    maxWidth: '78%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  myMsg: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    marginLeft: width * 0.18,
  },
  otherMsg: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    marginRight: width * 0.18,
  },
  sender: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 12,
    color: '#075E54',
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 21,
  },
  messageImage: {
    width: width * 0.52,
    height: width * 0.52,
    borderRadius: 10,
    marginVertical: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#DCF8C6',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
  },
  uploadingText: {
    marginLeft: 10,
    color: '#075E54',
    fontSize: 14,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F0F2F5',
    alignItems: 'flex-end',
  },
  imageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 16,
    maxHeight: 110,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#128C7E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#93C5C0',
  },
});
