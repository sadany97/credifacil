// Testimonios dinámicos de créditos aprobados para CrediFácil
// Se actualizan automáticamente con fechas relativas y NUNCA se repiten

const NOMBRES_HOMBRES = [
  'José Luis', 'Carlos Alberto', 'Miguel Ángel', 'Juan Carlos', 'Francisco Javier',
  'Roberto Carlos', 'Eduardo Antonio', 'Luis Fernando', 'Jorge Alberto', 'Ricardo',
  'Alejandro', 'Fernando', 'Héctor', 'Raúl', 'Sergio', 'Manuel', 'Arturo', 'Óscar',
  'Guillermo', 'Rafael', 'Adrián', 'Víctor', 'Enrique', 'Alfredo', 'Andrés',
  'Pablo', 'Gerardo', 'Javier', 'Antonio', 'Ramón', 'Jesús', 'David', 'Mario',
];

const NOMBRES_MUJERES = [
  'María Guadalupe', 'Ana Patricia', 'Rosa María', 'Martha Elena', 'Patricia',
  'Gabriela', 'Laura Elena', 'Claudia', 'Verónica', 'Mónica', 'Leticia', 'Sandra',
  'Alejandra', 'Adriana', 'Silvia', 'Teresa', 'Carmen', 'Lucía', 'Elena', 'Diana',
  'Karla', 'Daniela', 'Fernanda', 'Paola', 'Mariana', 'Sofía', 'Valeria', 'Regina',
  'Andrea', 'Isabel', 'Rocío', 'Beatriz', 'Norma', 'Gloria', 'Yolanda',
];

const APELLIDOS = [
  'García', 'Hernández', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez',
  'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz',
  'Morales', 'Reyes', 'Gutiérrez', 'Ortiz', 'Ramos', 'Castillo', 'Mendoza',
  'Jiménez', 'Ruiz', 'Vázquez', 'Romero', 'Herrera', 'Medina', 'Aguilar', 'Vargas',
  'Chávez', 'Castro', 'Molina', 'Delgado', 'Guerrero', 'Cortés', 'Silva', 'Luna',
];

const CIUDADES = [
  'Ciudad de México', 'Guadalajara, Jal.', 'Monterrey, N.L.',
  'Puebla, Pue.', 'Tijuana, B.C.', 'León, Gto.',
  'Mérida, Yuc.', 'Querétaro, Qro.', 'Cancún, Q.Roo',
  'Aguascalientes, Ags.', 'Chihuahua, Chih.', 'Hermosillo, Son.',
  'Saltillo, Coah.', 'Morelia, Mich.', 'Toluca, Edo. Méx.',
  'Veracruz, Ver.', 'Oaxaca, Oax.', 'Villahermosa, Tab.',
  'Tuxtla Gutiérrez, Chis.', 'Culiacán, Sin.', 'Mazatlán, Sin.',
  'San Luis Potosí, S.L.P.', 'Tampico, Tamps.', 'Reynosa, Tamps.',
  'Cuernavaca, Mor.', 'Pachuca, Hgo.', 'Durango, Dgo.',
  'Zacatecas, Zac.', 'Colima, Col.', 'La Paz, B.C.S.',
  'Acapulco, Gro.', 'Irapuato, Gto.', 'Celaya, Gto.',
];

const PROPOSITOS = [
  'para mi negocio de abarrotes',
  'para remodelación de mi casa',
  'para gastos médicos urgentes',
  'para comprar un auto',
  'para pagar mis deudas',
  'para la educación de mis hijos',
  'para invertir en mi empresa',
  'para comprar maquinaria',
  'para ampliar mi local comercial',
  'para gastos personales',
  'para una emergencia familiar',
  'para iniciar mi propio negocio',
  'para capital de trabajo',
  'para surtir mi inventario',
  'para consolidar mis deudas',
  'para mi taller mecánico',
  'para mi salón de belleza',
  'para comprar mercancía',
  'para mi restaurante',
  'para mejoras en mi hogar',
];

const TESTIMONIOS_FRASES = [
  '¡Excelente servicio! Me aprobaron en menos de 24 horas.',
  'Muy rápidos y profesionales. Lo recomiendo al 100%.',
  'Sin tanto papeleo, todo fue muy sencillo.',
  'Me ayudaron cuando más lo necesitaba. ¡Gracias CrediFácil!',
  'El proceso fue muy fácil y transparente.',
  'Increíble, pensé que no me aprobarían pero sí lo lograron.',
  'Atención de primera, siempre me mantuvieron informado.',
  'Ya es la tercera vez que solicito con ellos, excelente.',
  'Muy agradecido con todo el equipo de CrediFácil.',
  'Sin revisar buró, eso fue lo mejor.',
  'Tasas mucho mejores que en el banco.',
  'Me depositaron el mismo día de la aprobación.',
  'Proceso 100% en línea, muy práctico.',
  'Los ejecutivos son muy amables y profesionales.',
  'Cumplieron con todo lo que prometieron.',
  'Fácil, rápido y sin complicaciones.',
  'La mejor decisión que pude tomar.',
  'Gracias por confiar en mí cuando otros no lo hicieron.',
  'El trámite más sencillo que he hecho en mi vida.',
  'Super recomendados, muy confiables.',
  'Me salvaron de una emergencia, eternamente agradecido.',
  'Nunca pensé que fuera tan fácil obtener un crédito.',
  'Excelente trato, me explicaron todo con paciencia.',
  'Los recomiendo ampliamente a toda mi familia.',
  '¡Gracias por hacerlo tan fácil!',
];

