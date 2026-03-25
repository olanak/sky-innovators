from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import time
import hashlib
import bcrypt
from pydantic import BaseModel
import jwt # <-- Add this
from datetime import datetime, timedelta # <-- Add this
import os # NEW: To save files to the computer
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
import json
from dotenv import load_dotenv

# Import our database setup, models, and new schemas
from database import engine, Base, get_db
import models
import schemas
#from tkinter.tix import Form

# Create the database tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sky Innovators API")

UPLOAD_DIR = "uploaded_media"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")
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
load_dotenv() # <-- This tells Python to read the .env file
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_if_env_is_missing")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # Tokens last for 7 days

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- SECURITY DEPENDENCY ---
# This tells FastAPI where to look for the token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token using our secret master password
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    # Find the user in the database
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# NEW: Login Request Schema
class LoginRequest(BaseModel):
    email: str
    password: str


# CORS setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://sky-innovators-buotqlix6-olanaks-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Create a folder to store the physical files if it doesn't exist yet
UPLOAD_DIR = "uploaded_media"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/upload")
async def upload_drone_footage(
    file: UploadFile = File(...), 
    modules: str = Form(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) 
):
    file_bytes = await file.read()
    file_size_mb = round(len(file_bytes) / (1024 * 1024), 2)
    
    timestamp = int(time.time())
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    
    # NEW LOGIC: If they didn't select any modules, status is "Uploaded". Otherwise "Processing".
    parsed_modules = json.loads(modules)
    initial_status = "Uploaded" if len(parsed_modules) == 0 else "Processed"
        
    new_media = models.MediaFile(
        filename=safe_filename, # Save the safe name so we can serve it later
        file_path=file_path, 
        file_size_mb=file_size_mb,
        status=initial_status,
        owner_id=current_user.id 
    )
    
    db.add(new_media)
    db.commit()
    db.refresh(new_media)
    
    return {"status": "success", "file": new_media}

@app.get("/media")
def get_user_media(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.MediaFile).filter(models.MediaFile.owner_id == current_user.id).order_by(models.MediaFile.id.desc()).all()

# NEW: Route to permanently delete a file
@app.delete("/media/{media_id}")
def delete_media(media_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    media_item = db.query(models.MediaFile).filter(models.MediaFile.id == media_id, models.MediaFile.owner_id == current_user.id).first()
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Delete the physical file
    if os.path.exists(media_item.file_path):
        os.remove(media_item.file_path)
        
    # Delete from database
    db.delete(media_item)
    db.commit()
    return {"message": "Deleted"}

# NEW: Route to update status from 'Uploaded' to 'Processed'
@app.put("/media/{media_id}/analyze")
def analyze_media(media_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    media_item = db.query(models.MediaFile).filter(models.MediaFile.id == media_id, models.MediaFile.owner_id == current_user.id).first()
    if media_item:
        media_item.status = "Processed"
        db.commit()
    return {"message": "Updated"}