import React, { useState, useEffect, useRef } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TESTIMONIALS, obtenerTestimoniosFrescos } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import {
  ProfessionalLogo,
  TrustBadges,
  StatsBanner,
  TestimonialCard,
  ForgotPasswordModal,
} from '../components';
import Constants from 'expo-constants';
import { 
  checkBiometricAvailability, 
  authenticateWithBiometrics, 
  getBiometricCredentials,
  saveBiometricCredentials
} from '../utils/biometrics';
import { triggerHaptic, triggerSuccessHaptic, triggerErrorHaptic } from '../utils/haptics';

// Logo de CrediFácil
const CREDIFACIL_LOGO_URL = 'https://customer-assets.emergentagent.com/job_perfil-capital/artifacts/credifacil_logo.png';

// URL base para los documentos legales - Sin hardcodear
const BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Slogans de CrediFácil - CONFIANZA Y FACILIDAD
const SLOGANS = [
  "Más de $1,200 millones en créditos otorgados en 2024",
  "Institución regulada por CONDUSEF | Registro SIPRES vigente",
  "95% de solicitudes aprobadas | +1,000,000 clientes satisfechos",
  "Sin revisar Buró de Crédito | Aprobación en 24 horas",
  "Miembros activos de ASOFOM | Operación 100% legal y transparente",
  "Tasas competitivas desde 1.5% mensual | Sin comisiones ocultas",
  "Premio Nacional de Inclusión Financiera 2023 y 2024",
  "Certificación ISO 27001 en Seguridad de la Información",
  "Más de 15 años impulsando el crecimiento de familias mexicanas",
  "Tu crédito aprobado de forma fácil, rápida y segura",
];

// Nombres mexicanos realistas para notificaciones
const NOMBRES_CLIENTES = [
  "María Guadalupe H.", "José Antonio R.", "Ana Patricia M.", "Carlos Eduardo S.",
  "Rosa María L.", "Juan Manuel G.", "Leticia del Carmen V.", "Miguel Ángel P.",
  "Gabriela Fernanda T.", "Francisco Javier O.", "Martha Elena C.", "Roberto Carlos D.",
  "Verónica Alejandra N.", "Luis Fernando B.", "Patricia Eugenia A.", "Sergio Adrián F.",
  "María de los Ángeles K.", "Jorge Alberto W.", "Claudia Ivonne Z.", "Raúl Ernesto Q.",
  "Sandra Luz M.", "Alejandro David R.", "Mónica Isabel H.", "Arturo Enrique J.",
  "Guadalupe Esperanza L.", "Ricardo Daniel P.", "Elena Cristina S.", "Eduardo Martín V.",
  "Teresa de Jesús G.", "Óscar Armando C.", "Silvia Margarita B.", "Héctor Manuel T.",
];

// Ciudades mexicanas
const CIUDADES = [
  "CDMX", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Zapopan",
  "Mérida", "Cancún", "Querétaro", "San Luis Potosí", "Aguascalientes", "Toluca",
  "Morelia", "Chihuahua", "Hermosillo", "Saltillo", "Culiacán", "Veracruz", "Tampico",
];

