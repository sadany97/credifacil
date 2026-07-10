# CrediFácil - App de Créditos

> **Al alcance de todos** - Créditos fáciles, rápidos y seguros

## 🚀 Cómo Generar el APK

### Opción 1: GitHub Actions (Recomendado)

1. Ve a tu repositorio: https://github.com/sadany97/credifacil
2. Click en **"Actions"** (pestaña superior)
3. Click en **"Build Android APK"** (sidebar izquierdo)
4. Click en **"Run workflow"** (botón verde)
5. Espera ~15-20 minutos
6. Descarga el APK desde **"Artifacts"**

### Opción 2: EAS Build

```bash
cd frontend
npx eas build --platform android --profile preview
```

## 🔐 Credenciales

### Admin
- **Email:** admin@credifacil.com
- **Password:** admin123

## 📱 Características

### Para el Usuario
- ✅ Solicitud de crédito 100% digital
- ✅ Verificación de identidad con INE
- ✅ Biometría (huella/rostro)
- ✅ Seguimiento del estado del crédito
- ✅ Animaciones de aprobación
- ✅ WhatsApp integrado

### Para el Admin
- ✅ Panel completo de gestión
- ✅ 11 estados de crédito diferentes
- ✅ Activar animación de aprobación
- ✅ Retención condicional
- ✅ Generador de contratos PDF
- ✅ Comprobante SPEI
- ✅ Ver documentos de identidad
- ✅ Respaldo de clientes
- ✅ Exportar a Excel

## 🎨 Colores

- **Verde principal:** #1B5E20
- **Verde secundario:** #4CAF50
- **Azul confianza:** #1976D2

## 📊 Estados de Crédito

1. Solicitud Recibida
2. En Revisión
3. Documentación Pendiente
4. Crédito Aprobado
5. Aprobado con Garantía
6. Aprobado con Mensualidad
7. En Proceso de Desembolso
8. Crédito Otorgado
9. Solicitud Rechazada
10. Rechazado - Doc. Incompleta
11. Cancelado por Cliente

## 🔧 Tech Stack

- **Frontend:** Expo React Native
- **Backend:** FastAPI (Python)
- **Database:** MongoDB Atlas
- **Auth:** JWT + Biometría

## 📂 Estructura

```
credifacil/
├── .github/workflows/   # GitHub Actions
├── backend/             # FastAPI Server
│   ├── server.py
│   ├── requirements.txt
│   └── static/          # HTML legales
├── frontend/            # Expo App
│   ├── app/             # Screens
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── contexts/
│   │   └── screens/
│   └── app.json
└── CREDENCIALES.md
```

## 📄 Licencia

Propiedad de CrediFácil México © 2024
