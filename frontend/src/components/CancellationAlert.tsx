import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Razones de cancelación predefinidas
export const CANCELLATION_REASONS = [
  {
    id: 'no_payment',
    title: 'Pago Pendiente',
    description: 'No se ha realizado el pago correspondiente para continuar con el proceso de crédito.',
  },
  {
    id: 'expired_time',
    title: 'Tiempo Expirado',
    description: 'Ha transcurrido demasiado tiempo sin que se realice el traslado de fondos correspondiente.',
  },
  {
    id: 'incomplete_docs',
    title: 'Documentación Incompleta',
    description: 'No se ha proporcionado la documentación requerida para proceder con la crédito.',
  },
  {
    id: 'no_response',
    title: 'Sin Respuesta',
    description: 'No hemos recibido respuesta a nuestras comunicaciones en el tiempo establecido.',
  },
  {
    id: 'verification_failed',
    title: 'Verificación Fallida',
    description: 'No fue posible verificar la información proporcionada para el proceso.',
  },
];

interface CancellationAlertProps {
  visible: boolean;
  onClose: () => void;
  cancellationReason: string;
  cancellationMessage?: string;
  onContinueProcess: () => void;
  onConfirmCancel: () => void;
}

export const CancellationAlert: React.FC<CancellationAlertProps> = ({
  visible,
  onClose,
  cancellationReason,
  cancellationMessage,
  onContinueProcess,
  onConfirmCancel,
}) => {
  const [showFinalWarning, setShowFinalWarning] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const reason = CANCELLATION_REASONS.find(r => r.id === cancellationReason) || CANCELLATION_REASONS[0];

  useEffect(() => {
    if (visible) {
      // Shake animation for alert
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible]);

  const handleProceedCancel = () => {
    setShowFinalWarning(true);
  };

  const handleFinalCancel = () => {
    onConfirmCancel();
    setShowFinalWarning(false);
    onClose();
  };

  const handleClose = () => {
    setShowFinalWarning(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {!showFinalWarning ? (
          <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
            {/* Warning Header */}
            <View style={styles.warningHeader}>
              <Animated.View style={[styles.warningIconContainer, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="warning" size={50} color="#FFFFFF" />
              </Animated.View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Alert Badge */}
              <View style={styles.alertBadge}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.alertBadgeText}>AVISO IMPORTANTE</Text>
              </View>

              <Text style={styles.title}>Trámite en Riesgo de Cancelación</Text>

              {/* Reason Box */}
              <View style={styles.reasonBox}>
                <View style={styles.reasonHeader}>
                  <Ionicons name="document-text" size={20} color={COLORS.danger} />
                  <Text style={styles.reasonTitle}>{reason.title}</Text>
                </View>
                <Text style={styles.reasonDescription}>{reason.description}</Text>
                {cancellationMessage && (
                  <View style={styles.customMessageBox}>
                    <Text style={styles.customMessageLabel}>Mensaje del administrador:</Text>
                    <Text style={styles.customMessage}>{cancellationMessage}</Text>
                  </View>
                )}
              </View>

              {/* Consequences Box */}
              <View style={styles.consequencesBox}>
                <Text style={styles.consequencesTitle}>
                  <Ionicons name="information-circle" size={16} color={COLORS.text} /> Si no se toma acción:
                </Text>
                <View style={styles.consequenceItem}>
                  <View style={styles.consequenceDot} />
                  <Text style={styles.consequenceText}>Su trámite será cancelado definitivamente</Text>
                </View>
                <View style={styles.consequenceItem}>
                  <View style={styles.consequenceDot} />
                  <Text style={styles.consequenceText}>Se dará de baja sin derecho a reembolso</Text>
                </View>
                <View style={styles.consequenceItem}>
                  <View style={styles.consequenceDot} />
                  <Text style={styles.consequenceText}>Perderá el avance del proceso de crédito</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity style={styles.continueButton} onPress={onContinueProcess}>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.continueButtonText}>Continuar con mi proceso</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={handleProceedCancel}>
                <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                <Text style={styles.cancelButtonText}>Proceder a cancelar</Text>
              </TouchableOpacity>

              <Text style={styles.footerNote}>
                CrediFácil Financiero, S.A. de C.V.
              </Text>
            </ScrollView>
          </Animated.View>
        ) : (
          /* Final Warning Modal */
          <View style={styles.finalWarningContainer}>
            <View style={styles.finalWarningIcon}>
              <Ionicons name="skull" size={50} color={COLORS.danger} />
            </View>

            <Text style={styles.finalWarningTitle}>⚠️ ADVERTENCIA FINAL ⚠️</Text>
            
            <View style={styles.finalWarningBox}>
              <Text style={styles.finalWarningText}>
                Al confirmar la cancelación, usted acepta que:
              </Text>
              
              <View style={styles.finalWarningItem}>
                <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                <Text style={styles.finalWarningItemText}>
                  Se cancelará TODO el proceso de crédito de forma permanente
                </Text>
              </View>
              
              <View style={styles.finalWarningItem}>
                <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                <Text style={styles.finalWarningItemText}>
                  NO recibirá la crédito de sus fondos
                </Text>
              </View>
              
              <View style={styles.finalWarningItem}>
                <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                <Text style={styles.finalWarningItemText}>
                  NO tendrá derecho a reembolso alguno
                </Text>
              </View>
              
              <View style={styles.finalWarningItem}>
                <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                <Text style={styles.finalWarningItemText}>
                  Esta decisión es IRREVERSIBLE
                </Text>
              </View>
            </View>

            <View style={styles.disclaimerBox}>
              <Ionicons name="shield" size={20} color={COLORS.textMuted} />
              <Text style={styles.disclaimerText}>
                Esta cancelación es bajo su propia decisión y responsabilidad. 
                CrediFácil Financiero, S.A. de C.V. no se hace responsable 
                de las consecuencias derivadas de esta acción.
              </Text>
            </View>

            <TouchableOpacity style={styles.goBackButton} onPress={() => setShowFinalWarning(false)}>
              <Ionicons name="arrow-back" size={20} color={COLORS.card} />
              <Text style={styles.goBackButtonText}>No, quiero continuar mi proceso</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmCancelButton} onPress={handleFinalCancel}>
              <Text style={styles.confirmCancelButtonText}>Sí, cancelar definitivamente</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  warningHeader: {
    backgroundColor: COLORS.danger,
    paddingVertical: 30,
    alignItems: 'center',
  },
  warningIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.danger + '15',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.danger,
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  reasonBox: {
    backgroundColor: COLORS.danger + '08',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
  },
  reasonDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  customMessageBox: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  customMessageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  customMessage: {
    fontSize: 13,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  consequencesBox: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  consequencesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  consequenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  consequenceText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.success,
    borderRadius: 14,
    paddingVertical: 18,
    marginBottom: 12,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.danger + '50',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.danger,
  },
  footerNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  // Final Warning Styles
  finalWarningContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  finalWarningIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  finalWarningTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  finalWarningBox: {
    backgroundColor: COLORS.danger + '08',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  finalWarningText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 14,
  },
  finalWarningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  finalWarningItemText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  goBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.success,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    marginBottom: 12,
  },
  goBackButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.card,
  },
  confirmCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
  },
  confirmCancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.danger,
    textAlign: 'center',
  },
});

export default CancellationAlert;
