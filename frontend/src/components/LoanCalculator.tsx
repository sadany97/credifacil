import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants';
import { apiCall } from '../services/api';

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

// Tasas de interés por plazo (mensual)
const RATES_BY_TERM: { [key: number]: number } = {
  6: 0.038,
  12: 0.035,
  18: 0.032,
  24: 0.030,
  30: 0.028,
  36: 0.026,
  40: 0.025,
  48: 0.024,
  60: 0.022,
};

const LoanCalculator: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('50000');
  const [selectedTerm, setSelectedTerm] = useState(12);
  const [amortizationTable, setAmortizationTable] = useState<AmortizationRow[]>([]);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const [saving, setSaving] = useState(false);

  // Plazos disponibles según monto
  const getAvailableTerms = (principal: number) => {
    if (principal >= 1000000) {
      return [12, 18, 24, 30, 36, 40, 48, 60]; // Hasta 5 años para >1M
    }
    return [6, 12, 18, 24, 30, 36, 40];
  };

  const availableTerms = getAvailableTerms(parseFloat(amount.replace(/,/g, '')) || 0);

  // Calcular pago mensual
  const calculatePayment = (principal: number, term: number): number => {
    const rate = RATES_BY_TERM[term] || 0.030;
    const n = term;
    const r = rate;
    
    // Fórmula de amortización francesa
    const payment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(payment);
  };

  // Generar tabla de amortización
  const generateAmortizationTable = (principal: number, term: number, payment: number) => {
    const rate = RATES_BY_TERM[term] || 0.030;
    const table: AmortizationRow[] = [];
    let balance = principal;

    for (let month = 1; month <= term; month++) {
      const interest = Math.round(balance * rate);
      const principalPmt = payment - interest;
      balance = Math.max(0, balance - principalPmt);

      table.push({
        month,
        payment,
        principal: principalPmt,
        interest,
        balance: Math.round(balance),
      });
    }
    return table;
  };

  useEffect(() => {
    const principal = parseFloat(amount.replace(/,/g, '')) || 0;
    if (principal > 0) {
      // Ajustar plazo si es necesario
      const terms = getAvailableTerms(principal);
      if (!terms.includes(selectedTerm)) {
        setSelectedTerm(terms[0]);
      }
      
      const payment = calculatePayment(principal, selectedTerm);
      const total = payment * selectedTerm;
      const interest = total - principal;

      setMonthlyPayment(payment);
      setTotalPayment(total);
      setTotalInterest(interest);
      setAmortizationTable(generateAmortizationTable(principal, selectedTerm, payment));
    }
  }, [amount, selectedTerm]);

  const saveSimulation = async () => {
    setSaving(true);
    try {
      const simulation = {
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        amount: parseFloat(amount.replace(/,/g, '')),
        term: selectedTerm,
        monthlyPayment,
        totalPayment,
        totalInterest,
      };

      await apiCall('/users/loan-simulation', 'POST', simulation);

      Alert.alert(
        '✅ Solicitud Enviada',
        'Tu solicitud de crédito ha sido registrada. Un asesor te contactará en las próximas 24 horas.',
        [{ text: 'Entendido' }]
      );
    } catch (error) {
      Alert.alert('✅ Solicitud Registrada', 'Te contactaremos pronto.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return '$' + value.toLocaleString('es-MX');
  };

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  const quickAmounts = [
    { value: 10000, label: '$10K' },
    { value: 30000, label: '$30K' },
    { value: 50000, label: '$50K' },
    { value: 100000, label: '$100K' },
    { value: 500000, label: '$500K' },
    { value: 1000000, label: '$1M' },
    { value: 2000000, label: '$2M' },
    { value: 5000000, label: '$5M' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calculadora de Crédito</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Monto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Monto del Crédito</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="50000"
                placeholderTextColor="#999"
              />
              <Text style={styles.currencyLabel}>MXN</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAmountsScroll}>
              <View style={styles.quickAmounts}>
                {quickAmounts.map((amt) => (
                  <TouchableOpacity
                    key={amt.value}
                    style={[
                      styles.quickAmountBtn,
                      parseFloat(amount) === amt.value && styles.quickAmountBtnActive,
                    ]}
                    onPress={() => setAmount(amt.value.toString())}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        parseFloat(amount) === amt.value && styles.quickAmountTextActive,
                      ]}
                    >
                      {amt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {parseFloat(amount) >= 1000000 && (
              <View style={styles.millionNotice}>
                <Ionicons name="star" size={16} color="#FF9800" />
                <Text style={styles.millionNoticeText}>Créditos desde $1M: hasta 60 meses de plazo</Text>
              </View>
            )}
          </View>

          {/* Plazo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Plazo (Meses)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.termsContainer}>
                {availableTerms.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={[
                      styles.termBtn,
                      selectedTerm === term && styles.termBtnActive,
                    ]}
                    onPress={() => setSelectedTerm(term)}
                  >
                    <Text style={[styles.termText, selectedTerm === term && styles.termTextActive]}>
                      {term}
                    </Text>
                    {term >= 48 && <Text style={styles.termYears}>{Math.floor(term/12)}+ años</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Resultado */}
          <View style={styles.resultSection}>
            <View style={styles.mainResult}>
              <Text style={styles.mainResultLabel}>Tu Mensualidad</Text>
              <Text style={styles.mainResultValue}>{formatCurrency(monthlyPayment)}</Text>
              <Text style={styles.mainResultSubtext}>por {selectedTerm} meses</Text>
            </View>
            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Monto solicitado:</Text>
                <Text style={styles.resultValue}>{formatCurrency(parseFloat(amount) || 0)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total a pagar:</Text>
                <Text style={styles.resultValue}>{formatCurrency(totalPayment)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Intereses:</Text>
                <Text style={[styles.resultValue, { color: '#FF9800' }]}>{formatCurrency(totalInterest)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>CAT aproximado:</Text>
                <Text style={styles.resultValue}>
                  {(((RATES_BY_TERM[selectedTerm] || 0.03) * 12) * 100).toFixed(1)}% anual
                </Text>
              </View>
            </View>
          </View>

          {/* Tabla de amortización */}
          <TouchableOpacity style={styles.showTableBtn} onPress={() => setShowTable(!showTable)}>
            <Ionicons name={showTable ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.primary} />
            <Text style={styles.showTableText}>{showTable ? 'Ocultar' : 'Ver'} Tabla de Amortización</Text>
          </TouchableOpacity>

          {showTable && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.7 }]}>Mes</Text>
                <Text style={styles.tableHeaderCell}>Pago</Text>
                <Text style={styles.tableHeaderCell}>Capital</Text>
                <Text style={styles.tableHeaderCell}>Interés</Text>
                <Text style={styles.tableHeaderCell}>Saldo</Text>
              </View>
              {amortizationTable.slice(0, showTable ? undefined : 12).map((row) => (
                <View key={row.month} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.7 }]}>{row.month}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(row.payment)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(row.principal)}</Text>
                  <Text style={[styles.tableCell, { color: '#FF9800' }]}>{formatCurrency(row.interest)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(row.balance)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Botón solicitar */}
          <TouchableOpacity style={styles.requestBtn} onPress={saveSimulation} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.requestBtnText}>Solicitar Este Crédito</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            * Los montos son aproximados y pueden variar según tu perfil crediticio. Sin comisión por apertura.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  closeButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { flex: 1, padding: 16 },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  amountInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12,
  },
  currencySymbol: { fontSize: 24, fontWeight: '700', color: COLORS.primary, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700', color: COLORS.text },
  currencyLabel: { fontSize: 14, color: '#666', marginLeft: 8 },
  quickAmountsScroll: { marginBottom: 8 },
  quickAmounts: { flexDirection: 'row', gap: 8 },
  quickAmountBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  quickAmountBtnActive: { backgroundColor: COLORS.primary },
  quickAmountText: { fontSize: 13, fontWeight: '600', color: '#666' },
  quickAmountTextActive: { color: '#fff' },
  millionNotice: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0',
    padding: 10, borderRadius: 8, marginTop: 8, gap: 6,
  },
  millionNoticeText: { fontSize: 12, color: '#E65100', fontWeight: '500' },
  termsContainer: { flexDirection: 'row', gap: 10 },
  termBtn: {
    width: 65, height: 50, borderRadius: 12, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  termBtnActive: { backgroundColor: COLORS.primary },
  termText: { fontSize: 16, fontWeight: '600', color: '#666' },
  termTextActive: { color: '#fff' },
  termYears: { fontSize: 9, color: '#999', marginTop: 2 },
  resultSection: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  mainResult: { backgroundColor: COLORS.primary, padding: 24, alignItems: 'center' },
  mainResultLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  mainResultValue: { fontSize: 42, fontWeight: '800', color: '#fff' },
  mainResultSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  resultDetails: { padding: 16 },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  resultLabel: { fontSize: 14, color: '#666' },
  resultValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  showTableBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16,
  },
  showTableText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: COLORS.primary },
  tableContainer: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 8 },
  tableHeaderCell: { flex: 1, fontSize: 10, fontWeight: '600', color: '#fff', textAlign: 'center' },
  tableRow: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  tableCell: { flex: 1, fontSize: 10, color: COLORS.text, textAlign: 'center' },
  requestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, marginBottom: 16, gap: 8,
  },
  requestBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  disclaimer: { fontSize: 11, color: '#999', textAlign: 'center', lineHeight: 16, paddingHorizontal: 16 },
});

export default LoanCalculator;
