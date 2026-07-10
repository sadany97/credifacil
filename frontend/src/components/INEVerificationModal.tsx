import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { apiCall } from '../services/api';
import * as Linking from 'expo-linking';

interface INEVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

type CaptureStep = 'front' | 'back' | 'selfie' | 'review';

export const INEVerificationModal: React.FC<INEVerificationModalProps> = ({
  visible,
  onClose,
  token,
  onSuccess,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<CaptureStep>('front');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  
  // Captured images
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  
  const cameraRef = useRef<CameraView>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setStep('front');
      setFrontImage(null);
      setBackImage(null);
      setSelfieImage(null);
      setFacing('back');
    }
  }, [visible]);

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      // Check if we can ask again
      if (!result.canAskAgain) {
        Alert.alert(
          'Permiso de Cámara',
          'La cámara es necesaria para capturar tu INE. Por favor habilita el permiso desde la configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
      }
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady) return;
    
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });
      
      if (photo?.uri) {
        switch (step) {
          case 'front':
            setFrontImage(photo.uri);
            setStep('back');
            break;
          case 'back':
            setBackImage(photo.uri);
            setFacing('front');
            setStep('selfie');
            break;
          case 'selfie':
            setSelfieImage(photo.uri);
            setStep('review');
            break;
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'No se pudo capturar la imagen. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        switch (step) {
          case 'front':
            setFrontImage(uri);
            setStep('back');
            break;
          case 'back':
            setBackImage(uri);
            setStep('selfie');
            break;
          case 'selfie':
            setSelfieImage(uri);
            setStep('review');
            break;
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const retakeImage = (imageStep: CaptureStep) => {
    switch (imageStep) {
      case 'front':
        setFrontImage(null);
        setFacing('back');
        break;
      case 'back':
        setBackImage(null);
        setFacing('back');
        break;
      case 'selfie':
        setSelfieImage(null);
        setFacing('front');
        break;
    }
    setStep(imageStep);
  };

  const submitVerification = async () => {
    if (!frontImage || !backImage || !selfieImage) {
      Alert.alert('Error', 'Faltan imágenes por capturar');
      return;
    }

    setSubmitting(true);
    try {
      await apiCall('/profile/ine-verification', 'POST', {
        front_image: frontImage,
        back_image: backImage,
        selfie_image: selfieImage,
        document_type: 'ine'
      }, token);

      Alert.alert(
        'Verificación Enviada',
        'Tus documentos han sido enviados para verificación. Te notificaremos cuando sean revisados.',
        [{ text: 'OK', onPress: () => { onClose(); onSuccess(); } }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo enviar la verificación');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepConfig = () => {
    switch (step) {
      case 'front':
        return {
          title: 'Frente de tu INE',
          instruction: 'Coloca el frente de tu INE dentro del marco',
          icon: 'card',
          progress: 1,
        };
      case 'back':
        return {
          title: 'Reverso de tu INE',
          instruction: 'Ahora voltea tu INE y captura el reverso',
          icon: 'card-outline',
          progress: 2,
        };
      case 'selfie':
        return {
          title: 'Selfie de Verificación',
          instruction: 'Toma una selfie clara de tu rostro',
          icon: 'person',
          progress: 3,
        };
      case 'review':
        return {
          title: 'Revisar Documentos',
          instruction: 'Verifica que todas las imágenes sean claras',
          icon: 'checkmark-circle',
          progress: 4,
        };
    }
  };

  const config = getStepConfig();

  // Render permission request screen
  if (!permission?.granted && visible) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.permissionContainer}>
            <View style={styles.permissionIconBox}>
              <Ionicons name="camera" size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.permissionTitle}>Permiso de Cámara</Text>
            <Text style={styles.permissionText}>
              Necesitamos acceso a tu cámara para capturar las fotos de tu INE y verificar tu identidad.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={handleRequestPermission}>
              <Ionicons name="camera" size={22} color="#fff" />
              <Text style={styles.permissionBtnText}>Permitir Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Render review screen
  if (step === 'review') {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.reviewContainer}>
          <View style={styles.reviewHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.reviewTitle}>Revisar Documentos</Text>
            <View style={{ width: 44 }} />
          </View>

          <Text style={styles.reviewSubtitle}>
            Verifica que todas las imágenes sean claras y legibles
          </Text>

          <View style={styles.imagesGrid}>
            {/* Front INE */}
            <View style={styles.imageCard}>
              <Text style={styles.imageLabel}>Frente de INE</Text>
              {frontImage && (
                <Image source={{ uri: frontImage }} style={styles.previewImage} />
              )}
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => retakeImage('front')}
              >
                <Ionicons name="camera" size={16} color={COLORS.primary} />
                <Text style={styles.retakeBtnText}>Volver a tomar</Text>
              </TouchableOpacity>
            </View>

            {/* Back INE */}
            <View style={styles.imageCard}>
              <Text style={styles.imageLabel}>Reverso de INE</Text>
              {backImage && (
                <Image source={{ uri: backImage }} style={styles.previewImage} />
              )}
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => retakeImage('back')}
              >
                <Ionicons name="camera" size={16} color={COLORS.primary} />
                <Text style={styles.retakeBtnText}>Volver a tomar</Text>
              </TouchableOpacity>
            </View>

            {/* Selfie */}
            <View style={styles.imageCard}>
              <Text style={styles.imageLabel}>Selfie</Text>
              {selfieImage && (
                <Image source={{ uri: selfieImage }} style={styles.previewImage} />
              )}
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => retakeImage('selfie')}
              >
                <Ionicons name="camera" size={16} color={COLORS.primary} />
                <Text style={styles.retakeBtnText}>Volver a tomar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={submitVerification}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={22} color="#fff" />
                  <Text style={styles.submitBtnText}>Enviar Verificación</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Render camera screen
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.cameraContainer}>
        {/* Header */}
        <View style={styles.cameraHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.stepTitle}>{config.title}</Text>
            <View style={styles.progressDots}>
              {[1, 2, 3, 4].map((dot) => (
                <View
                  key={dot}
                  style={[
                    styles.progressDot,
                    config.progress >= dot && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Camera View */}
        <View style={styles.cameraWrapper}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            onCameraReady={() => setCameraReady(true)}
          >
            {/* Frame Overlay */}
            <View style={styles.frameOverlay}>
              <View style={[
                styles.frame,
                step === 'selfie' ? styles.frameSelfie : styles.frameCard
              ]}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
          </CameraView>
        </View>

        {/* Instruction */}
        <View style={styles.instructionBox}>
          <Ionicons name={config.icon as any} size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>{config.instruction}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryBtn} onPress={pickImageFromGallery}>
            <Ionicons name="images" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureBtn, loading && styles.captureBtnDisabled]}
            onPress={takePicture}
            disabled={loading || !cameraReady}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <View style={styles.captureBtnInner} />
            )}
          </TouchableOpacity>

          <View style={{ width: 56 }} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  permissionIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 14,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  closeBtn: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  stepTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    position: 'relative',
  },
  frameCard: {
    width: '85%',
    aspectRatio: 1.58,
    borderRadius: 16,
  },
  frameSelfie: {
    width: 250,
    height: 320,
    borderRadius: 125,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#fff',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  instructionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 30,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  galleryBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  // Review Screen Styles
  reviewContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  imagesGrid: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  imageCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    flex: 1,
  },
  imageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  previewImage: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    minHeight: 100,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
  },
  retakeBtnText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  reviewActions: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.success,
    paddingVertical: 18,
    borderRadius: 14,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default INEVerificationModal;
