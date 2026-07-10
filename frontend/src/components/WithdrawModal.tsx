import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { SmartBankInput } from './SmartBankInput';

interface WithdrawModalProps {
  visible: boolean;
  onClose: () => void;
  profile: any;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ visible, onClose, profile }) => {
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawData, setWithdrawData] = useState({
    bank: '',
    clabe: '',
    amount: '',
    beneficiary: '',
    withdrawType: 'bank' as 'bank' | 'cash', // Tipo de retiro
    cashCode: '', // Código para retiro en efectivo
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Generar código de retiro profesional
  const generateCashCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 9000 + 1000);
    const prefix = 'RCE'; // Crédito Capital Efectivo
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleWithdrawSubmit = () => {
    // Validación según tipo de retiro
    if (withdrawData.withdrawType === 'bank') {
      if (!withdrawData.bank || !withdrawData.clabe || !withdrawData.amount || !withdrawData.beneficiary) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }
      
      if (withdrawData.clabe.length !== 18) {
        Alert.alert('Error', 'La CLABE debe tener 18 dígitos');
        return;
      }
    } else {
      // Retiro en efectivo
      if (!withdrawData.amount || !withdrawData.beneficiary) {
        Alert.alert('Error', 'Por favor ingresa el monto y nombre del beneficiario');
        return;
      }
    }
    
    const amount = parseFloat(withdrawData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    
    if (amount > (profile?.available_balance || 0)) {
      Alert.alert('Error', 'El monto excede tu crédito disponible');
      return;
    }

    setIsProcessing(true);
    
    // Generar código si es retiro en efectivo
    const newData = { ...withdrawData };
    if (withdrawData.withdrawType === 'cash' && !withdrawData.cashCode) {
      newData.cashCode = generateCashCode();
      newData.bank = 'RETIRO EN EFECTIVO';
      setWithdrawData(newData);
    }
    
    setTimeout(() => {
      setIsProcessing(false);
      setWithdrawStep(2);
    }, 2500);
  };

  const resetWithdrawModal = () => {
    onClose();
    setWithdrawStep(1);
    setWithdrawData({ bank: '', clabe: '', amount: '', beneficiary: '', withdrawType: 'bank', cashCode: '' });
    setIsProcessing(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={resetWithdrawModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.withdrawModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {withdrawStep === 1 ? 'Solicitar Retiro' : 'Solicitud Enviada'}
            </Text>
            <TouchableOpacity onPress={resetWithdrawModal} style={styles.modalClose}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {withdrawStep === 1 ? (
            <>
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.withdrawBalanceBox}>
                  <Text style={styles.withdrawBalanceLabel}>Crédito Disponible</Text>
                  <Text style={styles.withdrawBalanceValue}>
                    ${profile?.available_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                  </Text>
                </View>

                <View style={styles.securityBadgeRow}>
                  <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
                  <Text style={styles.securityBadgeText}>Transacción segura y encriptada</Text>
                </View>

                {/* Selector de tipo de retiro */}
                <Text style={styles.inputLabel}>Método de retiro *</Text>
                <View style={styles.withdrawTypeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.withdrawTypeOption,
                      withdrawData.withdrawType === 'bank' && styles.withdrawTypeOptionActive
                    ]}
                    onPress={() => setWithdrawData({ ...withdrawData, withdrawType: 'bank', cashCode: '' })}
                  >
                    <View style={[
                      styles.withdrawTypeIcon,
                      withdrawData.withdrawType === 'bank' && styles.withdrawTypeIconActive
                    ]}>
                      <Ionicons 
                        name="business" 
                        size={22} 
                        color={withdrawData.withdrawType === 'bank' ? COLORS.card : COLORS.textMuted} 
                      />
                    </View>
                    <Text style={[
                      styles.withdrawTypeText,
                      withdrawData.withdrawType === 'bank' && styles.withdrawTypeTextActive
                    ]}>Transferencia Bancaria</Text>
                    {withdrawData.withdrawType === 'bank' && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.withdrawTypeOption,
                      withdrawData.withdrawType === 'cash' && styles.withdrawTypeOptionActive
                    ]}
                    onPress={() => setWithdrawData({ ...withdrawData, withdrawType: 'cash', bank: '', clabe: '' })}
                  >
                    <View style={[
                      styles.withdrawTypeIcon,
                      withdrawData.withdrawType === 'cash' && styles.withdrawTypeIconActive,
                      withdrawData.withdrawType === 'cash' && { backgroundColor: COLORS.warning }
                    ]}>
                      <Ionicons 
                        name="cash" 
                        size={22} 
                        color={withdrawData.withdrawType === 'cash' ? COLORS.card : COLORS.textMuted} 
                      />
                    </View>
                    <Text style={[
                      styles.withdrawTypeText,
                      withdrawData.withdrawType === 'cash' && styles.withdrawTypeTextActive
                    ]}>Retiro en Efectivo</Text>
                    {withdrawData.withdrawType === 'cash' && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    )}
                  </TouchableOpacity>
                </View>

                {withdrawData.withdrawType === 'cash' && (
                  <View style={styles.cashInfoBox}>
                    <View style={styles.cashInfoHeader}>
                      <Ionicons name="information-circle" size={20} color={COLORS.warning} />
                      <Text style={styles.cashInfoTitle}>Retiro sin cuenta bancaria</Text>
                    </View>
                    <Text style={styles.cashInfoText}>
                      Se generará un código de retiro único que podrás usar en cualquier sucursal bancaria participante para recoger tu efectivo.
                    </Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Monto a retirar *</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    value={withdrawData.amount}
                    onChangeText={(text) => setWithdrawData({ ...withdrawData, amount: text })}
                    keyboardType="decimal-pad"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={styles.currencyCode}>MXN</Text>
                </View>

                {/* Campos para transferencia bancaria */}
                {withdrawData.withdrawType === 'bank' && (
                  <>
                    <Text style={styles.inputLabel}>Banco destino *</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ej: BBVA, Banorte, Santander..."
                      value={withdrawData.bank}
                      onChangeText={(text) => setWithdrawData({ ...withdrawData, bank: text })}
                      placeholderTextColor={COLORS.textMuted}
                    />

                    <Text style={styles.inputLabel}>CLABE Interbancaria (18 dígitos) *</Text>
                    <SmartBankInput
                      value={withdrawData.clabe}
                      onChangeText={(formatted, clean) => {
                        setWithdrawData({ 
                          ...withdrawData, 
                          clabe: clean.slice(0, 18) 
                        });
                      }}
                      placeholder="Ingresa la CLABE de 18 dígitos"
                      inputType="clabe"
                      onBankDetected={(bankName) => {
                        if (bankName && !withdrawData.bank) {
                          setWithdrawData(prev => ({ ...prev, bank: bankName }));
                        }
                      }}
                    />
                  </>
                )}

                <Text style={styles.inputLabel}>Nombre del beneficiario *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nombre como aparece en el banco"
                  value={withdrawData.beneficiary}
                  onChangeText={(text) => setWithdrawData({ ...withdrawData, beneficiary: text })}
                  placeholderTextColor={COLORS.textMuted}
                />

                <View style={styles.withdrawInfoBox}>
                  <View style={styles.withdrawInfoRow}>
                    <Ionicons name="time-outline" size={18} color={COLORS.textLight} />
                    <Text style={styles.withdrawInfoText}>Tiempo estimado: 24-48 horas hábiles</Text>
                  </View>
                  <View style={styles.withdrawInfoRow}>
                    <Ionicons name="card-outline" size={18} color={COLORS.warning} />
                    <Text style={[styles.withdrawInfoText, { color: COLORS.warning }]}>Comisión cambio sujeto sin previo aviso</Text>
                  </View>
                  <View style={styles.withdrawInfoRow}>
                    <Ionicons name="notifications-outline" size={18} color={COLORS.textLight} />
                    <Text style={styles.withdrawInfoText}>Recibirás confirmación por correo</Text>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity 
                style={[styles.modalButton, styles.withdrawButton, isProcessing && styles.buttonDisabled]} 
                onPress={handleWithdrawSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator color={COLORS.card} size="small" />
                    <Text style={styles.modalButtonText}>  Procesando...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="paper-plane" size={20} color={COLORS.card} />
                    <Text style={styles.modalButtonText}>  Solicitar Retiro</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <ScrollView style={styles.receiptScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.successContainer}>
                {/* Receipt Header */}
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptLogoContainer}>
                    <View style={styles.receiptLogo}>
                      <Ionicons name="shield-checkmark" size={32} color={COLORS.success} />
                    </View>
                  </View>
                  <Text style={styles.receiptCompanyName}>CrediFácil</Text>
                  <Text style={styles.receiptSubtitle}>Comprobante Electrónico de Pago</Text>
                </View>

                {/* Success Icon */}
                <View style={styles.successIconContainer}>
                  <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark" size={50} color={COLORS.card} />
                  </View>
                </View>
                <Text style={styles.successTitle}>Solicitud Enviada</Text>
                <Text style={styles.successSubtitle}>Tu retiro está siendo procesado</Text>
                
                {/* Receipt Details */}
                <View style={styles.receiptBox}>
                  <View style={styles.receiptTitleRow}>
                    <Ionicons name="document-text" size={18} color={COLORS.primary} />
                    <Text style={styles.receiptTitleText}>Detalles de la Operación</Text>
                  </View>
                  
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Monto:</Text>
                    <Text style={styles.receiptDetailValueLarge}>
                      ${parseFloat(withdrawData.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </Text>
                  </View>
                  
                  <View style={styles.receiptDivider} />

                  {withdrawData.withdrawType === 'cash' ? (
                    <>
                      {/* Información para retiro en efectivo */}
                      <View style={styles.cashCodeSection}>
                        <Text style={styles.cashCodeLabel}>CÓDIGO DE RETIRO</Text>
                        <View style={styles.cashCodeBox}>
                          <Ionicons name="barcode" size={24} color={COLORS.warning} />
                          <Text style={styles.cashCodeText}>{withdrawData.cashCode}</Text>
                        </View>
                        <Text style={styles.cashCodeHint}>
                          Presenta este código en ventanilla
                        </Text>
                      </View>
                      
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Tipo:</Text>
                        <View style={styles.cashBadge}>
                          <Ionicons name="cash" size={14} color={COLORS.card} />
                          <Text style={styles.cashBadgeText}>Retiro en Efectivo</Text>
                        </View>
                      </View>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Beneficiario:</Text>
                        <Text style={styles.receiptDetailValue}>{withdrawData.beneficiary}</Text>
                      </View>
                      
                      <View style={styles.cashInstructionsBox}>
                        <Text style={styles.cashInstructionsTitle}>Instrucciones de retiro:</Text>
                        <View style={styles.cashInstructionItem}>
                          <Text style={styles.cashInstructionNumber}>1</Text>
                          <Text style={styles.cashInstructionText}>Acude a cualquier sucursal bancaria participante</Text>
                        </View>
                        <View style={styles.cashInstructionItem}>
                          <Text style={styles.cashInstructionNumber}>2</Text>
                          <Text style={styles.cashInstructionText}>Proporciona tu código de retiro en ventanilla</Text>
                        </View>
                        <View style={styles.cashInstructionItem}>
                          <Text style={styles.cashInstructionNumber}>3</Text>
                          <Text style={styles.cashInstructionText}>Presenta tu identificación oficial vigente</Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Información para transferencia bancaria */}
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Banco destino:</Text>
                        <Text style={styles.receiptDetailValue}>{withdrawData.bank}</Text>
                      </View>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>CLABE:</Text>
                        <Text style={styles.receiptDetailValueMono}>
                          {withdrawData.clabe.replace(/(\d{4})(\d{4})(\d{4})(\d{4})(\d{2})/, '$1 $2 $3 $4 $5')}
                        </Text>
                      </View>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Beneficiario:</Text>
                        <Text style={styles.receiptDetailValue}>{withdrawData.beneficiary}</Text>
                      </View>
                    </>
                  )}
                  
                  <View style={styles.receiptDivider} />
                  
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>No. Operación:</Text>
                    <Text style={[styles.receiptDetailValueMono, { color: COLORS.success }]}>
                      RC{Date.now().toString().slice(-8)}
                    </Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Fecha y hora:</Text>
                    <Text style={styles.receiptDetailValue}>
                      {new Date().toLocaleDateString('es-MX', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Estado:</Text>
                    <View style={styles.statusBadge}>
                      <Ionicons name="time" size={12} color={COLORS.warning} />
                      <Text style={styles.statusBadgeText}>En proceso</Text>
                    </View>
                  </View>
                </View>

                {/* QR Code Placeholder */}
                <View style={styles.qrContainer}>
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code" size={60} color={COLORS.primary} />
                  </View>
                  <Text style={styles.qrText}>Código de verificación</Text>
                </View>

                <View style={styles.successNotice}>
                  <Ionicons name="information-circle" size={20} color={COLORS.accent} />
                  <Text style={styles.successNoticeText}>
                    Este comprobante es tu constancia de la solicitud de retiro. Guárdalo para cualquier aclaración.
                  </Text>
                </View>

                <View style={styles.receiptFooter}>
                  <Text style={styles.receiptFooterText}>
                    CrediFácil Financiero, S.A. de C.V.
                  </Text>
                  <Text style={styles.receiptFooterSubtext}>
                    Documento generado electrónicamente
                  </Text>
                </View>

                <TouchableOpacity 
                  style={[styles.modalButton, { marginTop: 24, marginHorizontal: 0 }]} 
                  onPress={resetWithdrawModal}
                >
                  <Text style={styles.modalButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  withdrawModalContent: {
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
  withdrawBalanceBox: {
    backgroundColor: COLORS.success + '10',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  withdrawBalanceLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  withdrawBalanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.success,
    marginTop: 4,
  },
  securityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  securityBadgeText: {
    fontSize: 12,
    color: COLORS.success,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  monoInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },
  withdrawInfoBox: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  withdrawInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  withdrawInfoText: {
    fontSize: 13,
    color: COLORS.textLight,
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
  withdrawButton: {
    backgroundColor: COLORS.success,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: 24,
  },
  successDetailsBox: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 18,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  successDetailLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  successDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  successDetailValueMono: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  successNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  successNoticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  // Receipt styles
  receiptScroll: {
    maxHeight: '85%',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderStyle: 'dashed',
  },
  receiptLogoContainer: {
    marginBottom: 12,
  },
  receiptLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptCompanyName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  receiptSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  receiptTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  receiptTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptDetailLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  receiptDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  receiptDetailValueLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.success,
  },
  receiptDetailValueMono: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.warning,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderStyle: 'dashed',
  },
  qrPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  qrText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderStyle: 'dashed',
  },
  receiptFooterText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  receiptFooterSubtext: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  // Estilos para selector de tipo de retiro
  withdrawTypeSelector: {
    gap: 10,
    marginBottom: 20,
  },
  withdrawTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  withdrawTypeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  withdrawTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  withdrawTypeIconActive: {
    backgroundColor: COLORS.primary,
  },
  withdrawTypeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  withdrawTypeTextActive: {
    color: COLORS.text,
  },
  // Estilos para info de retiro en efectivo
  cashInfoBox: {
    backgroundColor: COLORS.warning + '12',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  cashInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cashInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warning,
  },
  cashInfoText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  // Estilos para código de retiro en recibo
  cashCodeSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },
  cashCodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  cashCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.warning + '15',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.warning,
    borderStyle: 'dashed',
  },
  cashCodeText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.warning,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cashCodeHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  cashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cashBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.card,
  },
  cashInstructionsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  cashInstructionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  cashInstructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cashInstructionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    color: COLORS.card,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    marginRight: 10,
    overflow: 'hidden',
  },
  cashInstructionText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});

export default WithdrawModal;
