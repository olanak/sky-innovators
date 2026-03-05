from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# NOTE: Replace 'postgres:password' with your actual PostgreSQL username and password.
# 'skyinnovators' is the name of the database we are going to use.
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:%40Kenne345@localhost/skyinnovators"

# Create the engine that manages the connection
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a session factory to talk to the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This is the base class all of our database models will inherit from
Base = declarative_base()

# Dependency to get a database session for our API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()