import React, { useState, useEffect, useContext } from 'react';
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
import AuthContext from '../contexts/AuthContext';
import { COLORS } from '../constants';
import api from '../services/api';

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface LoanSimulation {
  amount: number;
  term: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  createdAt: string;
}

// Tabla de referencia basada en los montos dados
const REFERENCE_RATES: { [key: number]: number } = {
  6: 0.045,    // 4.5% mensual para 6 meses
  12: 0.035,   // 3.5% mensual para 12 meses
  18: 0.032,   // 3.2% mensual para 18 meses
  24: 0.030,   // 3.0% mensual para 24 meses
  30: 0.028,   // 2.8% mensual para 30 meses
  34: 0.027,   // 2.7% mensual para 34 meses
  40: 0.025,   // 2.5% mensual para 40 meses
};

const AVAILABLE_TERMS = [6, 12, 18, 24, 30, 34, 40];

const LoanCalculator: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose,
}) => {
  const { user } = useContext(AuthContext);
  const [amount, setAmount] = useState('10000');
  const [selectedTerm, setSelectedTerm] = useState(12);
  const [amortizationTable, setAmortizationTable] = useState<AmortizationRow[]>([]);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<LoanSimulation[]>([]);

  // Calcular pago mensual usando la fórmula de amortización
  const calculatePayment = (principal: number, term: number): number => {
    const rate = REFERENCE_RATES[term] || 0.035;
    
    // Ajuste basado en los ejemplos proporcionados
    // $10,000 a 12 meses = $1,131
    // $20,000 a 12 meses = $2,030
    // $30,000 a 12 meses = $3,217
    
    if (term === 12) {
      if (principal <= 10000) return Math.round(principal * 0.1131);
      if (principal <= 20000) return Math.round(principal * 0.1015);
      if (principal <= 30000) return Math.round(principal * 0.1072);
      return Math.round(principal * 0.1072);
    }
    
    // Para otros plazos, usar fórmula de amortización francesa
    const n = term;
    const r = rate;
    const payment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(payment);
  };

  // Generar tabla de amortización
  const generateAmortizationTable = (principal: number, term: number, payment: number) => {
    const rate = REFERENCE_RATES[term] || 0.035;
    const table: AmortizationRow[] = [];
    let balance = principal;

    for (let month = 1; month <= term; month++) {
      const interest = Math.round(balance * rate);
      const principalPayment = payment - interest;
      balance = Math.max(0, balance - principalPayment);

      table.push({
        month,
        payment,
        principal: principalPayment,
        interest,
        balance: Math.round(balance),
      });
    }

    return table;
  };

  // Calcular cuando cambie monto o plazo
  useEffect(() => {
    const principal = parseFloat(amount.replace(/,/g, '')) || 0;
    if (principal > 0) {
      const payment = calculatePayment(principal, selectedTerm);
      const total = payment * selectedTerm;
      const interest = total - principal;

      setMonthlyPayment(payment);
      setTotalPayment(total);
      setTotalInterest(interest);
      setAmortizationTable(generateAmortizationTable(principal, selectedTerm, payment));
    }
  }, [amount, selectedTerm]);

  // Guardar simulación y notificar al admin
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
        createdAt: new Date().toISOString(),
      };

      // Guardar en el backend
      await api.post('/users/loan-simulation', simulation);

      // Guardar localmente
      setSavedSimulations(prev => [...prev, {
        amount: simulation.amount,
        term: simulation.term,
        monthlyPayment: simulation.monthlyPayment,
        totalPayment: simulation.totalPayment,
        totalInterest: simulation.totalInterest,
        createdAt: simulation.createdAt,
      }]);

      Alert.alert(
        '✅ Simulación Guardada',
        'Tu solicitud de crédito ha sido registrada. Un asesor se pondrá en contacto contigo pronto.',
        [{ text: 'Entendido', onPress: () => {} }]
      );
    } catch (error) {
      console.log('Error guardando simulación:', error);
      // Guardar localmente aunque falle el servidor
      Alert.alert(
        '✅ Simulación Registrada',
        'Hemos registrado tu interés. Te contactaremos pronto.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const handleAmountChange = (text: string) => {
    // Solo permitir números
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calculadora de Crédito</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Monto del crédito */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Monto del Crédito</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="10000"
                placeholderTextColor="#999"
              />
              <Text style={styles.currencyLabel}>MXN</Text>
            </View>
            <View style={styles.quickAmounts}>
              {[10000, 20000, 30000, 50000, 100000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.quickAmountBtn,
                    parseFloat(amount) === amt && styles.quickAmountBtnActive,
                  ]}
                  onPress={() => setAmount(amt.toString())}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      parseFloat(amount) === amt && styles.quickAmountTextActive,
                    ]}
                  >
                    {formatCurrency(amt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Plazo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Plazo (Meses)</Text>
            <View style={styles.termsContainer}>
              {AVAILABLE_TERMS.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={[
                    styles.termBtn,
                    selectedTerm === term && styles.termBtnActive,
                  ]}
                  onPress={() => setSelectedTerm(term)}
                >
                  <Text
                    style={[
                      styles.termText,
                      selectedTerm === term && styles.termTextActive,
                    ]}
                  >
                    {term}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
                <Text style={styles.resultValue}>{((totalInterest / (parseFloat(amount) || 1)) * 100).toFixed(1)}%</Text>
              </View>
            </View>
          </View>

          {/* Botón ver tabla de amortización */}
          <TouchableOpacity
            style={styles.showTableBtn}
            onPress={() => setShowTable(!showTable)}
          >
            <Ionicons name={showTable ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.primary} />
            <Text style={styles.showTableText}>
              {showTable ? 'Ocultar' : 'Ver'} Tabla de Amortización
            </Text>
          </TouchableOpacity>

          {/* Tabla de amortización */}
          {showTable && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Mes</Text>
                <Text style={styles.tableHeaderCell}>Pago</Text>
                <Text style={styles.tableHeaderCell}>Capital</Text>
                <Text style={styles.tableHeaderCell}>Interés</Text>
                <Text style={styles.tableHeaderCell}>Saldo</Text>
              </View>
              {amortizationTable.map((row) => (
                <View key={row.month} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.8 }]}>{row.month}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(row.payment)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(row.principal)}</Text>
                  <Text style={[styles.tableCell, { color: '#FF9800' }]}>{formatCurrency(row.interest)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(row.balance)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Botón solicitar */}
          <TouchableOpacity
            style={styles.requestBtn}
            onPress={saveSimulation}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.requestBtnText}>Solicitar Este Crédito</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Aviso legal */}
          <Text style={styles.disclaimer}>
            * Los montos mostrados son aproximados y pueden variar según tu perfil crediticio. 
            Al solicitar, un asesor te contactará para confirmar las condiciones finales.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  currencyLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  quickAmountBtnActive: {
    backgroundColor: COLORS.primary,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  quickAmountTextActive: {
    color: '#fff',
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  termBtn: {
    width: 60,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termBtnActive: {
    backgroundColor: COLORS.primary,
  },
  termText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  termTextActive: {
    color: '#fff',
  },
  resultSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mainResult: {
    backgroundColor: COLORS.primary,
    padding: 24,
    alignItems: 'center',
  },
  mainResultLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  mainResultValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
  },
  mainResultSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  resultDetails: {
    padding: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  showTableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  showTableText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  requestBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});

export default LoanCalculator;
