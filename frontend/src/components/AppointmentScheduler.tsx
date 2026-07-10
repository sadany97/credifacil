import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Sucursales en diferentes estados de México
// Configuradas para estar a mínimo 8 horas de cualquier ubicación común
const BRANCHES = [
  {
    id: '1',
    name: 'Sucursal Matriz CDMX',
    address: 'Av. Paseo de la Reforma 505, Cuauhtémoc',
    city: 'Ciudad de México',
    state: 'CDMX',
    phone: '55 1234 5678',
    hours: 'Lun-Vie 9:00 - 18:00',
    region: 'centro',
  },
  {
    id: '2',
    name: 'Sucursal Monterrey',
    address: 'Av. Constitución 1500, Centro',
    city: 'Monterrey',
    state: 'Nuevo León',
    phone: '81 8765 4321',
    hours: 'Lun-Vie 9:00 - 18:00',
    region: 'norte',
  },
  {
    id: '3',
    name: 'Sucursal Guadalajara',
    address: 'Av. Vallarta 3233, Vallarta Poniente',
    city: 'Guadalajara',
    state: 'Jalisco',
    phone: '33 3456 7890',
    hours: 'Lun-Vie 9:00 - 18:00',
    region: 'occidente',
  },
  {
    id: '4',
    name: 'Sucursal Mérida',
    address: 'Calle 60 No. 456, Centro',
    city: 'Mérida',
    state: 'Yucatán',
    phone: '99 9876 5432',
    hours: 'Lun-Vie 9:00 - 17:00',
    region: 'sureste',
  },
  {
    id: '5',
    name: 'Sucursal Tijuana',
    address: 'Blvd. Agua Caliente 4500, Aviación',
    city: 'Tijuana',
    state: 'Baja California',
    phone: '66 4567 8901',
    hours: 'Lun-Vie 9:00 - 18:00',
    region: 'noroeste',
  },
  {
    id: '6',
    name: 'Sucursal Cancún',
    address: 'Av. Tulum 200, Centro',
    city: 'Cancún',
    state: 'Quintana Roo',
    phone: '99 8234 5678',
    hours: 'Lun-Vie 9:00 - 17:00',
    region: 'sureste',
  },
];

// Mapeo de estados a regiones lejanas (mínimo 8 horas)
const STATE_TO_FAR_REGION: { [key: string]: string[] } = {
  // Estados del Norte -> Sucursales del Sur
  'NUEVO LEON': ['sureste'],
  'TAMAULIPAS': ['sureste', 'occidente'],
  'COAHUILA': ['sureste'],
  'CHIHUAHUA': ['sureste'],
  'SONORA': ['sureste'],
  'BAJA CALIFORNIA': ['sureste'],
  'BAJA CALIFORNIA SUR': ['sureste', 'centro'],
  'SINALOA': ['sureste'],
  'DURANGO': ['sureste'],
  
  // Estados del Centro -> Sucursales del Norte o Sureste
  'CDMX': ['noroeste', 'sureste'],
  'CIUDAD DE MEXICO': ['noroeste', 'sureste'],
  'ESTADO DE MEXICO': ['noroeste', 'sureste'],
  'MEXICO': ['noroeste', 'sureste'],
  'PUEBLA': ['noroeste', 'norte'],
  'MORELOS': ['noroeste', 'norte'],
  'TLAXCALA': ['noroeste', 'norte'],
  'HIDALGO': ['noroeste', 'sureste'],
  'QUERETARO': ['sureste', 'noroeste'],
  'GUANAJUATO': ['sureste', 'noroeste'],
  'AGUASCALIENTES': ['sureste'],
  'SAN LUIS POTOSI': ['sureste', 'noroeste'],
  'ZACATECAS': ['sureste'],
  
  // Estados del Occidente -> Sucursales del Norte o Sureste
  'JALISCO': ['sureste', 'norte'],
  'COLIMA': ['sureste', 'norte'],
  'MICHOACAN': ['sureste', 'norte'],
  'NAYARIT': ['sureste', 'norte'],
  
  // Estados del Sur -> Sucursales del Norte
  'YUCATAN': ['noroeste', 'norte'],
  'QUINTANA ROO': ['noroeste', 'norte'],
  'CAMPECHE': ['noroeste', 'norte'],
  'TABASCO': ['noroeste', 'norte'],
  'CHIAPAS': ['noroeste', 'norte'],
  'OAXACA': ['noroeste', 'norte'],
  'GUERRERO': ['noroeste', 'norte'],
  'VERACRUZ': ['noroeste', 'norte'],
};

