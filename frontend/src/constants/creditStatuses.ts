// CrediFácil - Estados específicos para créditos/préstamos
import { COLORS } from './colors';

export interface CreditStatus {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  isPositive: boolean;
}

// Estados de crédito para el dropdown del Admin
export const CREDIT_STATUSES: CreditStatus[] = [
  {
    id: 'solicitud_recibida',
    label: 'Solicitud Recibida',
    description: 'Tu solicitud ha sido recibida exitosamente',
    icon: 'document-text',
    color: COLORS.textMuted,
    isPositive: true,
  },
  {
    id: 'en_revision',
    label: 'En Revisión de Solicitud',
    description: 'Nuestro equipo está analizando tu solicitud',
    icon: 'search',
    color: COLORS.inReview,
    isPositive: true,
  },
  {
    id: 'documentacion_pendiente',
    label: 'Documentación Pendiente',
    description: 'Requerimos documentación adicional para continuar',
    icon: 'folder-open',
    color: COLORS.warning,
    isPositive: true,
  },
  {
    id: 'aprobado',
    label: 'Crédito Aprobado',
    description: '¡Felicidades! Tu crédito ha sido aprobado',
    icon: 'checkmark-circle',
    color: COLORS.approved,
    isPositive: true,
  },
  {
    id: 'aprobado_garantia',
    label: 'Aprobado con Garantía',
    description: 'Crédito aprobado sujeto a garantía',
    icon: 'shield-checkmark',
    color: COLORS.approved,
    isPositive: true,
  },
  {
    id: 'aprobado_mensualidad',
    label: 'Aprobado con Mensualidad',
    description: 'Crédito aprobado con plan de mensualidades',
    icon: 'calendar',
    color: COLORS.approved,
    isPositive: true,
  },
  {
    id: 'en_desembolso',
    label: 'En Proceso de Desembolso',
    description: 'Tu crédito está siendo procesado para depósito',
    icon: 'trending-up',
    color: COLORS.accent,
    isPositive: true,
  },
  {
    id: 'credito_otorgado',
    label: 'Crédito Otorgado',
    description: 'El monto ha sido depositado a tu cuenta',
    icon: 'cash',
    color: COLORS.success,
    isPositive: true,
  },
  {
    id: 'rechazado',
    label: 'Solicitud Rechazada',
    description: 'Tu solicitud no cumple con los requisitos',
    icon: 'close-circle',
    color: COLORS.rejected,
    isPositive: false,
  },
  {
    id: 'rechazado_documentacion',
    label: 'Rechazado - Documentación Incompleta',
    description: 'Documentación insuficiente o incorrecta',
    icon: 'alert-circle',
    color: COLORS.rejected,
    isPositive: false,
  },
  {
    id: 'cancelado_cliente',
    label: 'Cancelado por Cliente',
    description: 'El cliente ha cancelado su solicitud',
    icon: 'person-remove',
    color: COLORS.textMuted,
    isPositive: false,
  },
];

// Obtener estado por ID
export const getCreditStatusById = (id: string): CreditStatus | undefined => {
  return CREDIT_STATUSES.find(status => status.id === id);
};

// Estados positivos (para timeline)
export const POSITIVE_STATUSES = CREDIT_STATUSES.filter(s => s.isPositive);

// Estados de aprobación (para animación)
export const APPROVAL_STATUSES = ['aprobado', 'aprobado_garantia', 'aprobado_mensualidad', 'credito_otorgado'];

// Verificar si es estado de aprobación
export const isApprovalStatus = (statusId: string): boolean => {
  return APPROVAL_STATUSES.includes(statusId);
};

export default CREDIT_STATUSES;
