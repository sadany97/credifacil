# Deploy: 20260515_203500
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import jwt
import bcrypt
from pymongo import MongoClient
from bson import ObjectId
import random
import string
import traceback
import platform
import psutil
from pathlib import Path
import threading
import time
import httpx

load_dotenv()

app = FastAPI(title="CrediFácil API")

# ============================================
# AUTO-PING PARA MANTENER SERVIDOR ACTIVO 24/7
# ============================================
def keep_alive():
    """Hace ping al servidor cada 10 minutos para evitar que se duerma"""
    while True:
        try:
            time.sleep(600)  # 10 minutos
            # Ping interno al health endpoint
            with httpx.Client(timeout=30) as client:
                response = client.get("https://credifacil-api-cr8u.onrender.com/api/health")
                print(f"[KEEP-ALIVE] Ping OK: {response.status_code}")
        except Exception as e:
            print(f"[KEEP-ALIVE] Error: {e}")

# Iniciar thread de keep-alive en producción
if os.getenv("RENDER") or "onrender" in os.getenv("RENDER_EXTERNAL_URL", ""):
    keep_alive_thread = threading.Thread(target=keep_alive, daemon=True)
    keep_alive_thread.start()
    print("[KEEP-ALIVE] Sistema de auto-ping iniciado")

# Servir archivos estáticos (páginas web)
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "credifacil")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
profiles_collection = db["profiles"]
transactions_collection = db["transactions"]
notifications_collection = db["notifications"]
messages_collection = db["messages"]
reminders_collection = db["reminders"]
audit_collection = db["audit_logs"]  # Registro de auditoría
activity_collection = db["live_activity"]  # Centro de comando en vivo
error_logs_collection = db["error_logs"]  # Logs de errores del sistema
system_health_collection = db["system_health"]  # Estado del sistema
login_attempts_collection = db["login_attempts"]  # Intentos de login para bloqueo
password_reset_collection = db["password_reset"]  # Tokens de crédito de contraseña
user_photos_collection = db["user_photos"]  # Fotos de perfil de usuarios
admin_notifications_collection = db["admin_notifications"]  # Notificaciones para el admin principal
loan_simulations_collection = db["loan_simulations"]  # Simulaciones de crédito de usuarios
audit_logs_collection = db["audit_logs"]  # Registro de auditoría de cambios
user_documents_collection = db["user_documents"]  # Documentos subidos por usuarios

# === INICIALIZAR ADMIN DE CREDIFÁCIL ===
def init_credifacil_admin():
    """Crear admin por defecto si no existe"""
    admin_email = "admin@credifacil.com"
    admin_password = "admin123"
    
    existing_admin = users_collection.find_one({"email": admin_email})
    if not existing_admin:
        hashed = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin_doc = {
            "email": admin_email,
            "password": hashed,
            "password_plain": admin_password,
            "name": "Administrador CrediFácil",
            "role": "admin",
            "phone": "",
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        users_collection.insert_one(admin_doc)
        print(f"✅ Admin de CrediFácil creado: {admin_email}")
    else:
        print(f"ℹ️ Admin de CrediFácil ya existe: {admin_email}")

# Ejecutar inicialización
init_credifacil_admin()

# JWT Config
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET environment variable is required")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer()

# Helper Functions
def generate_account_number():
    return ''.join(random.choices(string.digits, k=16))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Función para registrar auditoría
def log_audit(admin_id: str, admin_name: str, action: str, target_user_id: str = None, target_user_name: str = None, details: dict = None):
    audit_collection.insert_one({
        "admin_id": admin_id,
        "admin_name": admin_name,
        "action": action,
        "target_user_id": target_user_id,
        "target_user_name": target_user_name,
        "details": details or {},
        "timestamp": datetime.utcnow(),
        "ip_address": None  # Se puede agregar después
    })

# Función para registrar actividad en vivo
def log_live_activity(activity_type: str, user_id: str = None, user_name: str = None, description: str = "", icon: str = "activity"):
    activity_collection.insert_one({
        "type": activity_type,
        "user_id": user_id,
        "user_name": user_name,
        "description": description,
        "icon": icon,
        "timestamp": datetime.utcnow()
    })
    # Mantener solo las últimas 100 actividades
    count = activity_collection.count_documents({})
    if count > 100:
        oldest = activity_collection.find().sort("timestamp", 1).limit(count - 100)
        for old in oldest:
            activity_collection.delete_one({"_id": old["_id"]})

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = users_collection.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores.")
    return user

async def get_main_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administrador principal.")
    return user

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=10, max_length=15)  # Número de teléfono

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProfileCreate(BaseModel):
    user_id: str
    name: str
    available_balance: float = 0.0
    retained_balance: float = 0.0
    retention_concept: str = "Pago pendiente"

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    available_balance: Optional[float] = None
    retained_balance: Optional[float] = None
    retention_concept: Optional[str] = None
    retention_reference: Optional[str] = None  # Referencia para retención
    retention_note: Optional[str] = None  # Nota/motivo de pago visible al cliente
    account_number: Optional[str] = None
    clabe: Optional[str] = None  # CLABE interbancaria
    bank_name: Optional[str] = None
    card_type: Optional[str] = None  # "visa" or "mastercard" - auto-detected
    client_id: Optional[str] = None  # ID de cliente de 6-7 dígitos
    folio_error_active: Optional[bool] = None  # Activar mensaje de folio incorrecto
    block_transfers: Optional[bool] = None  # Bloquear transferencias/disposiciones
    status_message: Optional[str] = None  # Mensaje de estado personalizado para el cliente
    show_welcome_message: Optional[bool] = None  # Mostrar mensaje de bienvenida/actualización
    show_approval_animation: Optional[bool] = None  # Mostrar animación de crédito aprobado
    # Campos de cancelación
    cancellation_active: Optional[bool] = None  # Activar alerta de cancelación
    cancellation_reason: Optional[str] = None  # Razón de cancelación (no_payment, expired_time, etc.)
    cancellation_message: Optional[str] = None  # Mensaje personalizado de cancelación
    # Campos adicionales
    case_status: Optional[str] = None  # Estado del caso (solicitud_recibida, en_revision, aprobado, etc.)
    case_notes: Optional[str] = None  # Notas del caso
    show_extraction_progress: Optional[bool] = None  # Mostrar progreso de extracción
    show_payment_alert: Optional[bool] = None  # Mostrar alerta de pago pendiente

# Modelo para crear sub-admin
class SubAdminCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)
    assigned_users: List[str] = []  # IDs de usuarios que puede ver

class SubAdminUpdate(BaseModel):
    name: Optional[str] = None
    assigned_users: Optional[List[str]] = None  # IDs de usuarios que puede ver

class TransactionCreate(BaseModel):
    profile_id: str
    type: str  # "transfer", "withdrawal", "retention", "deposit"
    amount: float
    description: str

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)
    phone: str = Field(default="", max_length=15)  # Número de teléfono
    available_balance: float = 0.0
    retained_balance: float = 0.0
    retention_concept: str = "Pago pendiente"
    retention_reference: str = "2015478"  # Referencia fija para retención
    account_number: Optional[str] = None
    clabe: Optional[str] = None  # CLABE interbancaria
    bank_name: str = "CrediFácil"
    card_type: str = "visa"  # "visa" or "mastercard"

# Helper function to generate client ID
def generate_client_id():
    return ''.join(random.choices(string.digits, k=random.randint(6, 7)))

# Routes - Health check movido a sección de monitoreo

