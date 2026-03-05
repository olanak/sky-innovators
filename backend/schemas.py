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