from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import time
import hashlib
import bcrypt
from pydantic import BaseModel
import jwt # <-- Add this
from datetime import datetime, timedelta # <-- Add this

# Import our database setup, models, and new schemas
from database import engine, Base, get_db
import models
import schemas

# Create the database tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sky Innovators API")

# Setup Password Hashing
#pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Pure Bcrypt Password Hashing ---
def get_password_hash(password: str) -> str:
    # bcrypt requires passwords to be converted to bytes first
    pwd_bytes = password.encode('utf-8')
    # Generate a secure salt and hash the password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    # Decode back to a normal string so PostgreSQL can save it
    return hashed_password.decode('utf-8')


# --- Pure Bcrypt Password Hashing ---
def get_password_hash(password: str) -> str:
    fixed_length_password = hashlib.sha256(password.encode('utf-8')).hexdigest()
    pwd_bytes = fixed_length_password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    return hashed_password.decode('utf-8')

# NEW: Password Verification function
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # We must apply the exact same SHA-256 transformation to the incoming password
    fixed_length_password = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    # Check if it matches the hash stored in PostgreSQL
    return bcrypt.checkpw(
        fixed_length_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

# NEW: JWT Token Settings
# In a real app, keep this string secret and store it in a .env file!
SECRET_KEY = "sky_innovators_super_secret_key_change_me"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # Tokens last for 7 days

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# NEW: Login Request Schema
class LoginRequest(BaseModel):
    email: str
    password: str


# CORS setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "API and Database are ready."}

# NEW: User Registration Endpoint
@app.post("/signup", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check if the email is already in the database
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash the password securely
    hashed_password = get_password_hash(user.password)
    
    # 3. Create the new user record
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    
    # 4. Save to PostgreSQL
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/login")
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    # 1. Find the user by their email in the database
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    # 2. If the user doesn't exist, or the password doesn't match, reject them
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. If credentials are correct, generate the digital wristband (JWT)
    access_token = create_access_token(data={"sub": user.email, "id": user.id})
    
    # 4. Return the token to the React frontend
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_info": {
            "name": user.full_name,
            "email": user.email
        }
    }

# (Your existing /upload route stays down here)
@app.post("/upload")
async def upload_drone_footage(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_size_mb = 12.5 
    new_media = models.MediaFile(
        filename=file.filename,
        file_size_mb=file_size_mb,
        status="Processing",
        owner_id=None 
    )
    db.add(new_media)
    db.commit()
    db.refresh(new_media)
    time.sleep(1) 
    return {
        "status": "success",
        "filename": new_media.filename,
        "database_id": new_media.id,
        "message": "File securely recorded in the database and queued for AI analysis."
    }