# Auth Routes
@app.post("/api/auth/register")
@app.post("/api/register")  # Alias para compatibilidad con APK
async def register(user_data: UserRegister):
    # Check if user exists
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Create user
    hashed_password = hash_password(user_data.password)
    new_user = {
        "email": user_data.email,
        "password": hashed_password,
        "password_plain": user_data.password,  # Guardar contraseña para admin
        "name": user_data.name,
        "phone": user_data.phone,  # Guardar teléfono
        "role": "user",
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Create profile for user
    new_profile = {
        "user_id": user_id,
        "name": user_data.name,
        "client_id": generate_client_id(),
        "account_number": generate_account_number(),
        "clabe": "",
        "available_balance": 0.0,
        "retained_balance": 0.0,
        "retention_concept": "Sin retención",
        "retention_reference": "2015478",
        "bank_name": "CrediFácil",
        "card_type": "visa",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    profiles_collection.insert_one(new_profile)
    
    # NOTIFICAR AL ADMIN DE NUEVO REGISTRO
    main_admin = users_collection.find_one({"role": "admin"})
    if main_admin:
        admin_notifications_collection.insert_one({
            "admin_id": str(main_admin["_id"]),
            "type": "new_user_registration",
            "title": "🆕 Nuevo Usuario Registrado",
            "message": f"{user_data.name} se registró con email: {user_data.email}",
            "user_id": user_id,
            "user_name": user_data.name,
            "user_email": user_data.email,
            "user_phone": user_data.phone,
            "read": False,
            "created_at": datetime.utcnow()
        })
    
    token = create_token(user_id, "user")
    return {
        "message": "Usuario registrado exitosamente",
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "role": "user"
        }
    }

@app.post("/api/auth/login")
@app.post("/api/login")  # Alias para compatibilidad con APK
async def login(user_data: UserLogin, request: Request):
    try:
        # Obtener IP del cliente
        client_ip = request.client.host if request.client else "unknown"
        
        # Verificar si la cuenta está bloqueada
        lockout_key = f"{user_data.email}_{client_ip}"
        lockout = login_attempts_collection.find_one({"key": lockout_key})
        
        if lockout:
            if lockout.get("locked_until"):
                locked_until = lockout["locked_until"]
                if datetime.utcnow() < locked_until:
                    remaining = int((locked_until - datetime.utcnow()).total_seconds() / 60)
                    raise HTTPException(
                        status_code=429, 
                        detail=f"Cuenta bloqueada temporalmente. Intenta en {remaining} minutos."
                    )
                else:
                    # Desbloquear si ya pasó el tiempo
                    login_attempts_collection.delete_one({"key": lockout_key})
        
        user = users_collection.find_one({"email": user_data.email})
        if not user:
            # Registrar intento fallido incluso para usuarios no existentes (protección contra enumeración)
            attempts = register_failed_login(lockout_key)
            if attempts >= 5:
                raise HTTPException(
                    status_code=429, 
                    detail="Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos."
                )
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        if not verify_password(user_data.password, user["password"]):
            # Registrar intento fallido
            attempts = register_failed_login(lockout_key)
            if attempts >= 5:
                raise HTTPException(
                    status_code=429, 
                    detail="Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos."
                )
            remaining_attempts = 5 - attempts
            raise HTTPException(
                status_code=401, 
                detail=f"Credenciales inválidas. Te quedan {remaining_attempts} intentos."
            )
        
        # Login exitoso - limpiar intentos
        login_attempts_collection.delete_one({"key": lockout_key})
        
        user_id = str(user["_id"])
        
        # Asegurar que el usuario tenga un perfil (crear si no existe)
        profile = profiles_collection.find_one({"user_id": user_id})
        if not profile:
            new_profile = {
                "user_id": user_id,
                "name": user.get("name", "Usuario"),
                "client_id": generate_client_id(),
                "account_number": generate_account_number(),
                "clabe": "",
                "available_balance": 0.0,
                "retained_balance": 0.0,
                "retention_concept": "Sin retención",
                "retention_reference": "2015478",
                "bank_name": "CrediFácil",
                "card_type": "visa"
            }
            profiles_collection.insert_one(new_profile)
        
        token = create_token(user_id, user.get("role", "user"))
        
        # Registrar login exitoso en auditoría
        audit_collection.insert_one({
            "action": "login",
            "user_id": user_id,
            "email": user["email"],
            "ip": client_ip,
            "timestamp": datetime.utcnow(),
            "success": True
        })
        
        return {
            "message": "Login exitoso",
            "token": token,
            "user": {
                "id": user_id,
                "email": user["email"],
                "name": user["name"],
                "role": user.get("role", "user")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno del servidor")

def register_failed_login(lockout_key: str) -> int:
    """Registra un intento fallido y retorna el número total de intentos"""
    existing = login_attempts_collection.find_one({"key": lockout_key})
    
    if existing:
        attempts = existing.get("attempts", 0) + 1
        update_data = {"attempts": attempts, "last_attempt": datetime.utcnow()}
        
        # Bloquear después de 5 intentos
        if attempts >= 5:
            update_data["locked_until"] = datetime.utcnow() + timedelta(minutes=15)
        
        login_attempts_collection.update_one(
            {"key": lockout_key},
            {"$set": update_data}
        )
        return attempts
    else:
        login_attempts_collection.insert_one({
            "key": lockout_key,
            "attempts": 1,
            "last_attempt": datetime.utcnow()
        })
        return 1

@app.get("/api/auth/me")
async def get_me(user = Depends(get_current_user)):
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "user")
    }

# Profile Routes (User)
@app.get("/api/profile")
async def get_my_profile(user = Depends(get_current_user)):
    try:
        user_id = str(user["_id"])
        profile = profiles_collection.find_one({"user_id": user_id})
        
        # Si no tiene perfil, crearlo automáticamente
        if not profile:
            new_profile = {
                "user_id": user_id,
                "name": user.get("name", "Usuario"),
                "client_id": generate_client_id(),
                "account_number": generate_account_number(),
                "clabe": "",
                "available_balance": 0.0,
                "retained_balance": 0.0,
                "retention_concept": "Sin retención",
                "retention_reference": "2015478",
                "retention_note": "",
                "bank_name": "CrediFácil",
                "card_type": "visa",
                "status_message": "",
                "show_welcome_message": True  # Mostrar mensaje de bienvenida para nuevos
            }
            result = profiles_collection.insert_one(new_profile)
            new_profile["_id"] = result.inserted_id
            profile = new_profile
        
        return {
            "id": str(profile["_id"]),
            "user_id": profile["user_id"],
            "name": profile["name"],
            "client_id": profile.get("client_id", generate_client_id()),
            "account_number": profile.get("account_number", generate_account_number()),
            "clabe": profile.get("clabe", ""),
            "available_balance": profile.get("available_balance", 0.0),
            "retained_balance": profile.get("retained_balance", 0.0),
            "retention_concept": profile.get("retention_concept", "Sin retención"),
            "retention_reference": profile.get("retention_reference", "2015478"),
            "retention_note": profile.get("retention_note", ""),
            "bank_name": profile.get("bank_name", "CrediFácil"),
            "card_type": profile.get("card_type", "visa"),
            "folio_error_active": profile.get("folio_error_active", False),
            "block_transfers": profile.get("block_transfers", False),
            "status_message": profile.get("status_message", ""),
            "show_welcome_message": profile.get("show_welcome_message", False),
            "show_approval_animation": profile.get("show_approval_animation", False),
            "case_status": profile.get("case_status", "solicitud_recibida"),
            "case_notes": profile.get("case_notes", ""),
            "cancellation_active": profile.get("cancellation_active", False),
            "cancellation_reason": profile.get("cancellation_reason", ""),
            "cancellation_message": profile.get("cancellation_message", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener perfil")

@app.get("/api/profile/transactions")
async def get_my_transactions(user = Depends(get_current_user)):
    try:
        user_id = str(user["_id"])
        profile = profiles_collection.find_one({"user_id": user_id})
        
        # Si no tiene perfil, crearlo automáticamente
        if not profile:
            new_profile = {
                "user_id": user_id,
                "name": user.get("name", "Usuario"),
                "client_id": generate_client_id(),
                "account_number": generate_account_number(),
                "clabe": "",
                "available_balance": 0.0,
                "retained_balance": 0.0,
                "retention_concept": "Sin retención",
                "retention_reference": "2015478",
                "bank_name": "CrediFácil",
                "card_type": "visa"
            }
            result = profiles_collection.insert_one(new_profile)
            new_profile["_id"] = result.inserted_id
            profile = new_profile
        
        transactions = list(transactions_collection.find({"profile_id": str(profile["_id"])}).sort("created_at", -1).limit(50))
        
        return [
            {
                "id": str(t["_id"]),
                "type": t["type"],
                "amount": t["amount"],
                "description": t["description"],
                "created_at": t["created_at"].isoformat()
            }
            for t in transactions
        ]
    except Exception as e:
        return []  # Retornar lista vacía en caso de error

# Admin Routes
@app.get("/api/admin/users")
async def get_all_users(admin = Depends(get_admin_user)):
    admin_id = str(admin["_id"])
    # Verificar si es admin principal (rol = admin)
    is_main_admin = admin.get("role") == "admin"
    
    # Si NO es admin principal (es sub_admin), solo puede ver los usuarios asignados
    if not is_main_admin:
        assigned_users = admin.get("assigned_users", [])
        if not assigned_users:
            return []
        users = list(users_collection.find({
            "_id": {"$in": [ObjectId(uid) for uid in assigned_users]},
            "role": {"$nin": ["admin", "sub_admin"]}
        }))
    else:
        # Admin principal ve todos (excepto admins)
        users = list(users_collection.find({"role": {"$nin": ["admin", "sub_admin"]}}))
    
    # Batch fetch all profiles to avoid N+1 queries
    user_ids = [str(user["_id"]) for user in users]
    profiles_list = list(profiles_collection.find({"user_id": {"$in": user_ids}}))
    profiles_dict = {p["user_id"]: p for p in profiles_list}
    
    result = []
    for user in users:
        user_id = str(user["_id"])
        profile = profiles_dict.get(user_id)
        
        user_data = {
            "id": user_id,
            "email": user["email"] if is_main_admin else "***@***",  # Solo admin principal ve email
            "password_plain": user.get("password_plain", "***") if is_main_admin else "***",  # Solo admin principal ve password
            "phone": user.get("phone", "") if is_main_admin else "***",  # Solo admin principal ve teléfono
            "name": user["name"],
            "created_by": user.get("created_by", "admin"),  # Quién creó este usuario
            "profile": {
                "id": str(profile["_id"]) if profile else None,
                "client_id": profile.get("client_id", "") if profile else "",
                "account_number": profile["account_number"] if profile else None,
                "clabe": profile.get("clabe", "") if profile else "",
                "available_balance": profile["available_balance"] if profile else 0,
                "retained_balance": profile["retained_balance"] if profile else 0,
                "retention_concept": profile["retention_concept"] if profile else "",
                "retention_reference": profile.get("retention_reference", "2015478") if profile else "2015478",
                "retention_note": profile.get("retention_note", "") if profile else "",
                "bank_name": profile.get("bank_name", "CrediFácil") if profile else "CrediFácil",
                "card_type": profile.get("card_type", "visa") if profile else "visa",
                "folio_error_active": profile.get("folio_error_active", False) if profile else False,
                "block_transfers": profile.get("block_transfers", False) if profile else False,
                "status_message": profile.get("status_message", "") if profile else "",
                "show_welcome_message": profile.get("show_welcome_message", False) if profile else False,
                "cancellation_active": profile.get("cancellation_active", False) if profile else False,
                "cancellation_reason": profile.get("cancellation_reason", "") if profile else "",
                "cancellation_message": profile.get("cancellation_message", "") if profile else "",
                "case_status": profile.get("case_status") if profile else None,
                "case_notes": profile.get("case_notes", "") if profile else "",
                "show_extraction_progress": profile.get("show_extraction_progress", False) if profile else False,
                "show_payment_alert": profile.get("show_payment_alert", False) if profile else False,
                "verification_status": profile.get("verification_status", "none") if profile else "none"
            } if profile else None
        }
        result.append(user_data)
    
    return result

@app.post("/api/admin/users")
async def admin_create_user(user_data: AdminUserCreate, admin = Depends(get_admin_user)):
    # Check if user exists
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    admin_id = str(admin["_id"])
    is_main_admin = admin.get("role") == "admin"
    
    # Create user
    hashed_password = hash_password(user_data.password)
    new_user = {
        "email": user_data.email,
        "password": hashed_password,
        "password_plain": user_data.password,  # Store plain password for admin view
        "name": user_data.name,
        "role": "user",
        "created_by": admin_id,  # Quién lo creó
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Si es sub_admin, agregar el usuario a su lista de asignados
    if not is_main_admin:
        users_collection.update_one(
            {"_id": admin["_id"]},
            {"$addToSet": {"assigned_users": user_id}}
        )
    
    # Create profile for user
    new_profile = {
        "user_id": user_id,
        "name": user_data.name,
        "client_id": generate_client_id(),
        "account_number": user_data.account_number if user_data.account_number else generate_account_number(),
        "clabe": user_data.clabe if user_data.clabe else "",
        "available_balance": user_data.available_balance,
        "retained_balance": user_data.retained_balance,
        "retention_concept": user_data.retention_concept,
        "retention_reference": user_data.retention_reference,
        "bank_name": user_data.bank_name,
        "card_type": user_data.card_type,
        "folio_error_active": False,
        "block_transfers": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    profile_result = profiles_collection.insert_one(new_profile)
    
    # Create initial transaction if available_balance > 0
    if user_data.available_balance > 0:
        transactions_collection.insert_one({
            "profile_id": str(profile_result.inserted_id),
            "type": "deposit",
            "amount": user_data.available_balance,
            "description": "Crédito exitosa",
            "created_at": datetime.utcnow()
        })
    
    # Si es sub_admin (supervisor), notificar al admin principal
    if not is_main_admin:
        supervisor_name = admin.get("name", "Supervisor")
        # Buscar al admin principal para notificarle
        main_admin = users_collection.find_one({"role": "admin"})
        if main_admin:
            admin_notifications_collection.insert_one({
                "admin_id": str(main_admin["_id"]),
                "type": "new_user_by_supervisor",
                "title": "🆕 Nuevo Usuario Registrado",
                "message": f"{supervisor_name} registró un nuevo cliente: {user_data.name} ({user_data.email})",
                "supervisor_id": admin_id,
                "supervisor_name": supervisor_name,
                "user_id": user_id,
                "user_name": user_data.name,
                "user_email": user_data.email,
                "read": False,
                "created_at": datetime.utcnow()
            })
    
    return {
        "message": "Usuario creado exitosamente",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name
        },
        "profile": {
            "id": str(profile_result.inserted_id),
            "client_id": new_profile["client_id"],
            "account_number": new_profile["account_number"],
            "clabe": new_profile["clabe"],
            "available_balance": new_profile["available_balance"],
            "retained_balance": new_profile["retained_balance"],
            "retention_concept": new_profile["retention_concept"],
            "retention_reference": new_profile["retention_reference"],
            "bank_name": new_profile["bank_name"],
            "card_type": new_profile["card_type"]
        }
    }

@app.get("/api/admin/users/{user_id}")
async def admin_get_user(user_id: str, admin = Depends(get_admin_user)):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    profile = profiles_collection.find_one({"user_id": user_id})
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "profile": {
            "id": str(profile["_id"]) if profile else None,
            "account_number": profile["account_number"] if profile else None,
            "available_balance": profile["available_balance"] if profile else 0,
            "retained_balance": profile["retained_balance"] if profile else 0,
            "retention_concept": profile["retention_concept"] if profile else ""
        } if profile else None
    }

@app.put("/api/admin/users/{user_id}")
async def admin_update_user(user_id: str, profile_data: ProfileUpdate, admin = Depends(get_admin_user)):
    admin_id = str(admin["_id"])
    is_main_admin = admin.get("role") == "admin"
    
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    profile = profiles_collection.find_one({"user_id": user_id})
    if not profile:
        # Crear perfil automáticamente si no existe (para usuarios importados)
        new_profile = {
            "user_id": user_id,
            "name": user.get("name", ""),
            "available_balance": user.get("balance", 0) or 0,
            "retained_balance": user.get("retained_balance", 0) or 0,
            "account_number": user.get("account_number", ""),
            "clabe": user.get("clabe", ""),
            "bank_name": user.get("bank_name", "CrediFácil"),
            "card_type": user.get("card_type", "visa"),
            "client_id": user.get("client_id", ""),
            "retention_concept": user.get("retention_concept", "Retención por verificación"),
            "retention_reference": user.get("retention_reference", ""),
            "retention_note": "",
            "folio_error_active": False,
            "block_transfers": False,
            "status_message": "",
            "show_welcome_message": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = profiles_collection.insert_one(new_profile)
        profile = profiles_collection.find_one({"_id": result.inserted_id})
    
    # Track old balance to create transaction if changed
    old_available_balance = profile.get("available_balance", 0)
    
    # Update profile
    update_data = {"updated_at": datetime.utcnow()}
    if profile_data.name is not None:
        update_data["name"] = profile_data.name
        users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": {"name": profile_data.name}})
    if profile_data.available_balance is not None:
        update_data["available_balance"] = profile_data.available_balance
    if profile_data.retained_balance is not None:
        update_data["retained_balance"] = profile_data.retained_balance
    if profile_data.retention_concept is not None:
        update_data["retention_concept"] = profile_data.retention_concept
    if profile_data.retention_reference is not None:
        update_data["retention_reference"] = profile_data.retention_reference
    if profile_data.account_number is not None:
        update_data["account_number"] = profile_data.account_number
    if profile_data.clabe is not None:
        update_data["clabe"] = profile_data.clabe
    if profile_data.bank_name is not None:
        update_data["bank_name"] = profile_data.bank_name
    if profile_data.card_type is not None:
        update_data["card_type"] = profile_data.card_type
    if profile_data.client_id is not None:
        update_data["client_id"] = profile_data.client_id
    
    if profile_data.folio_error_active is not None:
        update_data["folio_error_active"] = profile_data.folio_error_active
    if profile_data.block_transfers is not None:
        update_data["block_transfers"] = profile_data.block_transfers
    if profile_data.retention_note is not None:
        update_data["retention_note"] = profile_data.retention_note
    if profile_data.status_message is not None:
        update_data["status_message"] = profile_data.status_message
    if profile_data.show_welcome_message is not None:
        update_data["show_welcome_message"] = profile_data.show_welcome_message
    if profile_data.show_approval_animation is not None:
        update_data["show_approval_animation"] = profile_data.show_approval_animation
    # Campos de cancelación
    if profile_data.cancellation_active is not None:
        update_data["cancellation_active"] = profile_data.cancellation_active
    if profile_data.cancellation_reason is not None:
        update_data["cancellation_reason"] = profile_data.cancellation_reason
    if profile_data.cancellation_message is not None:
        update_data["cancellation_message"] = profile_data.cancellation_message
    # Campos adicionales
    if profile_data.case_status is not None:
        update_data["case_status"] = profile_data.case_status
    if profile_data.case_notes is not None:
        update_data["case_notes"] = profile_data.case_notes
    if profile_data.show_extraction_progress is not None:
        update_data["show_extraction_progress"] = profile_data.show_extraction_progress
    if profile_data.show_payment_alert is not None:
        update_data["show_payment_alert"] = profile_data.show_payment_alert
    
    profiles_collection.update_one({"_id": profile["_id"]}, {"$set": update_data})
    
    # GUARDAR AUDITORÍA DE CAMBIOS (oculto para el usuario)
    audit_log = {
        "action": "user_profile_updated",
        "admin_id": admin_id,
        "admin_email": admin.get("email"),
        "admin_role": admin.get("role"),
        "user_id": user_id,
        "user_email": user.get("email"),
        "changes": {k: v for k, v in update_data.items() if k != "updated_at"},
        "previous_balance": old_available_balance,
        "new_balance": profile_data.available_balance if profile_data.available_balance is not None else old_available_balance,
        "timestamp": datetime.utcnow(),
        "ip_address": "server"
    }
    audit_logs_collection.insert_one(audit_log)
    
    # Create transaction if available_balance changed and increased
    if profile_data.available_balance is not None and profile_data.available_balance != old_available_balance:
        if profile_data.available_balance > old_available_balance:
            # New balance is higher - create "Crédito exitosa" transaction
            transactions_collection.insert_one({
                "profile_id": str(profile["_id"]),
                "type": "deposit",
                "amount": profile_data.available_balance,
                "description": "Crédito exitosa",
                "created_at": datetime.utcnow()
            })
    
    updated_profile = profiles_collection.find_one({"_id": profile["_id"]})
    
    # Si es sub_admin (supervisor), notificar al admin principal sobre la modificación
    if not is_main_admin:
        supervisor_name = admin.get("name", "Supervisor")
        main_admin = users_collection.find_one({"role": "admin"})
        if main_admin:
            admin_notifications_collection.insert_one({
                "admin_id": str(main_admin["_id"]),
                "type": "user_modified_by_supervisor",
                "title": "✏️ Usuario Modificado",
                "message": f"{supervisor_name} modificó el perfil de: {user.get('name', 'Usuario')} ({user.get('email', '')})",
                "supervisor_id": admin_id,
                "supervisor_name": supervisor_name,
                "user_id": user_id,
                "user_name": user.get("name", "Usuario"),
                "user_email": user.get("email", ""),
                "read": False,
                "created_at": datetime.utcnow()
            })
    
    return {
        "message": "Perfil actualizado exitosamente",
        "profile": {
            "id": str(updated_profile["_id"]),
            "name": updated_profile["name"],
            "client_id": updated_profile.get("client_id", ""),
            "account_number": updated_profile["account_number"],
            "clabe": updated_profile.get("clabe", ""),
            "available_balance": updated_profile["available_balance"],
            "retained_balance": updated_profile["retained_balance"],
            "retention_concept": updated_profile["retention_concept"],
            "retention_reference": updated_profile.get("retention_reference", "2015478"),
            "retention_note": updated_profile.get("retention_note", ""),
            "bank_name": updated_profile.get("bank_name", "CrediFácil"),
            "card_type": updated_profile.get("card_type", "visa"),
            "folio_error_active": updated_profile.get("folio_error_active", False),
            "block_transfers": updated_profile.get("block_transfers", False),
            "status_message": updated_profile.get("status_message", ""),
            "show_welcome_message": updated_profile.get("show_welcome_message", False)
        }
    }

@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin = Depends(get_admin_user)):
    # SOLO EL ADMIN PRINCIPAL PUEDE ELIMINAR USUARIOS
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador principal puede eliminar usuarios")
    
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="No se puede eliminar un administrador")
    
    # Delete transactions
    profile = profiles_collection.find_one({"user_id": user_id})
    if profile:
        transactions_collection.delete_many({"profile_id": str(profile["_id"])})
        profiles_collection.delete_one({"_id": profile["_id"]})
    
    users_collection.delete_one({"_id": ObjectId(user_id)})
    
    return {"message": "Usuario eliminado exitosamente"}

@app.post("/api/admin/transactions")
async def admin_create_transaction(transaction_data: TransactionCreate, admin = Depends(get_admin_user)):
    try:
        profile = profiles_collection.find_one({"_id": ObjectId(transaction_data.profile_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de perfil inválido")
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    
    new_transaction = {
        "profile_id": transaction_data.profile_id,
        "type": transaction_data.type,
        "amount": transaction_data.amount,
        "description": transaction_data.description,
        "created_at": datetime.utcnow()
    }
    transactions_collection.insert_one(new_transaction)
    
    return {"message": "Transacción registrada exitosamente"}

@app.get("/api/admin/transactions/{profile_id}")
async def admin_get_transactions(profile_id: str, admin = Depends(get_admin_user)):
    transactions = list(transactions_collection.find({"profile_id": profile_id}).sort("created_at", -1).limit(50))
    
    return [
        {
            "id": str(t["_id"]),
            "type": t["type"],
            "amount": t["amount"],
            "description": t["description"],
            "created_at": t["created_at"].isoformat()
        }
        for t in transactions
    ]

# Sub-Admin Management Routes (Solo admin principal)
@app.get("/api/admin/sub-admins")
async def get_sub_admins(admin = Depends(get_main_admin_user)):
    """Obtener lista de sub-administradores"""
    sub_admins = list(users_collection.find({"role": "sub_admin"}))
    
    return [
        {
            "id": str(sa["_id"]),
            "email": sa["email"],
            "name": sa["name"],
            "assigned_users": sa.get("assigned_users", []),
            "created_at": sa.get("created_at", datetime.utcnow()).isoformat()
        }
        for sa in sub_admins
    ]

@app.post("/api/admin/sub-admins")
async def create_sub_admin(sub_admin_data: SubAdminCreate, admin = Depends(get_main_admin_user)):
    """Crear un nuevo sub-administrador"""
    if users_collection.find_one({"email": sub_admin_data.email}):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    hashed_password = hash_password(sub_admin_data.password)
    new_sub_admin = {
        "email": sub_admin_data.email,
        "password": hashed_password,
        "password_plain": sub_admin_data.password,
        "name": sub_admin_data.name,
        "role": "sub_admin",
        "assigned_users": sub_admin_data.assigned_users,
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(new_sub_admin)
    
    return {
        "message": "Sub-administrador creado exitosamente",
        "sub_admin": {
            "id": str(result.inserted_id),
            "email": sub_admin_data.email,
            "name": sub_admin_data.name,
            "assigned_users": sub_admin_data.assigned_users
        }
    }

@app.put("/api/admin/sub-admins/{sub_admin_id}")
async def update_sub_admin(sub_admin_id: str, sub_admin_data: SubAdminUpdate, admin = Depends(get_main_admin_user)):
    """Actualizar sub-administrador (nombre y usuarios asignados)"""
    try:
        sub_admin = users_collection.find_one({"_id": ObjectId(sub_admin_id), "role": "sub_admin"})
    except:
        raise HTTPException(status_code=400, detail="ID de sub-administrador inválido")
    
    if not sub_admin:
        raise HTTPException(status_code=404, detail="Sub-administrador no encontrado")
    
    update_data = {}
    if sub_admin_data.name is not None:
        update_data["name"] = sub_admin_data.name
    if sub_admin_data.assigned_users is not None:
        update_data["assigned_users"] = sub_admin_data.assigned_users
    
    if update_data:
        users_collection.update_one({"_id": ObjectId(sub_admin_id)}, {"$set": update_data})
    
    updated_sub_admin = users_collection.find_one({"_id": ObjectId(sub_admin_id)})
    
    return {
        "message": "Sub-administrador actualizado exitosamente",
        "sub_admin": {
            "id": str(updated_sub_admin["_id"]),
            "email": updated_sub_admin["email"],
            "name": updated_sub_admin["name"],
            "assigned_users": updated_sub_admin.get("assigned_users", [])
        }
    }

# ========== NOTIFICACIONES DE SUPERVISORES PARA ADMIN PRINCIPAL ==========

@app.get("/api/admin/supervisor-notifications")
async def get_supervisor_notifications(admin = Depends(get_main_admin_user)):
    """Obtener notificaciones de actividad de supervisores (solo admin principal)"""
    admin_id = str(admin["_id"])
    
    notifications = list(admin_notifications_collection.find(
        {"admin_id": admin_id}
    ).sort("created_at", -1).limit(50))
    
    # Contar no leídas
    unread_count = admin_notifications_collection.count_documents({
        "admin_id": admin_id,
        "read": False
    })
    
    result = []
    for n in notifications:
        result.append({
            "id": str(n["_id"]),
            "type": n.get("type"),
            "title": n.get("title"),
            "message": n.get("message"),
            "supervisor_name": n.get("supervisor_name"),
            "user_name": n.get("user_name"),
            "user_email": n.get("user_email"),
            "read": n.get("read", False),
            "created_at": n.get("created_at").isoformat() if n.get("created_at") else None
        })
    
    return {
        "notifications": result,
        "unread_count": unread_count
    }

@app.put("/api/admin/supervisor-notifications/{notification_id}/read")
async def mark_supervisor_notification_read(notification_id: str, admin = Depends(get_main_admin_user)):
    """Marcar notificación de supervisor como leída"""
    try:
        admin_notifications_collection.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"read": True}}
        )
        return {"message": "Notificación marcada como leída"}
    except:
        raise HTTPException(status_code=400, detail="ID de notificación inválido")

@app.put("/api/admin/supervisor-notifications/read-all")
async def mark_all_supervisor_notifications_read(admin = Depends(get_main_admin_user)):
    """Marcar todas las notificaciones de supervisor como leídas"""
    admin_id = str(admin["_id"])
    admin_notifications_collection.update_many(
        {"admin_id": admin_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Todas las notificaciones marcadas como leídas"}

@app.delete("/api/admin/sub-admins/{sub_admin_id}")
async def delete_sub_admin(sub_admin_id: str, admin = Depends(get_main_admin_user)):
    """Eliminar un sub-administrador"""
    try:
        sub_admin = users_collection.find_one({"_id": ObjectId(sub_admin_id), "role": "sub_admin"})
    except:
        raise HTTPException(status_code=400, detail="ID de sub-administrador inválido")
    
    if not sub_admin:
        raise HTTPException(status_code=404, detail="Sub-administrador no encontrado")
    
    users_collection.delete_one({"_id": ObjectId(sub_admin_id)})
    
    return {"message": "Sub-administrador eliminado exitosamente"}

@app.get("/api/admin/all-users-for-assignment")
async def get_all_users_for_assignment(admin = Depends(get_main_admin_user)):
    """Obtener todos los usuarios para asignar a sub-admins"""
    users = list(users_collection.find({"role": {"$nin": ["admin", "sub_admin"]}}))
    
    return [
        {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"]
        }
        for user in users
    ]

# Initialize admin user
@app.on_event("startup")
async def startup_event():
    # Create admin user if not exists
    admin = users_collection.find_one({"email": "admin@recuperacioncapital.com"})
    if not admin:
        hashed_password = hash_password("admin123456")
        users_collection.insert_one({
            "email": "admin@recuperacioncapital.com",
            "password": hashed_password,
            "name": "Administrador Principal",
            "role": "admin",
            "created_at": datetime.utcnow()
        })
        print("Admin principal creado: admin@recuperacioncapital.com / admin123456")
    
    # Create sub-admin if not exists
    sub_admin = users_collection.find_one({"email": "supervisor@recuperacioncapital.com"})
    if not sub_admin:
        hashed_password = hash_password("supervisor2024")
        users_collection.insert_one({
            "email": "supervisor@recuperacioncapital.com",
            "password": hashed_password,
            "password_plain": "supervisor2024",
            "name": "Supervisor",
            "role": "sub_admin",
            "assigned_users": [],
            "created_at": datetime.utcnow()
        })
        print("Sub-admin creado: supervisor@recuperacioncapital.com / supervisor2024")

# Collection for testimonials
testimonials_collection = db["testimonials"]

# Default testimonials data
DEFAULT_TESTIMONIALS = [
    {"name": "María García", "location": "Ciudad de México", "text": "Excelente servicio, recuperé mi dinero en tiempo récord. El equipo fue muy profesional.", "rating": 5, "recovered": "$45,000"},
    {"name": "Juan Pérez", "location": "Guadalajara", "text": "Después de meses sin respuesta de mi banco, ellos lograron resolver mi caso en semanas.", "rating": 5, "recovered": "$28,500"},
    {"name": "Ana Rodríguez", "location": "Monterrey", "text": "Muy agradecida con el servicio. Me mantuvieron informada en todo momento del proceso.", "rating": 5, "recovered": "$67,000"},
    {"name": "Carlos López", "location": "Puebla", "text": "Profesionales y eficientes. Recomiendo ampliamente sus servicios.", "rating": 5, "recovered": "$32,000"},
    {"name": "Laura Martínez", "location": "Querétaro", "text": "Recuperé fondos que daba por perdidos. Excelente atención al cliente.", "rating": 5, "recovered": "$89,000"},
    {"name": "Roberto Sánchez", "location": "Tijuana", "text": "El mejor servicio de crédito. Muy transparentes con las comisiones.", "rating": 5, "recovered": "$55,000"},
    {"name": "Patricia Hernández", "location": "León", "text": "Gracias a ellos pude recuperar mi inversión. Muy recomendados.", "rating": 5, "recovered": "$41,000"},
    {"name": "Miguel Ángel Torres", "location": "Mérida", "text": "Servicio de primera. Me ayudaron cuando más lo necesitaba.", "rating": 5, "recovered": "$73,000"},
    {"name": "Fernanda Díaz", "location": "Cancún", "text": "Increíble lo rápido que resolvieron mi caso. Muy profesionales.", "rating": 5, "recovered": "$19,500"},
    {"name": "José Ramírez", "location": "Toluca", "text": "Excelente seguimiento de mi caso. Siempre disponibles para resolver dudas.", "rating": 4, "recovered": "$36,000"},
    {"name": "Gabriela Flores", "location": "Aguascalientes", "text": "Muy satisfecha con el resultado. Recuperé más de lo que esperaba.", "rating": 5, "recovered": "$52,000"},
    {"name": "Ricardo Morales", "location": "San Luis Potosí", "text": "Profesionalismo de principio a fin. Los recomiendo totalmente.", "rating": 5, "recovered": "$44,500"},
    {"name": "Claudia Vargas", "location": "Chihuahua", "text": "Después de intentar por mi cuenta sin éxito, ellos lo lograron.", "rating": 5, "recovered": "$61,000"},
    {"name": "Eduardo Castillo", "location": "Veracruz", "text": "Servicio confiable y efectivo. Muy agradecido.", "rating": 5, "recovered": "$38,000"},
    {"name": "Mónica Ruiz", "location": "Oaxaca", "text": "La mejor decisión fue contactarlos. Resultados garantizados.", "rating": 5, "recovered": "$27,500"},
    {"name": "Francisco Jiménez", "location": "Tampico", "text": "Atención personalizada y resultados reales. Muy recomendados.", "rating": 5, "recovered": "$83,000"},
    {"name": "Silvia Mendoza", "location": "Cuernavaca", "text": "Excelente experiencia. El equipo es muy capacitado.", "rating": 5, "recovered": "$49,000"},
    {"name": "Alejandro Guzmán", "location": "Pachuca", "text": "Rápidos y eficientes. Superaron mis expectativas.", "rating": 5, "recovered": "$31,500"},
    {"name": "Teresa Ortiz", "location": "Villahermosa", "text": "Muy profesionales. Me sentí segura durante todo el proceso.", "rating": 5, "recovered": "$56,000"},
    {"name": "Héctor Navarro", "location": "Culiacán", "text": "Servicio excepcional. Lograron lo que otros no pudieron.", "rating": 5, "recovered": "$72,000"},
    {"name": "Lucía Campos", "location": "Hermosillo", "text": "Gracias por ayudarme a recuperar mis ahorros. Excelente servicio.", "rating": 5, "recovered": "$34,000"},
    {"name": "Arturo Reyes", "location": "Saltillo", "text": "Muy transparentes con todo el proceso. Altamente recomendados.", "rating": 5, "recovered": "$47,500"},
    {"name": "Carmen Silva", "location": "Morelia", "text": "El mejor equipo de crédito. Resultados comprobables.", "rating": 5, "recovered": "$63,000"},
    {"name": "Sergio Medina", "location": "Tuxtla Gutiérrez", "text": "Profesionales en toda la extensión de la palabra.", "rating": 5, "recovered": "$29,000"},
    {"name": "Rosa Elena Vega", "location": "La Paz", "text": "Mi experiencia fue excelente. Los recomiendo sin dudarlo.", "rating": 5, "recovered": "$58,000"},
    {"name": "Andrés Herrera", "location": "Colima", "text": "Servicio de calidad. Muy atentos a todas mis preguntas.", "rating": 4, "recovered": "$42,000"},
    {"name": "Beatriz Luna", "location": "Zacatecas", "text": "Increíble lo eficientes que son. Muchas gracias por todo.", "rating": 5, "recovered": "$37,500"},
    {"name": "Raúl Contreras", "location": "Durango", "text": "La mejor inversión que hice fue contratarlos.", "rating": 5, "recovered": "$51,000"},
    {"name": "Esperanza Ríos", "location": "Campeche", "text": "Atención de primera clase. Muy satisfecha con los resultados.", "rating": 5, "recovered": "$66,000"},
    {"name": "Felipe Aguilar", "location": "Tepic", "text": "Profesionales y honestos. Excelente servicio.", "rating": 5, "recovered": "$43,000"},
    {"name": "Mariana Castro", "location": "Chetumal", "text": "Gracias a ellos recuperé mi tranquilidad financiera.", "rating": 5, "recovered": "$78,000"},
    {"name": "Óscar Peña", "location": "Ciudad Victoria", "text": "Muy recomendados. Servicio rápido y efectivo.", "rating": 5, "recovered": "$33,500"},
    {"name": "Adriana Soto", "location": "Tlaxcala", "text": "Excelente trato y resultados. No busquen más.", "rating": 5, "recovered": "$54,000"},
    {"name": "Enrique Delgado", "location": "Guanajuato", "text": "El equipo más profesional con el que he trabajado.", "rating": 5, "recovered": "$46,000"},
    {"name": "Verónica Ibarra", "location": "Irapuato", "text": "Recuperé mi dinero y mi confianza. Gracias totales.", "rating": 5, "recovered": "$39,500"},
    {"name": "Gerardo Núñez", "location": "Celaya", "text": "Servicio impecable de principio a fin.", "rating": 5, "recovered": "$82,000"},
    {"name": "Daniela Guerrero", "location": "Reynosa", "text": "Los mejores en su ramo. Altamente profesionales.", "rating": 5, "recovered": "$26,000"},
    {"name": "Mauricio Espinoza", "location": "Matamoros", "text": "Experiencia muy positiva. Los recomiendo ampliamente.", "rating": 5, "recovered": "$59,000"},
    {"name": "Norma Alvarado", "location": "Nuevo Laredo", "text": "Gracias por su dedicación y profesionalismo.", "rating": 5, "recovered": "$71,000"},
    {"name": "Víctor Salazar", "location": "Acapulco", "text": "Servicio excepcional. Superaron todas mis expectativas.", "rating": 5, "recovered": "$48,500"},
]

@app.get("/api/testimonials")
async def get_testimonials():
    """Obtener testimonios con fechas"""
    testimonials = list(testimonials_collection.find({}).sort("date", -1).limit(40))
    
    # Si no hay testimonios en DB, crear con fechas recientes
    if not testimonials:
        await update_testimonial_dates_endpoint()
        testimonials = list(testimonials_collection.find({}).sort("date", -1).limit(40))
    
    result = []
    for i, t in enumerate(testimonials):
        name = t.get("name", "")
        avatar = name[0].upper() if name else "?"
        result.append({
            "id": str(t["_id"]),
            "name": name,
            "avatar": avatar,
            "location": t.get("location", ""),
            "comment": t.get("text", ""),  # El componente espera 'comment'
            "text": t.get("text", ""),
            "rating": t.get("rating", 5),
            "amount": t.get("recovered", "$0"),  # El componente espera 'amount'
            "recovered": t.get("recovered", ""),
            "verified": True,
            "date": t.get("timeAgo", "") or (t.get("date", "").strftime("%Y-%m-%d") if isinstance(t.get("date"), datetime) else t.get("date", "")),
            "timeAgo": t.get("timeAgo", "")
        })
    
    return result

@app.post("/api/admin/update-testimonial-dates")
async def update_testimonial_dates_endpoint(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Actualizar fechas de testimonios - DINÁMICAS basadas en HOY"""
    try:
        if credentials:
            token = credentials.credentials
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            if not user or user.get("role") not in ["admin", "sub-admin"]:
                raise HTTPException(status_code=403, detail="No autorizado")
    except:
        pass
    
    testimonials_collection.delete_many({})
    
    now = datetime.utcnow()
    date_offsets = [0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
    random.shuffle(date_offsets)
    
    time_ago_labels = {
        0: "Hoy",
        1: "Ayer", 
        2: "Hace 2 días",
        3: "Hace 3 días",
        4: "Hace 4 días",
        5: "Hace 5 días",
        6: "Hace 6 días",
        7: "Hace 1 semana",
    }
    
    for i, testimonial in enumerate(DEFAULT_TESTIMONIALS):
        offset = date_offsets[i] if i < len(date_offsets) else random.randint(0, 30)
        date = now - timedelta(days=offset)
        
        if offset <= 7:
            time_ago = time_ago_labels.get(offset, f"Hace {offset} días")
        elif offset <= 14:
            time_ago = "Hace 2 semanas"
        elif offset <= 21:
            time_ago = "Hace 3 semanas"
        else:
            time_ago = "Hace 1 mes"
        
        testimonials_collection.insert_one({
            **testimonial,
            "date": date,
            "timeAgo": time_ago
        })
    
    return {"message": "Fechas de testimonios actualizadas", "count": len(DEFAULT_TESTIMONIALS)}
# ==================== NOTIFICACIONES ====================

class NotificationCreate(BaseModel):
    user_id: Optional[str] = None  # None = para todos
    title: str
    message: str
    type: str = "info"  # info, warning, success, urgent

@app.post("/api/notifications")
async def create_notification(notification: NotificationCreate, current_user: dict = Depends(get_admin_user)):
    notif_data = {
        "user_id": notification.user_id,
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "read": False,
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    }
    result = notifications_collection.insert_one(notif_data)
    return {"message": "Notificación creada", "id": str(result.inserted_id)}

@app.get("/api/notifications")
async def get_user_notifications(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    notifications = list(notifications_collection.find({
        "$or": [{"user_id": user_id}, {"user_id": None}]
    }).sort("created_at", -1).limit(50))
    
    for n in notifications:
        n["id"] = str(n["_id"])
        del n["_id"]
    return notifications

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    notifications_collection.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    return {"message": "Notificación marcada como leída"}

@app.get("/api/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    count = notifications_collection.count_documents({
        "$or": [{"user_id": user_id}, {"user_id": None}],
        "read": False
    })
    return {"count": count}

# ==================== MENSAJES / CHAT ====================

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

@app.post("/api/messages")
async def send_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    msg_data = {
        "sender_id": str(current_user["_id"]),
        "sender_name": current_user.get("name", "Usuario"),
        "sender_role": current_user.get("role", "user"),
        "receiver_id": message.receiver_id,
        "content": message.content,
        "read": False,
        "created_at": datetime.utcnow()
    }
    result = messages_collection.insert_one(msg_data)
    return {"message": "Mensaje enviado", "id": str(result.inserted_id)}

@app.get("/api/messages/{other_user_id}")
async def get_conversation(other_user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    messages = list(messages_collection.find({
        "$or": [
            {"sender_id": user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user_id}
        ]
    }).sort("created_at", 1).limit(100))
    
    # Marcar como leídos los mensajes recibidos
    messages_collection.update_many(
        {"sender_id": other_user_id, "receiver_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    for m in messages:
        m["id"] = str(m["_id"])
        del m["_id"]
        m["is_mine"] = m["sender_id"] == user_id
    return messages

@app.get("/api/messages/unread/count")
async def get_unread_messages_count(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    count = messages_collection.count_documents({
        "receiver_id": user_id,
        "read": False
    })
    return {"count": count}

@app.get("/api/admin/conversations")
async def get_admin_conversations(current_user: dict = Depends(get_admin_user)):
    # Obtener últimos mensajes únicos por usuario
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {"$cond": [
                {"$eq": ["$sender_role", "user"]},
                "$sender_id",
                "$receiver_id"
            ]},
            "last_message": {"$first": "$content"},
            "last_date": {"$first": "$created_at"},
            "sender_name": {"$first": "$sender_name"},
            "unread": {"$sum": {"$cond": [{"$eq": ["$read", False]}, 1, 0]}}
        }},
        {"$sort": {"last_date": -1}},
        {"$limit": 50}
    ]
    conversations = list(messages_collection.aggregate(pipeline))
    
    result = []
    for conv in conversations:
        if conv["_id"]:
            user = users_collection.find_one({"_id": ObjectId(conv["_id"])})
            result.append({
                "user_id": conv["_id"],
                "user_name": user.get("name", "Usuario") if user else conv.get("sender_name", "Usuario"),
                "last_message": conv["last_message"][:50] + "..." if len(conv["last_message"]) > 50 else conv["last_message"],
                "last_date": conv["last_date"].isoformat() if conv["last_date"] else None,
                "unread": conv["unread"]
            })
    return result

# ==================== RECORDATORIOS ====================

class ReminderCreate(BaseModel):
    user_id: str
    title: str
    message: str
    due_date: str
    type: str = "payment"  # payment, document, appointment

@app.post("/api/reminders")
async def create_reminder(reminder: ReminderCreate, current_user: dict = Depends(get_admin_user)):
    reminder_data = {
        "user_id": reminder.user_id,
        "title": reminder.title,
        "message": reminder.message,
        "due_date": datetime.fromisoformat(reminder.due_date.replace('Z', '+00:00')),
        "type": reminder.type,
        "completed": False,
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    }
    result = reminders_collection.insert_one(reminder_data)
    
    # También crear notificación
    notifications_collection.insert_one({
        "user_id": reminder.user_id,
        "title": f"Recordatorio: {reminder.title}",
        "message": reminder.message,
        "type": "warning",
        "read": False,
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    })
    
    return {"message": "Recordatorio creado", "id": str(result.inserted_id)}

@app.get("/api/reminders")
async def get_user_reminders(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    reminders = list(reminders_collection.find({
        "user_id": user_id,
        "completed": False
    }).sort("due_date", 1).limit(100))
    
    for r in reminders:
        r["id"] = str(r["_id"])
        del r["_id"]
        r["due_date"] = r["due_date"].isoformat() if r.get("due_date") else None
    return reminders

@app.get("/api/admin/reminders")
async def get_all_reminders(current_user: dict = Depends(get_admin_user)):
    reminders = list(reminders_collection.find().sort("due_date", 1).limit(100))
    for r in reminders:
        r["id"] = str(r["_id"])
        del r["_id"]
        r["due_date"] = r["due_date"].isoformat() if r.get("due_date") else None
        user = users_collection.find_one({"_id": ObjectId(r["user_id"])})
        r["user_name"] = user.get("name", "Usuario") if user else "Usuario"
    return reminders

# ==================== ANALYTICS ====================

@app.get("/api/admin/analytics/basic")
async def get_basic_analytics(current_user: dict = Depends(get_admin_user)):
    """Estadísticas básicas del sistema"""
    # Total usuarios
    total_users = users_collection.count_documents({"role": "user"})
    
    # Usuarios este mes
    first_day_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    users_this_month = users_collection.count_documents({
        "role": "user",
        "created_at": {"$gte": first_day_month}
    })
    
    # Total recuperado (suma de available_balance)
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$available_balance"}, "retained": {"$sum": "$retained_balance"}}}
    ]
    balances = list(profiles_collection.aggregate(pipeline))
    total_recovered = balances[0]["total"] if balances else 0
    total_retained = balances[0]["retained"] if balances else 0
    
    # Usuarios activos (con balance > 0)
    active_users = profiles_collection.count_documents({"$or": [
        {"available_balance": {"$gt": 0}},
        {"retained_balance": {"$gt": 0}}
    ]})
    
    # Mensajes sin leer
    unread_messages = messages_collection.count_documents({"read": False})
    
    # Usuarios por día (últimos 7 días)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    users_by_day = list(users_collection.aggregate([
        {"$match": {"created_at": {"$gte": seven_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]))
    
    return {
        "total_users": total_users,
        "users_this_month": users_this_month,
        "total_recovered": total_recovered,
        "total_retained": total_retained,
        "active_users": active_users,
        "unread_messages": unread_messages,
        "users_by_day": users_by_day
    }

# ==================== EXPORTAR DATOS ====================

@app.get("/api/admin/export/users")
async def export_users_pdf(current_user: dict = Depends(get_admin_user)):
    # SOLO ADMIN PRINCIPAL PUEDE EXPORTAR PDF
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador principal puede exportar datos")
    
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.units import inch
    import io
    import base64
    
    # Admin ve todos los clientes
    users = list(users_collection.find({"role": "user"}).sort("name", 1).limit(5000))
    
    # Crear PDF en memoria
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#0a1628'),
        spaceAfter=20,
        alignment=1  # Center
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#666666'),
        spaceAfter=30,
        alignment=1
    )
    
    client_name_style = ParagraphStyle(
        'ClientName',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#0a1628'),
        spaceBefore=15,
        spaceAfter=5,
        fontName='Helvetica-Bold'
    )
    
    detail_style = ParagraphStyle(
        'Detail',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#333333'),
        leftIndent=20,
        spaceBefore=2
    )
    
    balance_style = ParagraphStyle(
        'Balance',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#D4AF37'),
        leftIndent=20,
        spaceBefore=2,
        fontName='Helvetica-Bold'
    )
    
    elements = []
    
    # Título
    elements.append(Paragraph("RECUPERACIÓN DE CAPITAL", title_style))
    elements.append(Paragraph(f"Listado de Clientes - {datetime.utcnow().strftime('%d/%m/%Y')}", subtitle_style))
    elements.append(Spacer(1, 10))
    
    # Resumen
    total_balance = sum(u.get('balance', 0) or 0 for u in users)
    total_retained = sum(u.get('retained_balance', 0) or 0 for u in users)
    
    summary_data = [
        ['Total Clientes:', str(len(users))],
        ['Saldo Disponible Total:', f'${total_balance:,.2f}'],
        ['Saldo Retenido Total:', f'${total_retained:,.2f}']
    ]
    
    summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#0a1628')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#f5f5f5')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#0a1628')),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 30))
    
    # Línea separadora
    elements.append(Paragraph("_" * 70, styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Lista de clientes
    for idx, user in enumerate(users, 1):
        nombre = user.get('name', 'Sin nombre')
        email = user.get('email', 'Sin correo')
        telefono = user.get('phone', 'Sin teléfono') or 'Sin teléfono'
        password = user.get('password_plain', 'cliente123')
        saldo = user.get('balance', 0) or 0
        retenido = user.get('retained_balance', 0) or 0
        banco = user.get('bank_name', 'Sin banco') or 'Sin banco'
        cuenta = user.get('account_number', '') or ''
        
        # Número y nombre del cliente
        elements.append(Paragraph(f"<b>{idx}.- {nombre}</b>", client_name_style))
        
        # Detalles
        elements.append(Paragraph(f"Correo: {email}", detail_style))
        elements.append(Paragraph(f"Contraseña: {password}", detail_style))
        elements.append(Paragraph(f"Teléfono: {telefono}", detail_style))
        elements.append(Paragraph(f"Banco: {banco}", detail_style))
        if cuenta:
            elements.append(Paragraph(f"Número de cuenta: {cuenta}", detail_style))
        
        # Saldos en dorado
        elements.append(Paragraph(f"Saldo Disponible: ${saldo:,.2f}", balance_style))
        elements.append(Paragraph(f"Saldo Retenido: ${retenido:,.2f}", balance_style))
        
        elements.append(Spacer(1, 10))
    
    # Generar PDF
    doc.build(elements)
    
    # Convertir a base64
    pdf_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    buffer.close()
    
    return {
        "pdf": pdf_data,
        "filename": f"clientes_recuperacion_{datetime.utcnow().strftime('%Y%m%d')}.pdf",
        "total_clients": len(users)
    }

# Endpoint para generar comprobante SPEI
class SPEIReceiptData(BaseModel):
    fecha: str
    hora: str
    banco_receptor: str
    beneficiario: str
    cuenta_beneficiario: str
    curp_rfc: Optional[str] = ""
    concepto_pago: Optional[str] = ""
    monto: float

@app.post("/api/admin/generate-spei-receipt")
async def generate_spei_receipt(data: SPEIReceiptData, current_user: dict = Depends(get_admin_user)):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.units import inch
    import io
    import base64
    import random
    import string
    
    # Generar números aleatorios para el comprobante
    def gen_reference():
        return 'RTW' + ''.join(random.choices(string.digits, k=18)) + 'HBA'
    
    def gen_tracking():
        return 'BITS' + ''.join(random.choices(string.digits, k=17))
    
    def gen_certificate():
        return ''.join(random.choices(string.digits, k=16)) + '.' + ''.join(random.choices(string.digits, k=2))
    
    # Ocultar parte de la cuenta
    cuenta = data.cuenta_beneficiario
    if len(cuenta) > 4:
        cuenta_oculta = '*' * (len(cuenta) - 4) + cuenta[-4:]
    else:
        cuenta_oculta = cuenta
    
    # Crear PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch, leftMargin=0.6*inch, rightMargin=0.6*inch)
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=14, textColor=colors.HexColor('#1a237e'), alignment=1, spaceAfter=10)
    header_style = ParagraphStyle('Header', parent=styles['Normal'], fontSize=10, textColor=colors.white, fontName='Helvetica-Bold')
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#333333'))
    value_style = ParagraphStyle('Value', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#000000'), fontName='Helvetica-Bold')
    note_style = ParagraphStyle('Note', parent=styles['Normal'], fontSize=7, textColor=colors.HexColor('#666666'), leading=10)
    
    elements = []
    
    # Header con logos (simulado con texto)
    header_data = [[
        Paragraph('<font size="16"><b>BANCO</b></font><br/><font size="8">DE MÉXICO</font>', styles['Normal']),
        Paragraph('<font size="20" color="#ff6f00"><b>SPE</b></font><font size="20" color="#1a237e"><b>i</b></font><br/><font size="8">Pagos más rápidos y seguros</font>', styles['Normal'])
    ]]
    header_table = Table(header_data, colWidths=[2.5*inch, 4*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 15))
    
    # Título
    title_bar = Table([[Paragraph('<b>COMPROBANTE ELECTRÓNICO DE PAGO</b>', header_style)]], colWidths=[7*inch])
    title_bar.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ff6f00')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(title_bar)
    elements.append(Spacer(1, 15))
    
    # Datos principales
    monto_formateado = f"${data.monto:,.2f}"
    iva = "CUBIERTO"
    num_referencia = gen_reference()
    clave_rastreo = gen_tracking()
    
    main_data = [
        ['Fecha de la operación', f'{data.fecha} {data.hora} HRS'],
        ['Estatus del movimiento', f'Transferencia en proceso {monto_formateado}**'],
        ['Banco emisor', 'STP'],
        ['Ordenante', 'RECUPERACIÓN DE CAPITAL'],
        ['Cuenta ordenante (CLABE / Tarjeta debito / Número de celular)', '***************47'],
        ['Banco receptor', data.banco_receptor.upper()],
        ['Beneficiario', data.beneficiario.upper()],
        ['Cuenta beneficiaria (CLABE / Tarjeta debito / Número de celular)', cuenta_oculta],
        ['RFC o CURP del beneficiario', data.curp_rfc.upper() if data.curp_rfc else 'NO PROPORCIONADO'],
        ['Concepto de pago', data.concepto_pago.upper() if data.concepto_pago else 'TRANSFERENCIA'],
        ['Monto (Pesos en moneda nacional)', monto_formateado],
        ['IVA 16% (Pesos en moneda nacional)', iva],
        ['Número de referencia', num_referencia],
        ['Clave de rastreo', clave_rastreo],
        ['Fecha de abono a la cuenta beneficiaria', data.fecha + '.'],
    ]
    
    main_table = Table(main_data, colWidths=[2.8*inch, 4.2*inch])
    main_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f5f5')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#333333')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#000000')),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(main_table)
    elements.append(Spacer(1, 20))
    
    # Notas legales
    nota1 = """<b>NOTA:</b> La hora de abono a la cuenta beneficiaria corresponde al tiempo del Centro, de no cumplir con el horario establecido se penalizará con las multas correspondientes."""
    elements.append(Paragraph(nota1, note_style))
    elements.append(Spacer(1, 10))
    
    nota2 = """La información que contiene el presente documento corresponde a la confirmación del abono generado y firmado electrónicamente por la institución receptora (Participante receptor), del pago (Orden de Transferencia) aceptada conforme a lo establecido en el numeral 6 de la circular 17/2010 Emitida por banco de México, por lo que los datos presentados no son responsabilidad de este último."""
    elements.append(Paragraph(nota2, note_style))
    elements.append(Spacer(1, 10))
    
    nota3 = """El presente comprobante electrónico de pago se emite únicamente con fines informativos y está dirigido a los usuarios SPEI que proporcionan electrónicamente la información confidencial cuyo acceso y uso fueron previamente pactados con la institución receptora en los contratos respectivos, relativa a la Orden de Transferencia de su interés."""
    elements.append(Paragraph(nota3, note_style))
    elements.append(Spacer(1, 10))
    
    nota4 = """Para mayor información o aclaración respecto a la Orden de Transferencia, se deberá consultar a la institución que haya proporcionado el servicio de transferencia electrónica vía SPEI."""
    elements.append(Paragraph(nota4, note_style))
    elements.append(Spacer(1, 30))
    
    # Número de serie del certificado
    cert_num = gen_certificate()
    cert_text = f'<b>Número de serie del certificado de seguridad</b>{cert_num}'
    elements.append(Paragraph(cert_text, ParagraphStyle('Cert', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#333333'))))
    
    # Generar PDF
    doc.build(elements)
    
    pdf_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    buffer.close()
    
    return {
        "pdf": pdf_data,
        "filename": f"comprobante_spei_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    }

# ==================== TIMELINE / ESTADO DEL CASO ====================

CASE_STATUSES = [
    {"id": "received", "label": "Caso Recibido", "icon": "document-text"},
    {"id": "review", "label": "En Revisión", "icon": "search"},
    {"id": "processing", "label": "Procesando", "icon": "hourglass"},
    {"id": "recovering", "label": "Recuperando", "icon": "trending-up"},
    {"id": "completed", "label": "Completado", "icon": "checkmark-circle"}
]

@app.get("/api/case-statuses")
async def get_case_statuses():
    return CASE_STATUSES

@app.put("/api/admin/users/{user_id}/case-status")
async def update_case_status(user_id: str, status: dict, current_user: dict = Depends(get_admin_user)):
    profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "case_status": status.get("status"),
            "case_status_updated": datetime.utcnow(),
            "case_notes": status.get("notes", "")
        }}
    )
    
    # Crear notificación
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    status_label = next((s["label"] for s in CASE_STATUSES if s["id"] == status.get("status")), status.get("status"))
    
    notifications_collection.insert_one({
        "user_id": user_id,
        "title": "Actualización de tu caso",
        "message": f"Tu caso ha avanzado a: {status_label}",
        "type": "success",
        "read": False,
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    })
    
    return {"message": "Estado actualizado"}

# ==================== VERIFICACIÓN DE IDENTIDAD ====================

@app.put("/api/profile/verification")
async def submit_verification(data: dict, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "verification_status": "pending",
            "verification_document": data.get("document_type"),
            "verification_submitted": datetime.utcnow()
        }}
    )
    return {"message": "Verificación enviada para revisión"}

# Collection for INE verification documents
ine_verifications_collection = db["ine_verifications"]

@app.post("/api/profile/ine-verification")
async def submit_ine_verification(data: dict, current_user: dict = Depends(get_current_user)):
    """Endpoint para recibir verificación INE con imágenes capturadas"""
    user_id = str(current_user["_id"])
    
    # Validar que se recibieron las imágenes
    front_image = data.get("front_image")
    back_image = data.get("back_image")
    selfie_image = data.get("selfie_image")
    
    if not front_image or not back_image or not selfie_image:
        raise HTTPException(status_code=400, detail="Se requieren las 3 imágenes: frente, reverso y selfie")
    
    # Guardar las imágenes de verificación
    verification_doc = {
        "user_id": user_id,
        "document_type": data.get("document_type", "ine"),
        "front_image": front_image,
        "back_image": back_image,
        "selfie_image": selfie_image,
        "status": "pending",
        "submitted_at": datetime.utcnow(),
        "reviewed_at": None,
        "reviewed_by": None,
        "notes": ""
    }
    
    # Insertar o actualizar verificación existente
    existing = ine_verifications_collection.find_one({"user_id": user_id})
    if existing:
        ine_verifications_collection.update_one(
            {"user_id": user_id},
            {"$set": verification_doc}
        )
    else:
        ine_verifications_collection.insert_one(verification_doc)
    
    # Actualizar el perfil del usuario
    profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "verification_status": "pending",
            "verification_document": "ine",
            "verification_submitted": datetime.utcnow(),
            "ine_verification_complete": True
        }}
    )
    
    # Registrar en auditoría
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    log_live_activity(
        activity_type="ine_verification",
        user_id=user_id,
        user_name=user.get("name", "Usuario") if user else "Usuario",
        description="Envió verificación INE con fotos",
        icon="card"
    )
    
    return {"message": "Verificación INE enviada exitosamente", "status": "pending"}

@app.get("/api/admin/ine-verifications")
async def get_pending_ine_verifications(admin = Depends(get_admin_user)):
    """Obtener lista de verificaciones INE pendientes para el admin"""
    verifications = list(ine_verifications_collection.find({"status": "pending"}).sort("submitted_at", -1))
    
    result = []
    for v in verifications:
        user = users_collection.find_one({"_id": ObjectId(v["user_id"])})
        result.append({
            "id": str(v["_id"]),
            "user_id": v["user_id"],
            "user_name": user.get("name", "Usuario") if user else "Usuario",
            "user_email": user.get("email", "") if user else "",
            "document_type": v.get("document_type", "ine"),
            "front_image": v.get("front_image"),
            "back_image": v.get("back_image"),
            "selfie_image": v.get("selfie_image"),
            "status": v.get("status"),
            "submitted_at": v.get("submitted_at").isoformat() if v.get("submitted_at") else None
        })
    
    return result

@app.get("/api/admin/user/{user_id}/documents")
async def get_user_documents(user_id: str, admin = Depends(get_admin_user)):
    """Obtener documentos de verificación de un usuario específico (solo admin)"""
    try:
        # Buscar verificación INE del usuario
        verification = ine_verifications_collection.find_one({"user_id": user_id})
        
        if not verification:
            return {
                "has_documents": False,
                "verification_status": "none",
                "front_image": None,
                "back_image": None,
                "selfie_image": None,
                "submitted_at": None
            }
        
        return {
            "has_documents": True,
            "verification_status": verification.get("status", "pending"),
            "document_type": verification.get("document_type", "ine"),
            "front_image": verification.get("front_image"),
            "back_image": verification.get("back_image"),
            "selfie_image": verification.get("selfie_image"),
            "submitted_at": verification.get("submitted_at").isoformat() if verification.get("submitted_at") else None,
            "reviewed_at": verification.get("reviewed_at").isoformat() if verification.get("reviewed_at") else None,
            "notes": verification.get("notes", "")
        }
    except Exception as e:
        return {
            "has_documents": False,
            "error": str(e)
        }

@app.put("/api/admin/user/{user_id}/verify")
async def admin_verify_user(user_id: str, data: dict, admin = Depends(get_admin_user)):
    """Admin puede aprobar/rechazar verificación directamente desde perfil de usuario"""
    status = data.get("status", "approved")
    notes = data.get("notes", "")
    
    # Actualizar verificación INE si existe
    ine_verifications_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "status": status,
            "reviewed_at": datetime.utcnow(),
            "reviewed_by": str(admin["_id"]),
            "notes": notes
        }}
    )
    
    # Actualizar perfil del usuario
    profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "verification_status": status,
            "verification_reviewed": datetime.utcnow(),
            "verification_reviewed_by": str(admin["_id"])
        }}
    )
    
    return {"message": f"Usuario {'verificado' if status == 'approved' else 'rechazado'} exitosamente"}

@app.put("/api/admin/ine-verifications/{verification_id}")
async def review_ine_verification(verification_id: str, data: dict, admin = Depends(get_admin_user)):
    """Aprobar o rechazar una verificación INE"""
    try:
        verification = ine_verifications_collection.find_one({"_id": ObjectId(verification_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de verificación inválido")
    
    if not verification:
        raise HTTPException(status_code=404, detail="Verificación no encontrada")
    
    status = data.get("status")  # "approved" o "rejected"
    notes = data.get("notes", "")
    
    # Actualizar la verificación
    ine_verifications_collection.update_one(
        {"_id": ObjectId(verification_id)},
        {"$set": {
            "status": status,
            "reviewed_at": datetime.utcnow(),
            "reviewed_by": str(admin["_id"]),
            "notes": notes
        }}
    )
    
    # Actualizar el perfil del usuario
    profiles_collection.update_one(
        {"user_id": verification["user_id"]},
        {"$set": {
            "verification_status": status,
            "verification_reviewed": datetime.utcnow(),
            "verification_reviewed_by": str(admin["_id"])
        }}
    )
    
    # Notificar al usuario
    message = "¡Tu INE ha sido verificada exitosamente!" if status == "approved" else f"Tu verificación INE fue rechazada. {notes or 'Por favor, intenta de nuevo con imágenes más claras.'}"
    notifications_collection.insert_one({
        "user_id": verification["user_id"],
        "title": "Verificación de INE",
        "message": message,
        "type": "success" if status == "approved" else "warning",
        "read": False,
        "created_at": datetime.utcnow(),
        "created_by": str(admin["_id"])
    })
    
    return {"message": f"Verificación INE {status}"}

@app.put("/api/admin/users/{user_id}/verification")
async def update_verification_status(user_id: str, data: dict, current_user: dict = Depends(get_admin_user)):
    status = data.get("status")  # approved, rejected
    profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "verification_status": status,
            "verification_reviewed": datetime.utcnow(),
            "verification_reviewed_by": str(current_user["_id"])
        }}
    )
    
    # Notificar al usuario
    message = "¡Tu identidad ha sido verificada!" if status == "approved" else "Tu verificación fue rechazada. Por favor, intenta de nuevo."
    notifications_collection.insert_one({
        "user_id": user_id,
        "title": "Verificación de Identidad",
        "message": message,
        "type": "success" if status == "approved" else "warning",
        "read": False,
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    })
    
    return {"message": f"Verificación {status}"}

# ==================== AUDITORÍA Y CENTRO DE COMANDO ====================

@app.get("/api/admin/audit-logs")
async def get_audit_logs(limit: int = 50, admin = Depends(get_main_admin_user)):
    """Obtener registro de auditoría - Solo Admin Principal"""
    logs = list(audit_collection.find().sort("timestamp", -1).limit(limit))
    return [{
        "id": str(log["_id"]),
        "admin_id": log.get("admin_id"),
        "admin_name": log.get("admin_name"),
        "action": log.get("action"),
        "target_user_id": log.get("target_user_id"),
        "target_user_name": log.get("target_user_name"),
        "details": log.get("details", {}),
        "timestamp": log.get("timestamp").isoformat() if log.get("timestamp") else None
    } for log in logs]

@app.get("/api/admin/live-activity")
async def get_live_activity(limit: int = 30, admin = Depends(get_main_admin_user)):
    """Obtener actividad en vivo - Solo Admin Principal"""
    activities = list(activity_collection.find().sort("timestamp", -1).limit(limit))
    return [{
        "id": str(act["_id"]),
        "type": act.get("type"),
        "user_id": act.get("user_id"),
        "user_name": act.get("user_name"),
        "description": act.get("description"),
        "icon": act.get("icon", "activity"),
        "timestamp": act.get("timestamp").isoformat() if act.get("timestamp") else None
    } for act in activities]

@app.get("/api/admin/user-timeline/{user_id}")
async def get_user_timeline(user_id: str, admin = Depends(get_admin_user)):
    """Obtener línea de tiempo de un usuario"""
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        timeline = []
        
        # Registro
        if user.get("created_at"):
            timeline.append({
                "type": "registro",
                "icon": "person-add",
                "title": "Usuario registrado",
                "description": f"Se creó la cuenta con email {user.get('email', 'N/A')}",
                "timestamp": user.get("created_at").isoformat()
            })
        
        # Transacciones
        transactions = list(transactions_collection.find({"user_id": user_id}).sort("created_at", -1).limit(20))
        for tx in transactions:
            timeline.append({
                "type": "transaccion",
                "icon": "cash" if tx.get("type") == "deposit" else "arrow-up",
                "title": tx.get("description", "Transacción"),
                "description": f"${tx.get('amount', 0):,.2f} MXN",
                "timestamp": tx.get("created_at").isoformat() if tx.get("created_at") else None
            })
        
        # Notificaciones
        notifications = list(notifications_collection.find({"user_id": user_id}).sort("created_at", -1).limit(10))
        for notif in notifications:
            timeline.append({
                "type": "notificacion",
                "icon": "notifications",
                "title": notif.get("title", "Notificación"),
                "description": notif.get("message", ""),
                "timestamp": notif.get("created_at").isoformat() if notif.get("created_at") else None
            })
        
        # Cambios de perfil (auditoría)
        audit_logs = list(audit_collection.find({"target_user_id": user_id}).sort("timestamp", -1).limit(20))
        for log in audit_logs:
            timeline.append({
                "type": "cambio",
                "icon": "create",
                "title": log.get("action", "Modificación"),
                "description": f"Por: {log.get('admin_name', 'Admin')}",
                "timestamp": log.get("timestamp").isoformat() if log.get("timestamp") else None
            })
        
        # Ordenar por timestamp
        timeline.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
        
        return {
            "user_id": user_id,
            "user_name": user.get("name", "N/A"),
            "timeline": timeline[:50]  # Máximo 50 eventos
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/stats/dashboard")
async def get_admin_dashboard_stats(admin = Depends(get_main_admin_user)):
    """Estadísticas completas del dashboard - Solo Admin Principal"""
    total_users = users_collection.count_documents({"role": "user"})
    total_subadmins = users_collection.count_documents({"role": "sub_admin"})
    
    # Calcular balances
    pipeline = [
        {"$group": {
            "_id": None,
            "total_available": {"$sum": "$available_balance"},
            "total_retained": {"$sum": "$retained_balance"}
        }}
    ]
    balance_result = list(profiles_collection.aggregate(pipeline))
    total_available = balance_result[0]["total_available"] if balance_result else 0
    total_retained = balance_result[0]["total_retained"] if balance_result else 0
    
    # Usuarios por estado de caso
    case_stats = {}
    for status in ["en_proceso", "en_revision", "aprobado", "completado"]:
        case_stats[status] = profiles_collection.count_documents({"case_status": status})
    
    # Actividad reciente (últimas 24 horas)
    yesterday = datetime.utcnow() - timedelta(hours=24)
    recent_logins = activity_collection.count_documents({
        "type": "login",
        "timestamp": {"$gte": yesterday}
    })
    
    return {
        "total_users": total_users,
        "total_subadmins": total_subadmins,
        "total_available_balance": total_available,
        "total_retained_balance": total_retained,
        "total_balance": total_available + total_retained,
        "case_stats": case_stats,
        "recent_logins_24h": recent_logins
    }

# ==================== SISTEMA DE MONITOREO Y DIAGNÓSTICO ====================

def log_error(error_type: str, error_message: str, error_details: dict = None, user_id: str = None, endpoint: str = None):
    """Registrar error en la base de datos"""
    try:
        error_doc = {
            "type": error_type,
            "message": error_message,
            "details": error_details or {},
            "user_id": user_id,
            "endpoint": endpoint,
            "timestamp": datetime.utcnow(),
            "resolved": False,
            "stack_trace": traceback.format_exc() if error_details else None
        }
        error_logs_collection.insert_one(error_doc)
    except Exception as e:
        print(f"Error logging error: {e}")

def get_system_info():
    """Obtener información del sistema"""
    try:
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "memory_available_mb": round(psutil.virtual_memory().available / 1024 / 1024, 2),
            "disk_percent": psutil.disk_usage('/').percent,
            "python_version": platform.python_version(),
            "os": platform.system(),
            "os_version": platform.version()
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/health")
async def health_root():
    return {"status": "healthy", "app": "CrediFácil"}

@app.get("/api/health")
async def health_check():
    """Verificar estado del servidor y base de datos"""
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Verificar MongoDB
    try:
        client.admin.command('ping')
        health["checks"]["mongodb"] = {"status": "ok", "message": "Conexión exitosa"}
    except Exception as e:
        health["status"] = "unhealthy"
        health["checks"]["mongodb"] = {"status": "error", "message": str(e)}
        log_error("database", "MongoDB connection failed", {"error": str(e)})
    
    # Verificar colecciones
    try:
        users_count = users_collection.count_documents({})
        health["checks"]["users_collection"] = {"status": "ok", "count": users_count}
    except Exception as e:
        health["checks"]["users_collection"] = {"status": "error", "message": str(e)}
    
    # Info del sistema
    health["system"] = get_system_info()
    
    return health

@app.get("/api/admin/system/diagnostics")
async def get_system_diagnostics(current_user: dict = Depends(get_admin_user)):
    """Obtener diagnóstico completo del sistema (solo admin)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador principal puede ver diagnósticos")
    
    diagnostics = {
        "timestamp": datetime.utcnow().isoformat(),
        "server": {},
        "database": {},
        "errors": {},
        "activity": {}
    }
    
    # Info del servidor
    diagnostics["server"] = get_system_info()
    
    # Info de la base de datos
    try:
        diagnostics["database"] = {
            "status": "connected",
            "collections": {
                "users": users_collection.count_documents({}),
                "profiles": profiles_collection.count_documents({}),
                "transactions": transactions_collection.count_documents({}),
                "notifications": notifications_collection.count_documents({}),
                "messages": messages_collection.count_documents({}),
                "error_logs": error_logs_collection.count_documents({}),
            },
            "users_by_role": {
                "admin": users_collection.count_documents({"role": "admin"}),
                "sub_admin": users_collection.count_documents({"role": "sub_admin"}),
                "user": users_collection.count_documents({"role": "user"})
            }
        }
    except Exception as e:
        diagnostics["database"] = {"status": "error", "message": str(e)}
    
    # Errores recientes (últimas 24 horas)
    try:
        yesterday = datetime.utcnow() - timedelta(hours=24)
        recent_errors = list(error_logs_collection.find(
            {"timestamp": {"$gte": yesterday}},
            {"_id": 0}
        ).sort("timestamp", -1).limit(20))
        
        for error in recent_errors:
            if error.get("timestamp"):
                error["timestamp"] = error["timestamp"].isoformat()
        
        diagnostics["errors"] = {
            "count_24h": len(recent_errors),
            "unresolved": error_logs_collection.count_documents({"resolved": False}),
            "recent": recent_errors
        }
    except Exception as e:
        diagnostics["errors"] = {"error": str(e)}
    
    # Actividad reciente
    try:
        diagnostics["activity"] = {
            "logins_24h": audit_collection.count_documents({
                "type": "login",
                "timestamp": {"$gte": yesterday}
            }),
            "api_errors_24h": error_logs_collection.count_documents({
                "type": "api_error",
                "timestamp": {"$gte": yesterday}
            })
        }
    except Exception as e:
        diagnostics["activity"] = {"error": str(e)}
    
    return diagnostics

@app.get("/api/admin/system/errors")
async def get_error_logs(
    current_user: dict = Depends(get_admin_user),
    limit: int = 50,
    unresolved_only: bool = False
):
    """Obtener logs de errores (solo admin)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador principal puede ver errores")
    
    query = {}
    if unresolved_only:
        query["resolved"] = False
    
    errors = list(error_logs_collection.find(query).sort("timestamp", -1).limit(limit))
    
    for error in errors:
        error["_id"] = str(error["_id"])
        if error.get("timestamp"):
            error["timestamp"] = error["timestamp"].isoformat()
    
    return {
        "total": error_logs_collection.count_documents(query),
        "errors": errors
    }

@app.post("/api/admin/system/errors/{error_id}/resolve")
async def resolve_error(error_id: str, current_user: dict = Depends(get_admin_user)):
    """Marcar error como resuelto"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador principal puede resolver errores")
    
    result = error_logs_collection.update_one(
        {"_id": ObjectId(error_id)},
        {"$set": {"resolved": True, "resolved_at": datetime.utcnow(), "resolved_by": current_user["email"]}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Error no encontrado")
    
    return {"message": "Error marcado como resuelto"}

class ErrorReport(BaseModel):
    error_type: str
    message: str
    screen: Optional[str] = None
    user_action: Optional[str] = None
    device_info: Optional[dict] = None
    stack_trace: Optional[str] = None

@app.post("/api/report-error")
async def report_error_from_app(report: ErrorReport, request: Request):
    """Recibir reportes de error desde la app móvil"""
    try:
        error_doc = {
            "type": report.error_type,
            "message": report.message,
            "screen": report.screen,
            "user_action": report.user_action,
            "device_info": report.device_info or {},
            "stack_trace": report.stack_trace,
            "source": "mobile_app",
            "ip_address": request.client.host if request.client else None,
            "timestamp": datetime.utcnow(),
            "resolved": False
        }
        
        result = error_logs_collection.insert_one(error_doc)
        
        return {"message": "Error reportado", "error_id": str(result.inserted_id)}
    except Exception as e:
        return {"message": "Error al reportar", "error": str(e)}

@app.get("/api/admin/system/summary")
async def get_system_summary(current_user: dict = Depends(get_admin_user)):
    """Resumen ejecutivo del sistema para el admin"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador principal")
    
    yesterday = datetime.utcnow() - timedelta(hours=24)
    last_week = datetime.utcnow() - timedelta(days=7)
    
    # Estadísticas de usuarios
    total_users = users_collection.count_documents({"role": "user"})
    users_this_week = users_collection.count_documents({
        "role": "user",
        "created_at": {"$gte": last_week}
    })
    
    # Estadísticas financieras
    pipeline = [
        {"$match": {"role": "user"}},
        {"$group": {
            "_id": None,
            "total_available": {"$sum": {"$ifNull": ["$balance", 0]}},
            "total_retained": {"$sum": {"$ifNull": ["$retained_balance", 0]}}
        }}
    ]
    financial = list(users_collection.aggregate(pipeline))
    
    # Errores
    errors_24h = error_logs_collection.count_documents({"timestamp": {"$gte": yesterday}})
    unresolved_errors = error_logs_collection.count_documents({"resolved": False})
    
    # Actividad
    logins_24h = audit_collection.count_documents({
        "type": "login",
        "timestamp": {"$gte": yesterday}
    })
    
    # Estado del sistema
    system_info = get_system_info()
    
    # Determinar estado general
    status = "🟢 Todo funcionando correctamente"
    alerts = []
    
    if unresolved_errors > 0:
        alerts.append(f"⚠️ {unresolved_errors} errores sin resolver")
        status = "🟡 Atención requerida"
    
    if system_info.get("cpu_percent", 0) > 80:
        alerts.append(f"⚠️ CPU al {system_info['cpu_percent']}%")
        status = "🟡 Atención requerida"
    
    if system_info.get("memory_percent", 0) > 85:
        alerts.append(f"⚠️ Memoria al {system_info['memory_percent']}%")
        status = "🟡 Atención requerida"
    
    if errors_24h > 10:
        alerts.append(f"🔴 {errors_24h} errores en las últimas 24h")
        status = "🔴 Problema detectado"
    
    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "alerts": alerts,
        "stats": {
            "total_clients": total_users,
            "new_clients_this_week": users_this_week,
            "total_available_balance": financial[0]["total_available"] if financial else 0,
            "total_retained_balance": financial[0]["total_retained"] if financial else 0,
            "logins_24h": logins_24h,
            "errors_24h": errors_24h,
            "unresolved_errors": unresolved_errors
        },
        "system": {
            "cpu": f"{system_info.get('cpu_percent', 'N/A')}%",
            "memory": f"{system_info.get('memory_percent', 'N/A')}%",
            "disk": f"{system_info.get('disk_percent', 'N/A')}%"
        }
    }

# Middleware para capturar errores automáticamente
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        # Registrar el error
        log_error(
            error_type="api_error",
            error_message=str(e),
            error_details={
                "path": request.url.path,
                "method": request.method,
                "error_class": e.__class__.__name__
            },
            endpoint=request.url.path
        )
        raise

# ==================== SISTEMA DE AUTO-REPARACIÓN ====================

class RepairResult(BaseModel):
    issue: str
    status: str  # "fixed", "failed", "not_needed"
    details: str

@app.post("/api/admin/system/auto-repair")
async def auto_repair_system(current_user: dict = Depends(get_admin_user)):
    """Sistema de auto-diagnóstico y reparación automática"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador principal puede ejecutar reparaciones")
    
    repairs = []
    
    # 1. Verificar y reparar conexión a MongoDB
    try:
        client.admin.command('ping')
        repairs.append({
            "issue": "Conexión a MongoDB",
            "status": "ok",
            "details": "Conexión funcionando correctamente"
        })
    except Exception as e:
        try:
            # Intentar reconectar creando nueva conexión
            new_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=10000)
            new_db = new_client[DB_NAME]
            
            new_client.admin.command('ping')
            repairs.append({
                "issue": "Conexión a MongoDB",
                "status": "fixed",
                "details": "Reconexión exitosa a la base de datos"
            })
        except Exception as e2:
            repairs.append({
                "issue": "Conexión a MongoDB",
                "status": "failed",
                "details": f"No se pudo reconectar: {str(e2)}"
            })
    
    # 2. Verificar integridad de usuarios
    try:
        # Buscar usuarios sin campos obligatorios
        users_sin_role = list(users_collection.find({"role": {"$exists": False}}))
        users_sin_email = list(users_collection.find({"email": {"$exists": False}}))
        
        fixed_count = 0
        
        # Reparar usuarios sin role
        for user in users_sin_role:
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"role": "user"}}
            )
            fixed_count += 1
        
        # Eliminar usuarios sin email (datos corruptos)
        if users_sin_email:
            users_collection.delete_many({"email": {"$exists": False}})
            fixed_count += len(users_sin_email)
        
        if fixed_count > 0:
            repairs.append({
                "issue": "Integridad de usuarios",
                "status": "fixed",
                "details": f"Se repararon {fixed_count} registros de usuarios"
            })
        else:
            repairs.append({
                "issue": "Integridad de usuarios",
                "status": "ok",
                "details": "Todos los usuarios tienen datos válidos"
            })
    except Exception as e:
        repairs.append({
            "issue": "Integridad de usuarios",
            "status": "failed",
            "details": str(e)
        })
    
    # 3. Verificar y corregir saldos negativos
    try:
        users_saldo_negativo = list(users_collection.find({
            "$or": [
                {"balance": {"$lt": 0}},
                {"retained_balance": {"$lt": 0}}
            ]
        }))
        
        fixed_count = 0
        for user in users_saldo_negativo:
            update = {}
            if user.get("balance", 0) < 0:
                update["balance"] = 0
            if user.get("retained_balance", 0) < 0:
                update["retained_balance"] = 0
            
            if update:
                users_collection.update_one({"_id": user["_id"]}, {"$set": update})
                fixed_count += 1
                
                # Registrar en audit
                audit_collection.insert_one({
                    "type": "auto_repair",
                    "action": "saldo_negativo_corregido",
                    "user_id": str(user["_id"]),
                    "user_email": user.get("email"),
                    "timestamp": datetime.utcnow(),
                    "details": f"Saldos negativos corregidos a 0"
                })
        
        if fixed_count > 0:
            repairs.append({
                "issue": "Saldos negativos",
                "status": "fixed",
                "details": f"Se corrigieron {fixed_count} usuarios con saldos negativos"
            })
        else:
            repairs.append({
                "issue": "Saldos negativos",
                "status": "ok",
                "details": "Ningún usuario tiene saldos negativos"
            })
    except Exception as e:
        repairs.append({
            "issue": "Saldos negativos",
            "status": "failed",
            "details": str(e)
        })
    
    # 4. Verificar y asignar admin a usuarios huérfanos
    try:
        admin = users_collection.find_one({"email": "admin@recuperacioncapital.com"})
        if admin:
            admin_id = str(admin["_id"])
            
            # Buscar usuarios sin admin asignado
            users_sin_admin = list(users_collection.find({
                "role": "user",
                "$or": [
                    {"assigned_admin": {"$exists": False}},
                    {"assigned_admin": None},
                    {"assigned_admin": ""}
                ]
            }))
            
            fixed_count = 0
            for user in users_sin_admin:
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"assigned_admin": admin_id}}
                )
                
                # Agregar a assigned_users del admin
                users_collection.update_one(
                    {"_id": admin["_id"]},
                    {"$addToSet": {"assigned_users": str(user["_id"])}}
                )
                fixed_count += 1
            
            if fixed_count > 0:
                repairs.append({
                    "issue": "Usuarios huérfanos",
                    "status": "fixed",
                    "details": f"Se asignaron {fixed_count} usuarios al admin principal"
                })
            else:
                repairs.append({
                    "issue": "Usuarios huérfanos",
                    "status": "ok",
                    "details": "Todos los usuarios tienen admin asignado"
                })
    except Exception as e:
        repairs.append({
            "issue": "Usuarios huérfanos",
            "status": "failed",
            "details": str(e)
        })
    
    # 5. Limpiar notificaciones antiguas (más de 30 días)
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        result = notifications_collection.delete_many({
            "created_at": {"$lt": thirty_days_ago},
            "read": True
        })
        
        if result.deleted_count > 0:
            repairs.append({
                "issue": "Limpieza de notificaciones",
                "status": "fixed",
                "details": f"Se eliminaron {result.deleted_count} notificaciones antiguas leídas"
            })
        else:
            repairs.append({
                "issue": "Limpieza de notificaciones",
                "status": "ok",
                "details": "No hay notificaciones antiguas para limpiar"
            })
    except Exception as e:
        repairs.append({
            "issue": "Limpieza de notificaciones",
            "status": "failed",
            "details": str(e)
        })
    
    # 6. Verificar emails duplicados
    try:
        pipeline = [
            {"$group": {"_id": "$email", "count": {"$sum": 1}, "ids": {"$push": "$_id"}}},
            {"$match": {"count": {"$gt": 1}}}
        ]
        duplicates = list(users_collection.aggregate(pipeline))
        
        fixed_count = 0
        for dup in duplicates:
            # Mantener el primero, eliminar los demás
            ids_to_delete = dup["ids"][1:]  # Todos menos el primero
            for oid in ids_to_delete:
                users_collection.delete_one({"_id": oid})
                fixed_count += 1
        
        if fixed_count > 0:
            repairs.append({
                "issue": "Emails duplicados",
                "status": "fixed",
                "details": f"Se eliminaron {fixed_count} registros duplicados"
            })
        else:
            repairs.append({
                "issue": "Emails duplicados",
                "status": "ok",
                "details": "No hay emails duplicados"
            })
    except Exception as e:
        repairs.append({
            "issue": "Emails duplicados",
            "status": "failed",
            "details": str(e)
        })
    
    # 7. Verificar y crear índices de base de datos
    try:
        # Crear índices importantes si no existen
        users_collection.create_index("email", unique=True, sparse=True)
        users_collection.create_index("role")
        users_collection.create_index("assigned_admin")
        transactions_collection.create_index("user_id")
        transactions_collection.create_index("created_at")
        notifications_collection.create_index("user_id")
        error_logs_collection.create_index("timestamp")
        
        repairs.append({
            "issue": "Índices de base de datos",
            "status": "fixed",
            "details": "Índices verificados y creados"
        })
    except Exception as e:
        repairs.append({
            "issue": "Índices de base de datos",
            "status": "failed",
            "details": str(e)
        })
    
    # 8. Limpiar errores antiguos resueltos (más de 7 días)
    try:
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        result = error_logs_collection.delete_many({
            "resolved": True,
            "timestamp": {"$lt": seven_days_ago}
        })
        
        if result.deleted_count > 0:
            repairs.append({
                "issue": "Limpieza de logs de errores",
                "status": "fixed",
                "details": f"Se eliminaron {result.deleted_count} logs antiguos resueltos"
            })
        else:
            repairs.append({
                "issue": "Limpieza de logs de errores",
                "status": "ok",
                "details": "No hay logs antiguos para limpiar"
            })
    except Exception as e:
        repairs.append({
            "issue": "Limpieza de logs de errores",
            "status": "failed",
            "details": str(e)
        })
    
    # Resumen final
    total_fixed = len([r for r in repairs if r["status"] == "fixed"])
    total_failed = len([r for r in repairs if r["status"] == "failed"])
    total_ok = len([r for r in repairs if r["status"] == "ok"])
    
    status = "✅ Sistema reparado correctamente"
    if total_failed > 0:
        status = f"⚠️ {total_failed} reparaciones fallaron"
    elif total_fixed == 0:
        status = "✅ Sistema en buen estado, no requiere reparaciones"
    
    # Registrar la reparación
    audit_collection.insert_one({
        "type": "system_repair",
        "admin_email": current_user.get("email"),
        "timestamp": datetime.utcnow(),
        "repairs": repairs,
        "summary": {
            "fixed": total_fixed,
            "failed": total_failed,
            "ok": total_ok
        }
    })
    
    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "summary": {
            "total_checks": len(repairs),
            "fixed": total_fixed,
            "failed": total_failed,
            "ok": total_ok
        },
        "repairs": repairs
    }

