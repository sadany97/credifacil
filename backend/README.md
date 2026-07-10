# CrediFácil - Backend API

## 🚀 Deploy Automático en Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/sadany97/credifacil)

**Solo haz click en el botón de arriba** y Render configurará todo automáticamente.

## Variables de Entorno Requeridas

Cuando Render te pida las variables, usa estas:

```
MONGO_URL = mongodb+srv://rcfadmin:RCF2026secure%21@cluster0.cdomtjo.mongodb.net/credifacil?retryWrites=true&w=majority
JWT_SECRET = credifacil_jwt_secret_2024_muy_seguro
SECRET_KEY = credifacil_super_secret_key_2024
ALGORITHM = HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
```

## Endpoints

- Health Check: `GET /api/health`
- Login: `POST /api/auth/login`
- Register: `POST /api/auth/register`

## Credenciales Admin

- Email: admin@credifacil.com
- Password: admin123
