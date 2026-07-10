import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../constants';
import { apiCall } from '../services/api';

interface SPEIReceiptGeneratorProps {
  visible: boolean;
  onClose: () => void;
  token: string;
}

export const SPEIReceiptGenerator: React.FC<SPEIReceiptGeneratorProps> = ({
  visible,
  onClose,
  token,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
    hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    bancoReceptor: '',
    beneficiario: '',
    cuentaBeneficiario: '',
    curpRfc: '',
    conceptoPago: '',
    monto: '',
  });

  const bancos = [
    'BBVA', 'SANTANDER', 'BANAMEX', 'BANORTE', 'HSBC', 
    'SCOTIABANK', 'BANCOPPEL', 'BANCO AZTECA', 'BANREGIO',
    'INBURSA', 'AFIRME', 'BANSI', 'STP', 'OTROS'
  ];

  const [showBancosList, setShowBancosList] = useState(false);

  const handleGeneratePDF = async () => {
    // Validar campos
    if (!formData.bancoReceptor || !formData.beneficiario || !formData.cuentaBeneficiario || !formData.monto) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const response = await apiCall('/admin/generate-spei-receipt', 'POST', {
        fecha: formData.fecha,
        hora: formData.hora,
        banco_receptor: formData.bancoReceptor,
        beneficiario: formData.beneficiario,
        cuenta_beneficiario: formData.cuentaBeneficiario,
        curp_rfc: formData.curpRfc,
        concepto_pago: formData.conceptoPago,
        monto: parseFloat(formData.monto.replace(/,/g, '')) || 0,
      }, token);

      if (response.pdf) {
        const filename = response.filename || `comprobante_spei_${Date.now()}.pdf`;
        const fileUri = FileSystem.documentDirectory + filename;

        await FileSystem.writeAsStringAsync(fileUri, response.pdf, {
          encoding: 'base64',
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Comprobante SPEI',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Éxito', 'PDF generado correctamente');
        }

        // Limpiar formulario
        setFormData({
          fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
          hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          bancoReceptor: '',
          beneficiario: '',
          cuentaBeneficiario: '',
          curpRfc: '',
          conceptoPago: '',
          monto: '',
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Error generating SPEI receipt:', error);
      const errorMsg = error?.message || error?.toString() || 'Error desconocido';
      Alert.alert('Error', `No se pudo generar el comprobante: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const formatMonto = (text: string) => {
    // Remover todo excepto números y punto
    const cleaned = text.replace(/[^0-9.]/g, '');
    setFormData({ ...formData, monto: cleaned });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>SPEI</Text>
                <Text style={styles.logoSubtext}>Comprobante Electrónico</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Fecha y Hora */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Fecha de operación *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fecha}
                  onChangeText={(text) => setFormData({ ...formData, fecha: text })}
                  placeholder="05 de Noviembre del 2025"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Hora *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.hora}
                  onChangeText={(text) => setFormData({ ...formData, hora: text })}
                  placeholder="13:52:48"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            {/* Banco Receptor */}
            <View style={styles.field}>
              <Text style={styles.label}>Banco receptor *</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowBancosList(!showBancosList)}
              >
                <Text style={formData.bancoReceptor ? styles.selectText : styles.placeholderText}>
                  {formData.bancoReceptor || 'Seleccionar banco'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              {showBancosList && (
                <View style={styles.dropdown}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {bancos.map((banco) => (
                      <TouchableOpacity
                        key={banco}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, bancoReceptor: banco });
                          setShowBancosList(false);
                        }}
                      >
                        <Text style={styles.dropdownText}>{banco}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Beneficiario */}
            <View style={styles.field}>
              <Text style={styles.label}>Beneficiario (Titular) *</Text>
              <TextInput
                style={styles.input}
                value={formData.beneficiario}
                onChangeText={(text) => setFormData({ ...formData, beneficiario: text.toUpperCase() })}
                placeholder="NOMBRE COMPLETO DEL BENEFICIARIO"
                placeholderTextColor="#666"
                autoCapitalize="characters"
              />
            </View>

            {/* Cuenta Beneficiario */}
            <View style={styles.field}>
              <Text style={styles.label}>CLABE / Tarjeta / Número de celular *</Text>
              <TextInput
                style={styles.input}
                value={formData.cuentaBeneficiario}
                onChangeText={(text) => setFormData({ ...formData, cuentaBeneficiario: text })}
                placeholder="Número de cuenta o CLABE"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>

            {/* CURP/RFC */}
            <View style={styles.field}>
              <Text style={styles.label}>CURP o RFC del beneficiario</Text>
              <TextInput
                style={styles.input}
                value={formData.curpRfc}
                onChangeText={(text) => setFormData({ ...formData, curpRfc: text.toUpperCase() })}
                placeholder="CURP o RFC (opcional)"
                placeholderTextColor="#666"
                autoCapitalize="characters"
                maxLength={18}
              />
            </View>

            {/* Concepto de pago */}
            <View style={styles.field}>
              <Text style={styles.label}>Concepto de pago</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={formData.conceptoPago}
                onChangeText={(text) => setFormData({ ...formData, conceptoPago: text.toUpperCase() })}
                placeholder="CONCEPTO DEL PAGO"
                placeholderTextColor="#666"
                autoCapitalize="characters"
                multiline
              />
            </View>

            {/* Monto */}
            <View style={styles.field}>
              <Text style={styles.label}>Monto (Pesos MXN) *</Text>
              <View style={styles.montoContainer}>
                <Text style={styles.montoPrefix}>$</Text>
                <TextInput
                  style={styles.montoInput}
                  value={formData.monto}
                  onChangeText={formatMonto}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Se generará automáticamente: Número de referencia, Clave de rastreo, 
                Número de serie del certificado de seguridad y demás datos oficiales.
              </Text>
            </View>

            {/* Botón Generar */}
            <TouchableOpacity
              style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
              onPress={handleGeneratePDF}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="document-text" size={22} color="#FFF" />
                  <Text style={styles.generateBtnText}>Generar Comprobante PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    height: '95%',
    backgroundColor: '#0a0a0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a237e',
    borderBottomWidth: 3,
    borderBottomColor: '#ff6f00',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 12,
    color: '#ff6f00',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAA',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  selectInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  selectText: {
    fontSize: 15,
    color: '#FFF',
  },
  placeholderText: {
    fontSize: 15,
    color: '#666',
  },
  dropdown: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  dropdownText: {
    fontSize: 14,
    color: '#FFF',
  },
  montoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  montoPrefix: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
    paddingLeft: 14,
  },
  montoInput: {
    flex: 1,
    padding: 14,
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 35, 126, 0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1a237e',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#AAA',
    lineHeight: 18,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    borderRadius: 14,
    padding: 18,
    gap: 10,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default SPEIReceiptGenerator;
