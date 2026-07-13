import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { COLORS } from '../src/constants';
import { ProfessionalLogo } from '../src/components';
import { LoginScreen, UserDashboard, AdminDashboard } from '../src/screens';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Mostrar loading mientras se cargan credenciales guardadas
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ProfessionalLogo size="large" />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  // Sin usuario = mostrar login
  if (!user) {
    return <LoginScreen />;
  }

  // Usuario autenticado - mostrar dashboard según rol
  if (user.role === 'admin' || user.role === 'sub-admin' || user.role === 'sub_admin') {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <AppContent />
      </View>
    </AuthProvider>
  );
}

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
});
