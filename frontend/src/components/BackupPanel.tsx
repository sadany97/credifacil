import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../constants';
import { apiCall } from '../services/api';

interface BackupPanelProps {
  visible: boolean;
  onClose: () => void;
  token: string;
}

interface UserBackup {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_plain: string;
  available_balance: number;
  retained_balance: number;
  bank_name: string;
}

export const BackupPanel: React.FC<BackupPanelProps> = ({
  visible,
  onClose,
  token,
}) => {
  const [users, setUsers] = useState<UserBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [totals, setTotals] = useState({
    totalUsers: 0,
    totalAvailable: 0,
    totalRetained: 0,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/admin/users', 'GET', null, token);
      const formattedUsers: UserBackup[] = data.map((u: any) => ({
        id: u.id,
        name: u.name || 'Sin nombre',
        email: u.email,
        phone: u.phone || 'N/A',
        password_plain: u.password_plain || '***',
        available_balance: u.profile?.available_balance || 0,
        retained_balance: u.profile?.retained_balance || 0,
        bank_name: u.profile?.bank_name || 'N/A',
      }));
      
      setUsers(formattedUsers);
      
      // Calcular totales
      const totalAvailable = formattedUsers.reduce((acc, u) => acc + u.available_balance, 0);
      const totalRetained = formattedUsers.reduce((acc, u) => acc + u.retained_balance, 0);
      
      setTotals({
        totalUsers: formattedUsers.length,
        totalAvailable,
        totalRetained,
      });
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible]);

  const formatCurrency = (value: number) => {
    return '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 2 });
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Crear CSV manualmente con los datos actuales
      const headers = 'Nombre,Email,Teléfono,Contraseña,Crédito Disponible,Saldo Retenido,Banco\n';
      const rows = users.map(u => 
        `"${u.name}","${u.email}","${u.phone}","${u.password_plain}",${u.available_balance},${u.retained_balance},"${u.bank_name}"`
      ).join('\n');
      
      const csvContent = headers + rows;
      const filename = `respaldo_clientes_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Guardar Respaldo CSV',
        });
      }
      
      Alert.alert('Éxito', 'Respaldo CSV generado correctamente');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo generar el respaldo');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const backupData = {
        fecha_respaldo: new Date().toISOString(),
        total_usuarios: totals.totalUsers,
        total_saldo_disponible: totals.totalAvailable,
        total_saldo_retenido: totals.totalRetained,
        usuarios: users,
      };
      
      const jsonContent = JSON.stringify(backupData, null, 2);
      const filename = `respaldo_completo_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Guardar Respaldo JSON',
        });
      }
      
      Alert.alert('Éxito', 'Respaldo JSON generado correctamente');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo generar el respaldo');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
              <Text style={styles.title}>Respaldo de Clientes</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Resumen de Totales */}
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.summaryValue}>{totals.totalUsers}</Text>
              <Text style={styles.summaryLabel}>Clientes</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                {formatCurrency(totals.totalAvailable)}
              </Text>
              <Text style={styles.summaryLabel}>Disponible</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="time" size={24} color={COLORS.warning} />
              <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
                {formatCurrency(totals.totalRetained)}
              </Text>
              <Text style={styles.summaryLabel}>Retenido</Text>
            </View>
          </View>

          {/* Botones de Exportación */}
          <View style={styles.exportButtons}>
            <TouchableOpacity 
              style={[styles.exportBtn, { backgroundColor: '#1B5E20' }]}
              onPress={handleExportCSV}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="document-text" size={20} color="white" />
                  <Text style={styles.exportBtnText}>Descargar CSV</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.exportBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleExportJSON}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="code-download" size={20} color="white" />
                  <Text style={styles.exportBtnText}>Descargar JSON</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Lista de Clientes */}
          <Text style={styles.listTitle}>Lista Completa de Clientes y Saldos</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
              {users.map((user, index) => (
                <View key={user.id} style={styles.userRow}>
                  <View style={styles.userIndex}>
                    <Text style={styles.indexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                    <View style={styles.userDetails}>
                      <Text style={styles.userPhone}>Tel: {user.phone}</Text>
                      <Text style={styles.userBank}>{user.bank_name}</Text>
                    </View>
                  </View>
                  <View style={styles.userBalances}>
                    <View style={styles.balanceRow}>
                      <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                      <Text style={[styles.balanceText, { color: COLORS.success }]}>
                        {formatCurrency(user.available_balance)}
                      </Text>
                    </View>
                    <View style={styles.balanceRow}>
                      <Ionicons name="time" size={12} color={COLORS.warning} />
                      <Text style={[styles.balanceText, { color: COLORS.warning }]}>
                        {formatCurrency(user.retained_balance)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              
              {/* Fila de Totales */}
              <View style={[styles.userRow, styles.totalRow]}>
                <View style={styles.userIndex}>
                  <Ionicons name="calculator" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: COLORS.primary, fontWeight: '800' }]}>
                    TOTAL GENERAL
                  </Text>
                  <Text style={styles.userEmail}>{totals.totalUsers} clientes registrados</Text>
                </View>
                <View style={styles.userBalances}>
                  <View style={styles.balanceRow}>
                    <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                    <Text style={[styles.balanceText, { color: COLORS.success, fontWeight: '800' }]}>
                      {formatCurrency(totals.totalAvailable)}
                    </Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Ionicons name="time" size={12} color={COLORS.warning} />
                    <Text style={[styles.balanceText, { color: COLORS.warning, fontWeight: '800' }]}>
                      {formatCurrency(totals.totalRetained)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* Nota de seguridad */}
          <View style={styles.securityNote}>
            <Ionicons name="information-circle" size={16} color={COLORS.accent} />
            <Text style={styles.securityNoteText}>
              Guarda este respaldo en un lugar seguro. Recomendamos hacer respaldos semanales.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  summarySection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  exportButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  exportBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  userList: {
    maxHeight: 350,
    paddingHorizontal: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  totalRow: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userIndex: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  userDetails: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  userPhone: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  userBank: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '600',
  },
  userBalances: {
    alignItems: 'flex-end',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '15',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.accent,
  },
});
