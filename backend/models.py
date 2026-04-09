from sqlalchemy import DateTime, Text, JSON
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
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)

    owner = relationship("User", back_populates="media")
    project = relationship("Project", back_populates="assets")

    # ── NEW: one MediaFile has many segmentation frames ──────────────────────
    segmentation_frames = relationship(
        "SegmentationFrame",
        back_populates="media",
        cascade="all, delete-orphan",
        order_by="SegmentationFrame.timestamp_ms"
    )


class AnalysisResult(Base):
    """
    Unchanged — stores high-level module metrics (canopy cover, vegetation
    index, etc.) exactly as before. The rest of the app still reads this.
    """
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("media_files.id", ondelete="CASCADE"))
    module_name = Column(String)
    result_data = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    media = relationship("MediaFile", backref="results")


# ── NEW TABLE ─────────────────────────────────────────────────────────────────
class SegmentationFrame(Base):
    """
    Stores per-frame (or per-image) pixel segmentation masks produced by the
    AI model.  Each row is one timestamp in a video (or timestamp_ms=0 for an
    image).  segments_json holds a JSON array like:

        [
          {
            "class": "forest",
            "mask_rle": [10, 5, 20, 3, ...],
            "width": 1920,
            "height": 1080,
            "confidence": 0.94
          },
          ...
        ]

    Using Text (not String) because RLE arrays can be large.
    """
    __tablename__ = "segmentation_frames"

    id           = Column(Integer, primary_key=True, index=True)
    media_id     = Column(Integer, ForeignKey("media_files.id", ondelete="CASCADE"), index=True)
    timestamp_ms = Column(Integer, default=0)   # 0 for images, real ms for video
    segments_json = Column(Text, nullable=False) # JSON array of segment objects

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    media = relationship("MediaFile", back_populates="segmentation_frames")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String, index=True, nullable=False)
    token      = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used    = Column(Boolean, default=False)
