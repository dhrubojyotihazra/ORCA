import json
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sse_starlette.sse import EventSourceResponse

from app.models.chat import (
    ConversationCreate,
    ConversationResponse,
    ConversationWithMessagesResponse,
    MessageCreate,
    MessageResponse
)
from app.services.chat_service import ChatService
from app.services.agent_service import AgentService
from app.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    body: ConversationCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new conversation"""
    return await ChatService.create_conversation(
        user_id=current_user["id"],
        title=body.title,
        first_message=body.first_message
    )

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(current_user: Dict[str, Any] = Depends(get_current_user)):
    """List all user conversations ordered by recent activity"""
    return await ChatService.list_conversations(user_id=current_user["id"])

@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessagesResponse)
async def get_conversation(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get single conversation history with messages"""
    conv = await ChatService.get_conversation_with_messages(conversation_id, current_user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete conversation and its associated messages"""
    success = await ChatService.delete_conversation(conversation_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "success", "message": "Conversation deleted"}

@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    body: MessageCreate,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Send a user message and get AI response (supports JSON and SSE text/event-stream)"""
    # 1. Save user message
    user_msg = await ChatService.add_message(
        conv_id=conversation_id,
        role="user",
        content=body.content,
        metadata=body.metadata
    )

    accept_header = request.headers.get("accept", "")
    is_sse = "text/event-stream" in accept_header

    if is_sse:
        async def event_generator():
            full_response_parts = []
            async for chunk in AgentService.stream_agent_response(body.content):
                full_response_parts.append(chunk)
                yield {"data": json.dumps({"chunk": chunk})}
            
            full_text = "".join(full_response_parts)
            # Save final assistant response to DB
            assistant_msg = await ChatService.add_message(
                conv_id=conversation_id,
                role="assistant",
                content=full_text,
                metadata={"evidence": ["INCOIS Forecast", "ISRO Telemetry"]}
            )
            yield {"event": "done", "data": json.dumps(assistant_msg.model_dump(), default=str)}

        return EventSourceResponse(event_generator())

    # Standard JSON non-streaming response
    agent_output = await AgentService.invoke_agent(body.content)
    assistant_msg = await ChatService.add_message(
        conv_id=conversation_id,
        role="assistant",
        content=agent_output["final_answer"],
        metadata={
            "evidence": agent_output.get("evidence", []),
            "map_layers": agent_output.get("map_layers", [])
        }
    )

    return assistant_msg
