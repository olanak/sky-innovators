import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:%40Kenne345@localhost/skyinnovators"
)

if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ── Neon-safe engine configuration ───────────────────────────────────────────
# pool_pre_ping=True   — tests the connection before using it; if it's dead
#                        SQLAlchemy silently reconnects instead of crashing
# pool_recycle=300     — recycle connections after 5 minutes so Neon's 5-minute
#                        auto-suspend never holds a stale connection
# pool_size / max_overflow — conservative limits for Render free tier
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    connect_args={"connect_timeout": 10},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
