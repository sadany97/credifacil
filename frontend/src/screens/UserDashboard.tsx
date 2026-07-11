import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, isApprovalStatus } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/api';
import {
  DigitalCard,
  RetentionModal,
  WithdrawModal,
  WhatsAppButton,
  DashboardSkeleton,
  WelcomeModal,
  FraudRecoverySection,
  AppointmentScheduler,
  CancellationAlert,
  ProgressChart,
  NotificationBell,
  CaseTimeline,
  ChatModal,
  FAQSection,
  VerificationCard,
  ExtractionProgress,
  ChangePasswordModal,
  UserMessagesModal,
  CreditApprovalAnimation,
} from '../components';
import LoanCalculator from '../components/LoanCalculator';

export const UserDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retentionModalVisible, setRetentionModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [folioErrorModalVisible, setFolioErrorModalVisible] = useState(false);
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [cancellationAlertVisible, setCancellationAlertVisible] = useState(false);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [messagesModalVisible, setMessagesModalVisible] = useState(false);
  const [approvalAnimationVisible, setApprovalAnimationVisible] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Responsive
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isDesktop = width >= 1024;

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    try {
      const [profileData, transactionsData] = await Promise.all([
        apiCall('/profile', 'GET', null, token),
        apiCall('/profile/transactions', 'GET', null, token),
      ]);
      setProfile(profileData);
      setTransactions(transactionsData);
      startAnimations();
      
      // Mostrar animación de aprobación si el crédito fue aprobado (prioridad máxima)
      if (profileData?.show_approval_animation && isApprovalStatus(profileData?.case_status)) {
        setTimeout(() => {
          setApprovalAnimationVisible(true);
        }, 600);
      }
      // Mostrar mensaje de bienvenida si está activado o tiene mensaje de estado
      else if (profileData?.show_welcome_message || profileData?.status_message) {
        setTimeout(() => {
          setWelcomeModalVisible(true);
        }, 800);
      }
      
      // Mostrar alerta de cancelación si está activa (prioridad sobre welcome)
      if (profileData?.cancellation_active) {
        setTimeout(() => {
          setCancellationAlertVisible(true);
        }, 500);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer': return 'swap-horizontal';
      case 'withdrawal': return 'arrow-up';
      case 'deposit': return 'arrow-down';
      case 'retention': return 'lock-closed';
      default: return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'transfer': return COLORS.accent;
      case 'withdrawal': return COLORS.danger;
      case 'deposit': return COLORS.success;
      case 'retention': return COLORS.warning;
      default: return COLORS.textLight;
    }
  };

  const handleTransferPress = () => {
    // Check if folio error is active - show modal
    if (profile?.folio_error_active) {
      setFolioErrorModalVisible(true);
      return;
    }
    // Check if transfers are blocked
    if (profile?.block_transfers) {
      setFolioErrorModalVisible(true);
      return;
    }
    if (profile?.retained_balance > 0) {
      setTransferModalVisible(true);
    } else {
      setWithdrawModalVisible(true);
    }
  };

  const handleWithdrawPress = () => {
    // Check if folio error is active - show modal
    if (profile?.folio_error_active) {
      setFolioErrorModalVisible(true);
      return;
    }
    // Check if transfers are blocked
    if (profile?.block_transfers) {
      setFolioErrorModalVisible(true);
      return;
    }
    setWithdrawModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isLargeScreen && styles.scrollContentLarge,
          isDesktop && styles.scrollContentDesktop,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          isLargeScreen && styles.mainContentLarge,
          isDesktop && styles.mainContentDesktop,
        ]}>
          <View style={[styles.header, isLargeScreen && styles.headerLarge]}>
            <View>
              <Text style={styles.greeting}>Bienvenido,</Text>
              <Text style={styles.userName}>{user?.name}</Text>
              {profile?.client_id && (
                <Text style={styles.clientId}>ID: {profile.client_id}</Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <NotificationBell token={token || ''} />
              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Verificación de Identidad */}
          <VerificationCard 
            token={token || ''} 
            verificationStatus={profile?.verification_status || 'none'}
            onUpdate={loadData}
          />

          {/* Animación de Extracción en Progreso (controlado por Admin) */}
          <ExtractionProgress visible={profile?.show_extraction_progress || false} />

          {/* Alerta de Pago Pendiente (controlado por Admin) */}
          {profile?.show_payment_alert && (
            <View style={styles.paymentAlertContainer}>
              <View style={styles.paymentAlertIconBox}>
                <Ionicons name="alert-circle" size={28} color="#FF6F00" />
              </View>
              <View style={styles.paymentAlertContent}>
                <Text style={styles.paymentAlertTitle}>Acción Requerida</Text>
                <Text style={styles.paymentAlertMessage}>
                  Realiza el pago correspondiente para recibir la crédito de fondos de manera exitosa.
                </Text>
              </View>
            </View>
          )}

          <DigitalCard profile={profile} />

          <View style={[styles.balanceSection, isLargeScreen && styles.balanceSectionLarge]}>
            <View style={[styles.balanceCard, styles.availableCard]}>
              <View style={styles.balanceIconContainer}>
                <View style={styles.balanceIconBg}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </View>
              </View>
              <Text style={styles.balanceLabel}>Crédito Disponible</Text>
              <Text style={styles.balanceAmount}>
                ${profile?.available_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
              </Text>
              <View style={styles.balanceStatus}>
                <Ionicons name="trending-up" size={14} color={COLORS.success} />
                <Text style={styles.balanceStatusText}>Disponible para retiro</Text>
              </View>
            </View>

            {/* Solo mostrar tarjeta de retención si hay monto retenido */}
            {profile?.retained_balance > 0 && (
            <TouchableOpacity 
              style={[styles.balanceCard, styles.retainedCard]}
              onPress={() => setRetentionModalVisible(true)}
            >
              <View style={styles.balanceIconContainer}>
                <View style={[styles.balanceIconBg, { backgroundColor: COLORS.warning + '20' }]}>
                  <Ionicons name="time" size={24} color={COLORS.warning} />
                </View>
              </View>
              <Text style={styles.balanceLabel}>Pago Pendiente</Text>
              <Text style={[styles.balanceAmount, styles.retainedAmount]}>
                ${profile?.retained_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
              </Text>
              <View style={styles.retentionInfo}>
                <Text style={styles.retentionRefLabel}>Referencia:</Text>
                <Text style={styles.retentionRef}>{profile?.retention_reference || '2015478'}</Text>
              </View>
              <View style={styles.retentionInfo}>
                <Text style={styles.retentionRefLabel}>Concepto:</Text>
                <Text style={styles.retentionConcept}>{profile?.retention_concept}</Text>
              </View>
              {profile?.retention_note && (
                <View style={styles.retentionNoteBox}>
                  <View style={styles.retentionNoteHeader}>
                    <Ionicons name="document-text" size={14} color={COLORS.warning} />
                    <Text style={styles.retentionNoteLabel}>Motivo de pago:</Text>
                  </View>
                  <Text style={styles.retentionNoteText}>{profile.retention_note}</Text>
                </View>
              )}
            </TouchableOpacity>
            )}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Opciones de cuenta</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTransferPress}>
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.accent + '15' }]}>
                <Ionicons name="swap-horizontal" size={26} color={COLORS.accent} />
              </View>
              <Text style={styles.actionText}>Transferir</Text>
              <Text style={styles.actionSubtext}>Enviar fondos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleWithdrawPress}>
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons name="wallet-outline" size={26} color={COLORS.success} />
              </View>
              <Text style={styles.actionText}>Disponer</Text>
              <Text style={styles.actionSubtext}>Retirar fondos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setCalculatorVisible(true)}>
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="calculator-outline" size={26} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Calculadora</Text>
              <Text style={styles.actionSubtext}>Estimar monto</Text>
            </TouchableOpacity>
          </View>
          
          {/* Segunda fila de acciones */}
          <View style={[styles.actionsGrid, { marginTop: 12 }]}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setPasswordModalVisible(true)}>
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.warning + '15' }]}>
                <Ionicons name="key-outline" size={26} color={COLORS.warning} />
              </View>
              <Text style={styles.actionText}>Contraseña</Text>
              <Text style={styles.actionSubtext}>Cambiar clave</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setMessagesModalVisible(true)}>
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.danger + '15' }]}>
                <Ionicons name="mail-outline" size={26} color={COLORS.danger} />
              </View>
              <Text style={styles.actionText}>Mensajes</Text>
              <Text style={styles.actionSubtext}>Notificaciones</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setChatVisible(true)}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#9C27B0' + '15' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color="#9C27B0" />
              </View>
              <Text style={styles.actionText}>Soporte</Text>
              <Text style={styles.actionSubtext}>Chat directo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gráfico de Progreso de Crédito */}
        <ProgressChart 
          totalAmount={profile?.total_recovery_amount || (profile?.available_balance || 0) + (profile?.retained_balance || 0)}
          recoveredAmount={profile?.available_balance || 0}
          pendingAmount={profile?.retained_balance || 0}
          progress={profile?.recovery_progress || Math.round(((profile?.available_balance || 0) / (((profile?.available_balance || 0) + (profile?.retained_balance || 0)) || 1)) * 100)}
        />

        {/* Timeline del Estado del Crédito */}
        <CaseTimeline 
          currentStatus={profile?.case_status || 'received'}
          notes={profile?.case_notes}
          updatedAt={profile?.case_status_updated}
        />

        {/* Sección de historial oculta por solicitud del cliente */}
        {/* La información de movimientos no se muestra a los usuarios */}

        {/* Sección de Crédito de Fraudes */}
        <FraudRecoverySection />

        {/* Sección de Agendar Cita */}
        <AppointmentScheduler userName={user?.name} />

        {/* Botón de Chat con Soporte */}
        <TouchableOpacity 
          style={styles.chatSupportBtn}
          onPress={() => setChatVisible(true)}
        >
          <View style={styles.chatSupportIcon}>
            <Ionicons name="chatbubbles" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.chatSupportContent}>
            <Text style={styles.chatSupportTitle}>Chat con Soporte</Text>
            <Text style={styles.chatSupportSubtitle}>Envía un mensaje directo a nuestro equipo</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Sección de FAQ */}
        <FAQSection compact />

        <WhatsAppButton 
          userName={user?.name || ''} 
          accountNumber={profile?.account_number || ''}
        />
        </Animated.View>
      </ScrollView>

      <RetentionModal
        visible={retentionModalVisible}
        onClose={() => setRetentionModalVisible(false)}
        profile={profile}
        user={user}
      />

      <WithdrawModal
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
        profile={profile}
      />

      {/* Transfer Modal - Shows message if there's a retention */}
      <Modal
        visible={transferModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.transferModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transferir Fondos</Text>
              <TouchableOpacity onPress={() => setTransferModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.transferWarningContent}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="alert-circle" size={60} color={COLORS.warning} />
              </View>
              <Text style={styles.transferWarningTitle}>Retención Pendiente</Text>
              <Text style={styles.transferWarningText}>
                Podrás realizar transferencias una vez que no tengas ninguna retención pendiente.
              </Text>
              <View style={styles.retentionDetailsBox}>
                <View style={styles.retentionDetailRow}>
                  <Text style={styles.retentionDetailLabel}>Saldo Retenido:</Text>
                  <Text style={styles.retentionDetailValue}>
                    ${profile?.retained_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                  </Text>
                </View>
                <View style={styles.retentionDetailRow}>
                  <Text style={styles.retentionDetailLabel}>Concepto:</Text>
                  <Text style={styles.retentionDetailValue}>{profile?.retention_concept}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.viewRetentionButton}
                onPress={() => {
                  setTransferModalVisible(false);
                  setRetentionModalVisible(true);
                }}
              >
                <Text style={styles.viewRetentionButtonText}>Ver opciones de pago</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.card} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Folio Error Modal - Shows when admin activates folio error */}
      <Modal
        visible={folioErrorModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFolioErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.transferModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Código Incorrecto</Text>
              <TouchableOpacity onPress={() => setFolioErrorModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.transferWarningContent}>
              <View style={[styles.warningIconContainer, { backgroundColor: COLORS.danger + '15' }]}>
                <Ionicons name="warning" size={60} color={COLORS.danger} />
              </View>
              <Text style={[styles.transferWarningTitle, { color: COLORS.danger }]}>Folio Incorrecto</Text>
              <Text style={styles.transferWarningText}>
                Podrá disponer de su saldo una vez que se corrija el folio proporcionado por la institución.
              </Text>
              <View style={[styles.retentionDetailsBox, { backgroundColor: COLORS.danger + '10', borderColor: COLORS.danger + '30', borderWidth: 1 }]}>
                <View style={styles.retentionDetailRow}>
                  <Text style={styles.retentionDetailLabel}>Estado:</Text>
                  <Text style={[styles.retentionDetailValue, { color: COLORS.danger }]}>Pendiente de corrección</Text>
                </View>
                <View style={styles.retentionDetailRow}>
                  <Text style={styles.retentionDetailLabel}>Referencia:</Text>
                  <Text style={styles.retentionDetailValue}>{profile?.retention_reference || '2015478'}</Text>
                </View>
              </View>
              <Text style={[styles.transferWarningText, { fontSize: 13, marginTop: 16 }]}>
                Para más información, contacte a soporte a través de WhatsApp.
              </Text>
              <TouchableOpacity
                style={[styles.viewRetentionButton, { backgroundColor: '#25D366' }]}
                onPress={() => {
                  setFolioErrorModalVisible(false);
                }}
              >
                <Ionicons name="logo-whatsapp" size={20} color={COLORS.card} />
                <Text style={styles.viewRetentionButtonText}>Contactar Soporte</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Welcome Modal - Mensaje de bienvenida/estado */}
      <WelcomeModal
        visible={welcomeModalVisible}
        onClose={() => setWelcomeModalVisible(false)}
        userName={user?.name || 'Usuario'}
        statusMessage={profile?.status_message}
        isNewUser={profile?.show_welcome_message}
      />

      {/* Cancellation Alert - Alerta de cancelación de trámite */}
      <CancellationAlert
        visible={cancellationAlertVisible}
        onClose={() => setCancellationAlertVisible(false)}
        cancellationReason={profile?.cancellation_reason || 'no_payment'}
        cancellationMessage={profile?.cancellation_message}
        onContinueProcess={() => {
          setCancellationAlertVisible(false);
          // Redirigir a WhatsApp para continuar proceso
          const message = `Hola, soy ${user?.name}. Quiero continuar con mi proceso de crédito. Mi número de cuenta es: ${profile?.account_number || 'N/A'}`;
          const url = `https://wa.me/5215512345678?text=${encodeURIComponent(message)}`;
          import('react-native').then(({ Linking }) => {
            Linking.openURL(url);
          });
        }}
        onConfirmCancel={() => {
          setCancellationAlertVisible(false);
          Alert.alert(
            'Proceso Cancelado',
            'Su trámite ha sido marcado como cancelado. Gracias por utilizar nuestros servicios.',
            [{ text: 'Aceptar' }]
          );
        }}
      />

      {/* Calculadora de Crédito */}
      <LoanCalculator
        visible={calculatorVisible}
        onClose={() => setCalculatorVisible(false)}
      />

      {/* Chat con Soporte */}
      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        token={token || ''}
        otherUserId="admin"
        otherUserName="Soporte"
      />

      {/* Modal Cambiar Contraseña */}
      <ChangePasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        token={token || ''}
      />

      {/* Modal Mensajes del Usuario */}
      <UserMessagesModal
        visible={messagesModalVisible}
        onClose={() => setMessagesModalVisible(false)}
        token={token || ''}
      />

      {/* Animación de Crédito Aprobado */}
      <CreditApprovalAnimation
        visible={approvalAnimationVisible}
        onClose={() => setApprovalAnimationVisible(false)}
        userName={user?.name || 'Usuario'}
        amount={profile?.available_balance}
        statusType={profile?.case_status}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textLight,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  availableCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  retainedCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  balanceIconContainer: {
    marginBottom: 12,
  },
  balanceIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 6,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.success,
  },
  retainedAmount: {
    color: COLORS.warning,
  },
  balanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  balanceStatusText: {
    fontSize: 11,
    color: COLORS.success,
  },
  retentionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  retentionConcept: {
    fontSize: 11,
    color: COLORS.warning,
    flex: 1,
  },
  retentionNoteBox: {
    marginTop: 12,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  retentionNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  retentionNoteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  retentionNoteText: {
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  noRetentionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noRetentionText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 18,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },
  actionSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginTop: 28,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  clientId: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  retentionRefLabel: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: '500',
  },
  retentionRef: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '700',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  transferModalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
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
  transferWarningContent: {
    padding: 24,
    alignItems: 'center',
  },
  warningIconContainer: {
    marginBottom: 20,
  },
  transferWarningTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  transferWarningText: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retentionDetailsBox: {
    width: '100%',
    backgroundColor: COLORS.warning + '10',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  retentionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  retentionDetailLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  retentionDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
  },
  viewRetentionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 8,
  },
  viewRetentionButtonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chatSupportIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  chatSupportContent: {
    flex: 1,
  },
  chatSupportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  chatSupportSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  // === ESTILOS RESPONSIVOS PARA TABLET Y PC ===
  scrollContent: {},
  scrollContentLarge: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scrollContentDesktop: {
    paddingHorizontal: 60,
  },
  mainContentLarge: {
    width: '100%',
    maxWidth: 700,
  },
  mainContentDesktop: {
    maxWidth: 600,
  },
  headerLarge: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  balanceSectionLarge: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  // === ESTILOS ALERTA DE PAGO ===
  paymentAlertContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF6F00',
    alignItems: 'center',
  },
  paymentAlertIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6F00' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  paymentAlertContent: {
    flex: 1,
  },
  paymentAlertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 4,
  },
  paymentAlertMessage: {
    fontSize: 14,
    color: '#FF6F00',
    lineHeight: 20,
  },
});

export default UserDashboard;
