from pydantic import BaseModel, EmailStr

# What we expect to receive from the React frontend when someone signs up
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str = "Sky Innovators User"

# What we safely return to the frontend (Notice we NEVER return the password!)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str

    class Config:
        from_attributes = True

# Add this to the bottom of schemas.py

# What we expect from React when creating a project
class ProjectCreate(BaseModel):
    title: str
    client: str
    location: str
    description: str = None

# What we send back to React
class ProjectResponse(BaseModel):
    id: int
    title: str
    client: str
    location: str
    description: str | None = None
    status: str
    progress: int

    class Config:
        from_attributes = True