import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { COLORS } from '../src/constants';
import { ProfessionalLogo } from '../src/components';
import { LoginScreen, UserDashboard, AdminDashboard } from '../src/screens';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setInitializing(false);
  }, []);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ProfessionalLogo size="large" />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

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
