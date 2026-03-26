from sqlalchemy import Column, Integer, String, Float, ForeignKey
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
    
    # 👉 NEW: Add a column for the Project ID
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True) 
    
    owner = relationship("User", back_populates="media")
    # 👉 NEW: Link back to the Project
    project = relationship("Project", back_populates="assets")