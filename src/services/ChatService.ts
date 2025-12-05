import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  messagesCollection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '../config/firebase';

const MESSAGES_STORAGE_KEY = '@ChatKu:messages';

export interface MessageType {
  id: string;
  text: string;
  user: string;
  imageUrl?: string;
  createdAt: {seconds: number; nanoseconds: number} | null;
  isLocal?: boolean;
}

// Alias for backward compatibility
export type Message = MessageType;

/**
 * Send a text message to Firestore
 */
export const sendMessage = async (
  text: string,
  userName: string,
): Promise<void> => {
  try {
    await addDoc(messagesCollection, {
      text,
      user: userName,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Gagal mengirim pesan');
  }
};

/**
 * Send an image message to Firestore
 */
export const sendImageMessage = async (
  imageUri: string,
  userName: string,
): Promise<void> => {
  try {
    // Upload image to Firebase Storage
    const imageUrl = await uploadImage(imageUri);
    
    // Save message with image URL
    await addDoc(messagesCollection, {
      text: '',
      user: userName,
      imageUrl,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending image message:', error);
    throw new Error('Gagal mengirim gambar');
  }
};

/**
 * Upload image to Firebase Storage
 */
export const uploadImage = async (uri: string): Promise<string> => {
  try {
    // Create blob from URI
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Generate unique filename
    const filename = `chat_images/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);
    
    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Gagal upload gambar');
  }
};

/**
 * Subscribe to real-time messages
 */
export const subscribeToMessages = (
  callback: (messages: MessageType[]) => void,
): (() => void) => {
  const q = query(messagesCollection, orderBy('createdAt', 'asc'));
  
  const unsubscribe = onSnapshot(
    q,
    async snapshot => {
      const messages: MessageType[] = [];
      snapshot.forEach(doc => {
        messages.push({
          id: doc.id,
          ...(doc.data() as Omit<MessageType, 'id'>),
        });
      });
      
      // Save to local storage for offline access
      await saveMessagesToStorage(messages);
      
      callback(messages);
    },
    error => {
      console.error('Error subscribing to messages:', error);
      // On error, try to load from local storage
      loadMessagesFromStorage().then(localMessages => {
        if (localMessages.length > 0) {
          callback(localMessages);
        }
      });
    },
  );
  
  return unsubscribe;
};

/**
 * Save messages to AsyncStorage for offline access
 */
export const saveMessagesToStorage = async (
  messages: MessageType[],
): Promise<void> => {
  try {
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages to storage:', error);
  }
};

/**
 * Load messages from AsyncStorage (offline mode)
 */
export const loadMessagesFromStorage = async (): Promise<MessageType[]> => {
  try {
    const messagesJson = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    if (messagesJson) {
      return JSON.parse(messagesJson) as MessageType[];
    }
    return [];
  } catch (error) {
    console.error('Error loading messages from storage:', error);
    return [];
  }
};

/**
 * Clear messages from local storage
 */
export const clearMessagesFromStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MESSAGES_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing messages from storage:', error);
  }
};

/**
 * Fetch all messages once (for initial load in offline mode)
 */
export const fetchMessagesOnce = async (): Promise<MessageType[]> => {
  try {
    const q = query(messagesCollection, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    const messages: MessageType[] = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...(doc.data() as Omit<MessageType, 'id'>),
      });
    });
    
    // Save to local storage
    await saveMessagesToStorage(messages);
    
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    // Return cached messages if fetch fails
    return loadMessagesFromStorage();
  }
};
