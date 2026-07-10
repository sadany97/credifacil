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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { COLORS, AVAILABLE_BANKS, detectCardType } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/api';
import { ContractGenerator, AdminDashboardSkeleton, CANCELLATION_REASONS, AdminAnalytics, NotificationBell, ChatModal, PaymentReceiptGenerator, CommandCenter, UserTimeline, SPEIReceiptGenerator, BackupPanel, AdminMessagesModal } from '../components';

// Estados de crédito específicos para CrediFácil
const CASE_STATUSES = [
  { id: 'solicitud_recibida', label: 'Solicitud Recibida', icon: 'document-text', color: COLORS.textMuted },
  { id: 'en_revision', label: 'En Revisión de Solicitud', icon: 'search', color: '#1976D2' },
  { id: 'documentacion_pendiente', label: 'Documentación Pendiente', icon: 'folder-open', color: COLORS.warning },
  { id: 'aprobado', label: 'Crédito Aprobado', icon: 'checkmark-circle', color: '#4CAF50' },
  { id: 'aprobado_garantia', label: 'Aprobado con Garantía', icon: 'shield-checkmark', color: '#4CAF50' },
  { id: 'aprobado_mensualidad', label: 'Aprobado con Mensualidad', icon: 'calendar', color: '#4CAF50' },
  { id: 'en_desembolso', label: 'En Proceso de Desembolso', icon: 'trending-up', color: COLORS.accent },
  { id: 'credito_otorgado', label: 'Crédito Otorgado', icon: 'cash', color: '#4CAF50' },
  { id: 'rechazado', label: 'Solicitud Rechazada', icon: 'close-circle', color: COLORS.danger },
  { id: 'rechazado_documentacion', label: 'Rechazado - Doc. Incompleta', icon: 'alert-circle', color: COLORS.danger },
  { id: 'cancelado_cliente', label: 'Cancelado por Cliente', icon: 'person-remove', color: COLORS.textMuted },
];

