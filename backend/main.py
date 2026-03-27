from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import time
import hashlib
import bcrypt
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
import os
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
import json
from dotenv import load_dotenv
from typing import Optional # 
import csv
from fastapi.responses import StreamingResponse
import io
import secrets
from mailer import send_reset_email
from passlib.context import CryptContext

# Import our database setup, models, and new schemas
from database import engine, Base, get_db
import models
import schemas
import exifread
import database

# Use your existing pwd_context if you already have one defined
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. Create a schema for the reset request
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def get_decimal_from_dms(dms, ref):
    degrees = float(dms.values[0].num) / float(dms.values[0].den)
    minutes = float(dms.values[1].num) / float(dms.values[1].den)
    seconds = float(dms.values[2].num) / float(dms.values[2].den)
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

def extract_exif_data(file_path):
    try:
        with open(file_path, 'rb') as f:
            tags = exifread.process_file(f)
            
            lat_field = tags.get('GPS GPSLatitude')
            lat_ref = tags.get('GPS GPSLatitudeRef')
            lon_field = tags.get('GPS GPSLongitude')
            lon_ref = tags.get('GPS GPSLongitudeRef')
            alt_field = tags.get('GPS GPSAltitude')

            # Only calculate if all parts exist
            if lat_field and lat_ref and lon_field and lon_ref:
                lat = get_decimal_from_dms(lat_field, lat_ref.printable)
                lon = get_decimal_from_dms(lon_field, lon_ref.printable)
                # Handle altitude carefully
                alt = 0.0
                if alt_field:
                    try:
                        alt = float(alt_field.values[0].num) / float(alt_field.values[0].den)
                    except:
                        alt = 0.0
                return lat, lon, alt
    except Exception as e:
        print(f"Skipping EXIF for this file: {e}")
    
    return None, None, None # PNGs and screenshots will hit this line


# Create the database tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sky Innovators API")

UPLOAD_DIR = "uploaded_media"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

# --- Pure Bcrypt Password Hashing ---
def get_password_hash(password: str) -> str:
    fixed_length_password = hashlib.sha256(password.encode('utf-8')).hexdigest()
    pwd_bytes = fixed_length_password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    return hashed_password.decode('utf-8')

# NEW: Password Verification function
def verify_password(plain_password: str, hashed_password: str) -> bool:
    fixed_length_password = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return bcrypt.checkpw(
        fixed_length_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

# NEW: JWT Token Settings
load_dotenv() 
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_if_env_is_missing")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- SECURITY DEPENDENCY ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Login Request Schema
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

# User Registration Endpoint
@app.post("/signup", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/login")
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email, "id": user.id})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_info": {
            "name": user.full_name,
            "email": user.email
        }
    }


# ==========================================
# UPLOAD AND MEDIA ROUTES
# ==========================================
@app.post("/upload")
async def upload_drone_footage(
    file: UploadFile = File(...), 
    modules: str = Form(...), 
    project_id: Optional[int] = Form(None), 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user) 
):
    try:
        # 1. Process and Save the Physical File
        file_bytes = await file.read()
        file_size_mb = round(len(file_bytes) / (1024 * 1024), 2)
        
        timestamp = int(time.time())
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # 2. Extract Real Telemetry (Returns None, None, None for PNGs)
        lat, lon, alt = extract_exif_data(file_path)

        # 3. Parse Analysis Modules
        try:
            parsed_modules = json.loads(modules)
        except:
            parsed_modules = []
        
        initial_status = "Uploaded" if len(parsed_modules) == 0 else "Processed"
            
        # 4. Create Media Record (Allows lat/lon to be None)
        new_media = models.MediaFile(
            filename=safe_filename, 
            file_path=file_path, 
            file_size_mb=file_size_mb,
            status=initial_status,
            owner_id=current_user.id,
            project_id=project_id,
            latitude=lat, # Will be None for PNG
            longitude=lon, # Will be None for PNG
            altitude=alt # Will be None for PNG
        )
        
        db.add(new_media)
        db.flush()

        # 5. Handle Instant AI Analysis Results
        ai_results = None
        if len(parsed_modules) > 0:
            ai_results = run_ai_logic(safe_filename, parsed_modules)
            
            for module_name, result_content in ai_results.items():
                new_result = models.AnalysisResult(
                    media_id=new_media.id,
                    module_name=module_name,
                    result_data=json.dumps(result_content)
                )
                db.add(new_result)

        db.commit()
        db.refresh(new_media)
        
        return {
            "status": "success", 
            "file": {
                "id": new_media.id,
                "filename": new_media.filename,
                "status": new_media.status
            },
            "aiResults": ai_results
        }

    except Exception as e:
        db.rollback()
        # 👉 LOGGING THE REAL ERROR: Check your terminal for this!
        print(f"CRITICAL ERROR DURING UPLOAD: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/media")
