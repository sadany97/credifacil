import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants';

interface ProfilePhotoProps {
  token: string;
  apiUrl: string;
  userName?: string;
  size?: number;
  editable?: boolean;
  onPhotoChange?: (photo: string) => void;
}

export const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  token,
  apiUrl,
  userName = 'Usuario',
  size = 100,
  editable = true,
  onPhotoChange,
}) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhoto();
  }, []);

  const fetchPhoto = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/profile/photo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.has_photo && data.photo) {
          setPhoto(data.photo);
        }
      }
    } catch (error) {
      console.error('Error fetching photo:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    // Solicitar permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso Requerido',
        'Necesitamos acceso a tu galería para seleccionar una foto de perfil.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Abrir selector de imagen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadPhoto(result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    // Solicitar permisos de cámara
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso Requerido',
        'Necesitamos acceso a tu cámara para tomar una foto.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Abrir cámara
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadPhoto(result.assets[0].base64);
    }
  };

  const uploadPhoto = async (base64: string) => {
    setUploading(true);
    try {
      const photoData = `data:image/jpeg;base64,${base64}`;
      
      const response = await fetch(`${apiUrl}/api/profile/photo/base64`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo: photoData }),
      });

      if (response.ok) {
        setPhoto(photoData);
        onPhotoChange?.(photoData);
        Alert.alert('¡Listo!', 'Tu foto de perfil ha sido actualizada.');
      } else {
        throw new Error('Error al subir la foto');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil.');
    } finally {
      setUploading(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Foto de Perfil',
      '¿Cómo deseas actualizar tu foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: '📷 Tomar Foto', onPress: takePhoto },
        { text: '🖼️ Elegir de Galería', onPress: pickImage },
      ]
    );
  };

  const getInitials = () => {
    const names = userName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
      onPress={editable ? showPhotoOptions : undefined}
      disabled={!editable || uploading}
      activeOpacity={0.8}
    >
      {uploading ? (
        <ActivityIndicator color="#FFFFFF" size="large" />
      ) : photo ? (
        <Image
          source={{ uri: photo }}
          style={[styles.photo, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.initialsContainer, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{getInitials()}</Text>
        </View>
      )}
      
      {editable && !uploading && (
        <View style={[styles.editBadge, { 
          width: size * 0.3, 
          height: size * 0.3, 
          borderRadius: size * 0.15,
          right: 0,
          bottom: 0,
        }]}>
          <Ionicons name="camera" size={size * 0.15} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photo: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  editBadge: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default ProfilePhoto;
