import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { User } from '../contexts/AuthContext';

interface RetentionModalProps {
  visible: boolean;
  onClose: () => void;
  profile: any;
  user: User | null;
}

export const RetentionModal: React.FC<RetentionModalProps> = ({ visible, onClose, profile, user }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.retentionModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saldo Retenido</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Retention Amount */}
            <View style={styles.retentionAmountBox}>
              <Ionicons name="lock-closed" size={40} color={COLORS.warning} />
              <Text style={styles.retentionAmountLabel}>Monto Retenido</Text>
              <Text style={styles.retentionAmountValue}>
                ${profile?.retained_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
              </Text>
            </View>

            {/* Reason for retention */}
            <View style={styles.retentionReasonBox}>
              <View style={styles.retentionReasonHeader}>
                <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
                <Text style={styles.retentionReasonTitle}>Motivo de la Retención</Text>
              </View>
              <Text style={styles.retentionReasonText}>
                {profile?.retention_concept || 'Sin concepto especificado'}
              </Text>
              <Text style={styles.retentionReasonDescription}>
                Para liberar estos fondos, es necesario realizar el pago correspondiente mediante alguna de las siguientes opciones:
              </Text>
            </View>

            {/* Payment Options */}
            <Text style={styles.paymentOptionsTitle}>Opciones de Pago</Text>

            {/* SPEI Option */}
            <View style={styles.paymentOptionCard}>
              <View style={styles.paymentOptionHeader}>
                <View style={styles.paymentOptionIconBg}>
                  <Ionicons name="flash" size={24} color={COLORS.accent} />
                </View>
                <View style={styles.paymentOptionInfo}>
                  <Text style={styles.paymentOptionName}>Transferencia SPEI</Text>
                  <Text style={styles.paymentOptionTime}>Se refleja en minutos</Text>
                </View>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recomendado</Text>
                </View>
              </View>
              <View style={styles.bankDetailsBox}>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Banco:</Text>
                  <Text style={styles.bankDetailValue}>STP</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>CLABE:</Text>
                  <Text style={styles.bankDetailValueMono}>646180263504340002</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Beneficiario:</Text>
                  <Text style={styles.bankDetailValue}>CrediFácil</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Referencia:</Text>
                  <Text style={styles.bankDetailValueMono}>2015478</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Concepto:</Text>
                  <Text style={styles.bankDetailValue}>{profile?.retention_concept || 'Pago pendiente'}</Text>
                </View>
              </View>
            </View>

            {/* Deposit Option */}
            <View style={styles.paymentOptionCard}>
              <View style={styles.paymentOptionHeader}>
                <View style={[styles.paymentOptionIconBg, { backgroundColor: COLORS.success + '15' }]}>
                  <Ionicons name="business" size={24} color={COLORS.success} />
                </View>
                <View style={styles.paymentOptionInfo}>
                  <Text style={styles.paymentOptionName}>Depósito en Ventanilla</Text>
                  <Text style={styles.paymentOptionTime}>Se refleja en 24-48 hrs</Text>
                </View>
              </View>
              <View style={styles.bankDetailsBox}>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Banco:</Text>
                  <Text style={styles.bankDetailValue}>BBVA México</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>No. Cuenta:</Text>
                  <Text style={styles.bankDetailValueMono}>1509060666</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Beneficiario:</Text>
                  <Text style={styles.bankDetailValue}>CrediFácil</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Referencia:</Text>
                  <Text style={styles.bankDetailValueMono}>2015478</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Concepto:</Text>
                  <Text style={styles.bankDetailValue}>Folio de Cliente</Text>
                </View>
              </View>
            </View>

            {/* OXXO Option */}
            <View style={styles.paymentOptionCard}>
              <View style={styles.paymentOptionHeader}>
                <View style={[styles.paymentOptionIconBg, { backgroundColor: '#cc0000' + '15' }]}>
                  <Ionicons name="storefront" size={24} color="#cc0000" />
                </View>
                <View style={styles.paymentOptionInfo}>
                  <Text style={styles.paymentOptionName}>OXXO</Text>
                  <Text style={styles.paymentOptionTime}>Pago en efectivo</Text>
                </View>
              </View>
              <View style={styles.oxxoMessageBox}>
                <Ionicons name="information-circle" size={24} color={COLORS.warning} />
                <Text style={styles.oxxoMessageText}>
                  Solicita un número de referencia o de cuenta para realizar tu pago por este medio.
                </Text>
              </View>
            </View>

            {/* Store Payment Options */}
            <Text style={styles.paymentOptionsSectionTitle}>Pago en Tiendas y Establecimientos</Text>
            <Text style={styles.paymentOptionsSectionSubtitle}>
              Presenta tu número de referencia Pespay en caja para realizar el pago
            </Text>

            {/* Reference Number Box */}
            <View style={styles.referenceNumberBox}>
              <Text style={styles.referenceNumberLabel}>Tu número de referencia Pespay</Text>
              <Text style={styles.referenceNumberValue}>
                10036314159275209145
              </Text>
              <View style={styles.referenceAmountRow}>
                <Text style={styles.referenceAmountLabel}>Monto a pagar:</Text>
                <Text style={styles.referenceAmountValue}>
                  ${profile?.retained_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                </Text>
              </View>
            </View>

            {/* Store Options Grid */}
            <View style={styles.storesGrid}>
              <View style={styles.storeCard}>
                <View style={[styles.storeIconBg, { backgroundColor: '#0071ce' + '20' }]}>
                  <Ionicons name="cart" size={22} color="#0071ce" />
                </View>
                <Text style={styles.storeName}>Walmart</Text>
                <Text style={styles.storeTime}>1 a 2 hrs</Text>
              </View>

              <View style={styles.storeCard}>
                <View style={[styles.storeIconBg, { backgroundColor: '#ffc220' + '30' }]}>
                  <Ionicons name="cart" size={22} color="#d4a000" />
                </View>
                <Text style={styles.storeName}>Bodega Aurrerá</Text>
                <Text style={styles.storeTime}>1 a 2 hrs</Text>
              </View>

              <View style={styles.storeCard}>
                <View style={[styles.storeIconBg, { backgroundColor: '#0060a9' + '20' }]}>
                  <Ionicons name="cart" size={22} color="#0060a9" />
                </View>
                <Text style={styles.storeName}>Sam's Club</Text>
                <Text style={styles.storeTime}>1 a 2 hrs</Text>
              </View>

              <View style={styles.storeCard}>
                <View style={[styles.storeIconBg, { backgroundColor: '#00a651' + '20' }]}>
                  <Ionicons name="medical" size={22} color="#00a651" />
                </View>
                <Text style={styles.storeName}>Farmacias del Ahorro</Text>
                <Text style={styles.storeTime}>1 a 2 hrs</Text>
              </View>

              <View style={styles.storeCard}>
                <View style={[styles.storeIconBg, { backgroundColor: '#ff6600' + '20' }]}>
                  <Ionicons name="storefront" size={22} color="#ff6600" />
                </View>
                <Text style={styles.storeName}>Kiosko</Text>
                <Text style={styles.storeTime}>1 a 2 hrs</Text>
              </View>

              <View style={styles.storeCard}>
                <View style={[styles.storeIconBg, { backgroundColor: '#e31837' + '20' }]}>
                  <Ionicons name="pricetag" size={22} color="#e31837" />
                </View>
                <Text style={styles.storeName}>Waldos</Text>
                <Text style={styles.storeTime}>1 a 2 hrs</Text>
              </View>
            </View>

            {/* Store Payment Instructions */}
            <View style={styles.storeInstructionsBox}>
              <Text style={styles.storeInstructionsTitle}>Instrucciones de pago en tienda:</Text>
              <View style={styles.instructionStep}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>Acude a cualquiera de las tiendas indicadas</Text>
              </View>
              <View style={styles.instructionStep}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>Indica que deseas realizar un pago de servicios</Text>
              </View>
              <View style={styles.instructionStep}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>Proporciona tu número de referencia al cajero</Text>
              </View>
              <View style={styles.instructionStep}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>4</Text>
                </View>
                <Text style={styles.instructionText}>Paga el monto indicado y envía tu comprobante</Text>
              </View>
            </View>

            {/* Important Notice */}
            <View style={styles.importantNotice}>
              <Ionicons name="information-circle" size={20} color={COLORS.accent} />
              <Text style={styles.importantNoticeText}>
                Una vez realizado el pago, envía tu comprobante por los canales oficiales. Tu saldo será liberado y visualizado de manera inmediata.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  retentionModalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
    paddingBottom: 0,
  },
  retentionAmountBox: {
    backgroundColor: COLORS.warning + '10',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  retentionAmountLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
  },
  retentionAmountValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.warning,
    marginTop: 4,
  },
  retentionReasonBox: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  retentionReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  retentionReasonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  retentionReasonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: 12,
  },
  retentionReasonDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  paymentOptionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  paymentOptionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentOptionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionInfo: {
    flex: 1,
    marginLeft: 14,
  },
  paymentOptionName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  paymentOptionTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  recommendedBadge: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  bankDetailsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bankDetailLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  bankDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  bankDetailValueMono: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  oxxoMessageBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '10',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  oxxoMessageText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    fontWeight: '500',
  },
  paymentOptionsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 8,
  },
  paymentOptionsSectionSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  referenceNumberBox: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  referenceNumberLabel: {
    fontSize: 12,
    color: COLORS.platinum,
    marginBottom: 8,
  },
  referenceNumberValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.card,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  referenceAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  referenceAmountLabel: {
    fontSize: 13,
    color: COLORS.platinum,
  },
  referenceAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gold,
  },
  storesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  storeCard: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  storeTime: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  storeInstructionsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  storeInstructionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  instructionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    color: COLORS.card,
    fontSize: 13,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  importantNotice: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent + '10',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  importantNoticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    margin: 24,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    color: COLORS.card,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default RetentionModal;
