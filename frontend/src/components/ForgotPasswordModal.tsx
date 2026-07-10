import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  apiUrl: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  apiUrl,
}) => {
  const [step, setStep] = useState<'email' | 'token' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetState = () => {
    setStep('email');
    setEmail('');
    setToken('');
    setNewPassword('');
    setConfirmPassword('');
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        // En desarrollo mostramos el token (en producción se envía por email)
        if (data.debug_token) {
          Alert.alert(
            'Código de Crédito',
            `Tu código es: ${data.debug_token}\n\n(En producción, este código se enviaría a tu email)`,
            [{ text: 'OK', onPress: () => setStep('token') }]
          );
          setToken(data.debug_token);
        } else {
          Alert.alert('Enviado', data.message);
          setStep('token');
        }
      } else {
        Alert.alert('Error', data.detail || 'Error al procesar la solicitud');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de crédito');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
      } else {
        Alert.alert('Error', data.detail || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {step === 'email' && (
            <Animated.View entering={FadeInUp} style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
              <Text style={styles.subtitle}>
                Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleRequestReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Enviar Código</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {step === 'token' && (
            <Animated.View entering={FadeInUp} style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="key" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Ingresa el código</Text>
              <Text style={styles.subtitle}>
                Ingresa el código que recibiste y tu nueva contraseña.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Código de crédito"
                placeholderTextColor={COLORS.textMuted}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Nueva contraseña"
                  placeholderTextColor={COLORS.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Restablecer Contraseña</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setStep('email')}
              >
                <Text style={styles.linkText}>← Volver a ingresar correo</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {step === 'success' && (
            <Animated.View entering={FadeInUp} style={styles.content}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="checkmark-circle" size={64} color="#00a878" />
              </View>
              <Text style={styles.title}>¡Contraseña Actualizada!</Text>
              <Text style={styles.subtitle}>
                Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleClose}
              >
                <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeBtn: {
    padding: 8,
  },
  content: {
    padding: 24,
    paddingTop: 0,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: COLORS.accent,
    fontSize: 14,
  },
});

export default ForgotPasswordModal;
