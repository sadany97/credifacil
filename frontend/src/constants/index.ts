// Colores principales de CrediFácil - Verde y Azul
export const COLORS = {
  // Verde principal (del logo)
  primary: '#2E7D32',        // Verde oscuro principal
  primaryLight: '#4CAF50',   // Verde claro del logo
  primaryDark: '#1B5E20',    // Verde muy oscuro
  
  // Azul secundario (confianza)
  secondary: '#1976D2',      // Azul principal
  secondaryLight: '#42A5F5', // Azul claro
  secondaryDark: '#0D47A1',  // Azul oscuro
  
  // Estados
  success: '#4CAF50',        // Verde éxito
  warning: '#FF9800',        // Naranja advertencia
  danger: '#F44336',         // Rojo error/cancelado
  info: '#2196F3',           // Azul info
  
  // Fondos
  background: '#F5F7FA',     // Fondo general
  card: '#FFFFFF',           // Tarjetas
  cardAlt: '#E8F5E9',        // Tarjeta alternativa (verde suave)
  
  // Textos
  text: '#1A1A2E',           // Texto principal oscuro
  textLight: '#4A4A68',      // Texto secundario
  textMuted: '#9E9E9E',      // Texto deshabilitado
  textOnPrimary: '#FFFFFF',  // Texto sobre fondo verde
  
  // Bordes
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  
  // Gradientes
  gradientStart: '#2E7D32',
  gradientEnd: '#1B5E20',
  
  // Otros
  overlay: 'rgba(0, 0, 0, 0.5)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

// Información de la empresa
export const COMPANY_INFO = {
  name: 'CrediFácil',
  slogan: 'Al alcance de todos',
  tagline: 'Créditos fáciles y sin complicaciones',
  phone: '800-CREDIFACIL',
  phoneDisplay: '800-273-3432',
  email: 'contacto@credifacil.mx',
  website: 'www.credifacil.mx',
  whatsapp: '+52 55 8765 4321',
  
  // Credenciales y certificaciones
  certifications: [
    'Institución regulada por CONDUSEF',
    'Registro SIPRES vigente',
    'Certificado ISO 27001',
    'Miembro de ASOFOM',
  ],
  
  // Stats para mostrar
  stats: {
    clients: '+1,000,000',
    approvalRate: '95%',
    yearsInBusiness: '15+',
    branches: '500+',
  },
};

// Estatus de crédito disponibles
export const CREDIT_STATUS = {
  received: { id: 'received', label: 'Solicitud Recibida', icon: 'document-text', color: '#9E9E9E' },
  review: { id: 'review', label: 'En Revisión de Solicitud', icon: 'search', color: '#FF9800' },
  documentation_pending: { id: 'documentation_pending', label: 'Documentación Pendiente', icon: 'folder-open', color: '#FF9800' },
  approved: { id: 'approved', label: 'Aprobado', icon: 'checkmark-circle', color: '#4CAF50' },
  approved_guarantee: { id: 'approved_guarantee', label: 'Aprobado con Garantía', icon: 'shield-checkmark', color: '#8BC34A' },
  approved_monthly: { id: 'approved_monthly', label: 'Aprobado con Mensualidad', icon: 'calendar', color: '#8BC34A' },
  rejected: { id: 'rejected', label: 'Rechazado', icon: 'close-circle', color: '#F44336' },
  rejected_docs: { id: 'rejected_docs', label: 'Rechazado - Docs Incompletos', icon: 'document-attach', color: '#F44336' },
  disbursement: { id: 'disbursement', label: 'En Proceso de Desembolso', icon: 'cash', color: '#2196F3' },
  granted: { id: 'granted', label: 'Crédito Otorgado', icon: 'trophy', color: '#1B5E20' },
  cancelled: { id: 'cancelled', label: 'Cancelado', icon: 'ban', color: '#9E9E9E' },
};

// Razones de cancelación
export const CANCELLATION_REASONS = {
  client_request: { id: 'client_request', label: 'Solicitud del cliente', message: 'El trámite ha sido cancelado a solicitud del cliente.' },
  no_response: { id: 'no_response', label: 'Sin respuesta', message: 'El trámite ha sido cancelado por falta de respuesta.' },
  incomplete_docs: { id: 'incomplete_docs', label: 'Documentación incompleta', message: 'Trámite cancelado por documentación incompleta.' },
  invalid_info: { id: 'invalid_info', label: 'Información inválida', message: 'Trámite cancelado por información incorrecta.' },
  expired: { id: 'expired', label: 'Tiempo expirado', message: 'El trámite ha expirado. Inicia una nueva solicitud.' },
};

export default { COLORS, COMPANY_INFO, CREDIT_STATUS, CANCELLATION_REASONS };