export const getRelativeDate = (daysAgo: number): string => {
  if (daysAgo === 0) return 'Hoy';
  if (daysAgo === 1) return 'Ayer';
  if (daysAgo === 2) return 'Antier';
  if (daysAgo <= 7) return `Hace ${daysAgo} días`;
  if (daysAgo <= 10) return `Hace ${daysAgo} días`;
  return `Hace ${Math.floor(daysAgo / 7)} semana${daysAgo >= 14 ? 's' : ''}`;
};

const generarMonto = (seed: number): number => {
  const rangos = [
    { min: 5000, max: 15000, peso: 12 },
    { min: 15000, max: 30000, peso: 18 },
    { min: 30000, max: 50000, peso: 20 },
    { min: 50000, max: 100000, peso: 18 },
    { min: 100000, max: 200000, peso: 12 },
    { min: 200000, max: 500000, peso: 10 },
    { min: 500000, max: 1000000, peso: 6 },
    { min: 1000000, max: 1500000, peso: 4 },
  ];
  
  const totalPeso = rangos.reduce((sum, r) => sum + r.peso, 0);
  let random = ((seed * 9301 + 49297) % 233280) / 233280 * totalPeso;
  
  for (const rango of rangos) {
    random -= rango.peso;
    if (random <= 0) {
      const range = rango.max - rango.min;
      const monto = rango.min + Math.floor(((seed * 7919 + 104729) % 233280) / 233280 * range);
      return Math.round(monto / 1000) * 1000;
    }
  }
  return 25000;
};

export const formatMonto = (monto: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto);
};

export interface Testimonio {
  id: string;
  nombre: string;
  ciudad: string;
  monto: number;
  montoFormateado: string;
  proposito: string;
  testimonio: string;
  fechaRelativa: string;
  diasAtras: number;
  verificado: boolean;
  estrellas: number;
}

// Generar testimonios únicos basados en la fecha actual
export const generarTestimonios = (cantidad: number = 35): Testimonio[] => {
  const hoy = new Date();
  const baseSeed = hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) * 100 + hoy.getDate();
  const hora = hoy.getHours();
  
  const testimonios: Testimonio[] = [];
  const nombresUsados = new Set<string>();
  
  for (let i = 0; i < cantidad; i++) {
    const seed = baseSeed + i * 1337 + hora;
    
    // Generar nombre único
    let nombre = '';
    let intentos = 0;
    while (intentos < 50) {
      const esHombre = (seed + intentos) % 2 === 0;
      const nombres = esHombre ? NOMBRES_HOMBRES : NOMBRES_MUJERES;
      const nombreIdx = (seed + intentos * 3) % nombres.length;
      const apellido1Idx = (seed + intentos * 7) % APELLIDOS.length;
      const apellido2Idx = (seed + intentos * 11) % APELLIDOS.length;
      
      nombre = `${nombres[nombreIdx]} ${APELLIDOS[apellido1Idx]} ${APELLIDOS[apellido2Idx]}`;
      
      if (!nombresUsados.has(nombre)) {
        nombresUsados.add(nombre);
        break;
      }
      intentos++;
    }
    
    const ciudadIdx = (seed * 13) % CIUDADES.length;
    const propositoIdx = (seed * 17) % PROPOSITOS.length;
    const fraseIdx = (seed * 19) % TESTIMONIOS_FRASES.length;
    const diasAtras = Math.min(Math.floor(i / 3.5), 10);
    const monto = generarMonto(seed);
    
    testimonios.push({
      id: `testimonio-${baseSeed}-${i}`,
      nombre,
      ciudad: CIUDADES[ciudadIdx],
      monto,
      montoFormateado: formatMonto(monto),
      proposito: PROPOSITOS[propositoIdx],
      testimonio: TESTIMONIOS_FRASES[fraseIdx],
      fechaRelativa: getRelativeDate(diasAtras),
      diasAtras,
      verificado: true,
      estrellas: (seed % 10) < 9 ? 5 : 4,
    });
  }
  
  // Mezclar testimonios con seed para consistencia durante el día
  return testimonios.sort((a, b) => {
    const hashA = a.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hashB = b.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return (hashA % 100) - (hashB % 100);
  });
};

export const TESTIMONIOS = generarTestimonios(35);

export const obtenerTestimoniosFrescos = (): Testimonio[] => generarTestimonios(35);

export default { TESTIMONIOS, generarTestimonios, obtenerTestimoniosFrescos, getRelativeDate, formatMonto };
