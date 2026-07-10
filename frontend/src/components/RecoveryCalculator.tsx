import React, { useState } from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface RecoveryCalculatorProps {
  visible: boolean;
  onClose: () => void;
}

export const RecoveryCalculator: React.FC<RecoveryCalculatorProps> = ({ visible, onClose }) => {
  const [amount, setAmount] = useState('');
  const [calculated, setCalculated] = useState(false);
  const [result, setResult] = useState({ min: 0, max: 0, time: '' });

  const calculate = () => {
    const value = parseFloat(amount.replace(/,/g, '')) || 0;
    if (value > 0) {
      const min = value * 0.85;
      const max = value * 0.98;
      let time = '2-4 semanas';
      if (value > 100000) time = '4-8 semanas';
      if (value > 500000) time = '8-12 semanas';
      setResult({ min, max, time });
      setCalculated(true);
    }
  };

  const reset = () => {
    setAmount('');
    setCalculated(false);
    setResult({ min: 0, max: 0, time: '' });
  };

  const formatCurrency = (value: number) => {
    return '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Animated.View 
          entering={FadeInUp.springify()}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Calculadora de Crédito</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.iconContainer}>
              <Ionicons name="calculator" size={40} color={COLORS.accent} />
            </View>

            <Text style={styles.label}>
              Ingresa el monto que deseas recuperar
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
              <Text style={styles.currencyLabel}>MXN</Text>
            </View>

            {!calculated ? (
              <TouchableOpacity
                style={styles.calculateBtn}
                onPress={calculate}
              >
                <Ionicons name="analytics" size={20} color="#fff" />
                <Text style={styles.calculateBtnText}>Calcular Crédito</Text>
              </TouchableOpacity>
            ) : (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={styles.resultCard}>
                  <Text style={styles.resultTitle}>Estimación de Crédito</Text>
                  
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Mínimo esperado:</Text>
                    <Text style={[styles.resultValue, { color: COLORS.success }]}>{formatCurrency(result.min)}</Text>
                  </View>
                  
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Máximo esperado:</Text>
                    <Text style={[styles.resultValue, { color: COLORS.success }]}>{formatCurrency(result.max)}</Text>
                  </View>
                  
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Tiempo estimado:</Text>
                    <Text style={[styles.resultValue, { color: COLORS.accent }]}>{result.time}</Text>
                  </View>

                  <View style={styles.disclaimer}>
                    <Ionicons name="information-circle" size={16} color={COLORS.warning} />
                    <Text style={styles.disclaimerText}>
                      *Estimación basada en casos similares. El resultado final puede variar.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={reset}
                >
                  <Ionicons name="refresh" size={18} color={COLORS.textLight} />
                  <Text style={styles.resetBtnText}>Calcular otro monto</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: COLORS.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    paddingVertical: 16,
    textAlign: 'center',
    color: COLORS.text,
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  calculateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: COLORS.accent,
  },
  calculateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: COLORS.success + '15',
    borderColor: COLORS.success,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: COLORS.success,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
    backgroundColor: COLORS.warning + '20',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textLight,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    marginBottom: 20,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
  },
});

export default RecoveryCalculator;