export const AdminDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [bankSelectorVisible, setBankSelectorVisible] = useState(false);
  const [bankSelectorForEdit, setBankSelectorForEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatUserId, setChatUserId] = useState('');
  const [chatUserName, setChatUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminMessagesVisible, setAdminMessagesVisible] = useState(false);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Scroll control
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // Responsive
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isDesktop = width >= 1024;
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    available_balance: '',
    retained_balance: '',
    retention_concept: 'Pago pendiente',
    retention_reference: '2015478',
    account_number: '',
    clabe: '',
    bank_name: 'CrediFácil',
    card_type: 'visa',
  });
  const [editData, setEditData] = useState({
    name: '',
    available_balance: '',
    retained_balance: '',
    retention_concept: '',
    retention_reference: '',
    retention_note: '',
    account_number: '',
    clabe: '',
    bank_name: '',
    card_type: 'visa',
    folio_error_active: false,
    block_transfers: false,
    status_message: '',
    show_welcome_message: false,
    show_approval_animation: false,
    cancellation_active: false,
    cancellation_reason: 'no_payment',
    cancellation_message: '',
    case_status: 'solicitud_recibida',
    case_notes: '',
    show_extraction_progress: false,
    show_payment_alert: false,
  });
  const [subAdminModalVisible, setSubAdminModalVisible] = useState(false);
  const [editSubAdminModalVisible, setEditSubAdminModalVisible] = useState(false);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [newSubAdmin, setNewSubAdmin] = useState({
    email: '',
    password: '',
    name: '',
    assigned_users: [] as string[],
  });
  const [editingSubAdmin, setEditingSubAdmin] = useState<any>(null);
  const [editSubAdminData, setEditSubAdminData] = useState({
    name: '',
    assigned_users: [] as string[],
  });
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [contractClientName, setContractClientName] = useState('');
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptUserName, setReceiptUserName] = useState('');
  const [receiptUserBank, setReceiptUserBank] = useState('');
  const [commandCenterVisible, setCommandCenterVisible] = useState(false);
  const [speiReceiptVisible, setSPEIReceiptVisible] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [timelineUserId, setTimelineUserId] = useState('');
  const [timelineUserName, setTimelineUserName] = useState('');
  const [diagnosticModalVisible, setDiagnosticModalVisible] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [repairLoading, setRepairLoading] = useState(false);
  
  // Estados para documentos de identidad del usuario
  const [userDocuments, setUserDocuments] = useState<any>(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentsExpanded, setDocumentsExpanded] = useState(false);
  
  // Estados para notificaciones del supervisor
  const [supervisorNotifications, setSupervisorNotifications] = useState<any[]>([]);
  const [supervisorUnreadCount, setSupervisorUnreadCount] = useState(0);
  const [supervisorNotifVisible, setSupervisorNotifVisible] = useState(false);
  
  // Verificar si es admin principal (por rol, no por email específico)
  const isMainAdmin = user?.role === 'admin';

  const loadUsers = async () => {
    try {
      const data = await apiCall('/admin/users', 'GET', null, token);
      setUsers(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSubAdmins = async () => {
    if (!isMainAdmin) return;
    try {
      const data = await apiCall('/admin/sub-admins', 'GET', null, token);
      setSubAdmins(data);
    } catch (error: any) {
      console.log('Error loading sub-admins:', error.message);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await apiCall('/admin/analytics', 'GET', null, token);
      setAnalytics(data);
    } catch (error: any) {
      console.log('Error loading analytics:', error.message);
    }
  };

  // Cargar notificaciones del supervisor (solo para admin principal)
  const loadSupervisorNotifications = async () => {
    if (!isMainAdmin) return;
    try {
      const data = await apiCall('/admin/supervisor-notifications', 'GET', null, token);
      setSupervisorNotifications(data.notifications || []);
      setSupervisorUnreadCount(data.unread_count || 0);
    } catch (error: any) {
      console.log('Error loading supervisor notifications:', error.message);
    }
  };

  // Marcar todas las notificaciones como leídas
  const markAllSupervisorNotificationsRead = async () => {
    try {
      await apiCall('/admin/supervisor-notifications/read-all', 'PUT', null, token);
      setSupervisorUnreadCount(0);
      setSupervisorNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error: any) {
      console.log('Error marking notifications read:', error.message);
    }
  };

  const openChat = (userId: string, userName: string) => {
    setChatUserId(userId);
    setChatUserName(userName);
    setChatVisible(true);
  };

  useEffect(() => {
    loadUsers();
    loadAnalytics();
    if (isMainAdmin) {
      loadSubAdmins();
      loadSupervisorNotifications();
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
    loadAnalytics();
    if (isMainAdmin) {
      loadSubAdmins();
      loadSupervisorNotifications();
    }
  };

  // Filtrar usuarios por búsqueda
  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phone?.includes(query) ||
      u.profile?.client_id?.includes(query)
    );
  });

  // Cargar mensajes de todos los clientes
  const loadAdminMessages = async () => {
    setLoadingMessages(true);
    try {
      const data = await apiCall('/admin/messages/all', 'GET', null, token);
      setAdminMessages(data || []);
    } catch (error: any) {
      console.log('Error loading messages:', error.message);
      setAdminMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const openAdminMessages = () => {
    loadAdminMessages();
    setAdminMessagesVisible(true);
  };

  const handleCreateSubAdmin = async () => {
    if (!newSubAdmin.email || !newSubAdmin.password || !newSubAdmin.name) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    try {
      await apiCall('/admin/sub-admins', 'POST', {
        email: newSubAdmin.email,
        password: newSubAdmin.password,
        name: newSubAdmin.name,
        assigned_users: newSubAdmin.assigned_users,
      }, token);
      Alert.alert('Éxito', 'Sub-administrador creado correctamente');
      setSubAdminModalVisible(false);
      setNewSubAdmin({ email: '', password: '', name: '', assigned_users: [] });
      loadSubAdmins();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteSubAdmin = (subAdmin: any) => {
    Alert.alert(
      'Eliminar Sub-Administrador',
      `¿Estás seguro de eliminar a ${subAdmin.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiCall(`/admin/sub-admins/${subAdmin.id}`, 'DELETE', null, token);
              Alert.alert('Éxito', 'Sub-administrador eliminado');
              loadSubAdmins();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const toggleUserAssignment = (userId: string) => {
    setNewSubAdmin(prev => {
      const isAssigned = prev.assigned_users.includes(userId);
      return {
        ...prev,
        assigned_users: isAssigned
          ? prev.assigned_users.filter(id => id !== userId)
          : [...prev.assigned_users, userId]
      };
    });
  };

  const toggleEditSubAdminUserAssignment = (userId: string) => {
    setEditSubAdminData(prev => {
      const isAssigned = prev.assigned_users.includes(userId);
      return {
        ...prev,
        assigned_users: isAssigned
          ? prev.assigned_users.filter(id => id !== userId)
          : [...prev.assigned_users, userId]
      };
    });
  };

  const handleEditSubAdmin = (subAdmin: any) => {
    setEditingSubAdmin(subAdmin);
    setEditSubAdminData({
      name: subAdmin.name || '',
      assigned_users: subAdmin.assigned_users || [],
    });
    setEditSubAdminModalVisible(true);
  };

  const handleUpdateSubAdmin = async () => {
    if (!editingSubAdmin) return;
    try {
      await apiCall(`/admin/sub-admins/${editingSubAdmin.id}`, 'PUT', {
        name: editSubAdminData.name,
        assigned_users: editSubAdminData.assigned_users,
      }, token);
      Alert.alert('Éxito', 'Sub-administrador actualizado correctamente');
      setEditSubAdminModalVisible(false);
      setEditingSubAdmin(null);
      loadSubAdmins();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const [updatingTestimonials, setUpdatingTestimonials] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [backupPanelVisible, setBackupPanelVisible] = useState(false);

  // Función para exportar usuarios a Excel
  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const data = await apiCall('/admin/export/users-excel', 'GET', null, token);
      
      if (data.excel) {
        const filename = data.filename || `clientes_${Date.now()}.xlsx`;
        const fileUri = FileSystem.documentDirectory + filename;
        
        await FileSystem.writeAsStringAsync(fileUri, data.excel, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Exportar Clientes Excel',
          });
        } else {
          Alert.alert('Éxito', `Excel guardado: ${filename}`);
        }
      } else if (data.csv) {
        // Fallback a CSV
        const filename = data.filename || `clientes_${Date.now()}.csv`;
        const fileUri = FileSystem.documentDirectory + filename;
        
        await FileSystem.writeAsStringAsync(fileUri, data.csv);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Exportar Clientes CSV'
          });
        }
      }
      Alert.alert('Éxito', 'Archivo exportado correctamente');
    } catch (error: any) {
      console.error('Export Excel error:', error);
      Alert.alert('Error', error.message || 'No se pudo exportar a Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleUpdateTestimonialDates = async () => {
    setUpdatingTestimonials(true);
    try {
      await apiCall('/admin/update-testimonial-dates', 'POST', {}, token);
      Alert.alert('Éxito', 'Las fechas de los testimonios han sido actualizadas. Los clientes verán fechas recientes (hoy, ayer, hace 3 días, etc.)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUpdatingTestimonials(false);
    }
  };

  // Función para ejecutar diagnóstico del sistema
  const handleRunDiagnostic = async () => {
    setDiagnosticLoading(true);
    setDiagnosticResult(null);
    try {
      const result = await apiCall('/admin/system/deep-scan', 'GET', null, token);
      setDiagnosticResult(result);
    } catch (error: any) {
      setDiagnosticResult({ error: true, message: error.message });
    } finally {
      setDiagnosticLoading(false);
    }
  };

  // Función para auto-reparar (incluye fechas de testimonios)
  const handleAutoRepair = async () => {
    setRepairLoading(true);
    try {
      // Primero ejecutar auto-repair del sistema
      const repairResult = await apiCall('/admin/system/auto-repair', 'POST', {}, token);
      
      // También actualizar fechas de testimonios
      await apiCall('/admin/update-testimonial-dates', 'POST', {}, token);
      
      Alert.alert(
        '✅ Reparación Completada', 
        `${repairResult.message || 'Sistema reparado'}\n\n✓ Fechas de testimonios actualizadas\n✓ Conexiones verificadas\n✓ Caché limpiado`,
        [{ text: 'OK', onPress: () => handleRunDiagnostic() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setRepairLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }
    try {
      await apiCall('/admin/users', 'POST', {
        ...newUser,
        available_balance: parseFloat(newUser.available_balance) || 0,
        retained_balance: parseFloat(newUser.retained_balance) || 0,
        account_number: newUser.account_number || null,
        clabe: newUser.clabe || null,
        card_type: detectCardType(newUser.account_number),
      }, token);
      Alert.alert('Éxito', 'Usuario creado correctamente');
      setModalVisible(false);
      setNewUser({
        email: '',
        password: '',
        name: '',
        available_balance: '',
        retained_balance: '',
        retention_concept: 'Pago pendiente',
        retention_reference: '2015478',
        account_number: '',
        clabe: '',
        bank_name: 'CrediFácil',
        card_type: 'visa',
      });
      loadUsers();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEditUser = (userItem: any) => {
    setSelectedUser(userItem);
    setEditData({
      name: userItem.name || '',
      available_balance: userItem.profile?.available_balance?.toString() || '0',
      retained_balance: userItem.profile?.retained_balance?.toString() || '0',
      retention_concept: userItem.profile?.retention_concept || 'Pago pendiente',
      retention_reference: userItem.profile?.retention_reference || '2015478',
      retention_note: userItem.profile?.retention_note || '',
      account_number: userItem.profile?.account_number || '',
      clabe: userItem.profile?.clabe || '',
      bank_name: userItem.profile?.bank_name || 'CrediFácil',
      card_type: userItem.profile?.card_type || 'visa',
      folio_error_active: userItem.profile?.folio_error_active || false,
      block_transfers: userItem.profile?.block_transfers || false,
      status_message: userItem.profile?.status_message || '',
      show_welcome_message: userItem.profile?.show_welcome_message || false,
      show_approval_animation: userItem.profile?.show_approval_animation || false,
      cancellation_active: userItem.profile?.cancellation_active || false,
      cancellation_reason: userItem.profile?.cancellation_reason || 'no_payment',
      cancellation_message: userItem.profile?.cancellation_message || '',
      case_status: userItem.profile?.case_status || 'solicitud_recibida',
      case_notes: userItem.profile?.case_notes || '',
      show_extraction_progress: userItem.profile?.show_extraction_progress || false,
      show_payment_alert: userItem.profile?.show_payment_alert || false,
    });
    // Cargar documentos de identidad del usuario
    loadUserDocuments(userItem.id);
    setDocumentsExpanded(false);
    setEditModalVisible(true);
  };

  // Función para cargar documentos de identidad del usuario
  const loadUserDocuments = async (userId: string) => {
    setLoadingDocuments(true);
    setUserDocuments(null);
    try {
      const data = await apiCall(`/admin/user/${userId}/documents`, 'GET', null, token);
      setUserDocuments(data);
    } catch (error: any) {
      console.log('Error loading user documents:', error.message);
      setUserDocuments(null);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Función para aprobar/rechazar verificación
  const handleVerifyUser = async (status: 'approved' | 'rejected') => {
    if (!selectedUser) return;
    try {
      await apiCall(`/admin/user/${selectedUser.id}/verify`, 'PUT', { status }, token);
      Alert.alert('Éxito', status === 'approved' ? 'Usuario verificado' : 'Verificación rechazada');
      loadUserDocuments(selectedUser.id);
      loadUsers();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Generadores de códigos aleatorios
  const generateRandomConcept = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetters = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const randomNumbers = Math.floor(100000 + Math.random() * 900000).toString();
    return `${randomLetters}${randomNumbers}`;
  };

  const generateRandomReference = (length: number = 7) => {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1))).toString();
  };

  // Razones de cancelación
  const CANCELLATION_REASONS = [
    { id: 'no_payment', title: 'Pago Pendiente' },
    { id: 'expired_time', title: 'Tiempo Expirado' },
    { id: 'incomplete_docs', title: 'Documentación Incompleta' },
    { id: 'no_response', title: 'Sin Respuesta' },
    { id: 'verification_failed', title: 'Verificación Fallida' },
  ];

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await apiCall(`/admin/users/${selectedUser.id}`, 'PUT', {
        name: editData.name || null,
        available_balance: editData.available_balance !== '' ? parseFloat(editData.available_balance) : null,
        retained_balance: editData.retained_balance !== '' ? parseFloat(editData.retained_balance) : null,
        retention_concept: editData.retention_concept || null,
        retention_reference: editData.retention_reference || null,
        retention_note: editData.retention_note || null,
        account_number: editData.account_number || null,
        clabe: editData.clabe || null,
        bank_name: editData.bank_name || null,
        card_type: detectCardType(editData.account_number) || null,
        folio_error_active: editData.folio_error_active,
        block_transfers: editData.block_transfers,
        status_message: editData.status_message || null,
        show_welcome_message: editData.show_welcome_message,
        show_approval_animation: editData.show_approval_animation,
        cancellation_active: editData.cancellation_active,
        cancellation_reason: editData.cancellation_reason || null,
        cancellation_message: editData.cancellation_message || null,
        case_status: editData.case_status || 'solicitud_recibida',
        case_notes: editData.case_notes || null,
        show_extraction_progress: editData.show_extraction_progress,
        show_payment_alert: editData.show_payment_alert,
      }, token);
      Alert.alert('Éxito', 'Usuario actualizado correctamente');
      setEditModalVisible(false);
      loadUsers();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteUser = (userItem: any) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar a ${userItem.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiCall(`/admin/users/${userItem.id}`, 'DELETE', null, token);
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              loadUsers();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <AdminDashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Barra de navegación lateral fija */}
      <View style={styles.sideScrollNav}>
        <TouchableOpacity 
          style={styles.sideNavButton}
          onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <Ionicons name="arrow-up" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.sideNavDivider} />
        <TouchableOpacity 
          style={styles.sideNavButton}
          onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <Ionicons name="arrow-down" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isLargeScreen && styles.scrollContentLarge,
          isDesktop && styles.scrollContentDesktop,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
        scrollIndicatorInsets={{ right: 1 }}
        scrollEventThrottle={16}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const y = event.nativeEvent.contentOffset.y;
          setShowScrollToTop(y > 300);
        }}
      >
        <View style={[
          styles.mainContent,
          isLargeScreen && styles.mainContentLarge,
          isDesktop && styles.mainContentDesktop,
        ]}>
          <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Panel de</Text>
            <Text style={styles.userName}>Administración</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Campana de notificaciones del supervisor - Solo para admin principal */}
            {isMainAdmin && (
              <TouchableOpacity 
                style={styles.supervisorBellBtn}
                onPress={() => {
                  setSupervisorNotifVisible(true);
                  markAllSupervisorNotificationsRead();
                }}
              >
                <Ionicons name="people" size={22} color={COLORS.primary} />
                {supervisorUnreadCount > 0 && (
                  <View style={styles.supervisorBadge}>
                    <Text style={styles.supervisorBadgeText}>
                      {supervisorUnreadCount > 9 ? '9+' : supervisorUnreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <NotificationBell token={token || ''} />
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Analytics */}
        {analytics && (
          <AdminAnalytics 
            token={token || ''} 
            analytics={analytics} 
            onExport={() => {}}
          />
        )}

        <View style={styles.adminStatsRow}>
          <View style={styles.adminStatCard}>
            <View style={[styles.adminStatIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="people" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.adminStatNumber}>{users.length}</Text>
            <Text style={styles.adminStatLabel}>Usuarios</Text>
          </View>
          <View style={styles.adminStatCard}>
            <View style={[styles.adminStatIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="cash" size={28} color={COLORS.success} />
            </View>
            <Text style={styles.adminStatNumber}>
              ${users.reduce((acc, u) => acc + (u.profile?.available_balance || 0), 0).toLocaleString('es-MX')}
            </Text>
            <Text style={styles.adminStatLabel}>Saldo Total</Text>
          </View>
        </View>

        {/* Botón Actualizar Fechas de Testimonios */}
        {isMainAdmin && (
          <TouchableOpacity
            style={styles.updateTestimonialsButton}
            onPress={handleUpdateTestimonialDates}
            disabled={updatingTestimonials}
          >
            {updatingTestimonials ? (
              <ActivityIndicator size="small" color={COLORS.card} />
            ) : (
              <Ionicons name="refresh" size={20} color={COLORS.card} />
            )}
            <Text style={styles.updateTestimonialsText}>
              {updatingTestimonials ? 'Actualizando...' : 'Actualizar Fechas de Testimonios'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Botón Generar Contrato - Solo Admin Principal */}
        {isMainAdmin && (
          <TouchableOpacity
            style={[styles.updateTestimonialsButton, { backgroundColor: COLORS.primary, marginTop: 10 }]}
            onPress={() => {
              setContractClientName('');
              setContractModalVisible(true);
            }}
          >
            <Ionicons name="document-text" size={20} color={COLORS.card} />
            <Text style={styles.updateTestimonialsText}>Generar Contrato de Servicios</Text>
          </TouchableOpacity>
        )}

        {/* Botón Generar Comprobante de Pago */}
        <TouchableOpacity
          style={[styles.updateTestimonialsButton, { backgroundColor: '#2E7D32', marginTop: 10 }]}
          onPress={() => {
            setReceiptUserName('');
            setReceiptUserBank('');
            setReceiptModalVisible(true);
          }}
        >
          <Ionicons name="receipt" size={20} color={COLORS.card} />
          <Text style={styles.updateTestimonialsText}>Generar Comprobante de Pago</Text>
        </TouchableOpacity>

        {/* Botón Generar Comprobante SPEI - Solo Admin Principal */}
        {isMainAdmin && (
          <TouchableOpacity
            style={[styles.updateTestimonialsButton, { backgroundColor: '#1a237e', marginTop: 10, borderWidth: 1, borderColor: '#ff6f00' }]}
            onPress={() => setSPEIReceiptVisible(true)}
          >
            <Ionicons name="document-text" size={20} color="#ff6f00" />
            <Text style={[styles.updateTestimonialsText, { color: '#ff6f00' }]}>Generar Comprobante SPEI</Text>
          </TouchableOpacity>
        )}

        {/* Botón Centro de Comando - Solo Admin Principal */}
        {isMainAdmin && (
          <TouchableOpacity
            style={[styles.updateTestimonialsButton, { backgroundColor: '#1a1a2e', marginTop: 10, borderWidth: 1, borderColor: '#f44336' }]}
            onPress={() => setCommandCenterVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f44336', marginRight: 8 }} />
              <Ionicons name="pulse" size={20} color="#f44336" />
            </View>
            <Text style={[styles.updateTestimonialsText, { color: '#f44336' }]}>Centro de Comando EN VIVO</Text>
          </TouchableOpacity>
        )}

        {/* Botón Diagnóstico y Auto-Reparación - Solo Admin Principal */}
        {isMainAdmin && (
          <TouchableOpacity
            style={[styles.updateTestimonialsButton, { backgroundColor: '#0d47a1', marginTop: 10, borderWidth: 1, borderColor: '#4CAF50' }]}
            onPress={() => {
              setDiagnosticModalVisible(true);
              handleRunDiagnostic();
            }}
          >
            <Ionicons name="hardware-chip" size={20} color="#4CAF50" />
            <Text style={[styles.updateTestimonialsText, { color: '#4CAF50' }]}>Diagnóstico y Auto-Reparación</Text>
          </TouchableOpacity>
        )}

        {/* Botón Exportar Excel - Solo Admin Principal */}
        {isMainAdmin && (
          <TouchableOpacity
            style={[styles.updateTestimonialsButton, { backgroundColor: '#1B5E20', marginTop: 10 }]}
            onPress={handleExportExcel}
            disabled={exportingExcel}
          >
            {exportingExcel ? (
              <ActivityIndicator size="small" color={COLORS.card} />
            ) : (
              <Ionicons name="document-attach" size={20} color={COLORS.card} />
            )}
            <Text style={styles.updateTestimonialsText}>
              {exportingExcel ? 'Exportando...' : 'Exportar Clientes a Excel'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Botón Respaldo de Clientes - Solo Admin Principal */}
        {isMainAdmin && (
          <TouchableOpacity
            style={[styles.updateTestimonialsButton, { backgroundColor: '#FF6F00', marginTop: 10 }]}
            onPress={() => setBackupPanelVisible(true)}
          >
            <Ionicons name="shield-checkmark" size={20} color={COLORS.card} />
            <Text style={styles.updateTestimonialsText}>Respaldo de Clientes y Saldos</Text>
          </TouchableOpacity>
        )}

        <View style={styles.adminSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Usuarios Registrados</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={24} color={COLORS.card} />
            </TouchableOpacity>
          </View>

          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre, email o teléfono..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.length > 0 && (
              <Text style={styles.searchResultsText}>
                {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Botón para ver mensajes de clientes */}
          {isMainAdmin && (
            <TouchableOpacity
              style={[styles.updateTestimonialsButton, { backgroundColor: '#5C6BC0', marginBottom: 16 }]}
              onPress={openAdminMessages}
            >
              <Ionicons name="mail-unread" size={20} color={COLORS.card} />
              <Text style={styles.updateTestimonialsText}>Ver Mensajes de Clientes</Text>
              {analytics?.unread_messages > 0 && (
                <View style={styles.messageBadge}>
                  <Text style={styles.messageBadgeText}>{analytics.unread_messages}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name={searchQuery ? "search-outline" : "people-outline"} size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyStateText}>
                {searchQuery ? "Sin resultados" : "Sin usuarios registrados"}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? "Intenta con otro término de búsqueda" : "Agrega usuarios con el botón +"}
              </Text>
            </View>
          ) : (
            filteredUsers.map((userItem, index) => (
              <View key={userItem.id || index} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {userItem.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userNameText}>{userItem.name}</Text>
                  <Text style={styles.userEmail}>{userItem.email}</Text>
                  {userItem.phone && userItem.phone !== '***' && (
                    <View style={styles.passwordHintRow}>
                      <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.passwordHint}>{userItem.phone}</Text>
                    </View>
                  )}
                  {userItem.password_plain && userItem.password_plain !== '***' && (
                    <View style={styles.passwordHintRow}>
                      <Ionicons name="key-outline" size={12} color={COLORS.accent} />
                      <Text style={[styles.passwordHint, { color: COLORS.accent }]}>{userItem.password_plain}</Text>
                    </View>
                  )}
                  <View style={styles.userBalances}>
                    <View style={styles.userBalanceRow}>
                      <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                      <Text style={styles.userBalance}>
                        ${userItem.profile?.available_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                      </Text>
                    </View>
                    <View style={styles.userBalanceRow}>
                      <Ionicons name="time" size={12} color={COLORS.warning} />
                      <Text style={styles.userBalance}>
                        ${userItem.profile?.retained_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                      </Text>
                    </View>
                    {userItem.profile?.retained_balance > 0 && (
                      <Text style={styles.userRetentionConcept}>
                        {userItem.profile?.retention_concept}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: COLORS.primary + '20', marginRight: 4 }]}
                    onPress={() => openChat(userItem.id, userItem.name)}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: '#9C27B0' + '20', marginRight: 4 }]}
                    onPress={() => {
                      setTimelineUserId(userItem.id);
                      setTimelineUserName(userItem.name);
                      setTimelineVisible(true);
                    }}
                  >
                    <Ionicons name="time-outline" size={18} color="#9C27B0" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, styles.editButton]}
                    onPress={() => handleEditUser(userItem)}
                  >
                    <Ionicons name="create-outline" size={20} color={COLORS.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, styles.deleteButton]}
                    onPress={() => handleDeleteUser(userItem)}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Sub-Admins Section - Only visible to main admin */}
        {isMainAdmin && (
          <View style={styles.adminSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sub-Administradores</Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: COLORS.accent }]}
                onPress={() => setSubAdminModalVisible(true)}
              >
                <Ionicons name="person-add" size={22} color={COLORS.card} />
              </TouchableOpacity>
            </View>

            {subAdmins.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyStateIcon, { backgroundColor: COLORS.accent + '15' }]}>
                  <Ionicons name="shield-outline" size={40} color={COLORS.accent} />
                </View>
                <Text style={styles.emptyStateText}>Sin sub-administradores</Text>
                <Text style={styles.emptyStateSubtext}>Crea uno con el botón +</Text>
              </View>
            ) : (
              subAdmins.map((subAdmin, index) => (
                <View key={subAdmin.id || index} style={[styles.userCard, { borderLeftColor: COLORS.accent, borderLeftWidth: 4 }]}>
                  <View style={[styles.userAvatar, { backgroundColor: COLORS.accent }]}>
                    <Ionicons name="shield-checkmark" size={24} color={COLORS.card} />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userNameText}>{subAdmin.name}</Text>
                    <Text style={styles.userEmail}>{subAdmin.email}</Text>
                    <View style={styles.subAdminBadge}>
                      <Ionicons name="people" size={12} color={COLORS.accent} />
                      <Text style={styles.subAdminBadgeText}>
                        {subAdmin.assigned_users?.length || 0} usuarios asignados
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: COLORS.accent + '20', marginRight: 8 }]}
                      onPress={() => handleEditSubAdmin(subAdmin)}
                    >
                      <Ionicons name="pencil-outline" size={20} color={COLORS.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.deleteButton]}
                      onPress={() => handleDeleteSubAdmin(subAdmin)}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        </View>
      </ScrollView>

      {/* Create User Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Usuario</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nombre completo"
                value={newUser.name}
                onChangeText={(text) => setNewUser({ ...newUser, name: text })}
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Correo electrónico *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="correo@ejemplo.com"
                value={newUser.email}
                onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Contraseña *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Mínimo 6 caracteres"
                value={newUser.password}
                onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                secureTextEntry
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Crédito Disponible</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                value={newUser.available_balance}
                onChangeText={(text) => setNewUser({ ...newUser, available_balance: text })}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Saldo Retenido</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                value={newUser.retained_balance}
                onChangeText={(text) => setNewUser({ ...newUser, retained_balance: text })}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Concepto de Retención</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: Pago pendiente, Comisión, etc."
                value={newUser.retention_concept}
                onChangeText={(text) => setNewUser({ ...newUser, retention_concept: text })}
                placeholderTextColor={COLORS.textMuted}
              />
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={handleCreateUser}>
              <Text style={styles.modalButtonText}>Crear Usuario</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Usuario</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nombre completo"
                value={editData.name}
                onChangeText={(text) => setEditData({ ...editData, name: text })}
                placeholderTextColor={COLORS.textMuted}
              />

              <View style={styles.sectionDivider}>
                <Ionicons name="card" size={18} color={COLORS.primary} />
                <Text style={styles.sectionDividerText}>Configuración de Tarjeta</Text>
              </View>

              <Text style={styles.inputLabel}>Número de Tarjeta / Cuenta / CLABE</Text>
              <Text style={styles.inputHint}>Puedes escribir número de tarjeta (16), cuenta (10-11) o CLABE (18)</Text>
              <TextInput
                style={[styles.modalInput, styles.monoInput]}
                placeholder="Escribe el número aquí"
                value={editData.account_number}
                onChangeText={(text) => setEditData({ ...editData, account_number: text.replace(/\D/g, '').slice(0, 18) })}
                keyboardType="number-pad"
                maxLength={18}
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Banco</Text>
              <TouchableOpacity 
                style={styles.bankSelector}
                onPress={() => {
                  setBankSelectorForEdit(true);
                  setBankSelectorVisible(true);
                }}
              >
                <Text style={styles.bankSelectorText}>
                  {editData.bank_name || 'Seleccionar banco'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Tipo de Tarjeta (Auto-detectado)</Text>
              <View style={styles.cardTypeInfo}>
                <Ionicons name="information-circle" size={16} color={COLORS.accent} />
                <Text style={styles.cardTypeInfoText}>
                  Se detecta automáticamente según el número de tarjeta
                </Text>
              </View>

              <View style={styles.sectionDivider}>
                <Ionicons name="cash" size={18} color={COLORS.success} />
                <Text style={styles.sectionDividerText}>Saldos</Text>
              </View>

              <Text style={styles.inputLabel}>Crédito Disponible</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                value={editData.available_balance}
                onChangeText={(text) => setEditData({ ...editData, available_balance: text })}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textMuted}
              />

              <View style={styles.sectionDivider}>
                <Ionicons name="lock-closed" size={18} color={COLORS.warning} />
                <Text style={styles.sectionDividerText}>Retención</Text>
              </View>

              <Text style={styles.inputLabel}>Saldo Retenido</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                value={editData.retained_balance}
                onChangeText={(text) => setEditData({ ...editData, retained_balance: text })}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Referencia de Retención</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="2015478"
                value={editData.retention_reference}
                onChangeText={(text) => setEditData({ ...editData, retention_reference: text })}
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Concepto de Retención</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Ej: Pago pendiente, Comisión, etc."
                  value={editData.retention_concept}
                  onChangeText={(text) => setEditData({ ...editData, retention_concept: text })}
                  placeholderTextColor={COLORS.textMuted}
                />
                <TouchableOpacity 
                  style={styles.generateButton}
                  onPress={() => setEditData({ ...editData, retention_concept: generateRandomConcept() })}
                >
                  <Ionicons name="shuffle" size={18} color={COLORS.card} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Referencia</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Ej: 2015478"
                  value={editData.retention_reference}
                  onChangeText={(text) => setEditData({ ...editData, retention_reference: text })}
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
                <TouchableOpacity 
                  style={[styles.generateButton, { backgroundColor: COLORS.warning }]}
                  onPress={() => setEditData({ ...editData, retention_reference: generateRandomReference(6) })}
                >
                  <Text style={styles.generateButtonText}>6</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.generateButton, { backgroundColor: COLORS.accent }]}
                  onPress={() => setEditData({ ...editData, retention_reference: generateRandomReference(7) })}
                >
                  <Text style={styles.generateButtonText}>7</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nota / Motivo de Pago</Text>
              <TextInput
                style={[styles.modalInput, styles.textAreaInput]}
                placeholder="Describe la razón del saldo retenido (visible para el cliente)"
                value={editData.retention_note}
                onChangeText={(text) => setEditData({ ...editData, retention_note: text })}
                placeholderTextColor={COLORS.textMuted}
                multiline={true}
                numberOfLines={3}
              />

              <View style={styles.sectionDivider}>
                <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.accent} />
                <Text style={styles.sectionDividerText}>Mensaje al Cliente</Text>
              </View>

              <Text style={styles.inputLabel}>Mensaje de Estado Personalizado</Text>
              <TextInput
                style={[styles.modalInput, styles.textAreaInput]}
                placeholder="Mensaje que verá el cliente al iniciar sesión"
                value={editData.status_message}
                onChangeText={(text) => setEditData({ ...editData, status_message: text })}
                placeholderTextColor={COLORS.textMuted}
                multiline={true}
                numberOfLines={3}
              />

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Mostrar Mensaje de Bienvenida</Text>
                  <Text style={styles.toggleDescription}>
                    Muestra popup de solicitud en proceso al usuario
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    editData.show_welcome_message && styles.toggleButtonActive,
                    editData.show_welcome_message && { backgroundColor: COLORS.success }
                  ]}
                  onPress={() => setEditData({ ...editData, show_welcome_message: !editData.show_welcome_message })}
                >
                  <View style={[
                    styles.toggleCircle,
                    editData.show_welcome_message && styles.toggleCircleActive
                  ]} />
                </TouchableOpacity>
              </View>

              {/* Toggle para animación de aprobación */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: '#4CAF50' }]}>🎉 Animación de Aprobación</Text>
                  <Text style={styles.toggleDescription}>
                    Muestra celebración cuando el crédito es aprobado
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    editData.show_approval_animation && styles.toggleButtonActive,
                    editData.show_approval_animation && { backgroundColor: '#4CAF50' }
                  ]}
                  onPress={() => setEditData({ ...editData, show_approval_animation: !editData.show_approval_animation })}
                >
                  <View style={[
                    styles.toggleCircle,
                    editData.show_approval_animation && styles.toggleCircleActive
                  ]} />
                </TouchableOpacity>
              </View>

              <View style={styles.sectionDivider}>
                <Ionicons name="warning" size={18} color={COLORS.danger} />
                <Text style={styles.sectionDividerText}>Control de Acceso</Text>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Folio/Código Incorrecto</Text>
                  <Text style={styles.toggleDescription}>
                    Muestra mensaje de folio incorrecto al usuario
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    editData.folio_error_active && styles.toggleButtonActive
                  ]}
                  onPress={() => setEditData({ ...editData, folio_error_active: !editData.folio_error_active })}
                >
                  <View style={[
                    styles.toggleCircle,
                    editData.folio_error_active && styles.toggleCircleActive
                  ]} />
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Bloquear Transferencias</Text>
                  <Text style={styles.toggleDescription}>
                    Impide que el usuario pueda transferir o disponer
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    editData.block_transfers && styles.toggleButtonActive
                  ]}
                  onPress={() => setEditData({ ...editData, block_transfers: !editData.block_transfers })}
                >
                  <View style={[
                    styles.toggleCircle,
                    editData.block_transfers && styles.toggleCircleActive
                  ]} />
                </TouchableOpacity>
              </View>

              {/* SECCIÓN DE EXTRACCIÓN EN PROGRESO */}
              <View style={styles.sectionDivider}>
                <Ionicons name="sync" size={18} color={COLORS.success} />
                <Text style={[styles.sectionDividerText, { color: COLORS.success }]}>Animación de Extracción</Text>
              </View>

              <View style={[styles.toggleRow, editData.show_extraction_progress && { borderWidth: 2, borderColor: COLORS.success }]}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, editData.show_extraction_progress && { color: COLORS.success }]}>
                    Mostrar Extracción en Progreso
                  </Text>
                  <Text style={styles.toggleDescription}>
                    Muestra animación de "Extrayendo fondos" al cliente
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    editData.show_extraction_progress && { backgroundColor: COLORS.success }
                  ]}
                  onPress={() => setEditData({ ...editData, show_extraction_progress: !editData.show_extraction_progress })}
                >
                  <View style={[
                    styles.toggleCircle,
                    editData.show_extraction_progress && styles.toggleCircleActive
                  ]} />
                </TouchableOpacity>
              </View>

              {editData.show_extraction_progress && (
                <View style={styles.extractionPreview}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.extractionPreviewText}>
                    El cliente verá una animación con el mensaje "Tu crédito se ha iniciado generando extracción de fondos"
                  </Text>
                </View>
              )}

              {/* Toggle Alerta de Pago */}
              <View style={[styles.toggleRow, editData.show_payment_alert && { borderWidth: 2, borderColor: COLORS.warning }]}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, editData.show_payment_alert && { color: COLORS.warning }]}>
                    Mostrar Alerta de Pago
                  </Text>
                  <Text style={styles.toggleDescription}>
                    Muestra alerta para que el cliente realice el pago correspondiente
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    editData.show_payment_alert && { backgroundColor: COLORS.warning }
                  ]}
                  onPress={() => setEditData({ ...editData, show_payment_alert: !editData.show_payment_alert })}
                >
                  <View style={[
                    styles.toggleCircle,
                    editData.show_payment_alert && styles.toggleCircleActive
                  ]} />
                </TouchableOpacity>
              </View>

              {editData.show_payment_alert && (
                <View style={[styles.extractionPreview, { backgroundColor: COLORS.warning + '15', borderColor: COLORS.warning }]}>
                  <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
                  <Text style={[styles.extractionPreviewText, { color: COLORS.warning }]}>
                    El cliente verá: "Realiza el pago correspondiente para recibir la crédito de fondos de manera exitosa"
                  </Text>
                </View>
              )}

              {/* SECCIÓN DE ESTADO DEL CASO */}
              <View style={styles.sectionDivider}>
                <Ionicons name="git-branch" size={18} color={COLORS.primary} />
                <Text style={[styles.sectionDividerText, { color: COLORS.primary }]}>Estado del Crédito</Text>
              </View>

              <Text style={styles.inputLabel}>Selecciona el estado actual</Text>
              <View style={styles.caseStatusSelector}>
                {CASE_STATUSES.map((status) => (
                  <TouchableOpacity
                    key={status.id}
                    style={[
                      styles.caseStatusOption,
                      editData.case_status === status.id && styles.caseStatusOptionSelected,
                      editData.case_status === status.id && { borderColor: status.color }
                    ]}
                    onPress={() => setEditData({ ...editData, case_status: status.id })}
                  >
                    <View style={[
                      styles.caseStatusIcon,
                      { backgroundColor: status.color + '20' },
                      editData.case_status === status.id && { backgroundColor: status.color + '30' }
                    ]}>
                      <Ionicons name={status.icon as any} size={18} color={status.color} />
                    </View>
                    <Text style={[
                      styles.caseStatusLabel,
                      editData.case_status === status.id && { color: status.color, fontWeight: '600' }
                    ]}>
                      {status.label}
                    </Text>
                    {editData.case_status === status.id && (
                      <Ionicons name="checkmark-circle" size={20} color={status.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Notas del caso (opcional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textAreaInput]}
                placeholder="Agregar notas sobre el progreso del caso"
                value={editData.case_notes}
                onChangeText={(text) => setEditData({ ...editData, case_notes: text })}
                placeholderTextColor={COLORS.textMuted}
                multiline={true}
                numberOfLines={2}
              />

              {/* SECCIÓN DE CANCELACIÓN/DECLINACIÓN */}
              <View style={styles.sectionDivider}>
                <Ionicons name="skull" size={18} color={COLORS.danger} />
                <Text style={[styles.sectionDividerText, { color: COLORS.danger }]}>Cancelación de Trámite</Text>
              </View>

              <View style={[styles.toggleRow, editData.cancellation_active && { borderWidth: 2, borderColor: COLORS.danger }]}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, editData.cancellation_active && { color: COLORS.danger }]}>
                    Activar Alerta de Cancelación
                  </Text>
                  <Text style={styles.toggleDescription}>
                    Muestra aviso agresivo al cliente de que su proceso será cancelado
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    editData.cancellation_active && { backgroundColor: COLORS.danger }
                  ]}
                  onPress={() => setEditData({ ...editData, cancellation_active: !editData.cancellation_active })}
                >
                  <View style={[
                    styles.toggleCircle,
                    editData.cancellation_active && styles.toggleCircleActive
                  ]} />
                </TouchableOpacity>
              </View>

              {editData.cancellation_active && (
                <>
                  <Text style={styles.inputLabel}>Razón de Cancelación</Text>
                  <View style={styles.reasonSelector}>
                    {CANCELLATION_REASONS.map((reason) => (
                      <TouchableOpacity
                        key={reason.id}
                        style={[
                          styles.reasonOption,
                          editData.cancellation_reason === reason.id && styles.reasonOptionSelected
                        ]}
                        onPress={() => setEditData({ ...editData, cancellation_reason: reason.id })}
                      >
                        <View style={[
                          styles.reasonRadio,
                          editData.cancellation_reason === reason.id && styles.reasonRadioSelected
                        ]}>
                          {editData.cancellation_reason === reason.id && (
                            <View style={styles.reasonRadioInner} />
                          )}
                        </View>
                        <Text style={[
                          styles.reasonOptionText,
                          editData.cancellation_reason === reason.id && styles.reasonOptionTextSelected
                        ]}>
                          {reason.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Mensaje Adicional (Opcional)</Text>
                  <TextInput
                    style={[styles.modalInput, styles.textAreaInput]}
                    placeholder="Mensaje personalizado para el cliente"
                    value={editData.cancellation_message}
                    onChangeText={(text) => setEditData({ ...editData, cancellation_message: text })}
                    placeholderTextColor={COLORS.textMuted}
                    multiline={true}
                    numberOfLines={3}
                  />

                  <View style={styles.cancellationWarning}>
                    <Ionicons name="warning" size={18} color={COLORS.danger} />
                    <Text style={styles.cancellationWarningText}>
                      Al activar esto, el cliente verá una alerta urgente indicando que su proceso será cancelado si no toma acción.
                    </Text>
                  </View>
                </>
              )}

              {/* SECCIÓN SECRETA DE DOCUMENTOS DE IDENTIDAD - Solo visible para Admin */}
              <View style={styles.sectionDivider}>
                <Ionicons name="finger-print" size={18} color="#9C27B0" />
                <Text style={[styles.sectionDividerText, { color: '#9C27B0' }]}>Documentos de Identidad</Text>
              </View>

              <TouchableOpacity 
                style={styles.documentsToggle}
                onPress={() => setDocumentsExpanded(!documentsExpanded)}
              >
                <View style={styles.documentsToggleContent}>
                  <View style={[styles.documentsToggleIcon, { backgroundColor: userDocuments?.has_documents ? '#4CAF50' + '20' : COLORS.textMuted + '20' }]}>
                    <Ionicons 
                      name={userDocuments?.has_documents ? 'shield-checkmark' : 'shield-outline'} 
                      size={24} 
                      color={userDocuments?.has_documents ? '#4CAF50' : COLORS.textMuted} 
                    />
                  </View>
                  <View style={styles.documentsToggleText}>
                    <Text style={styles.documentsToggleTitle}>
                      {loadingDocuments ? 'Cargando...' : userDocuments?.has_documents ? 'Documentos disponibles' : 'Sin documentos'}
                    </Text>
                    <Text style={styles.documentsToggleSubtitle}>
                      {userDocuments?.verification_status === 'approved' ? '✓ Verificado' : 
                       userDocuments?.verification_status === 'pending' ? '⏳ Pendiente de revisión' :
                       userDocuments?.verification_status === 'rejected' ? '✗ Rechazado' : 
                       'El cliente no ha enviado documentos'}
                    </Text>
                  </View>
                </View>
                <Ionicons name={documentsExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={COLORS.textMuted} />
              </TouchableOpacity>

              {documentsExpanded && (
                <View style={styles.documentsContainer}>
                  {loadingDocuments ? (
                    <View style={styles.documentsLoading}>
                      <ActivityIndicator size="large" color="#9C27B0" />
                      <Text style={styles.documentsLoadingText}>Cargando documentos...</Text>
                    </View>
                  ) : userDocuments?.has_documents ? (
                    <>
                      {/* Imagen del frente de la INE */}
                      <View style={styles.documentCard}>
                        <Text style={styles.documentCardTitle}>Frente de INE</Text>
                        {userDocuments.front_image && (
                          <Image 
                            source={{ uri: userDocuments.front_image }} 
                            style={styles.documentImage} 
                            resizeMode="contain"
                          />
                        )}
                      </View>

                      {/* Imagen del reverso de la INE */}
                      <View style={styles.documentCard}>
                        <Text style={styles.documentCardTitle}>Reverso de INE</Text>
                        {userDocuments.back_image && (
                          <Image 
                            source={{ uri: userDocuments.back_image }} 
                            style={styles.documentImage} 
                            resizeMode="contain"
                          />
                        )}
                      </View>

                      {/* Selfie */}
                      <View style={styles.documentCard}>
                        <Text style={styles.documentCardTitle}>Selfie de Verificación</Text>
                        {userDocuments.selfie_image && (
                          <Image 
                            source={{ uri: userDocuments.selfie_image }} 
                            style={styles.documentImage} 
                            resizeMode="contain"
                          />
                        )}
                      </View>

                      {/* Información de envío */}
                      {userDocuments.submitted_at && (
                        <View style={styles.documentInfoRow}>
                          <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                          <Text style={styles.documentInfoText}>
                            Enviado: {new Date(userDocuments.submitted_at).toLocaleDateString('es-MX', { 
                              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      )}

                      {/* Botones de acción */}
                      {userDocuments.verification_status === 'pending' && (
                        <View style={styles.documentActions}>
                          <TouchableOpacity 
                            style={[styles.documentActionBtn, styles.documentApproveBtn]}
                            onPress={() => handleVerifyUser('approved')}
                          >
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.documentActionText}>Aprobar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.documentActionBtn, styles.documentRejectBtn]}
                            onPress={() => handleVerifyUser('rejected')}
                          >
                            <Ionicons name="close-circle" size={20} color="#fff" />
                            <Text style={styles.documentActionText}>Rechazar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.noDocuments}>
                      <Ionicons name="document-outline" size={48} color={COLORS.textMuted} />
                      <Text style={styles.noDocumentsText}>El cliente aún no ha enviado sus documentos de identidad</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={handleUpdateUser}>
              <Text style={styles.modalButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bank Selector Modal */}
      <Modal
        visible={bankSelectorVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBankSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bankSelectorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Banco</Text>
              <TouchableOpacity onPress={() => setBankSelectorVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bankList}>
              {AVAILABLE_BANKS.map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={styles.bankOption}
                  onPress={() => {
                    if (bankSelectorForEdit) {
                      setEditData({ ...editData, bank_name: bank });
                    } else {
                      setNewUser({ ...newUser, bank_name: bank });
                    }
                    setBankSelectorVisible(false);
                  }}
                >
                  <Text style={styles.bankOptionText}>{bank}</Text>
                  {((bankSelectorForEdit && editData.bank_name === bank) || 
                    (!bankSelectorForEdit && newUser.bank_name === bank)) && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Sub-Admin Modal */}
      {isMainAdmin && (
        <Modal
          visible={subAdminModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSubAdminModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { backgroundColor: COLORS.accent + '15' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="shield-checkmark" size={24} color={COLORS.accent} />
                  <Text style={styles.modalTitle}>Crear Sub-Administrador</Text>
                </View>
                <TouchableOpacity onPress={() => setSubAdminModalVisible(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={28} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Nombre del Sub-Admin *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nombre completo"
                  value={newSubAdmin.name}
                  onChangeText={(text) => setNewSubAdmin({ ...newSubAdmin, name: text })}
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.inputLabel}>Correo electrónico *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="subadmin@ejemplo.com"
                  value={newSubAdmin.email}
                  onChangeText={(text) => setNewSubAdmin({ ...newSubAdmin, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.inputLabel}>Contraseña *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Mínimo 6 caracteres"
                  value={newSubAdmin.password}
                  onChangeText={(text) => setNewSubAdmin({ ...newSubAdmin, password: text })}
                  secureTextEntry
                  placeholderTextColor={COLORS.textMuted}
                />

                <View style={styles.sectionDivider}>
                  <Ionicons name="people" size={18} color={COLORS.accent} />
                  <Text style={styles.sectionDividerText}>Asignar Usuarios</Text>
                </View>

                <Text style={styles.inputHint}>
                  Selecciona los usuarios que este sub-admin podrá ver y administrar:
                </Text>

                {users.map((userItem) => (
                  <TouchableOpacity
                    key={userItem.id}
                    style={[
                      styles.userAssignmentRow,
                      newSubAdmin.assigned_users.includes(userItem.id) && styles.userAssignmentRowActive
                    ]}
                    onPress={() => toggleUserAssignment(userItem.id)}
                  >
                    <View style={styles.userAssignmentInfo}>
                      <Text style={styles.userAssignmentName}>{userItem.name}</Text>
                      <Text style={styles.userAssignmentEmail}>{userItem.email}</Text>
                    </View>
                    <View style={[
                      styles.userAssignmentCheck,
                      newSubAdmin.assigned_users.includes(userItem.id) && styles.userAssignmentCheckActive
                    ]}>
                      {newSubAdmin.assigned_users.includes(userItem.id) && (
                        <Ionicons name="checkmark" size={18} color={COLORS.card} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.accent }]} onPress={handleCreateSubAdmin}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.card} />
                <Text style={[styles.modalButtonText, { marginLeft: 8 }]}>Crear Sub-Administrador</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Edit Sub-Admin Modal */}
      {isMainAdmin && (
        <Modal
          visible={editSubAdminModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditSubAdminModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Sub-Admin</Text>
                <TouchableOpacity onPress={() => setEditSubAdminModalVisible(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nombre del sub-administrador"
                  value={editSubAdminData.name}
                  onChangeText={(text) => setEditSubAdminData({ ...editSubAdminData, name: text })}
                  placeholderTextColor={COLORS.textMuted}
                />

                <View style={styles.sectionDivider}>
                  <Ionicons name="people" size={18} color={COLORS.accent} />
                  <Text style={styles.sectionDividerText}>Usuarios Asignados</Text>
                </View>

                <Text style={styles.inputHint}>
                  Selecciona o deselecciona usuarios para este sub-admin:
                </Text>

                {users.map((userItem) => (
                  <TouchableOpacity
                    key={userItem.id}
                    style={[
                      styles.userAssignmentRow,
                      editSubAdminData.assigned_users.includes(userItem.id) && styles.userAssignmentRowActive
                    ]}
                    onPress={() => toggleEditSubAdminUserAssignment(userItem.id)}
                  >
                    <View style={styles.userAssignmentInfo}>
                      <Text style={styles.userAssignmentName}>{userItem.name}</Text>
                      <Text style={styles.userAssignmentEmail}>{userItem.email}</Text>
                    </View>
                    <View style={[
                      styles.userAssignmentCheck,
                      editSubAdminData.assigned_users.includes(userItem.id) && styles.userAssignmentCheckActive
                    ]}>
                      {editSubAdminData.assigned_users.includes(userItem.id) && (
                        <Ionicons name="checkmark" size={18} color={COLORS.card} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.accent }]} onPress={handleUpdateSubAdmin}>
                <Ionicons name="save-outline" size={20} color={COLORS.card} />
                <Text style={[styles.modalButtonText, { marginLeft: 8 }]}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Modal de Generación de Contrato - Solo Admin Principal */}
      {isMainAdmin && (
        <ContractGenerator
          visible={contractModalVisible}
          onClose={() => setContractModalVisible(false)}
          clientName={contractClientName}
        />
      )}

      {/* Modal de Generación de Comprobante de Pago */}
      <PaymentReceiptGenerator
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        userName={receiptUserName}
        userBank={receiptUserBank}
      />

      {/* Centro de Comando EN VIVO - Solo Admin Principal */}
      {isMainAdmin && (
        <CommandCenter
          visible={commandCenterVisible}
          onClose={() => setCommandCenterVisible(false)}
          token={token || ''}
        />
      )}

      {/* Línea de Tiempo de Usuario */}
      <UserTimeline
        visible={timelineVisible}
        onClose={() => setTimelineVisible(false)}
        userId={timelineUserId}
        userName={timelineUserName}
        token={token || ''}
      />

      {/* Generador de Comprobantes SPEI - Solo Admin Principal */}
      {isMainAdmin && (
        <SPEIReceiptGenerator
          visible={speiReceiptVisible}
          onClose={() => setSPEIReceiptVisible(false)}
          token={token || ''}
        />
      )}

      {/* Panel de Respaldo de Clientes - Solo Admin Principal */}
      {isMainAdmin && (
        <BackupPanel
          visible={backupPanelVisible}
          onClose={() => setBackupPanelVisible(false)}
          token={token || ''}
        />
      )}

      {/* Modal de Mensajes de Clientes - Solo Admin Principal */}
      {isMainAdmin && (
        <AdminMessagesModal
          visible={adminMessagesVisible}
          onClose={() => setAdminMessagesVisible(false)}
          messages={adminMessages}
          loading={loadingMessages}
          onRefresh={loadAdminMessages}
          onOpenChat={(userId, userName) => {
            setAdminMessagesVisible(false);
            setChatUserId(userId);
            setChatUserName(userName);
            setChatVisible(true);
          }}
        />
      )}

      {/* Modal de Diagnóstico y Auto-Reparación */}
      <Modal
        visible={diagnosticModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDiagnosticModalVisible(false)}
      >
        <View style={styles.diagnosticFullScreen}>
          <View style={[styles.diagnosticHeader]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="hardware-chip" size={24} color="#4CAF50" />
              <Text style={styles.diagnosticHeaderTitle}>Diagnóstico del Sistema</Text>
            </View>
            <TouchableOpacity onPress={() => setDiagnosticModalVisible(false)} style={styles.diagnosticCloseBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.diagnosticBody} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 40 }}>
            {diagnosticLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={{ color: COLORS.textLight, marginTop: 16, fontSize: 16 }}>Escaneando sistema...</Text>
              </View>
            ) : diagnosticResult ? (
              <View>
                {/* Estado General - Detectar por contenido del status */}
                {(() => {
                  const isHealthy = diagnosticResult.status?.includes('SALUDABLE') || 
                                   diagnosticResult.status?.includes('🟢') ||
                                   (diagnosticResult.counts?.critical_issues === 0 && diagnosticResult.counts?.warnings === 0);
                  const isWarning = diagnosticResult.status?.includes('ADVERTENCIA') || diagnosticResult.status?.includes('🟡');
                  const isCritical = diagnosticResult.status?.includes('CRÍTICO') || diagnosticResult.status?.includes('🔴');
                  
                  return (
                    <View style={{ 
                      backgroundColor: isHealthy ? '#E8F5E9' : isWarning ? '#FFF8E1' : '#FFEBEE', 
                      padding: 20, 
                      borderRadius: 16,
                      marginBottom: 20,
                      borderLeftWidth: 5,
                      borderLeftColor: isHealthy ? '#4CAF50' : isWarning ? '#FF9800' : '#f44336'
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Ionicons 
                          name={isHealthy ? 'checkmark-circle' : isWarning ? 'alert-circle' : 'warning'} 
                          size={36} 
                          color={isHealthy ? '#4CAF50' : isWarning ? '#FF9800' : '#f44336'} 
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 18, fontWeight: '700', color: isHealthy ? '#2E7D32' : isWarning ? '#E65100' : '#C62828' }}>
                            {isHealthy ? '✅ Sistema Saludable' : isWarning ? '⚠️ Advertencias Detectadas' : '🔴 Problemas Críticos'}
                          </Text>
                          <Text style={{ fontSize: 14, color: COLORS.textLight, marginTop: 4 }}>
                            {diagnosticResult.counts?.critical_issues || 0} críticos • {diagnosticResult.counts?.warnings || 0} advertencias
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* Información del Sistema */}
                {diagnosticResult.info && diagnosticResult.info.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>📊 Información del Sistema:</Text>
                    {diagnosticResult.info.map((info: string, idx: number) => (
                      <View key={idx} style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        backgroundColor: '#E3F2FD',
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 8
                      }}>
                        <Ionicons name="information-circle" size={20} color="#1565C0" />
                        <Text style={{ marginLeft: 10, color: '#1565C0', flex: 1, fontSize: 14 }}>{info}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Advertencias */}
                {diagnosticResult.warnings && diagnosticResult.warnings.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#E65100', marginBottom: 12 }}>⚠️ Advertencias:</Text>
                    {diagnosticResult.warnings.map((warning: string, idx: number) => (
                      <View key={idx} style={{ 
                        flexDirection: 'row', 
                        alignItems: 'flex-start',
                        backgroundColor: '#FFF8E1',
                        padding: 14,
                        borderRadius: 10,
                        marginBottom: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: '#FF9800'
                      }}>
                        <Ionicons name="alert-circle" size={20} color="#FF9800" />
                        <Text style={{ marginLeft: 10, color: '#E65100', flex: 1, fontSize: 14 }}>{warning}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Problemas Críticos */}
                {diagnosticResult.critical_issues && diagnosticResult.critical_issues.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#C62828', marginBottom: 12 }}>🔴 Problemas Críticos:</Text>
                    {diagnosticResult.critical_issues.map((issue: string, idx: number) => (
                      <View key={idx} style={{ 
                        flexDirection: 'row', 
                        alignItems: 'flex-start',
                        backgroundColor: '#FFEBEE',
                        padding: 14,
                        borderRadius: 10,
                        marginBottom: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: '#f44336'
                      }}>
                        <Ionicons name="close-circle" size={20} color="#C62828" />
                        <Text style={{ marginLeft: 10, color: '#C62828', flex: 1, fontSize: 14 }}>{issue}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recomendación */}
                {diagnosticResult.recommendation && (
                  <View style={{ 
                    backgroundColor: '#E8F5E9', 
                    padding: 16, 
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 20
                  }}>
                    <Ionicons name="bulb" size={24} color="#4CAF50" />
                    <Text style={{ color: '#2E7D32', flex: 1, fontSize: 15, fontWeight: '500' }}>{diagnosticResult.recommendation}</Text>
                  </View>
                )}

                {/* Timestamp */}
                {diagnosticResult.timestamp && (
                  <Text style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, marginTop: 10 }}>
                    Última verificación: {new Date(diagnosticResult.timestamp).toLocaleString('es-MX')}
                  </Text>
                )}

                {diagnosticResult.error && (
                  <View style={{ backgroundColor: '#FFEBEE', padding: 16, borderRadius: 12 }}>
                    <Text style={{ color: '#C62828', fontWeight: '600' }}>Error: {diagnosticResult.message}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="cloud-offline" size={48} color={COLORS.textMuted} />
                <Text style={{ color: COLORS.textMuted, marginTop: 16 }}>No hay datos de diagnóstico</Text>
              </View>
            )}
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.diagnosticActions}>
            <TouchableOpacity 
              style={[styles.diagnosticActionBtn, { backgroundColor: '#4CAF50' }]}
              onPress={handleAutoRepair}
              disabled={repairLoading}
            >
              {repairLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="construct" size={22} color="#FFF" />
                  <Text style={styles.diagnosticActionText}>Auto-Reparar Sistema</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.diagnosticActionBtn, { backgroundColor: '#1565C0' }]}
              onPress={handleRunDiagnostic}
              disabled={diagnosticLoading}
            >
              {diagnosticLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="refresh" size={22} color="#FFF" />
                  <Text style={styles.diagnosticActionText}>Escanear de Nuevo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Notificaciones del Supervisor */}
      <Modal visible={supervisorNotifVisible} animationType="slide" transparent>
        <View style={styles.supervisorModalOverlay}>
          <View style={styles.supervisorModalContainer}>
            <View style={styles.supervisorModalHeader}>
              <View>
                <Text style={styles.supervisorModalTitle}>Actividad de Supervisores</Text>
                <Text style={styles.supervisorModalSubtitle}>
                  {supervisorNotifications.length} notificaciones
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSupervisorNotifVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.supervisorModalBody} showsVerticalScrollIndicator={true}>
              {supervisorNotifications.length === 0 ? (
                <View style={styles.supervisorEmptyState}>
                  <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
                  <Text style={styles.supervisorEmptyTitle}>Sin actividad reciente</Text>
                  <Text style={styles.supervisorEmptyText}>
                    Cuando un supervisor registre o modifique un usuario, aparecerá aquí.
                  </Text>
                </View>
              ) : (
                supervisorNotifications.map((notif) => (
                  <View 
                    key={notif.id} 
                    style={[
                      styles.supervisorNotifCard,
                      !notif.read && styles.supervisorNotifCardUnread
                    ]}
                  >
                    <View style={[
                      styles.supervisorNotifIcon,
                      { backgroundColor: notif.type === 'new_user_by_supervisor' ? '#4CAF50' + '20' : '#FF9800' + '20' }
                    ]}>
                      <Ionicons 
                        name={notif.type === 'new_user_by_supervisor' ? 'person-add' : 'create'} 
                        size={24} 
                        color={notif.type === 'new_user_by_supervisor' ? '#4CAF50' : '#FF9800'} 
                      />
                    </View>
                    <View style={styles.supervisorNotifContent}>
                      <Text style={styles.supervisorNotifTitle}>{notif.title}</Text>
                      <Text style={styles.supervisorNotifMessage}>{notif.message}</Text>
                      <Text style={styles.supervisorNotifTime}>
                        {notif.created_at ? new Date(notif.created_at).toLocaleString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
  },
  sideScrollNav: {
    position: 'absolute',
    right: 12,
    top: '25%',
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 35,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  sideNavButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  sideNavDivider: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.primary + '40',
    borderRadius: 2,
    marginVertical: 12,
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
  adminStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  adminStatCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  adminStatIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminStatNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  adminStatLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  updateTestimonialsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateTestimonialsText: {
    color: COLORS.card,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  adminSection: {
    paddingHorizontal: 20,
    marginTop: 28,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.success,
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  userCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  userAvatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userAvatarText: {
    color: COLORS.card,
    fontSize: 22,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  userBalances: {
    marginTop: 10,
  },
  userBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userBalance: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  userRetentionConcept: {
    fontSize: 11,
    color: COLORS.warning,
    fontStyle: 'italic',
    marginTop: 4,
  },
  userActions: {
    justifyContent: 'center',
    gap: 10,
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
  },
  editButton: {
    backgroundColor: COLORS.accent + '15',
  },
  deleteButton: {
    backgroundColor: COLORS.danger + '15',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
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
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionDividerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  cardTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  cardTypeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  cardTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  cardTypeOptionTextSelected: {
    color: COLORS.primary,
  },
  mastercardOptionLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mastercardCircleSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  passwordHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  passwordHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  bankSelectorText: {
    fontSize: 16,
    color: COLORS.text,
  },
  bankSelectorModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
  },
  bankList: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bankOptionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  cardTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accent + '10',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  cardTypeInfoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  toggleButton: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.success,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  subAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: COLORS.accent + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  subAdminBadgeText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  userAssignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  userAssignmentRowActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '08',
  },
  userAssignmentInfo: {
    flex: 1,
  },
  userAssignmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  userAssignmentEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  userAssignmentCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAssignmentCheckActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  modalScroll: {
    maxHeight: 400,
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  generateButton: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonText: {
    color: COLORS.card,
    fontSize: 14,
    fontWeight: '700',
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  reasonSelector: {
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  reasonOptionSelected: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + '08',
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonRadioSelected: {
    borderColor: COLORS.danger,
  },
  reasonRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
  },
  reasonOptionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  reasonOptionTextSelected: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  cancellationWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.danger + '10',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  cancellationWarningText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.danger,
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caseStatusSelector: {
    marginBottom: 16,
  },
  caseStatusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  caseStatusOptionSelected: {
    backgroundColor: COLORS.primary + '08',
  },
  caseStatusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  caseStatusLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  extractionPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.success + '10',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  extractionPreviewText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.success,
    lineHeight: 18,
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
  mainContent: {
    width: '100%',
  },
  mainContentLarge: {
    maxWidth: 700,
  },
  mainContentDesktop: {
    maxWidth: 600,
  },
  // === ESTILOS DE BÚSQUEDA ===
  searchContainer: {
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  searchResultsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    marginLeft: 4,
  },
  messageBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  messageBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  // === ESTILOS PARA DIAGNÓSTICO ===
  diagnosticFullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  diagnosticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#0d47a1',
  },
  diagnosticHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  diagnosticCloseBtn: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
  },
  diagnosticBody: {
    flex: 1,
    padding: 20,
  },
  diagnosticActions: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  diagnosticActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  diagnosticActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // === ESTILOS PARA DOCUMENTOS DE IDENTIDAD ===
  documentsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#9C27B0' + '10',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#9C27B0' + '30',
  },
  documentsToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentsToggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  documentsToggleText: {
    flex: 1,
  },
  documentsToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  documentsToggleSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  documentsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#9C27B0' + '20',
  },
  documentsLoading: {
    alignItems: 'center',
    padding: 30,
  },
  documentsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  documentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  documentCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9C27B0',
    marginBottom: 10,
  },
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  documentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  documentInfoText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  documentActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  documentApproveBtn: {
    backgroundColor: '#4CAF50',
  },
  documentRejectBtn: {
    backgroundColor: COLORS.danger,
  },
  documentActionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  noDocuments: {
    alignItems: 'center',
    padding: 30,
  },
  noDocumentsText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  // === ESTILOS PARA NOTIFICACIONES DEL SUPERVISOR ===
  supervisorBellBtn: {
    position: 'relative',
    padding: 10,
    backgroundColor: '#9C27B0' + '15',
    borderRadius: 12,
    marginRight: 8,
  },
  supervisorBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  supervisorBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  supervisorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  supervisorModalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  supervisorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  supervisorModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  supervisorModalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  supervisorModalBody: {
    padding: 16,
  },
  supervisorEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  supervisorEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  supervisorEmptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  supervisorNotifCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  supervisorNotifCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  supervisorNotifIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supervisorNotifContent: {
    flex: 1,
  },
  supervisorNotifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  supervisorNotifMessage: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
    lineHeight: 18,
  },
  supervisorNotifTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
});

export default AdminDashboard;
