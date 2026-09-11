from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

RoleType = Literal["user", "assistant"]

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: RoleType
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

class ConversationCreate(BaseModel):
    title: Optional[str] = None
    first_message: Optional[str] = None

class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ConversationWithMessagesResponse(ConversationResponse):
    messages: List[MessageResponse] = []