// Lista de estados de México
const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

interface AppointmentSchedulerProps {
  userName?: string;
}

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ userName = '' }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedState, setSelectedState] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<typeof BRANCHES[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableBranches, setAvailableBranches] = useState<typeof BRANCHES>([]);
  const [confirmationCode, setConfirmationCode] = useState('');
  
  // Animation
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [modalVisible]);

  // Obtener sucursales lejanas basado en el estado seleccionado
  const getFarBranches = (state: string) => {
    const normalizedState = state.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const farRegions = STATE_TO_FAR_REGION[normalizedState] || ['sureste', 'noroeste'];
    
    return BRANCHES.filter(branch => farRegions.includes(branch.region));
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    const farBranches = getFarBranches(state);
    setAvailableBranches(farBranches);
    setStep(2);
  };

  const handleBranchSelect = (branch: typeof BRANCHES[0]) => {
    setSelectedBranch(branch);
    setStep(3);
  };

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 3; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Excluir fines de semana
        dates.push(date);
      }
    }
    return dates.slice(0, 8);
  };

  const generateAvailableTimes = () => {
    return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  };

  const handleConfirmAppointment = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Por favor selecciona fecha y hora');
      return;
    }
    
    // Generar código de confirmación
    const code = `RCF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    setConfirmationCode(code);
    setStep(4);
  };

  const resetModal = () => {
    setModalVisible(false);
    setStep(1);
    setSelectedState('');
    setSelectedBranch(null);
    setSelectedDate('');
    setSelectedTime('');
    setConfirmationCode('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <View style={styles.headerIcon}>
              <Ionicons name="calendar" size={28} color={COLORS.card} />
            </View>
            <View style={styles.headerBadge}>
              <Ionicons name="location" size={12} color={COLORS.card} />
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>¿Necesitas atención presencial?</Text>
            <Text style={styles.subtitle}>Agenda tu cita en la sucursal más cercana</Text>
          </View>
        </View>

        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.featureText}>Atención personalizada</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.featureText}>Sin filas ni esperas</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.accent} />
          <Text style={styles.infoText}>
            Nuestros asesores expertos te atenderán de manera personal para resolver tu caso de crédito de fondos.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.scheduleButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="calendar-outline" size={22} color={COLORS.card} />
          <Text style={styles.scheduleButtonText}>Agendar mi cita ahora</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.card} />
        </TouchableOpacity>

        <View style={styles.branchesPreview}>
          <Text style={styles.branchesTitle}>Sucursales disponibles:</Text>
          <View style={styles.branchLogos}>
            {BRANCHES.slice(0, 4).map((branch, index) => (
              <View key={index} style={styles.branchMini}>
                <Ionicons name="business" size={16} color={COLORS.primary} />
                <Text style={styles.branchMiniText}>{branch.city}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Modal de Agendamiento */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={resetModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {step === 1 && '¿En qué estado te encuentras?'}
                {step === 2 && 'Sucursal más cercana'}
                {step === 3 && 'Selecciona fecha y hora'}
                {step === 4 && '¡Cita confirmada!'}
              </Text>
              <TouchableOpacity onPress={resetModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Step 1: Seleccionar Estado */}
            {step === 1 && (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.stepDescription}>
                  Selecciona tu estado para encontrar la sucursal más conveniente para ti.
                </Text>
                <View style={styles.statesGrid}>
                  {MEXICAN_STATES.map((state, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.stateOption}
                      onPress={() => handleStateSelect(state)}
                    >
                      <Text style={styles.stateText}>{state}</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Step 2: Mostrar Sucursal */}
            {step === 2 && (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.selectedStateBox}>
                  <Ionicons name="location" size={18} color={COLORS.primary} />
                  <Text style={styles.selectedStateText}>Tu ubicación: {selectedState}</Text>
                </View>
                
                <Text style={styles.stepDescription}>
                  Basado en tu ubicación, estas son las sucursales disponibles para tu atención:
                </Text>

                {availableBranches.map((branch) => (
                  <TouchableOpacity
                    key={branch.id}
                    style={styles.branchCard}
                    onPress={() => handleBranchSelect(branch)}
                  >
                    <View style={styles.branchCardHeader}>
                      <View style={styles.branchIconBox}>
                        <Ionicons name="business" size={24} color={COLORS.primary} />
                      </View>
                      <View style={styles.branchInfo}>
                        <Text style={styles.branchName}>{branch.name}</Text>
                        <Text style={styles.branchCity}>{branch.city}, {branch.state}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.branchDetails}>
                      <View style={styles.branchDetailRow}>
                        <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                        <Text style={styles.branchDetailText}>{branch.address}</Text>
                      </View>
                      <View style={styles.branchDetailRow}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                        <Text style={styles.branchDetailText}>{branch.hours}</Text>
                      </View>
                      <View style={styles.branchDetailRow}>
                        <Ionicons name="call-outline" size={14} color={COLORS.textMuted} />
                        <Text style={styles.branchDetailText}>{branch.phone}</Text>
                      </View>
                    </View>
                    <View style={styles.distanceBadge}>
                      <Ionicons name="car" size={12} color={COLORS.warning} />
                      <Text style={styles.distanceText}>Aprox. 8-10 hrs de distancia</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                  <Ionicons name="arrow-back" size={18} color={COLORS.textLight} />
                  <Text style={styles.backButtonText}>Cambiar ubicación</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Step 3: Seleccionar Fecha y Hora */}
            {step === 3 && selectedBranch && (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.selectedBranchSummary}>
                  <Ionicons name="business" size={20} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryBranchName}>{selectedBranch.name}</Text>
                    <Text style={styles.summaryBranchCity}>{selectedBranch.city}</Text>
                  </View>
                </View>

                <Text style={styles.sectionLabel}>Selecciona una fecha:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
                  {generateAvailableDates().map((date, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateOption,
                        selectedDate === date.toISOString() && styles.dateOptionActive
                      ]}
                      onPress={() => setSelectedDate(date.toISOString())}
                    >
                      <Text style={[
                        styles.dateDay,
                        selectedDate === date.toISOString() && styles.dateDayActive
                      ]}>
                        {date.toLocaleDateString('es-MX', { weekday: 'short' })}
                      </Text>
                      <Text style={[
                        styles.dateNumber,
                        selectedDate === date.toISOString() && styles.dateNumberActive
                      ]}>
                        {date.getDate()}
                      </Text>
                      <Text style={[
                        styles.dateMonth,
                        selectedDate === date.toISOString() && styles.dateMonthActive
                      ]}>
                        {date.toLocaleDateString('es-MX', { month: 'short' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.sectionLabel}>Selecciona una hora:</Text>
                <View style={styles.timesGrid}>
                  {generateAvailableTimes().map((time, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeOption,
                        selectedTime === time && styles.timeOptionActive
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={[
                        styles.timeText,
                        selectedTime === time && styles.timeTextActive
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={[styles.confirmButton, (!selectedDate || !selectedTime) && styles.confirmButtonDisabled]}
                  onPress={handleConfirmAppointment}
                  disabled={!selectedDate || !selectedTime}
                >
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.card} />
                  <Text style={styles.confirmButtonText}>Confirmar cita</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                  <Ionicons name="arrow-back" size={18} color={COLORS.textLight} />
                  <Text style={styles.backButtonText}>Cambiar sucursal</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Step 4: Confirmación */}
            {step === 4 && selectedBranch && (
              <View style={styles.confirmationContainer}>
                <View style={styles.confirmationIcon}>
                  <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
                </View>
                <Text style={styles.confirmationTitle}>¡Cita Registrada!</Text>
                
                <View style={styles.confirmationCard}>
                  <View style={styles.confirmationCodeBox}>
                    <Text style={styles.confirmationCodeLabel}>Código de confirmación</Text>
                    <Text style={styles.confirmationCode}>{confirmationCode}</Text>
                  </View>

                  <View style={styles.confirmationDetail}>
                    <Ionicons name="person" size={18} color={COLORS.primary} />
                    <Text style={styles.confirmationDetailText}>
                      <Text style={{ fontWeight: '700' }}>Lic. Área de Investigación</Text>
                    </Text>
                  </View>
                  <View style={styles.confirmationDetail}>
                    <Ionicons name="business" size={18} color={COLORS.primary} />
                    <Text style={styles.confirmationDetailText}>{selectedBranch.name}</Text>
                  </View>
                  <View style={styles.confirmationDetail}>
                    <Ionicons name="calendar" size={18} color={COLORS.primary} />
                    <Text style={styles.confirmationDetailText}>
                      {selectedDate && formatDate(new Date(selectedDate))}
                    </Text>
                  </View>
                  <View style={styles.confirmationDetail}>
                    <Ionicons name="time" size={18} color={COLORS.primary} />
                    <Text style={styles.confirmationDetailText}>{selectedTime} hrs</Text>
                  </View>
                </View>

                {/* Mensaje de espera de asignación */}
                <View style={styles.pendingLocationBox}>
                  <View style={styles.pendingLocationHeader}>
                    <Ionicons name="hourglass" size={24} color={COLORS.warning} />
                    <Text style={styles.pendingLocationTitle}>Asignación de Ubicación Pendiente</Text>
                  </View>
                  <Text style={styles.pendingLocationText}>
                    Tu cita ha sido programada con un <Text style={{ fontWeight: '700' }}>Licenciado del Área de Investigación</Text>. 
                    Sin embargo, debido a la alta demanda de nuestros servicios y los miles de casos de crédito de capital 
                    que atendemos actualmente, la ubicación exacta de tu cita será asignada próximamente.
                  </Text>
                  <View style={styles.pendingLocationNote}>
                    <Ionicons name="information-circle" size={16} color={COLORS.accent} />
                    <Text style={styles.pendingLocationNoteText}>
                      Te notificaremos por correo electrónico y/o mensaje de texto cuando tu ubicación haya sido confirmada. 
                      Agradecemos tu paciencia y comprensión.
                    </Text>
                  </View>
                </View>

                <View style={styles.reminderBox}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
                  <Text style={styles.reminderText}>
                    Recuerda presentar tu identificación oficial y este código de confirmación el día de tu cita.
                  </Text>
                </View>

                <TouchableOpacity style={styles.doneButton} onPress={resetModal}>
                  <Text style={styles.doneButtonText}>Entendido</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconContainer: {
    position: 'relative',
    marginRight: 14,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.accent + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.card,
  },
  branchesPreview: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  branchesTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  branchLogos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  branchMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  branchMiniText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
    maxHeight: 450,
  },
  stepDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 16,
  },
  statesGrid: {
    gap: 8,
  },
  stateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
  },
  stateText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  selectedStateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  selectedStateText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  branchCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  branchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  branchIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  branchCity: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  branchDetails: {
    gap: 8,
    marginBottom: 12,
  },
  branchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchDetailText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.warning + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  backButtonText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  selectedBranchSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  summaryBranchName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryBranchCity: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  datesScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateOption: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  dateDay: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  dateDayActive: {
    color: COLORS.primary,
  },
  dateNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: 4,
  },
  dateNumberActive: {
    color: COLORS.primary,
  },
  dateMonth: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  dateMonthActive: {
    color: COLORS.primary,
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  timeOption: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  timeText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  timeTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.success,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.card,
  },
  confirmationContainer: {
    padding: 20,
    alignItems: 'center',
  },
  confirmationIcon: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
  },
  confirmationCard: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  confirmationCodeBox: {
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  confirmationCodeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  confirmationCode: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  confirmationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  confirmationDetailText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
  },
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  reminderText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.card,
  },
  // Estilos para mensaje de asignación pendiente
  pendingLocationBox: {
    backgroundColor: COLORS.warning + '10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  pendingLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  pendingLocationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warning,
    flex: 1,
  },
  pendingLocationText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  pendingLocationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
  },
  pendingLocationNoteText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});

export default AppointmentScheduler;
