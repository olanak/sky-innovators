import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 1. Load the .env file so we can read the SECRET_KEY and DATABASE_URL
load_dotenv()

# 2. Get the URL from the environment variable (Render/Neon)
# If it doesn't exist, it uses your local PostgreSQL as the fallback
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:%40Kenne345@localhost/skyinnovators"
)

# 3. CRITICAL FIX: SQLAlchemy requires 'postgresql://', 
# but many cloud providers (like Render/Heroku) provide 'postgres://'
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 4. Create the engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()