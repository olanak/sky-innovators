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


class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)       
    file_size_mb = Column(Float)     
    status = Column(String, default="Processing")
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    # This side was already here, looking for the 'media' property above!
    owner = relationship("User", back_populates="media")