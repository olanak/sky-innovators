from sqlalchemy import DateTime 
import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    
    # NEW: The missing half of the bridge!
    # This tells the User class that it owns multiple MediaFiles.
    media = relationship("MediaFile", back_populates="owner")



class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    client = Column(String)
    location = Column(String)
    description = Column(String, nullable=True)
    status = Column(String, default="Planning")
    progress = Column(Integer, default=0)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", backref="projects")
    # 👉 NEW: Tell the Project it owns multiple media files
    assets = relationship("MediaFile", back_populates="project") 


class MediaFile(Base):
    __tablename__ = "media_files"
    

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)       
    file_size_mb = Column(Float)     
    status = Column(String, default="Processing")
    owner_id = Column(Integer, ForeignKey("users.id"))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    altitude = Column(Float, nullable=True)
    
    # 👉 NEW: Add a column for the Project ID
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True) 
    
    owner = relationship("User", back_populates="media")
    # 👉 NEW: Link back to the Project
    project = relationship("Project", back_populates="assets")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("media_files.id", ondelete="CASCADE"))
    module_name = Column(String)  # e.g., "forestry", "land", "infrastructure"
    
    # We store the results as a JSON blob so it's flexible for any AI model
    # Example: {"canopy_cover": 65, "deforestation_detected": true}
    result_data = Column(String) 
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    media = relationship("MediaFile", backref="results")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    
    # ✅ THE FIX: Wrap Boolean inside Column()
    is_used = Column(Boolean, default=False)