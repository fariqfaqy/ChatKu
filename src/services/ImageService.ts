import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import {Platform, PermissionsAndroid, Alert} from 'react-native';

export interface SelectedImage {
  uri: string;
  type: string;
  fileName: string;
}

/**
 * Request camera permission for Android
 */
const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Izin Kamera',
          message: 'ChatKu membutuhkan akses kamera untuk mengambil foto',
          buttonNeutral: 'Tanya Nanti',
          buttonNegative: 'Batal',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

/**
 * Pick image from gallery
 */
export const pickImageFromGallery = async (): Promise<SelectedImage | null> => {
  return new Promise(resolve => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 1024,
      maxWidth: 1024,
      quality: 0.8 as const,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        resolve(null);
        return;
      }

      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', 'Gagal memilih gambar');
        resolve(null);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.uri) {
          resolve({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || `image_${Date.now()}.jpg`,
          });
          return;
        }
      }

      resolve(null);
    });
  });
};

/**
 * Take photo with camera
 */
export const takePhotoWithCamera = async (): Promise<SelectedImage | null> => {
  const hasPermission = await requestCameraPermission();
  
  if (!hasPermission) {
    Alert.alert('Izin Ditolak', 'Izin kamera diperlukan untuk mengambil foto');
    return null;
  }

  return new Promise(resolve => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 1024,
      maxWidth: 1024,
      quality: 0.8 as const,
      saveToPhotos: true,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        resolve(null);
        return;
      }

      if (response.errorCode) {
        console.error('Camera Error:', response.errorMessage);
        Alert.alert('Error', 'Gagal mengambil foto');
        resolve(null);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.uri) {
          resolve({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          });
          return;
        }
      }

      resolve(null);
    });
  });
};

/**
 * Show image picker options (Gallery or Camera)
 */
export const showImagePickerOptions = (): Promise<SelectedImage | null> => {
  return new Promise(resolve => {
    Alert.alert(
      'Pilih Gambar',
      'Ambil gambar dari:',
      [
        {
          text: 'Kamera',
          onPress: async () => {
            const image = await takePhotoWithCamera();
            resolve(image);
          },
        },
        {
          text: 'Galeri',
          onPress: async () => {
            const image = await pickImageFromGallery();
            resolve(image);
          },
        },
        {
          text: 'Batal',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      {cancelable: true, onDismiss: () => resolve(null)},
    );
  });
};