// Generar monto aleatorio realista entre $5,000 y $5,000,000
const generarMontoAleatorio = (): string => {
  const min = 5000;
  const max = 5000000;
  const monto = Math.random() * (max - min) + min;
  // Agregar centavos aleatorios
  const centavos = Math.floor(Math.random() * 100);
  const montoFinal = Math.floor(monto) + (centavos / 100);
  return montoFinal.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Generar tiempo aleatorio
const generarTiempoAleatorio = (): string => {
  const opciones = [
    "hace 2 minutos",
    "hace 5 minutos",
    "hace 8 minutos",
    "hace 12 minutos",
    "hace 15 minutos",
    "hace 23 minutos",
    "hace 31 minutos",
    "hace 45 minutos",
    "hace 1 hora",
    "hace 2 horas",
  ];
  return opciones[Math.floor(Math.random() * opciones.length)];
};

// Generar notificación de crédito
const generarNotificacionRecuperacion = () => {
  const nombre = NOMBRES_CLIENTES[Math.floor(Math.random() * NOMBRES_CLIENTES.length)];
  const ciudad = CIUDADES[Math.floor(Math.random() * CIUDADES.length)];
  const monto = generarMontoAleatorio();
  const tiempo = generarTiempoAleatorio();
  return { nombre, ciudad, monto, tiempo };
};

// Número de WhatsApp de soporte
const WHATSAPP_NUMBER = '5215512345678';

export const LoginScreen: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeSlogan, setActiveSlogan] = useState(0);
  const [testimonials, setTestimonials] = useState(TESTIMONIALS);
  const [notificacionVisible, setNotificacionVisible] = useState(false);
  const [notificacionActual, setNotificacionActual] = useState(generarNotificacionRecuperacion());
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  
  // Estados para biometría
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [biometricEmail, setBiometricEmail] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricHardwareExists, setBiometricHardwareExists] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  
  // Estado para modal de crédito de contraseña
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  
  // Detectar si es pantalla grande (tablet/PC)
  const isLargeScreen = width >= 768;
  const isDesktop = width >= 1024;

  // Verificar disponibilidad de biometría al inicio
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const { available, biometricType: type, hardwareExists, enrolled } = await checkBiometricAvailability();
        console.log('[Login] Biometric check:', { available, type, hardwareExists, enrolled });
        setBiometricAvailable(available);
        setBiometricType(type);
        setBiometricHardwareExists(hardwareExists);
        setBiometricEnrolled(enrolled);
        
        if (available) {
          const { enabled, email: savedEmail } = await getBiometricCredentials();
          if (enabled && savedEmail) {
            setBiometricEmail(savedEmail);
          }
        }
      } catch (error) {
        console.log('Error checking biometrics:', error);
      }
    };
    checkBiometrics();
  }, []);

  // Función para login biométrico
  const handleBiometricLogin = async () => {
    if (!biometricEmail) {
      Alert.alert('Configuración Requerida', 'Primero debes iniciar sesión con tu correo y contraseña para activar el acceso biométrico.');
      return;
    }

    setBiometricLoading(true);
    try {
      const result = await authenticateWithBiometrics();
      
      if (result.success) {
        await triggerSuccessHaptic();
        // El usuario se autenticó con biometría, ahora hacer login
        setEmail(biometricEmail);
        // Como no tenemos la contraseña guardada, mostramos mensaje
        Alert.alert(
          '✅ Verificación Exitosa',
          `Bienvenido de vuelta. Por seguridad, ingresa tu contraseña para ${biometricEmail}`,
          [{ text: 'OK' }]
        );
      } else if (result.error === 'fallback') {
        // Usuario eligió usar contraseña
        setEmail(biometricEmail);
      } else {
        await triggerErrorHaptic();
        if (result.error !== 'Autenticación cancelada') {
          Alert.alert('Error', result.error || 'No se pudo verificar tu identidad');
        }
      }
    } catch (error: any) {
      await triggerErrorHaptic();
      console.error('Biometric login error:', error);
    } finally {
      setBiometricLoading(false);
    }
  };

  // Función para abrir WhatsApp
  const openWhatsApp = () => {
    triggerHaptic('light');
    const message = 'Hola, me gustaría obtener información sobre el servicio de CrediFácil.';
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    });
  };

  // Cargar testimonios frescos (generados dinámicamente)
  useEffect(() => {
    // Usar testimonios generados localmente para garantizar consistencia
    // Los testimonios se generan dinámicamente cada día con nombres mexicanos
    const testimoniosFrescos = obtenerTestimoniosFrescos();
    setTestimonials(testimoniosFrescos);
  }, []);

  // Rotación de testimonios
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Rotación de slogans
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlogan((prev) => (prev + 1) % SLOGANS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Notificaciones de crédito aleatorias
  useEffect(() => {
    // Mostrar primera notificación después de 3 segundos
    const initialTimeout = setTimeout(() => {
      setNotificacionActual(generarNotificacionRecuperacion());
      setNotificacionVisible(true);
    }, 3000);

    // Ciclo de notificaciones
    const interval = setInterval(() => {
      setNotificacionVisible(false);
      setTimeout(() => {
        setNotificacionActual(generarNotificacionRecuperacion());
        setNotificacionVisible(true);
      }, 1000);
    }, 8000); // Nueva notificación cada 8 segundos

    // Ocultar notificación después de 6 segundos
    const hideInterval = setInterval(() => {
      setTimeout(() => {
        setNotificacionVisible(false);
      }, 6000);
    }, 8000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      clearInterval(hideInterval);
    };
  }, []);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name) || (!isLogin && !phone)) {
      await triggerErrorHaptic();
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (!isLogin && phone.length < 10) {
      await triggerErrorHaptic();
      Alert.alert('Error', 'El número de teléfono debe tener al menos 10 dígitos');
      return;
    }
    try {
      await triggerHaptic('light');
      if (isLogin) {
        await login(email, password);
        await triggerSuccessHaptic();
        // Preguntar si desea activar biometría después de login exitoso
        if (biometricAvailable && !biometricEmail) {
          setTimeout(() => {
            Alert.alert(
              `¿Activar ${biometricType}?`,
              `¿Deseas usar ${biometricType} para iniciar sesión más rápido la próxima vez?`,
              [
                { text: 'No, gracias', style: 'cancel' },
                { 
                  text: 'Sí, activar', 
                  onPress: async () => {
                    await saveBiometricCredentials(email);
                    setBiometricEmail(email);
                    await triggerSuccessHaptic();
                  }
                }
              ]
            );
          }, 500);
        }
      } else {
        await register(email, password, name, phone);
        await triggerSuccessHaptic();
      }
    } catch (error: any) {
      await triggerErrorHaptic();
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Notificación de Crédito Flotante */}
      {notificacionVisible && (
        <Animated.View 
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          style={styles.notificacionFlotante}
        >
          <View style={styles.notificacionIcono}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
          <View style={styles.notificacionContenido}>
            <Text style={styles.notificacionTitulo}>
              ¡Crédito Aprobado!
            </Text>
            <Text style={styles.notificacionTexto}>
              <Text style={styles.notificacionNombre}>{notificacionActual.nombre}</Text> de {notificacionActual.ciudad}
            </Text>
            <Text style={styles.notificacionMonto}>
              Recibió {notificacionActual.monto}
            </Text>
            <Text style={styles.notificacionTiempo}>{notificacionActual.tiempo}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificacionCerrar}
            onPress={() => setNotificacionVisible(false)}
          >
            <Ionicons name="close" size={16} color="#999" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: insets.top + 20 },
          isLargeScreen && styles.scrollContentLarge,
          isDesktop && styles.scrollContentDesktop,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Contenedor central para pantallas grandes */}
        <View style={[
          styles.mainContent,
          isLargeScreen && styles.mainContentLarge,
          isDesktop && styles.mainContentDesktop,
        ]}>
          <View style={styles.logoContainer}>
            <ProfessionalLogo size="large" />
            <Text style={[styles.logoText, isDesktop && styles.logoTextDesktop]}>CrediFácil</Text>
            <Text style={[styles.logoSubtext, isDesktop && styles.logoSubtextDesktop]}>Tu Crédito Fácil</Text>
            
            {/* Slogan rotativo */}
            <View style={styles.sloganContainer}>
              <Animated.Text 
                key={activeSlogan}
                entering={FadeIn.duration(500)}
                exiting={FadeOut.duration(300)}
                style={[styles.sloganText, isDesktop && styles.sloganTextDesktop]}
              >
                {SLOGANS[activeSlogan]}
              </Animated.Text>
            </View>
          </View>

          {/* Badge de SHCP */}
          <View style={[styles.shcpBadge, isLargeScreen && styles.shcpBadgeLarge]}>
            <View style={styles.shcpIconContainer}>
              <Ionicons name="shield-checkmark" size={18} color="#c9a227" />
            </View>
            <Text style={styles.shcpText}>Empresa sujeta a supervisión de la SHCP</Text>
            <View style={styles.shcpVerified}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            </View>
          </View>

          <TrustBadges />
          <StatsBanner />

          <View style={[styles.formCard, isLargeScreen && styles.formCardLarge]}>
            <Text style={[styles.formTitle, isDesktop && styles.formTitleDesktop]}>
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isLogin ? 'Accede a tu cuenta de forma segura' : 'Únete a miles de clientes satisfechos'}
            </Text>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="person-outline" size={20} color={COLORS.accent} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            )}

            {!isLogin && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="call-outline" size={20} color={COLORS.accent} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Número de teléfono"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor={COLORS.textMuted}
                  maxLength={15}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.accent} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.accent} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.card} />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>
                    {isLogin ? 'Ingresar de forma segura' : 'Crear mi cuenta'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.card} />
                </View>
              )}
            </TouchableOpacity>

            {/* Botón de Login Biométrico */}
            {isLogin && (biometricAvailable || biometricHardwareExists) && (
              <TouchableOpacity
                style={[styles.biometricButton, !biometricEnrolled && styles.biometricButtonDisabled]}
                onPress={() => {
                  if (!biometricEnrolled) {
                    Alert.alert(
                      '⚙️ Configuración Requerida',
                      `Para usar ${biometricType || 'Huella Digital'}, primero debes registrar tu huella o rostro en los ajustes de seguridad de tu teléfono.`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { 
                          text: 'Abrir Ajustes', 
                          onPress: () => Linking.openSettings()
                        }
                      ]
                    );
                    return;
                  }
                  handleBiometricLogin();
                }}
                disabled={biometricLoading}
              >
                {biometricLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons 
                      name={biometricType === 'Face ID' || biometricType === 'Reconocimiento Facial' ? 'scan' : 'finger-print'} 
                      size={22} 
                      color={biometricEnrolled ? COLORS.primary : COLORS.textMuted} 
                    />
                    <Text style={[styles.biometricButtonText, !biometricEnrolled && { color: COLORS.textMuted }]}>
                      {biometricEnrolled 
                        ? `Ingresar con ${biometricType}` 
                        : `Configurar ${biometricType || 'Huella Digital'}`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Botón de WhatsApp */}
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={openWhatsApp}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
                <Text style={styles.whatsappButtonText}>
                  Contáctanos por WhatsApp
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchButtonText}>
                {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                <Text style={styles.switchButtonTextBold}>
                  {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Botón Olvidé mi contraseña */}
            {isLogin && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => setForgotPasswordVisible(true)}
              >
                <Ionicons name="key-outline" size={16} color={COLORS.accent} />
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Modal de crédito de contraseña */}
          <ForgotPasswordModal
            visible={forgotPasswordVisible}
            onClose={() => setForgotPasswordVisible(false)}
            apiUrl={BASE_URL}
          />

          <View style={styles.testimonialsSection}>
            <View style={styles.testimonialsTitleRow}>
              <Ionicons name="chatbubbles" size={24} color={COLORS.primary} />
              <Text style={styles.testimonialsTitle}>Lo que dicen nuestros clientes</Text>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              style={styles.testimonialsScroll}
              contentContainerStyle={[
                styles.testimonialsContent,
                isLargeScreen && styles.testimonialsContentLarge
              ]}
            >
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </ScrollView>

            <View style={styles.dotsContainer}>
              {testimonials.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === activeTestimonial && styles.dotActive
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.securityFooter}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            <Text style={styles.securityText}>
              Conexión segura SSL • Datos encriptados • Privacidad garantizada
            </Text>
          </View>

          {/* Enlaces legales */}
          <View style={styles.legalLinksContainer}>
            <TouchableOpacity 
              style={styles.legalLink}
              onPress={() => Linking.openURL(`${BASE_URL}/privacidad.html`)}
            >
              <Ionicons name="document-text-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.legalLinkText}>Aviso de Privacidad</Text>
            </TouchableOpacity>
            
            <View style={styles.legalDivider} />
            
            <TouchableOpacity 
              style={styles.legalLink}
              onPress={() => Linking.openURL(`${BASE_URL}/terminos.html`)}
            >
              <Ionicons name="reader-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.legalLinkText}>Términos y Condiciones</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.copyrightText}>
            © 2026 CrediFácil Financiero, S.A. de C.V.
          </Text>

          {/* Logo corporativo RCF */}
          <View style={styles.corporateLogoContainer}>
            <Image 
              source={{ uri: CREDIFACIL_LOGO_URL }}
              style={[styles.corporateLogo, isDesktop && styles.corporateLogoDesktop]}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  logoSubtext: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: -4,
  },
  logoTagline: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputIconWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeButton: {
    padding: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: COLORS.card,
    fontSize: 17,
    fontWeight: '700',
  },
  biometricButton: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  biometricButtonDisabled: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  biometricButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: COLORS.textLight,
    fontSize: 15,
  },
  switchButtonTextBold: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    gap: 6,
  },
  forgotPasswordText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  testimonialsSection: {
    marginBottom: 24,
  },
  testimonialsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  testimonialsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  testimonialsScroll: {
    marginHorizontal: -20,
  },
  testimonialsContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  securityFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  securityText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  legalLinkText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  copyrightText: {
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 12,
    marginBottom: 8,
    opacity: 0.7,
  },
  sloganContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sloganText: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  shcpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2a3a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c9a227',
  },
  shcpIconContainer: {
    marginRight: 8,
  },
  shcpText: {
    fontSize: 11,
    color: '#e8d9a9',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  shcpVerified: {
    marginLeft: 8,
  },
  corporateLogoContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  corporateLogo: {
    width: 180,
    height: 60,
    opacity: 0.9,
  },
  corporateLogoDesktop: {
    width: 220,
    height: 80,
  },
  // === ESTILOS RESPONSIVOS PARA TABLET Y PC ===
  mainContent: {
    width: '100%',
  },
  mainContentLarge: {
    maxWidth: 600,
    alignSelf: 'center',
  },
  mainContentDesktop: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  scrollContentLarge: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scrollContentDesktop: {
    paddingHorizontal: 60,
    minHeight: '100%',
  },
  formCardLarge: {
    width: '100%',
    maxWidth: 500,
    padding: 32,
  },
  formTitleDesktop: {
    fontSize: 30,
  },
  logoTextDesktop: {
    fontSize: 38,
  },
  logoSubtextDesktop: {
    fontSize: 26,
  },
  sloganTextDesktop: {
    fontSize: 15,
  },
  shcpBadgeLarge: {
    maxWidth: 400,
    alignSelf: 'center',
  },
  testimonialsContentLarge: {
    justifyContent: 'center',
  },
  // === ESTILOS PARA NOTIFICACIÓN FLOTANTE ===
  notificacionFlotante: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 9999,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  notificacionIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificacionContenido: {
    flex: 1,
  },
  notificacionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 2,
  },
  notificacionTexto: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  notificacionNombre: {
    fontWeight: '700',
    color: '#1a1a2e',
  },
  notificacionMonto: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a2e',
    marginTop: 2,
  },
  notificacionTiempo: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  notificacionCerrar: {
    padding: 8,
  },
});

export default LoginScreen;