def get_user_media(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.MediaFile).filter(models.MediaFile.owner_id == current_user.id).order_by(models.MediaFile.id.desc()).all()

@app.delete("/media/{media_id}")
def delete_media(media_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    media_item = db.query(models.MediaFile).filter(models.MediaFile.id == media_id, models.MediaFile.owner_id == current_user.id).first()
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")
    
    if os.path.exists(media_item.file_path):
        os.remove(media_item.file_path)
        
    db.delete(media_item)
    db.commit()
    return {"message": "Deleted"}



@app.put("/media/{media_id}/analyze")
async def analyze_media(
    media_id: int, 
    modules: str = Form(...), # Receive the modules to run
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    media_item = db.query(models.MediaFile).filter(
        models.MediaFile.id == media_id, 
        models.MediaFile.owner_id == current_user.id
    ).first()

    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")

    # 1. Run the "Pluggable" AI logic
    module_list = json.loads(modules)
    ai_results = run_ai_logic(media_item.filename, module_list)

    # 2. Save each module result to the database
    for module, data in ai_results.items():
        new_result = models.AnalysisResult(
            media_id=media_id,
            module_name=module,
            result_data=json.dumps(data)
        )
        db.add(new_result)

    # 3. Mark the file as Processed
    media_item.status = "Processed"
    db.commit()

    return {"status": "success", "results": ai_results}


# ==========================================
# PROJECT ROUTES
# ==========================================

@app.post("/projects", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_project = models.Project(
        title=project.title,
        client=project.client,
        location=project.location,
        description=project.description,
        owner_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/projects")
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Fetch all projects belonging to the logged-in user, newest first
    return db.query(models.Project).filter(models.Project.owner_id == current_user.id).order_by(models.Project.id.desc()).all()

# 👉 NEW: Route to link existing media from the library to a project
@app.put("/projects/{project_id}/media/{media_id}")
def link_media_to_project(project_id: int, media_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    media_item = db.query(models.MediaFile).filter(
        models.MediaFile.id == media_id, 
        models.MediaFile.owner_id == current_user.id
    ).first()
    
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")
        
    media_item.project_id = project_id
    db.commit()
    return {"status": "success", "message": "Media linked to project"}


def run_ai_logic(filename: str, modules: list):
    """
    PLUG-IN POINT: When your AI model is ready, 
    replace this mock logic with your model.predict() calls.
    """
    results = {}
    
    if "forestry" in modules:
        results["forestry"] = {"canopy_cover": 72, "health_score": "Good"}
    if "land" in modules:
        results["land"] = {"vegetation_index": 0.82, "bare_soil": "12%"}
    if "infrastructure" in modules:
        results["infrastructure"] = {"roads_detected": "4.2km", "water_bodies": 1}
        
    return results


@app.get("/media/{media_id}/results")
def get_analysis_results(media_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verify the user owns the media file first
    media_item = db.query(models.MediaFile).filter(models.MediaFile.id == media_id, models.MediaFile.owner_id == current_user.id).first()
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")

    # Fetch all results linked to this media
    results = db.query(models.AnalysisResult).filter(models.AnalysisResult.media_id == media_id).all()
    
    # Convert from string (JSON) back to Python dictionaries for the response
    formatted_results = {}
    for res in results:
        formatted_results[res.module_name] = json.loads(res.result_data)
        
    return formatted_results


@app.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Count total projects
    total_projects = db.query(models.Project).filter(models.Project.owner_id == current_user.id).count()

    # 2. Count total media files
    total_files = db.query(models.MediaFile).filter(models.MediaFile.owner_id == current_user.id).count()

    # 3. Calculate "Total Area Scanned" from AnalysisResults
    all_results = db.query(models.AnalysisResult).join(models.MediaFile).filter(models.MediaFile.owner_id == current_user.id).all()
    
    total_area = 0.0
    for res in all_results:
        data = json.loads(res.result_data)
        # Summing a mock hectare value per successful scan for the demonstration
        if "canopy_cover" in data:
            total_area += 12.4 

    return {
        "total_projects": total_projects,
        "total_files": total_files,
        "total_area_scanned": f"{total_area:.1f} Ha",
        "active_models": 1
    }


@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Returns the profile of the currently authenticated user.
    """
    return current_user


# 1. Add this new Pydantic schema for updates
class UserUpdate(BaseModel):
    full_name: str
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@app.put("/users/me", response_model=schemas.UserResponse)
def update_profile(
    data: UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Only update the Name (Email is locked as requested)
    current_user.full_name = data.full_name
    
    # 2. Handle Password Change Logic
    if data.new_password:
        # Check if they provided the current password
        if not data.current_password:
             raise HTTPException(status_code=400, detail="Current password is required to set a new one.")
        
        # Verify the current password matches the DB
        if not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        
        # Hash and save the new password
        current_user.hashed_password = get_password_hash(data.new_password)
        
    db.commit()
    db.refresh(current_user)
    return current_user


@app.get("/media/{media_id}/export/csv")
def export_analysis_csv(media_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Fetch the media and its results
    media_item = db.query(models.MediaFile).filter(models.MediaFile.id == media_id, models.MediaFile.owner_id == current_user.id).first()
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")
        
    results = db.query(models.AnalysisResult).filter(models.AnalysisResult.media_id == media_id).all()

    # 2. Create an in-memory string buffer for the CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # 3. Write Headers
    writer.writerow(["Project ID", "Filename", "Module", "Metric", "Value", "Timestamp"])
    
    # 4. Write Data Rows
    for res in results:
        data = json.loads(res.result_data)
        for key, val in data.items():
            writer.writerow([
                media_item.project_id or "N/A",
                media_item.filename,
                res.module_name,
                key,
                val,
                res.created_at
            ])

    # 5. Return as a downloadable file
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=report_{media_id}.csv"
    return response

@app.get("/projects/{project_id}/export/csv")
def export_project_master_csv(
    project_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # 1. Verify project belongs to user
    project = db.query(models.Project).filter(
        models.Project.id == project_id, 
        models.Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Get all media files and their analysis results
    media_files = db.query(models.MediaFile).filter(models.MediaFile.project_id == project_id).all()
    media_ids = [m.id for m in media_files]
    
    results = db.query(models.AnalysisResult).filter(models.AnalysisResult.media_id.in_(media_ids)).all()

    # 3. Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Project", "Location", "Asset Name", "AI Module", "Metric", "Value", "Date"])

    for res in results:
        # Find the parent media file for this result to get the filename
        parent_media = next((m for m in media_files if m.id == res.media_id), None)
        data = json.loads(res.result_data)
        
        for key, val in data.items():
            writer.writerow([
                project.title,
                project.location,
                parent_media.filename.split('_')[-1] if parent_media else "Unknown",
                res.module_name,
                key,
                val,
                res.created_at.strftime("%Y-%m-%d")
            ])

    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=Project_{project_id}_Master_Report.csv"
    return response


# A simple dictionary to store tokens temporarily
# In a real app, you'd save this to a database table
#password_reset_tokens = {} 
# Change schemas.LoginRequest to schemas.ForgotPasswordRequest
@app.post("/forgot-password")
async def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if user:
        # 1. Generate Token
        token = secrets.token_urlsafe(32)
        expiry = datetime.now() + timedelta(hours=1)

        # 2. Save to Database
        db_token = models.PasswordResetToken(
            email=user.email,
            token=token,
            expires_at=expiry
        )
        db.add(db_token)
        db.commit()
        frontend_base_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        # 3. Send Email
        reset_link = f"{frontend_base_url}/reset-password?token={token}"
        send_reset_email(user.email, reset_link)

    return {"message": "Check your email for a reset link."}


@app.post("/reset-password")
async def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    # 1. Look for the token in the DB
    db_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == request.token,
        models.PasswordResetToken.is_used == False
    ).first()
    
    if not db_token:
        raise HTTPException(status_code=400, detail="Invalid reset link.")

    # 2. Check if expired
    if datetime.now() > db_token.expires_at:
        raise HTTPException(status_code=400, detail="Reset link has expired.")

    # 3. Find the user
    user = db.query(models.User).filter(models.User.email == db_token.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # 4. Hash and Update
    user.hashed_password = get_password_hash(request.new_password)
    
    # 5. Mark token as used so it can't be reused
    db_token.is_used = True
    
    db.commit()

    return {"message": "Password updated successfully!"}


@app.delete("/maintenance/clear-expired-tokens")
def clear_expired_tokens(db: Session = Depends(get_db)):
    # Delete tokens that are either already used OR past their expiration date
    now = datetime.now()
    deleted_count = db.query(models.PasswordResetToken).filter(
        (models.PasswordResetToken.expires_at < now) | 
        (models.PasswordResetToken.is_used == True)
    ).delete()
    
    db.commit()
    return {"message": f"Cleaned up {deleted_count} old tokens."}


@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Find the project AND ensure it belongs to the logged-in user
    project = db.query(models.Project).filter(
        models.Project.id == project_id, 
        models.Project.owner_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}