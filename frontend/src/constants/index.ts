// CrediFácil - Constantes exportadas
export { COLORS } from './colors';
export { AVAILABLE_BANKS, detectCardType, getBankConfig, BANK_CONFIGS } from './banks';
export type { BankConfig } from './banks';
export { TESTIMONIOS as TESTIMONIALS, generarTestimonios, obtenerTestimoniosFrescos, getRelativeDate, formatMonto } from './testimonials';
export type { Testimonio } from './testimonials';
export { CREDIT_STATUSES, getCreditStatusById, POSITIVE_STATUSES, APPROVAL_STATUSES, isApprovalStatus } from './creditStatuses';
export type { CreditStatus } from './creditStatuses';
