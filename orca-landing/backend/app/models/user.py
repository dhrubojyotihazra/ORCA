from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

LanguageType = Literal["en", "hi", "bn", "mr", "ta"]
VesselType = Literal["small", "medium", "large"]

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OtpSendRequest(BaseModel):
    phone: str = Field(..., description="Phone number with country code, e.g. +919876543210")

class OtpVerifyRequest(BaseModel):
    phone: str
    token: str = Field(..., description="OTP code received")

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None
    refresh_token: Optional[str] = None
    user_id: str
    email: Optional[str] = None

class OnboardingRequest(BaseModel):
    display_name: str
    language: LanguageType = "en"
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_name: Optional[str] = None
    vessel_type: VesselType = "small"

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    language: Optional[LanguageType] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    location_name: Optional[str] = None
    vessel_type: Optional[VesselType] = None

class UserProfileResponse(BaseModel):
    id: str
    display_name: Optional[str] = None
    language: LanguageType = "en"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    vessel_type: Optional[VesselType] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
