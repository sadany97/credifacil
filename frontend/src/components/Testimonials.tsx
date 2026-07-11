import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const TESTIMONIALS = [
  { name: 'Roberto M.', city: 'CDMX', amount: '$45,000', text: 'Proceso muy rápido, en 24 horas ya tenía el dinero.' },
  { name: 'María G.', city: 'Guadalajara', amount: '$80,000', text: 'Excelente servicio, muy profesionales.' },
  { name: 'Carlos L.', city: 'Monterrey', amount: '$120,000', text: 'La mejor tasa que encontré, 100% recomendado.' },
  { name: 'Ana P.', city: 'Puebla', amount: '$35,000', text: 'Sin tanto papeleo, todo desde la app.' },
  { name: 'Jorge S.', city: 'Querétaro', amount: '$200,000', text: 'Para mi negocio fue la mejor opción.' },
  { name: 'Laura V.', city: 'Tijuana', amount: '$65,000', text: 'Muy transparentes con los costos.' },
  { name: 'Miguel A.', city: 'León', amount: '$95,000', text: 'Ya es mi segundo crédito con ellos.' },
  { name: 'Patricia R.', city: 'Mérida', amount: '$150,000', text: 'Atención personalizada, me sentí muy segura.' },
  { name: 'Fernando H.', city: 'Cancún', amount: '$250,000', text: 'Crédito para inversión aprobado en 48 hrs.' },
  { name: 'Claudia T.', city: 'Toluca', amount: '$55,000', text: 'Fácil de usar y muy confiable.' },
  { name: 'Ricardo N.', city: 'Aguascalientes', amount: '$180,000', text: 'Tasas competitivas y sin sorpresas.' },
  { name: 'Sofía D.', city: 'San Luis Potosí', amount: '$70,000', text: 'El mejor servicio al cliente.' },
];

const getRandomDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const getNextTestimonial = () => {
    let available = TESTIMONIALS.map((_, i) => i).filter(i => !usedIndices.includes(i));
    
    if (available.length === 0) {
      setUsedIndices([]);
      available = TESTIMONIALS.map((_, i) => i);
    }
    
    const randomIdx = available[Math.floor(Math.random() * available.length)];
    setUsedIndices(prev => [...prev, randomIdx]);
    return randomIdx;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setCurrentIndex(getNextTestimonial());
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [usedIndices]);

  const testimonial = TESTIMONIALS[currentIndex];
  const date = getRandomDate();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map(i => (
            <Ionicons key={i} name="star" size={14} color="#FFD700" />
          ))}
        </View>
        <Text style={styles.date}>{date}</Text>
      </View>
      <Text style={styles.text}>"{testimonial.text}"</Text>
      <View style={styles.footer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{testimonial.name.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{testimonial.name}</Text>
          <Text style={styles.details}>{testimonial.city} · Crédito: {testimonial.amount}</Text>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 16, marginHorizontal: 20,
    marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  stars: { flexDirection: 'row', gap: 2 },
  date: { fontSize: 11, color: '#999' },
  text: { fontSize: 14, color: COLORS.text, fontStyle: 'italic', lineHeight: 20, marginBottom: 12 },
  footer: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  details: { fontSize: 11, color: '#666' },
});

export default Testimonials;