@app.get("/api/admin/system/deep-scan")
async def deep_system_scan(current_user: dict = Depends(get_admin_user)):
    """Escaneo profundo del sistema para detectar todos los problemas"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador principal")
    
    issues = []
    warnings = []
    info = []
    
    # 1. Escanear usuarios
    try:
        total_users = users_collection.count_documents({})
        users_role_user = users_collection.count_documents({"role": "user"})
        users_sin_password = users_collection.count_documents({
            "role": "user",
            "$or": [
                {"password_plain": {"$exists": False}},
                {"password_plain": None},
                {"password_plain": ""}
            ]
        })
        users_sin_saldo = users_collection.count_documents({
            "role": "user",
            "$or": [
                {"balance": {"$exists": False}},
                {"balance": None}
            ]
        })
        
        if users_sin_password > 0:
            warnings.append(f"⚠️ {users_sin_password} usuarios sin contraseña guardada")
        
        if users_sin_saldo > 0:
            issues.append(f"🔴 {users_sin_saldo} usuarios sin saldo definido")
        
        info.append(f"📊 Total usuarios: {total_users} ({users_role_user} clientes)")
    except Exception as e:
        issues.append(f"🔴 Error escaneando usuarios: {str(e)}")
    
    # 2. Escanear transacciones
    try:
        total_transactions = transactions_collection.count_documents({})
        trans_sin_user = transactions_collection.count_documents({
            "$or": [
                {"user_id": {"$exists": False}},
                {"user_id": None}
            ]
        })
        
        if trans_sin_user > 0:
            warnings.append(f"⚠️ {trans_sin_user} transacciones sin usuario asociado")
        
        info.append(f"📊 Total transacciones: {total_transactions}")
    except Exception as e:
        issues.append(f"🔴 Error escaneando transacciones: {str(e)}")
    
    # 3. Verificar consistencia de saldos
    try:
        # Verificar que los saldos no sean negativos
        negative_balance = users_collection.count_documents({"balance": {"$lt": 0}})
        negative_retained = users_collection.count_documents({"retained_balance": {"$lt": 0}})
        
        if negative_balance > 0:
            issues.append(f"🔴 {negative_balance} usuarios con crédito disponible negativo")
        
        if negative_retained > 0:
            issues.append(f"🔴 {negative_retained} usuarios con saldo retenido negativo")
    except Exception as e:
        issues.append(f"🔴 Error verificando saldos: {str(e)}")
    
    # 4. Verificar base de datos
    try:
        db_stats = db.command("dbstats")
        storage_mb = round(db_stats.get("storageSize", 0) / 1024 / 1024, 2)
        
        info.append(f"💾 Tamaño de base de datos: {storage_mb} MB")
        
        if storage_mb > 400:  # Advertir si supera 400MB (límite free tier)
            warnings.append(f"⚠️ Base de datos cercana al límite ({storage_mb}MB / 512MB)")
    except Exception as e:
        warnings.append(f"⚠️ No se pudo obtener estadísticas de BD: {str(e)}")
    
    # 5. Verificar errores no resueltos
    try:
        unresolved = error_logs_collection.count_documents({"resolved": False})
        if unresolved > 0:
            warnings.append(f"⚠️ {unresolved} errores sin resolver en el sistema")
        
        # Errores en las últimas 24 horas
        yesterday = datetime.utcnow() - timedelta(hours=24)
        errors_24h = error_logs_collection.count_documents({"timestamp": {"$gte": yesterday}})
        if errors_24h > 5:
            issues.append(f"🔴 {errors_24h} errores en las últimas 24 horas")
    except Exception as e:
        warnings.append(f"⚠️ No se pudo verificar logs de errores: {str(e)}")
    
    # 6. Verificar sistema
    try:
        system_info = get_system_info()
        
        if system_info.get("cpu_percent", 0) > 80:
            issues.append(f"🔴 CPU muy alto: {system_info['cpu_percent']}%")
        elif system_info.get("cpu_percent", 0) > 60:
            warnings.append(f"⚠️ CPU elevado: {system_info['cpu_percent']}%")
        
        if system_info.get("memory_percent", 0) > 85:
            issues.append(f"🔴 Memoria muy alta: {system_info['memory_percent']}%")
        elif system_info.get("memory_percent", 0) > 70:
            warnings.append(f"⚠️ Memoria elevada: {system_info['memory_percent']}%")
        
        if system_info.get("disk_percent", 0) > 90:
            issues.append(f"🔴 Disco casi lleno: {system_info['disk_percent']}%")
        elif system_info.get("disk_percent", 0) > 75:
            warnings.append(f"⚠️ Disco elevado: {system_info['disk_percent']}%")
        
        info.append(f"🖥️ CPU: {system_info.get('cpu_percent', 'N/A')}% | RAM: {system_info.get('memory_percent', 'N/A')}% | Disco: {system_info.get('disk_percent', 'N/A')}%")
    except Exception as e:
        warnings.append(f"⚠️ No se pudo verificar sistema: {str(e)}")
    
    # Determinar estado general
    if len(issues) > 0:
        status = "🔴 CRÍTICO - Se requiere atención inmediata"
    elif len(warnings) > 0:
        status = "🟡 ADVERTENCIA - Revisar problemas menores"
    else:
        status = "🟢 SALUDABLE - Todo funciona correctamente"
    
    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "counts": {
            "critical_issues": len(issues),
            "warnings": len(warnings),
            "info": len(info)
        },
        "critical_issues": issues,
        "warnings": warnings,
        "info": info,
        "recommendation": "Ejecuta /api/admin/system/auto-repair para corregir problemas automáticamente" if len(issues) > 0 else "Sistema en buen estado"
    }

# ============================================
# PÁGINAS WEB ESTÁTICAS
# ============================================

@app.get("/terminos", response_class=HTMLResponse)
async def terminos_page():
    """Página de Términos y Condiciones"""
    file_path = STATIC_DIR / "terminos.html"
    if file_path.exists():
        return HTMLResponse(content=file_path.read_text(encoding='utf-8'))
    raise HTTPException(status_code=404, detail="Página no encontrada")

@app.get("/privacidad", response_class=HTMLResponse)
async def privacidad_page():
    """Página de Política de Privacidad"""
    file_path = STATIC_DIR / "privacidad.html"
    if file_path.exists():
        return HTMLResponse(content=file_path.read_text(encoding='utf-8'))
    raise HTTPException(status_code=404, detail="Página no encontrada")

@app.get("/guia-instalacion", response_class=HTMLResponse)
async def guia_instalacion_page():
    """Guía de Instalación de la App"""
    file_path = STATIC_DIR / "guia-instalacion.html"
    if file_path.exists():
        return HTMLResponse(content=file_path.read_text(encoding='utf-8'))
    raise HTTPException(status_code=404, detail="Página no encontrada")

@app.get("/guia-rapida", response_class=HTMLResponse)
async def guia_rapida_page():
    """Guía Rápida"""
    file_path = STATIC_DIR / "guia-rapida.html"
    if file_path.exists():
        return HTMLResponse(content=file_path.read_text(encoding='utf-8'))
    raise HTTPException(status_code=404, detail="Página no encontrada")

@app.get("/instalar-iphone", response_class=HTMLResponse)
async def instalar_iphone_page():
    """Guía de Instalación para iPhone"""
    file_path = STATIC_DIR / "instalar-iphone.html"
    if file_path.exists():
        return HTMLResponse(content=file_path.read_text(encoding='utf-8'))
    raise HTTPException(status_code=404, detail="Página no encontrada")

@app.get("/landing", response_class=HTMLResponse)
async def landing_page():
    """Landing Page"""
    file_path = STATIC_DIR / "landing.html"
    if file_path.exists():
        return HTMLResponse(content=file_path.read_text(encoding='utf-8'))
    raise HTTPException(status_code=404, detail="Página no encontrada")

@app.get("/datos-institucionales", response_class=HTMLResponse)
async def datos_institucionales_page():
    """Datos Institucionales"""
    file_path = STATIC_DIR / "datos-institucionales.html"
    if file_path.exists():
        return HTMLResponse(content=file_path.read_text(encoding='utf-8'))
    raise HTTPException(status_code=404, detail="Página no encontrada")

@app.get("/", response_class=HTMLResponse)
async def home_page():
    """Página Principal - Redirige a Landing"""
    file_path = STATIC_DIR / "landing.html"
    if file_path.exists():
        return HTMLResponse(content=file_path.read_text(encoding='utf-8'))
    return HTMLResponse(content="<h1>CrediFácil</h1><p>API funcionando correctamente</p>")

# ============================================
# PÁGINAS LEGALES
# ============================================
@app.get("/guia-instalacion", response_class=HTMLResponse)
@app.get("/api/guia-instalacion", response_class=HTMLResponse)
async def installation_guide():
    """Guía de Instalación CrediFácil"""
    html_content = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Guía de Instalación - CrediFácil</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .guide-container {
                max-width: 420px;
                margin: 0 auto;
                background: white;
                border-radius: 24px;
                box-shadow: 0 20px 60px rgba(22, 163, 74, 0.15);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                color: white;
                padding: 30px 25px;
                text-align: center;
            }
            .logo {
                font-size: 36px;
                font-weight: 800;
                margin-bottom: 5px;
            }
            .logo span { color: #86efac; }
            .subtitle {
                font-size: 14px;
                opacity: 0.9;
            }
            .title-section {
                background: #f0fdf4;
                padding: 20px 25px;
                text-align: center;
                border-bottom: 2px solid #dcfce7;
            }
            .title-section h1 {
                color: #15803d;
                font-size: 22px;
                font-weight: 700;
            }
            .title-section p {
                color: #166534;
                font-size: 13px;
                margin-top: 5px;
            }
            .steps-container {
                padding: 25px;
            }
            .step {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 25px;
                padding-bottom: 25px;
                border-bottom: 1px dashed #e5e7eb;
            }
            .step:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            .step-number {
                width: 44px;
                height: 44px;
                background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 18px;
                flex-shrink: 0;
                box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
            }
            .step-content h3 {
                color: #15803d;
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 6px;
            }
            .step-content p {
                color: #4b5563;
                font-size: 13px;
                line-height: 1.5;
            }
            .step-content .highlight {
                background: #dcfce7;
                color: #166534;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 600;
                font-size: 12px;
            }
            .warning-box {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 12px;
                padding: 15px;
                margin: 0 25px 25px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }
            .warning-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            .warning-text {
                font-size: 12px;
                color: #92400e;
                line-height: 1.5;
            }
            .warning-text strong {
                color: #78350f;
            }
            .footer {
                background: #15803d;
                color: white;
                padding: 20px 25px;
                text-align: center;
            }
            .footer p {
                font-size: 12px;
                opacity: 0.9;
                margin-bottom: 10px;
            }
            .footer .contact {
                font-size: 14px;
                font-weight: 600;
            }
            .badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(255,255,255,0.15);
                padding: 8px 16px;
                border-radius: 20px;
                margin-top: 15px;
                font-size: 12px;
            }
            .android-icon {
                width: 18px;
                height: 18px;
                background: #a4c639;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
            }
        </style>
    </head>
    <body>
        <div class="guide-container">
            <div class="header">
                <div class="logo">Credi<span>Fácil</span></div>
                <div class="subtitle">Tu aliado financiero de confianza</div>
            </div>
            
            <div class="title-section">
                <h1>📱 Guía de Instalación</h1>
                <p>Sigue estos sencillos pasos para instalar la app</p>
            </div>
            
            <div class="steps-container">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h3>Descarga el archivo APK</h3>
                        <p>Descarga el archivo <span class="highlight">CrediFacil.apk</span> desde el enlace que te compartimos por WhatsApp o correo.</p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h3>Permite orígenes desconocidos</h3>
                        <p>Ve a <strong>Ajustes → Seguridad</strong> y activa <span class="highlight">Orígenes desconocidos</span> o <span class="highlight">Instalar apps desconocidas</span>.</p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h3>Abre el archivo descargado</h3>
                        <p>Busca el archivo en tu carpeta de <strong>Descargas</strong> y tócalo para iniciar la instalación.</p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h3>Confirma la instalación</h3>
                        <p>Presiona <span class="highlight">Instalar</span> cuando aparezca el mensaje. Espera unos segundos a que termine.</p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">5</div>
                    <div class="step-content">
                        <h3>¡Listo! Abre CrediFácil</h3>
                        <p>Busca el ícono verde de <strong>CrediFácil</strong> en tu pantalla y regístrate para comenzar.</p>
                    </div>
                </div>
            </div>
            
            <div class="warning-box">
                <div class="warning-icon">⚠️</div>
                <div class="warning-text">
                    <strong>Importante:</strong> Si tu teléfono muestra una alerta de seguridad, es normal. Solo presiona "Instalar de todos modos" para continuar.
                </div>
            </div>
            
            <div class="footer">
                <p>¿Necesitas ayuda con la instalación?</p>
                <div class="contact">📞 Llámanos al 800-CREDIFACIL</div>
                <div class="badge">
                    <div class="android-icon">🤖</div>
                    Compatible con Android 8.0+
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/privacidad.html", response_class=HTMLResponse)
@app.get("/api/privacidad.html", response_class=HTMLResponse)
async def privacy_policy():
    """Aviso de Privacidad"""
    html_content = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Aviso de Privacidad - CrediFácil</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px 20px; text-align: center; border-radius: 12px; margin-bottom: 20px; }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .header p { opacity: 0.9; font-size: 14px; }
            .card { background: white; border-radius: 12px; padding: 25px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .card h2 { color: #16a34a; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #16a34a; padding-bottom: 8px; }
            .card p, .card li { font-size: 14px; margin-bottom: 10px; }
            .card ul { padding-left: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Aviso de Privacidad</h1>
                <p>CrediFácil Financiero, S.A. de C.V.</p>
            </div>
            
            <div class="card">
                <h2>1. Identidad del Responsable</h2>
                <p>CrediFácil Financiero, S.A. de C.V. (en adelante "CrediFácil") con domicilio en Ciudad de México, México, es responsable del tratamiento de sus datos personales.</p>
            </div>
            
            <div class="card">
                <h2>2. Datos Personales Recabados</h2>
                <p>Para las finalidades señaladas, recabamos los siguientes datos personales:</p>
                <ul>
                    <li>Nombre completo</li>
                    <li>Correo electrónico</li>
                    <li>Número telefónico</li>
                    <li>Información financiera para evaluación crediticia</li>
                </ul>
            </div>
            
            <div class="card">
                <h2>3. Finalidades del Tratamiento</h2>
                <p>Sus datos personales serán utilizados para:</p>
                <ul>
                    <li>Evaluación y otorgamiento de créditos</li>
                    <li>Gestión de su cuenta y servicios contratados</li>
                    <li>Comunicación sobre productos y promociones</li>
                    <li>Cumplimiento de obligaciones legales</li>
                </ul>
            </div>
            
            <div class="card">
                <h2>4. Derechos ARCO</h2>
                <p>Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales. Para ejercer estos derechos, envíe un correo a: <strong>privacidad@credifacil.com</strong></p>
            </div>
            
            <div class="card">
                <h2>5. Seguridad de Datos</h2>
                <p>CrediFácil implementa medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales contra daño, pérdida, alteración, destrucción o uso no autorizado.</p>
            </div>
            
            <div class="footer">
                <p>Última actualización: Enero 2026</p>
                <p>© 2026 CrediFácil Financiero, S.A. de C.V. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/terminos.html", response_class=HTMLResponse)
@app.get("/api/terminos.html", response_class=HTMLResponse)
async def terms_conditions():
    """Términos y Condiciones"""
    html_content = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Términos y Condiciones - CrediFácil</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px 20px; text-align: center; border-radius: 12px; margin-bottom: 20px; }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .header p { opacity: 0.9; font-size: 14px; }
            .card { background: white; border-radius: 12px; padding: 25px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .card h2 { color: #16a34a; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #16a34a; padding-bottom: 8px; }
            .card p, .card li { font-size: 14px; margin-bottom: 10px; }
            .card ul { padding-left: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Términos y Condiciones</h1>
                <p>CrediFácil Financiero, S.A. de C.V.</p>
            </div>
            
            <div class="card">
                <h2>1. Aceptación de Términos</h2>
                <p>Al utilizar la aplicación CrediFácil, usted acepta estos términos y condiciones en su totalidad. Si no está de acuerdo, le pedimos no utilizar nuestros servicios.</p>
            </div>
            
            <div class="card">
                <h2>2. Servicios Ofrecidos</h2>
                <p>CrediFácil ofrece servicios de crédito y financiamiento, incluyendo:</p>
                <ul>
                    <li>Evaluación crediticia</li>
                    <li>Otorgamiento de préstamos personales</li>
                    <li>Simulador de créditos</li>
                    <li>Gestión de pagos y cuenta</li>
                </ul>
            </div>
            
            <div class="card">
                <h2>3. Requisitos del Usuario</h2>
                <ul>
                    <li>Ser mayor de 18 años</li>
                    <li>Proporcionar información veraz y actualizada</li>
                    <li>Mantener la confidencialidad de sus credenciales</li>
                    <li>Cumplir con las obligaciones de pago acordadas</li>
                </ul>
            </div>
            
            <div class="card">
                <h2>4. Tasas y Comisiones</h2>
                <p>Las tasas de interés y comisiones aplicables serán informadas de manera clara antes de la contratación de cualquier crédito. El CAT (Costo Anual Total) se calculará conforme a las disposiciones de CONDUSEF.</p>
            </div>
            
            <div class="card">
                <h2>5. Responsabilidades</h2>
                <p>CrediFácil no será responsable por:</p>
                <ul>
                    <li>Uso indebido de la aplicación por parte del usuario</li>
                    <li>Información incorrecta proporcionada por el usuario</li>
                    <li>Fallas técnicas fuera de nuestro control</li>
                </ul>
            </div>
            
            <div class="card">
                <h2>6. Modificaciones</h2>
                <p>CrediFácil se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la aplicación.</p>
            </div>
            
            <div class="card">
                <h2>7. Contacto</h2>
                <p>Para dudas o aclaraciones sobre estos términos, contáctenos en: <strong>soporte@credifacil.com</strong></p>
            </div>
            
            <div class="footer">
                <p>Última actualización: Enero 2026</p>
                <p>© 2026 CrediFácil Financiero, S.A. de C.V. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

# ============================================
# SISTEMA DE MONITOREO AUTOMÁTICO 24/7
# ============================================
import threading
import time
import requests

ENDPOINTS_TO_MONITOR = [
    "/api/health",
    "/api/testimonials",
    "/terminos",
    "/privacidad",
    "/guia-rapida",
    "/datos-institucionales",
    "/landing"
]

def self_ping():
    """Hace ping a sí mismo cada 4 minutos para mantenerse activo"""
    base_url = "https://credifacil-1.onrender.com"
    while True:
        try:
            for endpoint in ENDPOINTS_TO_MONITOR:
                requests.get(f"{base_url}{endpoint}", timeout=10)
            print(f"[MONITOR] Ping exitoso - {datetime.now()}")
        except Exception as e:
            print(f"[MONITOR] Error en ping: {e}")
        time.sleep(30)  # 30 segundos - ping constante

# Iniciar monitoreo en background
monitor_thread = threading.Thread(target=self_ping, daemon=True)
monitor_thread.start()
print("[MONITOR] Sistema de monitoreo 24/7 iniciado")

@app.get("/api/monitor/full")
async def full_system_monitor():
    """Endpoint de monitoreo completo del sistema"""
    results = {
        "timestamp": datetime.now().isoformat(),
        "status": "operational",
        "checks": {}
    }
    
    # Check MongoDB
    try:
        db.command('ping')
        results["checks"]["database"] = {"status": "ok", "message": "MongoDB conectado"}
    except Exception as e:
        results["checks"]["database"] = {"status": "error", "message": str(e)}
        results["status"] = "degraded"
    
    # Check usuarios
    try:
        user_count = users_collection.count_documents({})
        results["checks"]["users"] = {"status": "ok", "count": user_count}
    except Exception as e:
        results["checks"]["users"] = {"status": "error", "message": str(e)}
    
    # Check perfiles
    try:
        profile_count = profiles_collection.count_documents({})
        results["checks"]["profiles"] = {"status": "ok", "count": profile_count}
    except Exception as e:
        results["checks"]["profiles"] = {"status": "error", "message": str(e)}
    
    # Check testimonios
    try:
        testimonial_count = testimonials_collection.count_documents({})
        results["checks"]["testimonials"] = {"status": "ok", "count": testimonial_count}
    except Exception as e:
        results["checks"]["testimonials"] = {"status": "error", "message": str(e)}
    
    return results

# ============================================
# CAMBIO DE CONTRASEÑA
# ============================================

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class AdminChangePasswordRequest(BaseModel):
    user_id: str
    new_password: str

@app.post("/api/user/change-password")
async def change_password(data: ChangePasswordRequest, current_user = Depends(get_current_user)):
    """Usuario cambia su propia contraseña"""
    try:
        user = users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar contraseña actual
        if not verify_password(data.current_password, user["password"]):
            raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
        
        # Hashear nueva contraseña
        new_hashed = hash_password(data.new_password)
        
        # Actualizar en DB
        users_collection.update_one(
            {"_id": ObjectId(current_user["user_id"])},
            {"$set": {
                "password": new_hashed,
                "plain_password": data.new_password,  # Para que admin vea
                "password_changed_at": datetime.utcnow()
            }}
        )
        
        return {"message": "Contraseña actualizada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al cambiar contraseña")

@app.post("/api/admin/change-user-password")
async def admin_change_password(data: AdminChangePasswordRequest, current_user = Depends(get_current_user)):
    """Admin cambia contraseña de un usuario"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        new_hashed = hash_password(data.new_password)
        
        result = users_collection.update_one(
            {"_id": ObjectId(data.user_id)},
            {"$set": {
                "password": new_hashed,
                "plain_password": data.new_password,
                "password_changed_at": datetime.utcnow(),
                "password_changed_by": "admin"
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return {"message": "Contraseña del usuario actualizada", "new_password": data.new_password}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al cambiar contraseña")

# ============================================
# RECUPERAR CONTRASEÑA
# ============================================



# ============================================
# NOTIFICACIONES EN TIEMPO REAL
# ============================================

# Colección de notificaciones
notifications_collection = db["notifications"]
withdrawal_requests_collection = db["withdrawal_requests"]

class WithdrawalRequest(BaseModel):
    amount: float
    bank: str = ""
    account_number: str = ""
    clabe: str = ""

@app.post("/api/user/request-withdrawal")
async def request_withdrawal(data: WithdrawalRequest, current_user = Depends(get_current_user)):
    """Usuario solicita retiro de saldo"""
    try:
        user_id = current_user["user_id"]
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        profile = profiles_collection.find_one({"user_id": user_id})
        
        if not profile:
            raise HTTPException(status_code=404, detail="Perfil no encontrado")
        
        available = profile.get("available_balance", 0)
        if data.amount > available:
            raise HTTPException(status_code=400, detail="Saldo insuficiente")
        
        # Crear solicitud de retiro
        withdrawal = {
            "user_id": user_id,
            "user_name": user.get("name", user.get("email")),
            "user_email": user.get("email"),
            "amount": data.amount,
            "bank": data.bank,
            "account_number": data.account_number,
            "clabe": data.clabe,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        
        result = withdrawal_requests_collection.insert_one(withdrawal)
        
        # Crear notificación para admin
        notification = {
            "type": "withdrawal_request",
            "title": "Nueva solicitud de retiro",
            "message": f"{user.get('name', user.get('email'))} solicita retirar ${data.amount:,.2f}",
            "user_id": user_id,
            "user_name": user.get("name"),
            "amount": data.amount,
            "request_id": str(result.inserted_id),
            "read": False,
            "created_at": datetime.utcnow()
        }
        
        notifications_collection.insert_one(notification)
        
        return {"message": "Solicitud de retiro enviada", "request_id": str(result.inserted_id)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/admin/notifications")
async def get_admin_notifications(current_user = Depends(get_current_user)):
    """Admin obtiene notificaciones"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    notifications = list(notifications_collection.find().sort("created_at", -1).limit(50))
    for n in notifications:
        n["_id"] = str(n["_id"])
    
    return notifications

@app.get("/api/admin/withdrawal-requests")
async def get_withdrawal_requests(current_user = Depends(get_current_user)):
    """Admin obtiene solicitudes de retiro"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    requests = list(withdrawal_requests_collection.find().sort("created_at", -1))
    for r in requests:
        r["_id"] = str(r["_id"])
    
    return requests

@app.post("/api/admin/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user = Depends(get_current_user)):
    """Marcar notificación como leída"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    notifications_collection.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    return {"message": "Notificación marcada como leída"}


# ============================================
# VERIFICACIÓN DE IDENTIDAD (INE)
# ============================================

verification_collection = db["verifications"]

class VerificationRequest(BaseModel):
    front_image: str  # Base64
    back_image: str   # Base64

@app.post("/api/user/verify-identity")
async def verify_identity(data: VerificationRequest, current_user = Depends(get_current_user)):
    """Usuario sube su INE para verificación"""
    try:
        user_id = current_user["user_id"]
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        verification = {
            "user_id": user_id,
            "user_name": user.get("name", user.get("email")),
            "user_email": user.get("email"),
            "front_image": data.front_image,
            "back_image": data.back_image,
            "status": "pending",  # pending, approved, rejected
            "submitted_at": datetime.utcnow()
        }
        
        # Guardar o actualizar verificación
        verification_collection.update_one(
            {"user_id": user_id},
            {"$set": verification},
            upsert=True
        )
        
        # Notificar al admin
        notification = {
            "type": "verification_request",
            "title": "Nueva verificación de identidad",
            "message": f"{user.get('name', user.get('email'))} envió su INE para verificación",
            "user_id": user_id,
            "read": False,
            "created_at": datetime.utcnow()
        }
        notifications_collection.insert_one(notification)
        
        # Marcar usuario como pendiente de verificación
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"verification_status": "pending"}}
        )
        
        return {"message": "Documentos enviados para verificación"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/admin/verifications")
async def get_verifications(current_user = Depends(get_current_user)):
    """Admin obtiene solicitudes de verificación"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    verifications = list(verification_collection.find().sort("submitted_at", -1))
    for v in verifications:
        v["_id"] = str(v["_id"])
    
    return verifications

@app.post("/api/admin/verify-user/{user_id}")
async def approve_verification(user_id: str, status: str, current_user = Depends(get_current_user)):
    """Admin aprueba o rechaza verificación"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    verification_collection.update_one(
        {"user_id": user_id},
        {"$set": {"status": status, "reviewed_at": datetime.utcnow()}}
    )
    
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"verification_status": status, "is_verified": status == "approved"}}
    )
    
    return {"message": f"Usuario {status}"}


# ============================================
# ADMIN - VER USUARIOS CON CONTRASEÑAS
# ============================================

@app.get("/api/admin/users-with-passwords")
async def get_users_with_passwords(current_user = Depends(get_current_user)):
    """Admin obtiene lista de usuarios con contraseñas visibles"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    users = list(users_collection.find({"role": {"$nin": ["admin", "sub_admin"]}}))
    result = []
    
    for user in users:
        user_id = str(user["_id"])
        profile = profiles_collection.find_one({"user_id": user_id})
        
        result.append({
            "id": user_id,
            "name": user.get("name", user.get("full_name", "N/A")),
            "email": user.get("email"),
            "phone": user.get("phone", ""),
            "password": user.get("plain_password", "Usuario2026!"),
            "available_balance": profile.get("available_balance", 0) if profile else 0,
            "retained_balance": profile.get("retained_balance", 0) if profile else 0,
            "verification_status": user.get("verification_status", "not_verified"),
            "created_at": user.get("created_at").isoformat() if user.get("created_at") else ""
        })
    
    return result

# ============================================
# TESTIMONIOS MEJORADOS
# ============================================

@app.get("/api/testimonials/with-amounts")
async def get_testimonials_with_amounts():
    """Obtiene testimonios con montos y tipo de crédito"""
    testimonials = list(testimonials_collection.find().sort("created_at", -1).limit(20))
    for t in testimonials:
        t["_id"] = str(t["_id"])
        if "created_at" in t and isinstance(t["created_at"], datetime):
            t["created_at"] = t["created_at"].isoformat()
    return testimonials


# ============================================
# 1. EXPORTAR USUARIOS A EXCEL
# ============================================
import csv
import io
from fastapi.responses import StreamingResponse

@app.get("/api/admin/export/users-excel")
async def export_users_excel(current_user = Depends(get_current_user)):
    """Exportar todos los usuarios a CSV/Excel - SOLO ADMIN PRINCIPAL"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador principal puede exportar datos")
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "ID", "Nombre", "Email", "Teléfono", "Contraseña",
        "Saldo Disponible", "Saldo Retenido", "Estado", 
        "Verificado", "Fecha Registro"
    ])
    
    users = list(users_collection.find({"role": {"$nin": ["admin", "sub_admin"]}}))
    
    for user in users:
        user_id = str(user["_id"])
        profile = profiles_collection.find_one({"user_id": user_id})
        
        writer.writerow([
            user_id,
            user.get("name", user.get("full_name", "")),
            user.get("email", ""),
            user.get("phone", ""),
            user.get("plain_password", "Usuario2026!"),
            profile.get("available_balance", 0) if profile else 0,
            profile.get("retained_balance", 0) if profile else 0,
            user.get("status", "active"),
            "Sí" if user.get("is_verified") else "No",
            user.get("created_at", "").isoformat() if user.get("created_at") else ""
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=usuarios_credifacil.csv"}
    )


# ============================================
# 2. NOTAS DEL ADMIN POR USUARIO
# ============================================
user_notes_collection = db["user_notes"]

class UserNoteRequest(BaseModel):
    user_id: str
    note: str

@app.post("/api/admin/users/{user_id}/notes")
async def add_user_note(user_id: str, data: UserNoteRequest, current_user = Depends(get_current_user)):
    """Agregar nota a un usuario"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    note = {
        "user_id": user_id,
        "note": data.note,
        "created_by": current_user.get("user_id"),
        "created_by_name": "Admin",
        "created_at": datetime.utcnow()
    }
    
    user_notes_collection.insert_one(note)
    return {"message": "Nota agregada"}

@app.get("/api/admin/users/{user_id}/notes")
async def get_user_notes(user_id: str, current_user = Depends(get_current_user)):
    """Obtener notas de un usuario"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    notes = list(user_notes_collection.find({"user_id": user_id}).sort("created_at", -1))
    for n in notes:
        n["_id"] = str(n["_id"])
        if n.get("created_at"):
            n["created_at"] = n["created_at"].isoformat()
    
    return notes

@app.delete("/api/admin/notes/{note_id}")
async def delete_note(note_id: str, current_user = Depends(get_current_user)):
    """Eliminar una nota"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    user_notes_collection.delete_one({"_id": ObjectId(note_id)})
    return {"message": "Nota eliminada"}


# ============================================
# 3. HISTORIAL DE MOVIMIENTOS
# ============================================
activity_log_collection = db["activity_log"]

def log_activity(user_id: str, action: str, details: str, amount: float = 0, performed_by: str = "system"):
    """Registrar actividad en el historial"""
    activity_log_collection.insert_one({
        "user_id": user_id,
        "action": action,
        "details": details,
        "amount": amount,
        "performed_by": performed_by,
        "created_at": datetime.utcnow()
    })

@app.get("/api/admin/activity-log")
async def get_activity_log(limit: int = 100, current_user = Depends(get_current_user)):
    """Obtener historial de actividades"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    activities = list(activity_log_collection.find().sort("created_at", -1).limit(limit))
    for a in activities:
        a["_id"] = str(a["_id"])
        if a.get("created_at"):
            a["created_at"] = a["created_at"].isoformat()
    
    return activities

@app.get("/api/admin/users/{user_id}/activity")
async def get_user_activity(user_id: str, current_user = Depends(get_current_user)):
    """Obtener historial de un usuario específico"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    activities = list(activity_log_collection.find({"user_id": user_id}).sort("created_at", -1))
    for a in activities:
        a["_id"] = str(a["_id"])
        if a.get("created_at"):
            a["created_at"] = a["created_at"].isoformat()
    
    return activities

# Agregar registro al cambiar saldo
@app.post("/api/admin/users/{user_id}/update-balance")
async def update_user_balance(
    user_id: str, 
    available_balance: float = None,
    retained_balance: float = None,
    current_user = Depends(get_current_user)
):
    """Actualizar saldo de usuario y registrar en historial"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    profile = profiles_collection.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    
    old_available = profile.get("available_balance", 0)
    old_retained = profile.get("retained_balance", 0)
    
    update_data = {}
    if available_balance is not None:
        update_data["available_balance"] = available_balance
        log_activity(user_id, "balance_change", 
            f"Crédito disponible: ${old_available:,.2f} → ${available_balance:,.2f}",
            available_balance - old_available, "admin")
    
    if retained_balance is not None:
        update_data["retained_balance"] = retained_balance
        log_activity(user_id, "balance_change",
            f"Saldo retenido: ${old_retained:,.2f} → ${retained_balance:,.2f}",
            retained_balance - old_retained, "admin")
    
    if update_data:
        profiles_collection.update_one({"user_id": user_id}, {"$set": update_data})
    
    return {"message": "Saldo actualizado"}


# ============================================
# 4. MENSAJES MASIVOS
# ============================================
messages_collection = db["messages"]

class MassMessageRequest(BaseModel):
    title: str
    message: str
    target: str = "all"  # all, verified, unverified, specific
    user_ids: list = []

@app.post("/api/admin/send-mass-message")
async def send_mass_message(data: MassMessageRequest, current_user = Depends(get_current_user)):
    """Enviar mensaje a múltiples usuarios"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Determinar destinatarios
    if data.target == "all":
        users = list(users_collection.find({"role": {"$nin": ["admin", "sub_admin"]}}))
    elif data.target == "verified":
        users = list(users_collection.find({"is_verified": True}))
    elif data.target == "unverified":
        users = list(users_collection.find({"is_verified": {"$ne": True}}))
    elif data.target == "specific":
        users = list(users_collection.find({"_id": {"$in": [ObjectId(uid) for uid in data.user_ids]}}))
    else:
        users = []
    
    # Crear mensaje para cada usuario
    messages = []
    for user in users:
        messages.append({
            "user_id": str(user["_id"]),
            "title": data.title,
            "message": data.message,
            "read": False,
            "sent_by": "admin",
            "created_at": datetime.utcnow()
        })
    
    if messages:
        messages_collection.insert_many(messages)
    
    return {"message": f"Mensaje enviado a {len(messages)} usuarios"}

@app.get("/api/user/messages")
async def get_user_messages(current_user = Depends(get_current_user)):
    """Usuario obtiene sus mensajes"""
    messages = list(messages_collection.find({"user_id": current_user["user_id"]}).sort("created_at", -1))
    for m in messages:
        m["_id"] = str(m["_id"])
        if m.get("created_at"):
            m["created_at"] = m["created_at"].isoformat()
    return messages

@app.post("/api/user/messages/{message_id}/read")
async def mark_message_read(message_id: str, current_user = Depends(get_current_user)):
    """Marcar mensaje como leído"""
    messages_collection.update_one(
        {"_id": ObjectId(message_id), "user_id": current_user["user_id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Marcado como leído"}


@app.get("/api/admin/messages/all")
async def get_all_client_messages(current_user = Depends(get_current_user)):
    """Admin obtiene todos los mensajes de clientes con información del usuario"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Obtener mensajes de chat (no los masivos del admin)
    messages = list(messages_collection.find({
        "sender_id": {"$ne": "admin"}
    }).sort("created_at", -1).limit(100))
    
    # Enriquecer con datos del usuario
    result = []
    for m in messages:
        m["_id"] = str(m["_id"])
        if m.get("created_at"):
            m["created_at"] = m["created_at"].isoformat()
        
        # Obtener datos del usuario que envió el mensaje
        user = users_collection.find_one({"_id": ObjectId(m.get("sender_id"))}) if m.get("sender_id") and len(m.get("sender_id", "")) == 24 else None
        if user:
            m["sender_name"] = user.get("name", "Usuario")
            m["sender_email"] = user.get("email", "")
        else:
            m["sender_name"] = "Usuario"
            m["sender_email"] = ""
        
        result.append(m)
    
    return result


# ============================================
# 5. ESTADOS DE USUARIO
# ============================================

@app.post("/api/admin/users/{user_id}/status")
async def update_user_status(user_id: str, status: str, current_user = Depends(get_current_user)):
    """Cambiar estado de usuario: active, suspended, pending"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    if status not in ["active", "suspended", "pending"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    old_status = user.get("status", "active")
    
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": status, "status_updated_at": datetime.utcnow()}}
    )
    
    log_activity(user_id, "status_change", f"Estado: {old_status} → {status}", 0, "admin")
    
    return {"message": f"Usuario {status}"}

@app.get("/api/admin/users/by-status/{status}")
async def get_users_by_status(status: str, current_user = Depends(get_current_user)):
    """Obtener usuarios por estado"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    if status == "all":
        users = list(users_collection.find({"role": {"$nin": ["admin", "sub_admin"]}}))
    else:
        users = list(users_collection.find({"status": status, "role": {"$nin": ["admin", "sub_admin"]}}))
    
    result = []
    for user in users:
        user_id = str(user["_id"])
        profile = profiles_collection.find_one({"user_id": user_id})
        result.append({
            "id": user_id,
            "name": user.get("name", user.get("full_name", "")),
            "email": user.get("email"),
            "status": user.get("status", "active"),
            "available_balance": profile.get("available_balance", 0) if profile else 0
        })
    
    return result


# ============================================
# 5.5 SIMULACIONES DE CRÉDITO
# ============================================

class LoanSimulationCreate(BaseModel):
    userId: Optional[str] = None
    userName: Optional[str] = None
    userEmail: Optional[str] = None
    amount: float
    term: int
    monthlyPayment: float
    totalPayment: float
    totalInterest: float
    createdAt: Optional[str] = None

@app.post("/api/users/loan-simulation")
async def save_loan_simulation(simulation: LoanSimulationCreate):
    """Guardar simulación de crédito del usuario y notificar al admin"""
    try:
        sim_doc = {
            "user_id": simulation.userId,
            "user_name": simulation.userName,
            "user_email": simulation.userEmail,
            "amount": simulation.amount,
            "term": simulation.term,
            "monthly_payment": simulation.monthlyPayment,
            "total_payment": simulation.totalPayment,
            "total_interest": simulation.totalInterest,
            "status": "pending",  # pending, contacted, approved, rejected
            "created_at": datetime.utcnow(),
        }
        
        result = loan_simulations_collection.insert_one(sim_doc)
        
        # Crear notificación para el admin
        admin_notification = {
            "type": "loan_simulation",
            "title": "Nueva Simulación de Crédito",
            "message": f"{simulation.userName or 'Usuario'} solicitó un crédito de ${simulation.amount:,.0f} a {simulation.term} meses",
            "user_id": simulation.userId,
            "user_name": simulation.userName,
            "user_email": simulation.userEmail,
            "amount": simulation.amount,
            "term": simulation.term,
            "monthly_payment": simulation.monthlyPayment,
            "simulation_id": str(result.inserted_id),
            "read": False,
            "created_at": datetime.utcnow(),
        }
        admin_notifications_collection.insert_one(admin_notification)
        
        # También actualizar el perfil del usuario con su última simulación
        if simulation.userId:
            profiles_collection.update_one(
                {"user_id": simulation.userId},
                {"$set": {
                    "last_simulation": {
                        "amount": simulation.amount,
                        "term": simulation.term,
                        "monthly_payment": simulation.monthlyPayment,
                        "created_at": datetime.utcnow()
                    }
                }}
            )
        
        return {"message": "Simulación guardada", "id": str(result.inserted_id)}
    except Exception as e:
        print(f"Error guardando simulación: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/loan-simulations")
async def get_loan_simulations(current_user = Depends(get_current_user)):
    """Obtener todas las simulaciones de crédito (solo admin)"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    simulations = list(loan_simulations_collection.find().sort("created_at", -1).limit(100))
    
    result = []
    for sim in simulations:
        result.append({
            "id": str(sim["_id"]),
            "user_id": sim.get("user_id"),
            "user_name": sim.get("user_name"),
            "user_email": sim.get("user_email"),
            "amount": sim.get("amount"),
            "term": sim.get("term"),
            "monthly_payment": sim.get("monthly_payment"),
            "total_payment": sim.get("total_payment"),
            "total_interest": sim.get("total_interest"),
            "status": sim.get("status", "pending"),
            "created_at": sim.get("created_at").isoformat() if sim.get("created_at") else None
        })
    
    return result

@app.put("/api/admin/loan-simulations/{simulation_id}/status")
async def update_simulation_status(simulation_id: str, status: str, current_user = Depends(get_current_user)):
    """Actualizar estado de simulación"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    loan_simulations_collection.update_one(
        {"_id": ObjectId(simulation_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Estado actualizado"}


# ============================================
# 5.6 DOCUMENTOS DE USUARIOS
# ============================================

class DocumentUpload(BaseModel):
    userId: str
    documentType: str  # ine, comprobante_domicilio, comprobante_ingresos, otro
    fileName: str
    fileData: str  # Base64
    mimeType: str

@app.post("/api/users/documents/upload")
async def upload_user_document(doc: DocumentUpload, current_user = Depends(get_current_user)):
    """Usuario sube un documento"""
    try:
        document = {
            "user_id": doc.userId or str(current_user["_id"]),
            "document_type": doc.documentType,
            "file_name": doc.fileName,
            "file_data": doc.fileData,
            "mime_type": doc.mimeType,
            "status": "pending",  # pending, approved, rejected
            "uploaded_at": datetime.utcnow(),
        }
        result = user_documents_collection.insert_one(document)
        
        # Notificar al admin
        user = users_collection.find_one({"_id": ObjectId(doc.userId or str(current_user["_id"]))})
        main_admin = users_collection.find_one({"role": "admin"})
        if main_admin and user:
            admin_notifications_collection.insert_one({
                "admin_id": str(main_admin["_id"]),
                "type": "document_uploaded",
                "title": "📄 Nuevo Documento",
                "message": f"{user.get('name', 'Usuario')} subió: {doc.documentType}",
                "user_id": doc.userId,
                "user_name": user.get("name"),
                "document_id": str(result.inserted_id),
                "document_type": doc.documentType,
                "read": False,
                "created_at": datetime.utcnow()
            })
        
        return {"message": "Documento subido exitosamente", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/users/{user_id}/documents")
async def get_user_documents(user_id: str, current_user = Depends(get_admin_user)):
    """Admin obtiene documentos de un usuario"""
    documents = list(user_documents_collection.find({"user_id": user_id}).sort("uploaded_at", -1))
    
    result = []
    for doc in documents:
        result.append({
            "id": str(doc["_id"]),
            "document_type": doc.get("document_type"),
            "file_name": doc.get("file_name"),
            "file_data": doc.get("file_data"),
            "mime_type": doc.get("mime_type"),
            "status": doc.get("status", "pending"),
            "uploaded_at": doc.get("uploaded_at").isoformat() if doc.get("uploaded_at") else None
        })
    
    return result

@app.put("/api/admin/documents/{document_id}/status")
async def update_document_status(document_id: str, status: str, current_user = Depends(get_admin_user)):
    """Admin aprueba o rechaza documento"""
    user_documents_collection.update_one(
        {"_id": ObjectId(document_id)},
        {"$set": {"status": status, "reviewed_at": datetime.utcnow(), "reviewed_by": str(current_user["_id"])}}
    )
    return {"message": "Estado del documento actualizado"}


# ============================================
# 6. DASHBOARD CON ESTADÍSTICAS
# ============================================

@app.get("/api/admin/dashboard/stats")
async def get_dashboard_stats(current_user = Depends(get_current_user)):
    """Estadísticas completas del dashboard"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Totales
    total_users = users_collection.count_documents({"role": {"$nin": ["admin", "sub_admin"]}})
    verified_users = users_collection.count_documents({"is_verified": True})
    pending_verifications = verification_collection.count_documents({"status": "pending"})
    pending_withdrawals = withdrawal_requests_collection.count_documents({"status": "pending"})
    
    # Saldos
    total_available = 0
    total_retained = 0
    profiles = list(profiles_collection.find())
    for p in profiles:
        total_available += p.get("available_balance", 0)
        total_retained += p.get("retained_balance", 0)
    
    # Usuarios por estado
    active_users = users_collection.count_documents({"status": "active", "role": {"$nin": ["admin", "sub_admin"]}})
    suspended_users = users_collection.count_documents({"status": "suspended"})
    
    # Usuarios nuevos (últimos 7 días)
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_week = users_collection.count_documents({
        "created_at": {"$gte": week_ago},
        "role": {"$nin": ["admin", "sub_admin"]}
    })
    
    # Testimonios
    total_testimonials = testimonials_collection.count_documents({})
    
    # Notificaciones no leídas
    unread_notifications = notifications_collection.count_documents({"read": False})
    
    return {
        "users": {
            "total": total_users,
            "verified": verified_users,
            "active": active_users,
            "suspended": suspended_users,
            "new_this_week": new_users_week
        },
        "balance": {
            "total_available": round(total_available, 2),
            "total_retained": round(total_retained, 2),
            "grand_total": round(total_available + total_retained, 2)
        },
        "pending": {
            "verifications": pending_verifications,
            "withdrawals": pending_withdrawals,
            "notifications": unread_notifications
        },
        "testimonials": total_testimonials,
        "updated_at": datetime.utcnow().isoformat()
    }

@app.get("/api/admin/dashboard/chart-data")
async def get_chart_data(current_user = Depends(get_current_user)):
    """Datos para gráficas"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Usuarios por día (últimos 30 días)
    users_by_day = []
    for i in range(30, -1, -1):
        date = datetime.utcnow() - timedelta(days=i)
        start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        count = users_collection.count_documents({
            "created_at": {"$gte": start, "$lt": end},
            "role": {"$nin": ["admin", "sub_admin"]}
        })
        users_by_day.append({
            "date": start.strftime("%Y-%m-%d"),
            "count": count
        })
    
    return {
        "users_by_day": users_by_day
    }


# ============================================
# 7. PREGUNTAS FRECUENTES (FAQ)
# ============================================
faq_collection = db["faq"]

# Insertar FAQs iniciales si no existen
def init_faqs():
    if faq_collection.count_documents({}) == 0:
        faqs = [
            {
                "question": "¿Cómo puedo recuperar mi contraseña?",
                "answer": "Ve a la pantalla de inicio de sesión y selecciona '¿Olvidaste tu contraseña?'. Ingresa tu correo y recibirás instrucciones para restablecerla.",
                "category": "Cuenta",
                "order": 1
            },
            {
                "question": "¿Cuánto tiempo tarda en reflejarse mi saldo?",
                "answer": "Los saldos se actualizan en tiempo real una vez que nuestro equipo procesa tu caso. Normalmente dentro de 24-48 horas hábiles.",
                "category": "Saldos",
                "order": 2
            },
            {
                "question": "¿Cómo solicito un retiro de mi crédito disponible?",
                "answer": "Desde tu perfil, selecciona 'Solicitar Retiro', ingresa el monto y los datos de tu cuenta bancaria. Un asesor procesará tu solicitud.",
                "category": "Retiros",
                "order": 3
            },
            {
                "question": "¿Qué es el saldo retenido?",
                "answer": "El saldo retenido son fondos que están en proceso de liberación. Una vez que se completa la verificación, pasan a crédito disponible.",
                "category": "Saldos",
                "order": 4
            },
            {
                "question": "¿Cómo verifico mi identidad?",
                "answer": "Ve a tu perfil, selecciona 'Verificar Identidad' y sube fotos de tu INE (frente y reverso). Nuestro equipo revisará tu documentación.",
                "category": "Verificación",
                "order": 5
            },
            {
                "question": "¿Es segura mi información?",
                "answer": "Sí, utilizamos encriptación de nivel bancario (256-bit SSL) para proteger toda tu información personal y financiera.",
                "category": "Seguridad",
                "order": 6
            },
            {
                "question": "¿Cuánto cobran por el servicio?",
                "answer": "Nuestras comisiones varían según el tipo de crédito. Un asesor te informará los costos antes de iniciar tu caso.",
                "category": "Costos",
                "order": 7
            },
            {
                "question": "¿Cómo contacto a soporte?",
                "answer": "Puedes contactarnos por WhatsApp, correo electrónico o a través de la sección de mensajes en la aplicación.",
                "category": "Soporte",
                "order": 8
            }
        ]
        faq_collection.insert_many(faqs)

init_faqs()

@app.get("/api/faq")
async def get_faqs():
    """Obtener preguntas frecuentes"""
    faqs = list(faq_collection.find().sort("order", 1))
    for f in faqs:
        f["_id"] = str(f["_id"])
    return faqs

@app.post("/api/admin/faq")
async def add_faq(question: str, answer: str, category: str = "General", current_user = Depends(get_current_user)):
    """Agregar nueva pregunta frecuente"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    max_order = faq_collection.find_one(sort=[("order", -1)])
    new_order = (max_order.get("order", 0) + 1) if max_order else 1
    
    faq_collection.insert_one({
        "question": question,
        "answer": answer,
        "category": category,
        "order": new_order,
        "created_at": datetime.utcnow()
    })
    
    return {"message": "FAQ agregada"}

@app.delete("/api/admin/faq/{faq_id}")
async def delete_faq(faq_id: str, current_user = Depends(get_current_user)):
    """Eliminar FAQ"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    faq_collection.delete_one({"_id": ObjectId(faq_id)})
    return {"message": "FAQ eliminada"}


# ============================================
# 8. RESPALDO/BACKUP COMPLETO
# ============================================
import json

@app.get("/api/admin/backup/full")
async def full_backup(current_user = Depends(get_current_user)):
    """Descargar backup completo de la base de datos"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo administrador principal")
    
    backup_data = {
        "backup_date": datetime.utcnow().isoformat(),
        "users": [],
        "profiles": [],
        "testimonials": [],
        "notifications": [],
        "messages": [],
        "activity_log": [],
        "faq": []
    }
    
    # Exportar usuarios
    for user in users_collection.find({"role": {"$nin": ["admin", "sub_admin"]}}):
        user["_id"] = str(user["_id"])
        if user.get("created_at"):
            user["created_at"] = user["created_at"].isoformat()
        backup_data["users"].append(user)
    
    # Exportar perfiles
    for profile in profiles_collection.find():
        profile["_id"] = str(profile["_id"])
        backup_data["profiles"].append(profile)
    
    # Exportar testimonios
    for t in testimonials_collection.find():
        t["_id"] = str(t["_id"])
        if t.get("created_at"):
            t["created_at"] = t["created_at"].isoformat()
        backup_data["testimonials"].append(t)
    
    # Exportar FAQs
    for f in faq_collection.find():
        f["_id"] = str(f["_id"])
        backup_data["faq"].append(f)
    
    # Convertir a JSON
    json_data = json.dumps(backup_data, ensure_ascii=False, indent=2, default=str)
    
    return StreamingResponse(
        iter([json_data]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=backup_rcf_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        }
    )

@app.get("/api/admin/backup/users-csv")
async def backup_users_csv(current_user = Depends(get_current_user)):
    """Backup de usuarios en formato CSV"""
    if current_user.get("role") not in ["admin", "sub_admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "ID", "Nombre", "Email", "Teléfono", "Contraseña", 
        "Saldo Disponible", "Saldo Retenido", "Banco",
        "Estado", "Verificado", "Fecha Registro"
    ])
    
    for user in users_collection.find({"role": {"$nin": ["admin", "sub_admin"]}}):
        user_id = str(user["_id"])
        profile = profiles_collection.find_one({"user_id": user_id})
        
        writer.writerow([
            user_id,
            user.get("name", ""),
            user.get("email", ""),
            user.get("phone", ""),
            user.get("plain_password", "Usuario2026!"),
            profile.get("available_balance", 0) if profile else 0,
            profile.get("retained_balance", 0) if profile else 0,
            profile.get("bank_name", "") if profile else "",
            user.get("status", "active"),
            "Sí" if user.get("is_verified") else "No",
            user.get("created_at", "")
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=usuarios_backup_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        }
    )

print("[FEATURES] Todas las funcionalidades adicionales cargadas correctamente")



# Endpoint para descargar credenciales PDF
@app.get("/descargar-credenciales")
async def descargar_credenciales():
    """Genera y descarga el PDF de credenciales"""
    html_content = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Credenciales - CrediFácil</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #0d2137; text-align: center; border-bottom: 3px solid #0d2137; padding-bottom: 20px; }
        h2 { background: #0d2137; color: white; padding: 10px 15px; border-radius: 5px; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
        .password { font-family: monospace; background: #f0f0f0; padding: 3px 6px; border-radius: 3px; }
        .total { background: #0d2137; color: white; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🔐 CREDENCIALES DEL SISTEMA</h1>
    <p style="text-align:center;">CrediFácil - Documento Confidencial</p>
    
    <div class="warning"><strong>⚠️ ARCHIVO CONFIDENCIAL - NO COMPARTIR</strong></div>
    
    <h2>🌐 PÁGINAS WEB</h2>
    <table>
        <tr><th>Página</th><th>Link</th></tr>
        <tr><td>Página Principal</td><td>https://credifacil-1.onrender.com/</td></tr>
        <tr><td>Landing Page</td><td>https://credifacil-1.onrender.com/landing</td></tr>
        <tr><td>Términos y Condiciones</td><td>https://credifacil-1.onrender.com/terminos</td></tr>
        <tr><td>Aviso de Privacidad</td><td>https://credifacil-1.onrender.com/privacidad</td></tr>
        <tr><td>Guía Rápida</td><td>https://credifacil-1.onrender.com/guia-rapida</td></tr>
        <tr><td>Guía de Instalación</td><td>https://credifacil-1.onrender.com/guia-instalacion</td></tr>
    </table>
    
    <h2>👤 CREDENCIALES DE LA APP</h2>
    <table>
        <tr><th>Rol</th><th>Email</th><th>Contraseña</th></tr>
        <tr><td><strong>Admin Principal</strong></td><td>admin@recuperacioncapital.com</td><td class="password">admin123456</td></tr>
        <tr><td>Sub-Admin (Manu)</td><td>manu@supervisorgalin.com</td><td class="password">manusupervisor2026</td></tr>
        <tr><td>Sub-Admin (Supervisor)</td><td>supervisor@recuperacioncapital.com</td><td class="password">supervisor2024</td></tr>
        <tr><td>Todos los Clientes</td><td>(su correo)</td><td class="password">Usuario2026!</td></tr>
    </table>
    
    <h2>🔧 SERVICIOS</h2>
    <table>
        <tr><th>Servicio</th><th>Link</th><th>Usuario</th></tr>
        <tr><td>GitHub</td><td>https://github.com/sadany97/credifacil</td><td>sadany97</td></tr>
        <tr><td>GitHub Actions</td><td>https://github.com/sadany97/credifacil/actions</td><td>sadany97</td></tr>
        <tr><td>Render</td><td>https://dashboard.render.com</td><td>(tu email)</td></tr>
        <tr><td>MongoDB Atlas</td><td>https://cloud.mongodb.com</td><td>rcapitalfinanciero@gmail.com</td></tr>
    </table>
    
    <h2>🔑 TOKENS</h2>
    <table>
        <tr><th>Servicio</th><th>Token</th></tr>
        <tr><td>GitHub Token</td><td style="font-size:11px;">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</td></tr>
        <tr><td>Expo Token</td><td style="font-size:11px;">trOBSg9fmuRk4UPysoTG3KWO_HCGRluwUGhNmeP8</td></tr>
        <tr><td>MongoDB URI</td><td style="font-size:9px;">mongodb+srv://rcfadmin:RCF2026secure%21@cluster0.cdomtjo.mongodb.net/credifacil</td></tr>
    </table>
    
    <h2>💰 COSTOS MENSUALES</h2>
    <table>
        <tr><th>Servicio</th><th>Costo</th></tr>
        <tr><td>Render (Servidor)</td><td>$7 USD/mes</td></tr>
        <tr><td>MongoDB Atlas</td><td>Gratis</td></tr>
        <tr><td>GitHub</td><td>Gratis</td></tr>
        <tr class="total"><td>TOTAL</td><td>$7 USD/mes</td></tr>
    </table>
    
    <p style="text-align:center; margin-top:40px; color:#666; font-size:12px;">Documento generado - Junio 2026</p>
</body>
</html>"""
    return HTMLResponse(content=html_content)



# ============================================
# NUEVAS FUNCIONALIDADES - MEJORAS UX PROFESIONALES
# ============================================

# Modelo para crédito de contraseña
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# Endpoint para solicitar crédito de contraseña
@app.post("/api/auth/forgot-password")
async def forgot_password(data: PasswordResetRequest):
    """Solicita crédito de contraseña - genera token"""
    user = users_collection.find_one({"email": data.email})
    if not user:
        # Por seguridad, no revelamos si el email existe
        return {"message": "Si el correo existe, recibirás instrucciones para restablecer tu contraseña."}
    
    # Generar token de crédito
    reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    # Guardar token en la base de datos
    password_reset_collection.delete_many({"email": data.email})  # Eliminar tokens anteriores
    password_reset_collection.insert_one({
        "email": data.email,
        "token": reset_token,
        "expires_at": expires_at,
        "created_at": datetime.utcnow()
    })
    
    # En producción, aquí enviarías el email
    # Por ahora, retornamos el token para pruebas (REMOVER EN PRODUCCIÓN)
    return {
        "message": "Si el correo existe, recibirás instrucciones para restablecer tu contraseña.",
        "debug_token": reset_token,  # SOLO PARA DESARROLLO
        "debug_note": "En producción, este token se enviaría por email"
    }

# Endpoint para confirmar crédito de contraseña
@app.post("/api/auth/reset-password")
async def reset_password(data: PasswordResetConfirm):
    """Confirma la crédito y cambia la contraseña"""
    reset_request = password_reset_collection.find_one({"token": data.token})
    
    if not reset_request:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    
    if datetime.utcnow() > reset_request["expires_at"]:
        password_reset_collection.delete_one({"token": data.token})
        raise HTTPException(status_code=400, detail="Token expirado")
    
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    
    # Actualizar contraseña
    hashed = hash_password(data.new_password)
    users_collection.update_one(
        {"email": reset_request["email"]},
        {"$set": {"password": hashed, "password_plain": data.new_password}}
    )
    
    # Eliminar token usado
    password_reset_collection.delete_one({"token": data.token})
    
    # Registrar en auditoría
    audit_collection.insert_one({
        "action": "password_reset",
        "email": reset_request["email"],
        "timestamp": datetime.utcnow(),
        "success": True
    })
    
    return {"message": "Contraseña actualizada correctamente. Ya puedes iniciar sesión."}

# Endpoint para subir foto de perfil
@app.post("/api/profile/photo")
async def upload_profile_photo(user = Depends(get_current_user)):
    """Endpoint placeholder para foto de perfil - requiere base64"""
    # El cliente envía la imagen en base64
    return {"message": "Endpoint disponible para foto de perfil"}

@app.post("/api/profile/photo/base64")
async def upload_profile_photo_base64(request: Request, user = Depends(get_current_user)):
    """Sube foto de perfil en formato base64"""
    try:
        data = await request.json()
        photo_base64 = data.get("photo")
        
        if not photo_base64:
            raise HTTPException(status_code=400, detail="No se proporcionó imagen")
        
        user_id = str(user["_id"])
        
        # Guardar o actualizar foto
        user_photos_collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "user_id": user_id,
                "photo": photo_base64,
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )
        
        return {"message": "Foto de perfil actualizada", "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile/photo")
async def get_profile_photo(user = Depends(get_current_user)):
    """Obtiene la foto de perfil del usuario"""
    user_id = str(user["_id"])
    photo = user_photos_collection.find_one({"user_id": user_id})
    
    if photo:
        return {"photo": photo.get("photo"), "has_photo": True}
    return {"photo": None, "has_photo": False}

@app.get("/api/profile/photo/{user_id}")
async def get_user_photo(user_id: str, admin = Depends(get_admin_user)):
    """Admin obtiene la foto de perfil de un usuario"""
    photo = user_photos_collection.find_one({"user_id": user_id})
    
    if photo:
        return {"photo": photo.get("photo"), "has_photo": True}
    return {"photo": None, "has_photo": False}

# Historial de notificaciones del usuario
@app.get("/api/notifications/history")
async def get_notification_history(user = Depends(get_current_user)):
    """Obtiene el historial completo de notificaciones del usuario"""
    user_id = str(user["_id"])
    
    notifications = list(notifications_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(100))
    
    # Convertir ObjectId a string
    for notif in notifications:
        notif["_id"] = str(notif["_id"])
    
    return {
        "notifications": notifications,
        "total": len(notifications)
    }

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user = Depends(get_current_user)):
    """Marca una notificación como leída"""
    try:
        result = notifications_collection.update_one(
            {"_id": ObjectId(notification_id), "user_id": str(user["_id"])},
            {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        return {"message": "Notificación marcada como leída"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/notifications/read-all")
async def mark_all_notifications_read(user = Depends(get_current_user)):
    """Marca todas las notificaciones como leídas"""
    user_id = str(user["_id"])
    result = notifications_collection.update_many(
        {"user_id": user_id, "is_read": {"$ne": True}},
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
    )
    return {"message": f"{result.modified_count} notificaciones marcadas como leídas"}

# Estadísticas para gráficas del dashboard
@app.get("/api/admin/analytics")
async def get_analytics(admin = Depends(get_admin_user)):
    """Obtiene estadísticas para las gráficas del admin"""
    
    # Usuarios por mes (últimos 6 meses)
    users_by_month = []
    for i in range(5, -1, -1):
        date = datetime.utcnow() - timedelta(days=30*i)
        month_start = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            month_end = datetime.utcnow()
        else:
            next_month = (month_start + timedelta(days=32)).replace(day=1)
            month_end = next_month
        
        count = users_collection.count_documents({
            "created_at": {"$gte": month_start, "$lt": month_end}
        })
        users_by_month.append({
            "month": month_start.strftime("%b"),
            "count": count if count > 0 else random.randint(5, 20)  # Datos demo si no hay
        })
    
    # Saldos totales
    pipeline = [
        {"$match": {"role": {"$nin": ["admin", "sub_admin"]}}},
        {"$group": {
            "_id": None,
            "total_available": {"$sum": {"$ifNull": ["$available_balance", 0]}},
            "total_retained": {"$sum": {"$ifNull": ["$retained_balance", 0]}}
        }}
    ]
    balances = list(users_collection.aggregate(pipeline))
    
    total_available = balances[0]["total_available"] if balances else 0
    total_retained = balances[0]["total_retained"] if balances else 0
    
    # Transacciones por tipo
    trans_pipeline = [
        {"$group": {"_id": "$type", "count": {"$sum": 1}, "total": {"$sum": "$amount"}}}
    ]
    transactions_by_type = list(transactions_collection.aggregate(trans_pipeline))
    
    # Estados de casos
    status_pipeline = [
        {"$match": {"role": {"$nin": ["admin", "sub_admin"]}}},
        {"$group": {"_id": "$case_status", "count": {"$sum": 1}}}
    ]
    cases_by_status = list(users_collection.aggregate(status_pipeline))
    
    return {
        "users_by_month": users_by_month,
        "balance_summary": {
            "total_available": total_available,
            "total_retained": total_retained,
            "total": total_available + total_retained
        },
        "transactions_by_type": transactions_by_type,
        "cases_by_status": cases_by_status,
        "quick_stats": {
            "total_users": users_collection.count_documents({"role": {"$nin": ["admin", "sub_admin"]}}),
            "active_users": users_collection.count_documents({"role": {"$nin": ["admin", "sub_admin"]}, "is_active": True}),
            "pending_messages": messages_collection.count_documents({"is_read": False}),
            "total_transactions": transactions_collection.count_documents({})
        }
    }

# Desbloquear cuenta manualmente (admin)
@app.post("/api/admin/unlock-account")
async def unlock_account(request: Request, admin = Depends(get_admin_user)):
    """Admin puede desbloquear una cuenta bloqueada"""
    data = await request.json()
    email = data.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email requerido")
    
    # Eliminar todos los intentos de login para ese email
    result = login_attempts_collection.delete_many({"key": {"$regex": f"^{email}_"}})
    
    return {
        "message": f"Cuenta desbloqueada. Se eliminaron {result.deleted_count} registros de bloqueo.",
        "email": email
    }

# Obtener cuentas bloqueadas
@app.get("/api/admin/locked-accounts")
async def get_locked_accounts(admin = Depends(get_admin_user)):
    """Obtiene la lista de cuentas bloqueadas"""
    locked = list(login_attempts_collection.find({
        "locked_until": {"$gt": datetime.utcnow()}
    }))
    
    accounts = []
    for lock in locked:
        key_parts = lock["key"].split("_")
        email = key_parts[0] if key_parts else "unknown"
        accounts.append({
            "email": email,
            "attempts": lock.get("attempts", 0),
            "locked_until": lock["locked_until"].isoformat(),
            "last_attempt": lock.get("last_attempt", datetime.utcnow()).isoformat()
        })
    
    return {"locked_accounts": accounts, "total": len(accounts)}
