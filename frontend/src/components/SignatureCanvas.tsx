import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface SignatureCanvasProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();
  const [hasSignature, setHasSignature] = useState(false);

  const handleClear = () => {
    setHasSignature(false);
  };

  const handleSave = () => {
    // In a real implementation, we would capture the canvas data
    // For now, we'll simulate saving
    onSave('signature_data_base64');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Firma Digital</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.instructions, { color: colors.textMuted }]}>
            Dibuja tu firma en el área de abajo
          </Text>

          {/* Signature Area */}
          <View style={[styles.signatureArea, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <View style={styles.signaturePlaceholder}>
              <Ionicons name="create-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                Firma aquí
              </Text>
            </View>
            {/* In production, this would be a react-native-signature-canvas or similar */}
          </View>

          <View style={styles.signatureLine}>
            <View style={[styles.line, { backgroundColor: colors.text }]} />
            <Text style={[styles.signatureLabel, { color: colors.textMuted }]}>Firma del titular</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.clearBtn, { borderColor: colors.border }]}
              onPress={handleClear}
            >
              <Ionicons name="trash-outline" size={20} color={colors.textLight} />
              <Text style={[styles.actionBtnText, { color: colors.textLight }]}>Limpiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.saveBtn, { backgroundColor: colors.accent }]}
              onPress={handleSave}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Guardar Firma</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.disclaimer, { backgroundColor: colors.warning + '15' }]}>
            <Ionicons name="shield-checkmark" size={16} color={colors.warning} />
            <Text style={[styles.disclaimerText, { color: colors.textLight }]}>
              Tu firma será encriptada y almacenada de forma segura.
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  instructions: {
    fontSize: 14,
    marginBottom: 16,
  },
  signatureArea: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signaturePlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  signatureLine: {
    alignItems: 'center',
    marginBottom: 20,
  },
  line: {
    width: '80%',
    height: 1,
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  clearBtn: {
    borderWidth: 1,
  },
  saveBtn: {},
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});

export default SignatureCanvas;
