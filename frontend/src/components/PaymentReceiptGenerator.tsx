import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';

interface PaymentReceiptGeneratorProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  userBank?: string;
}

export const PaymentReceiptGenerator: React.FC<PaymentReceiptGeneratorProps> = ({
  visible,
  onClose,
  userName = '',
  userBank = '',
}) => {
  const [receiptData, setReceiptData] = useState({
    recipientName: userName,
    amount: '',
    concept: 'Transferencia de fondos recuperados',
    bank: userBank || 'BBVA',
    referenceNumber: '',
    date: new Date().toLocaleDateString('es-MX'),
    time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    clabe: '',
    senderName: 'RECUPERACIÓN DE CAPITAL S.A. DE C.V.',
  });
  
  const receiptRef = useRef<View>(null);
  const [generating, setGenerating] = useState(false);

  const generateRandomReference = () => {
    const ref = Math.random().toString(36).substring(2, 10).toUpperCase() + 
                Date.now().toString().slice(-6);
    setReceiptData(prev => ({ ...prev, referenceNumber: ref }));
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(number)) return '';
    return number.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });
  };

  const handleShare = async () => {
    if (!receiptData.recipientName || !receiptData.amount) {
      Alert.alert('Error', 'Por favor completa el nombre del beneficiario y el monto');
      return;
    }

    setGenerating(true);
    try {
      if (receiptRef.current) {
        const uri = await captureRef(receiptRef.current, {
          format: 'png',
          quality: 1,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Compartir Comprobante',
          });
        } else {
          Alert.alert('Éxito', 'Comprobante generado correctamente');
        }
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      Alert.alert('Error', 'No se pudo generar el comprobante');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Generar Comprobante de Pago</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Formulario */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Datos del Comprobante</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Beneficiario</Text>
                <TextInput
                  style={styles.input}
                  value={receiptData.recipientName}
                  onChangeText={(text) => setReceiptData(prev => ({ ...prev, recipientName: text.toUpperCase() }))}
                  placeholder="Nombre del beneficiario"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Monto</Text>
                <TextInput
                  style={styles.input}
                  value={receiptData.amount}
                  onChangeText={(text) => setReceiptData(prev => ({ ...prev, amount: text.replace(/[^0-9.]/g, '') }))}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CLABE / Cuenta</Text>
                <TextInput
                  style={styles.input}
                  value={receiptData.clabe}
                  onChangeText={(text) => setReceiptData(prev => ({ ...prev, clabe: text.replace(/[^0-9]/g, '') }))}
                  placeholder="Número de cuenta o CLABE"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={18}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Banco Destino</Text>
                <TextInput
                  style={styles.input}
                  value={receiptData.bank}
                  onChangeText={(text) => setReceiptData(prev => ({ ...prev, bank: text.toUpperCase() }))}
                  placeholder="Nombre del banco"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Concepto</Text>
                <TextInput
                  style={styles.input}
                  value={receiptData.concept}
                  onChangeText={(text) => setReceiptData(prev => ({ ...prev, concept: text }))}
                  placeholder="Concepto de la transferencia"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Referencia</Text>
                <View style={styles.referenceRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={receiptData.referenceNumber}
                    onChangeText={(text) => setReceiptData(prev => ({ ...prev, referenceNumber: text.toUpperCase() }))}
                    placeholder="Número de referencia"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <TouchableOpacity style={styles.generateRefBtn} onPress={generateRandomReference}>
                    <Ionicons name="refresh" size={20} color={'#FFFFFF'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Fecha</Text>
                  <TextInput
                    style={styles.input}
                    value={receiptData.date}
                    onChangeText={(text) => setReceiptData(prev => ({ ...prev, date: text }))}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Hora</Text>
                  <TextInput
                    style={styles.input}
                    value={receiptData.time}
                    onChangeText={(text) => setReceiptData(prev => ({ ...prev, time: text }))}
                    placeholder="HH:MM"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Vista previa del comprobante */}
            <Text style={styles.sectionTitle}>Vista Previa</Text>
            <View ref={receiptRef} collapsable={false} style={styles.receiptPreview}>
              <View style={styles.receiptHeader}>
                <View style={styles.bankLogo}>
                  <Ionicons name="business" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.receiptTitle}>COMPROBANTE DE TRANSFERENCIA</Text>
                <Text style={styles.receiptSubtitle}>SPEI - Sistema de Pagos Electrónicos</Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Fecha y Hora:</Text>
                  <Text style={styles.receiptValue}>{receiptData.date} {receiptData.time}</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Referencia:</Text>
                  <Text style={styles.receiptValue}>{receiptData.referenceNumber || 'N/A'}</Text>
                </View>

                <View style={styles.receiptDivider} />

                <Text style={styles.receiptSectionHeader}>ORDENANTE</Text>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Nombre:</Text>
                  <Text style={styles.receiptValue}>{receiptData.senderName}</Text>
                </View>

                <View style={styles.receiptDivider} />

                <Text style={styles.receiptSectionHeader}>BENEFICIARIO</Text>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Nombre:</Text>
                  <Text style={styles.receiptValue}>{receiptData.recipientName || 'N/A'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Banco:</Text>
                  <Text style={styles.receiptValue}>{receiptData.bank}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>CLABE/Cuenta:</Text>
                  <Text style={styles.receiptValue}>{receiptData.clabe || 'N/A'}</Text>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Concepto:</Text>
                  <Text style={styles.receiptValue}>{receiptData.concept}</Text>
                </View>

                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>MONTO:</Text>
                  <Text style={styles.amountValue}>
                    {receiptData.amount ? formatCurrency(receiptData.amount) : '$0.00 MXN'}
                  </Text>
                </View>

                <View style={styles.statusContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  <Text style={styles.statusText}>TRANSFERENCIA EXITOSA</Text>
                </View>
              </View>

              <View style={styles.receiptFooter}>
                <Text style={styles.footerText}>Este comprobante es un documento digital válido</Text>
                <Text style={styles.footerText}>Conserve este comprobante para cualquier aclaración</Text>
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.shareButton]}
                onPress={handleShare}
                disabled={generating}
              >
                <Ionicons name="share-outline" size={20} color={'#FFFFFF'} />
                <Text style={styles.actionButtonText}>
                  {generating ? 'Generando...' : 'Compartir Comprobante'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateRefBtn: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
  },
  receiptPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bankLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  receiptSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  receiptBody: {
    marginBottom: 16,
  },
  receiptSectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  receiptValue: {
    fontSize: 13,
    color: '#1A1A2E',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  amountContainer: {
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 8,
  },
  receiptFooter: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  actions: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  shareButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
});
