import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../constants';

interface ContractGeneratorProps {
  visible: boolean;
  onClose: () => void;
  clientName?: string;
  clientEmail?: string;
}

export const ContractGenerator: React.FC<ContractGeneratorProps> = ({
  visible,
  onClose,
  clientName = '',
  clientEmail = '',
}) => {
  const [name, setName] = useState(clientName);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contractGenerated, setContractGenerated] = useState(false);

  const currentDate = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const contractNumber = `RCF-${Date.now().toString().slice(-8)}`;
  const websiteUrl = 'https://recuperacioncapital.com';
  
  // QR Code as SVG data URL for the PDF
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(websiteUrl)}`;

  const generateContractHTML = () => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @page {
          size: letter;
          margin: 0.75in;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1a1a2e;
          background: #fff;
        }
        .page {
          page-break-after: always;
          min-height: 100vh;
          padding: 20px 0;
        }
        .page:last-child {
          page-break-after: avoid;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #0d2137;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 15px;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #0d2137 0%, #1a5276 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d4af37;
          font-size: 28px;
          font-weight: bold;
        }
        .company-name {
          font-size: 24pt;
          font-weight: 800;
          color: #0d2137;
          letter-spacing: 1px;
          margin-top: 10px;
        }
        .company-subtitle {
          font-size: 10pt;
          color: #666;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 5px;
        }
        .contract-title {
          font-size: 18pt;
          font-weight: 700;
          color: #0d2137;
          text-align: center;
          margin: 30px 0 20px;
          padding: 15px;
          background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%);
          border-left: 4px solid #d4af37;
          border-right: 4px solid #d4af37;
        }
        .contract-number {
          text-align: center;
          font-size: 10pt;
          color: #666;
          margin-bottom: 30px;
        }
        .contract-number span {
          background: #0d2137;
          color: #fff;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: 600;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 13pt;
          font-weight: 700;
          color: #0d2137;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #d4af37;
          display: flex;
          align-items: center;
        }
        .section-number {
          background: #0d2137;
          color: #d4af37;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          font-size: 12pt;
        }
        .section-content {
          text-align: justify;
          padding-left: 38px;
        }
        .parties-box {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
        .party {
          margin-bottom: 15px;
        }
        .party:last-child {
          margin-bottom: 0;
        }
        .party-label {
          font-weight: 700;
          color: #0d2137;
          font-size: 10pt;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .party-name {
          font-size: 14pt;
          font-weight: 600;
          color: #1a5276;
          margin-top: 5px;
        }
        .client-name {
          font-size: 16pt;
          font-weight: 700;
          color: #0d2137;
          border-bottom: 2px solid #d4af37;
          padding-bottom: 5px;
          display: inline-block;
        }
        .clause {
          margin-bottom: 15px;
          padding-left: 20px;
          position: relative;
        }
        .clause::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #d4af37;
          font-weight: bold;
        }
        .highlight-box {
          background: linear-gradient(135deg, #0d2137 0%, #1a5276 100%);
          color: #fff;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        .highlight-box h4 {
          color: #d4af37;
          margin-bottom: 10px;
          font-size: 12pt;
        }
        .important-note {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .important-note-title {
          font-weight: 700;
          color: #856404;
          margin-bottom: 8px;
        }
        .signature-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          width: 45%;
          text-align: center;
        }
        .signature-line {
          border-top: 2px solid #0d2137;
          margin-top: 60px;
          padding-top: 10px;
        }
        .signature-label {
          font-size: 10pt;
          color: #666;
        }
        .signature-name {
          font-weight: 600;
          color: #0d2137;
          margin-top: 5px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          text-align: center;
        }
        .qr-section {
          text-align: center;
          margin: 30px 0;
        }
        .qr-code {
          margin: 15px auto;
        }
        .qr-label {
          font-size: 9pt;
          color: #666;
          margin-top: 10px;
        }
        .page-number {
          text-align: center;
          font-size: 9pt;
          color: #999;
          margin-top: 30px;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80pt;
          color: rgba(13, 33, 55, 0.03);
          font-weight: 900;
          z-index: -1;
          white-space: nowrap;
        }
        .terms-list {
          counter-reset: terms;
          list-style: none;
          padding-left: 0;
        }
        .terms-list li {
          counter-increment: terms;
          margin-bottom: 12px;
          padding-left: 35px;
          position: relative;
        }
        .terms-list li::before {
          content: counter(terms) ".";
          position: absolute;
          left: 0;
          font-weight: 700;
          color: #1a5276;
        }
        .date-location {
          text-align: right;
          font-style: italic;
          color: #666;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #dee2e6;
          padding: 10px;
          text-align: left;
        }
        th {
          background: #0d2137;
          color: #fff;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background: #f8f9fa;
        }
      </style>
    </head>
    <body>
      <div class="watermark">RCF</div>
      
      <!-- PÁGINA 1: Portada y Datos Generales -->
      <div class="page">
        <div class="header">
          <div class="logo-container">
            <div class="logo">RCF</div>
          </div>
          <div class="company-name">CrediFácil Financiero</div>
          <div class="company-subtitle">S.A. de C.V. • Servicios Financieros Especializados</div>
        </div>

        <div class="contract-title">
          CONTRATO DE PRESTACIÓN DE SERVICIOS<br/>
          <span style="font-size: 12pt; font-weight: 400;">DE RECUPERACIÓN DE CAPITAL</span>
        </div>

        <div class="contract-number">
          Número de Contrato: <span>${contractNumber}</span>
        </div>

        <div class="date-location">
          Ciudad de México, a ${currentDate}
        </div>

        <div class="parties-box">
          <div class="party">
            <div class="party-label">El Prestador de Servicios:</div>
            <div class="party-name">CrediFácil Financiero, S.A. de C.V.</div>
            <div style="font-size: 10pt; color: #666; margin-top: 5px;">
              En adelante "LA EMPRESA" o "RCF"
            </div>
          </div>
          <div class="party">
            <div class="party-label">El Cliente:</div>
            <div class="client-name">${name || '[NOMBRE DEL CLIENTE]'}</div>
            <div style="font-size: 10pt; color: #666; margin-top: 5px;">
              En adelante "EL CLIENTE"
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-number">1</span>
            DECLARACIONES
          </div>
          <div class="section-content">
            <p><strong>I. Declara LA EMPRESA que:</strong></p>
            <div class="clause">Es una sociedad legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos, dedicada a la prestación de servicios de asesoría, gestión y crédito de activos financieros.</div>
            <div class="clause">Cuenta con la infraestructura, personal capacitado y recursos necesarios para la prestación de los servicios objeto del presente contrato.</div>
            <div class="clause">Tiene su domicilio fiscal en Ciudad de México, México.</div>
            
            <p style="margin-top: 15px;"><strong>II. Declara EL CLIENTE que:</strong></p>
            <div class="clause">Es una persona física mayor de edad, en pleno uso de sus facultades mentales y con capacidad legal para obligarse en los términos del presente contrato.</div>
            <div class="clause">Tiene interés en contratar los servicios de LA EMPRESA para la crédito y/o gestión de sus activos financieros.</div>
            <div class="clause">La información proporcionada a LA EMPRESA es verídica y se compromete a mantenerla actualizada.</div>
          </div>
        </div>

        <div class="page-number">Página 1 de 4</div>
      </div>

      <!-- PÁGINA 2: Objeto y Servicios -->
      <div class="page">
        <div class="header" style="padding-bottom: 15px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 14pt; font-weight: 700; color: #0d2137;">CrediFácil Financiero</div>
            <div style="font-size: 10pt; color: #666;">Contrato: ${contractNumber}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-number">2</span>
            OBJETO DEL CONTRATO
          </div>
          <div class="section-content">
            <p>Por medio del presente contrato, LA EMPRESA se obliga a prestar a EL CLIENTE los siguientes servicios profesionales de crédito de capital:</p>
            
            <table>
              <tr>
                <th>Servicio</th>
                <th>Descripción</th>
              </tr>
              <tr>
                <td><strong>Análisis de Caso</strong></td>
                <td>Evaluación detallada de la situación financiera y viabilidad de crédito</td>
              </tr>
              <tr>
                <td><strong>Gestión Activa</strong></td>
                <td>Negociación y seguimiento con instituciones financieras involucradas</td>
              </tr>
              <tr>
                <td><strong>Asesoría Legal</strong></td>
                <td>Orientación sobre procedimientos y derechos del cliente</td>
              </tr>
              <tr>
                <td><strong>Crédito</strong></td>
                <td>Gestión de la transferencia de fondos recuperados</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-number">3</span>
            OBLIGACIONES DE LAS PARTES
          </div>
          <div class="section-content">
            <p><strong>A) Son obligaciones de LA EMPRESA:</strong></p>
            <ol class="terms-list">
              <li>Realizar las gestiones necesarias para la crédito del capital de EL CLIENTE con la diligencia debida.</li>
              <li>Mantener informado a EL CLIENTE sobre el avance de su caso mediante los canales de comunicación establecidos.</li>
              <li>Proteger la confidencialidad de la información proporcionada por EL CLIENTE.</li>
              <li>Actuar de buena fe y en el mejor interés de EL CLIENTE dentro del marco legal aplicable.</li>
              <li>Proporcionar comprobantes de las operaciones realizadas cuando EL CLIENTE lo solicite.</li>
            </ol>
            
            <p style="margin-top: 20px;"><strong>B) Son obligaciones de EL CLIENTE:</strong></p>
            <ol class="terms-list">
              <li>Proporcionar información veraz y documentación necesaria para la gestión de su caso.</li>
              <li>Atender oportunamente los requerimientos de información o documentación adicional.</li>
              <li>Cumplir con los pagos y comisiones acordadas en tiempo y forma.</li>
              <li>Mantener actualizados sus datos de contacto.</li>
              <li>No realizar gestiones paralelas que puedan interferir con el proceso de crédito.</li>
            </ol>
          </div>
        </div>

        <div class="page-number">Página 2 de 4</div>
      </div>

      <!-- PÁGINA 3: Términos, Comisiones y Condiciones -->
      <div class="page">
        <div class="header" style="padding-bottom: 15px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 14pt; font-weight: 700; color: #0d2137;">CrediFácil Financiero</div>
            <div style="font-size: 10pt; color: #666;">Contrato: ${contractNumber}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-number">4</span>
            COMISIONES Y FORMA DE PAGO
          </div>
          <div class="section-content">
            <div class="highlight-box">
              <h4>AVISO IMPORTANTE SOBRE COMISIONES</h4>
              <p>Las comisiones por los servicios prestados están sujetas a cambio sin previo aviso, de acuerdo con las políticas vigentes de LA EMPRESA y las condiciones específicas de cada caso.</p>
            </div>
            <p>EL CLIENTE acepta que:</p>
            <ol class="terms-list">
              <li>Los honorarios serán determinados con base en la complejidad del caso y el monto a recuperar.</li>
              <li>Podrán existir gastos administrativos y operativos adicionales según el proceso requerido.</li>
              <li>El pago de comisiones no garantiza un resultado específico, ya que este depende de múltiples factores externos.</li>
              <li>LA EMPRESA se reserva el derecho de modificar las tarifas aplicables con la debida notificación.</li>
            </ol>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-number">5</span>
            VIGENCIA Y TERMINACIÓN
          </div>
          <div class="section-content">
            <p>El presente contrato entrará en vigor a partir de la fecha de su firma y tendrá una duración indefinida, pudiendo ser terminado por cualquiera de las partes mediante notificación por escrito con al menos 15 días naturales de anticipación.</p>
            
            <div class="important-note">
              <div class="important-note-title">⚠️ Causales de Terminación Anticipada:</div>
              <ul style="margin-left: 20px;">
                <li>Incumplimiento de las obligaciones por cualquiera de las partes</li>
                <li>Proporcionar información falsa o incompleta</li>
                <li>Realizar gestiones que interfieran con el proceso de crédito</li>
                <li>Mutuo acuerdo entre las partes</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-number">6</span>
            CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS
          </div>
          <div class="section-content">
            <p>LA EMPRESA se compromete a:</p>
            <ol class="terms-list">
              <li>Mantener estricta confidencialidad sobre toda la información proporcionada por EL CLIENTE.</li>
              <li>Utilizar los datos personales únicamente para los fines establecidos en este contrato y en el Aviso de Privacidad.</li>
              <li>Implementar medidas de seguridad para proteger la información contra acceso no autorizado.</li>
              <li>No compartir información con terceros sin el consentimiento expreso de EL CLIENTE, salvo requerimiento legal.</li>
            </ol>
          </div>
        </div>

        <div class="page-number">Página 3 de 4</div>
      </div>

      <!-- PÁGINA 4: Firmas y Código QR -->
      <div class="page">
        <div class="header" style="padding-bottom: 15px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 14pt; font-weight: 700; color: #0d2137;">CrediFácil Financiero</div>
            <div style="font-size: 10pt; color: #666;">Contrato: ${contractNumber}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-number">7</span>
            JURISDICCIÓN Y LEGISLACIÓN APLICABLE
          </div>
          <div class="section-content">
            <p>Para la interpretación y cumplimiento del presente contrato, las partes se someten expresamente a la jurisdicción de los Tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.</p>
            <p style="margin-top: 10px;">Este contrato se regirá e interpretará de conformidad con las leyes de los Estados Unidos Mexicanos.</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-number">8</span>
            ACEPTACIÓN
          </div>
          <div class="section-content">
            <p>Al firmar el presente contrato, EL CLIENTE manifiesta:</p>
            <ol class="terms-list">
              <li>Haber leído y comprendido en su totalidad el contenido de este documento.</li>
              <li>Estar de acuerdo con todos los términos y condiciones aquí establecidos.</li>
              <li>Haber recibido información clara sobre los servicios contratados.</li>
              <li>Conocer y aceptar el Aviso de Privacidad de LA EMPRESA.</li>
            </ol>
          </div>
        </div>

        <div class="highlight-box" style="text-align: center;">
          <p style="margin: 0; font-size: 11pt;">
            Leído que fue el presente contrato y enteradas las partes de su contenido y alcance legal, lo firman por duplicado en la Ciudad de México, a ${currentDate}.
          </p>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-label">Por LA EMPRESA</div>
              <div class="signature-name">CrediFácil Financiero, S.A. de C.V.</div>
              <div style="font-size: 9pt; color: #666; margin-top: 5px;">Representante Legal</div>
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-label">EL CLIENTE</div>
              <div class="signature-name">${name || '[NOMBRE DEL CLIENTE]'}</div>
              <div style="font-size: 9pt; color: #666; margin-top: 5px;">Firma de conformidad</div>
            </div>
          </div>
        </div>

        <div class="qr-section">
          <p style="font-size: 10pt; color: #666; margin-bottom: 10px;">Escanea el código QR para acceder a nuestro sitio web oficial:</p>
          <img src="${qrCodeUrl}" class="qr-code" alt="QR Code" style="width: 120px; height: 120px;" />
          <div class="qr-label">www.recuperacioncapital.com</div>
        </div>

        <div class="footer">
          <p style="font-size: 9pt; color: #666;">
            <strong>CrediFácil Financiero, S.A. de C.V.</strong><br/>
            Documento generado electrónicamente • ${currentDate}<br/>
            Este documento tiene validez legal conforme a las disposiciones aplicables.
          </p>
        </div>

        <div class="page-number">Página 4 de 4</div>
      </div>
    </body>
    </html>
    `;
  };

  const handleGeneratePDF = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del cliente');
      return;
    }

    setIsGenerating(true);

    try {
      const html = generateContractHTML();
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      setIsGenerating(false);
      setContractGenerated(true);

      // Ask if user wants to share/download
      Alert.alert(
        'Contrato Generado',
        '¿Deseas descargar o compartir el contrato PDF?',
        [
          {
            text: 'Cerrar',
            style: 'cancel',
          },
          {
            text: 'Descargar/Compartir',
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: `Contrato_${name.replace(/\s+/g, '_')}_${contractNumber}.pdf`,
                  UTI: 'com.adobe.pdf',
                });
              } else {
                Alert.alert('Info', 'El archivo se guardó correctamente');
              }
            },
          },
        ]
      );
    } catch (error) {
      setIsGenerating(false);
      Alert.alert('Error', 'No se pudo generar el contrato. Intenta de nuevo.');
      console.error('PDF generation error:', error);
    }
  };

  const handleClose = () => {
    setName(clientName);
    setContractGenerated(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.contractIcon}>
                <Ionicons name="document-text" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>Generar Contrato</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.modalClose}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.accent} />
              <Text style={styles.infoText}>
                Genera un contrato profesional de prestación de servicios. Solo necesitas ingresar el nombre del cliente.
              </Text>
            </View>

            <Text style={styles.inputLabel}>Nombre completo del cliente *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ingresa el nombre del cliente"
              value={name}
              onChangeText={setName}
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>Vista Previa del Contrato</Text>
              <View style={styles.previewContent}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>No. Contrato:</Text>
                  <Text style={styles.previewValue}>{contractNumber}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Cliente:</Text>
                  <Text style={styles.previewValueHighlight}>
                    {name || '[Sin especificar]'}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Fecha:</Text>
                  <Text style={styles.previewValue}>{currentDate}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Páginas:</Text>
                  <Text style={styles.previewValue}>4 páginas</Text>
                </View>
              </View>
            </View>

            <View style={styles.featuresBox}>
              <Text style={styles.featuresTitle}>El contrato incluye:</Text>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.featureText}>Datos de las partes contratantes</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.featureText}>Descripción de servicios</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.featureText}>Obligaciones de las partes</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.featureText}>Términos y condiciones</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.featureText}>Sección de firmas</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.featureText}>Código QR del sitio web</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
              onPress={handleGeneratePDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color={COLORS.card} size="small" />
                  <Text style={styles.buttonText}>Generando PDF...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="download" size={22} color={COLORS.card} />
                  <Text style={styles.buttonText}>Generar y Descargar PDF</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  modalHeader: {
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
    gap: 12,
  },
  contractIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.accent + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  previewBox: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  previewContent: {
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  previewValueHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  featuresBox: {
    backgroundColor: COLORS.success + '10',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 10,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 17,
    fontWeight: '700',
  },
});

export default ContractGenerator;
