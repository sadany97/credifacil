import React, { useState } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { apiCall } from '../services/api';
import { INEVerificationModal } from './INEVerificationModal';

interface VerificationCardProps {
  token: string;
  verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  onUpdate: () => void;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  token,
  verificationStatus = 'none',
  onUpdate
}) => {
  const [ineModalVisible, setIneModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const documentTypes = [
    { id: 'ine', label: 'INE / IFE', icon: 'card', description: 'Captura fotos de tu INE', hasCamera: true },
    { id: 'passport', label: 'Pasaporte', icon: 'document', description: 'Documento de viaje', hasCamera: false },
    { id: 'license', label: 'Licencia de conducir', icon: 'car', description: 'Licencia vigente', hasCamera: false },
  ];

  const handleDocumentSelect = (docId: string) => {
    if (docId === 'ine') {
      setOptionsModalVisible(false);
      setTimeout(() => setIneModalVisible(true), 300);
    } else {
      setSelectedDoc(docId);
      submitBasicVerification(docId);
    }
  };

  const submitBasicVerification = async (docType: string) => {
    setLoading(true);
    try {
      await apiCall('/profile/verification', 'PUT', {
        document_type: docType
      }, token);
      
      Alert.alert(
        'Verificación Solicitada',
        'Tu solicitud de verificación ha sido enviada. Te notificaremos cuando sea revisada.',
        [{ text: 'OK', onPress: () => { setOptionsModalVisible(false); onUpdate(); } }]
      );
    } catch {
      Alert.alert('Error', 'No se pudo enviar la verificación');
    }
    setLoading(false);
  };

  const getStatusConfig = () => {
    switch (verificationStatus) {
      case 'approved':
        return {
          icon: 'checkmark-circle',
          color: COLORS.success,
          title: 'Cuenta Verificada',
          subtitle: 'Tu identidad ha sido verificada',
          showAction: false
        };
      case 'pending':
        return {
          icon: 'time',
          color: COLORS.warning,
          title: 'Verificación Pendiente',
          subtitle: 'Tu solicitud está siendo revisada',
          showAction: false
        };
      case 'rejected':
        return {
          icon: 'close-circle',
          color: COLORS.danger,
          title: 'Verificación Rechazada',
          subtitle: 'Por favor, intenta de nuevo',
          showAction: true
        };
      default:
        return {
          icon: 'shield-outline',
          color: COLORS.textMuted,
          title: 'Cuenta Sin Verificar',
          subtitle: 'Verifica tu identidad para más beneficios',
          showAction: true
        };
    }
  };

  const config = getStatusConfig();

  return (
    <>
      <Animated.View entering={FadeInUp} style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
          <Ionicons name={config.icon as any} size={28} color={config.color} />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>

        {config.showAction && (
          <TouchableOpacity 
            style={styles.verifyBtn}
            onPress={() => setOptionsModalVisible(true)}
          >
            <Text style={styles.verifyBtnText}>Verificar</Text>
          </TouchableOpacity>
        )}

        {verificationStatus === 'approved' && (
          <View style={styles.badge}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
        )}
      </Animated.View>

      {/* Document Selection Modal */}
      <Modal visible={optionsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verificar Identidad</Text>
              <TouchableOpacity onPress={() => setOptionsModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Selecciona el tipo de documento para verificar tu identidad
            </Text>

            <View style={styles.documentList}>
              {documentTypes.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.documentOption,
                    doc.id === 'ine' && styles.documentOptionHighlighted
                  ]}
                  onPress={() => handleDocumentSelect(doc.id)}
                  disabled={loading}
                >
                  <View style={[
                    styles.docIcon,
                    doc.id === 'ine' && styles.docIconHighlighted
                  ]}>
                    <Ionicons 
                      name={doc.icon as any} 
                      size={24} 
                      color={doc.id === 'ine' ? COLORS.primary : COLORS.textMuted} 
                    />
                  </View>
                  <View style={styles.docTextContainer}>
                    <Text style={[
                      styles.docLabel,
                      doc.id === 'ine' && styles.docLabelHighlighted
                    ]}>
                      {doc.label}
                    </Text>
                    <Text style={styles.docDescription}>{doc.description}</Text>
                  </View>
                  {doc.hasCamera && (
                    <View style={styles.cameraBadge}>
                      <Ionicons name="camera" size={14} color="#fff" />
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
              <Text style={styles.infoText}>
                La opción INE permite capturar fotos de tu identificación con la cámara de tu dispositivo para una verificación más rápida.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* INE Camera Verification Modal */}
      <INEVerificationModal
        visible={ineModalVisible}
        onClose={() => setIneModalVisible(false)}
        token={token}
        onSuccess={onUpdate}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 24,
    lineHeight: 20,
  },
  documentList: {
    gap: 12,
    marginBottom: 20,
  },
  documentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  documentOptionHighlighted: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  docIconHighlighted: {
    backgroundColor: COLORS.primary + '20',
  },
  docTextContainer: {
    flex: 1,
  },
  docLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  docLabelHighlighted: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  docDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cameraBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.success + '10',
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});

export default VerificationCard;
