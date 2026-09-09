import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.services.supabase_client import get_supabase_client
from app.models.chat import ConversationResponse, MessageResponse

logger = logging.getLogger(__name__)

# Mock storage fallback
_mock_conversations: Dict[str, Dict[str, Any]] = {}
_mock_messages: Dict[str, List[Dict[str, Any]]] = {}

class ChatService:
    @staticmethod
    async def create_conversation(user_id: str, title: Optional[str] = None, first_message: Optional[str] = None) -> ConversationResponse:
        client = get_supabase_client()
        conv_title = title or (first_message[:30] + "..." if first_message else "New Conversation")
        now = datetime.now(timezone.utc)

        if client:
            try:
                res = client.table("conversations").insert({
                    "user_id": user_id,
                    "title": conv_title
                }).execute()
                if res.data and len(res.data) > 0:
                    c = res.data[0]
                    return ConversationResponse(
                        id=c["id"],
                        user_id=c["user_id"],
                        title=c["title"],
                        created_at=c["created_at"],
                        updated_at=c["updated_at"]
                    )
            except Exception as e:
                logger.error(f"Error creating conversation in Supabase: {e}")

        # Fallback
        conv_id = str(uuid.uuid4())
        conv_obj = {
            "id": conv_id,
            "user_id": user_id,
            "title": conv_title,
            "created_at": now,
            "updated_at": now
        }
        _mock_conversations[conv_id] = conv_obj
        _mock_messages[conv_id] = []
        return ConversationResponse(**conv_obj)

    @staticmethod
    async def list_conversations(user_id: str) -> List[ConversationResponse]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
                if res.data:
                    return [ConversationResponse(**c) for c in res.data]
            except Exception as e:
                logger.error(f"Error listing conversations from Supabase: {e}")

        # Fallback
        user_convs = [c for c in _mock_conversations.values() if c["user_id"] == user_id]
        user_convs.sort(key=lambda x: x["updated_at"], reverse=True)
        return [ConversationResponse(**c) for c in user_convs]

    @staticmethod
    async def get_conversation_with_messages(conv_id: str, user_id: str) -> Dict[str, Any]:
        client = get_supabase_client()
        if client:
            try:
                c_res = client.table("conversations").select("*").eq("id", conv_id).eq("user_id", user_id).execute()
                if c_res.data and len(c_res.data) > 0:
                    conv = c_res.data[0]
                    m_res = client.table("messages").select("*").eq("conversation_id", conv_id).order("created_at", desc=False).execute()
                    messages = m_res.data or []
                    return {
                        "id": conv["id"],
                        "user_id": conv["user_id"],
                        "title": conv["title"],
                        "created_at": conv["created_at"],
                        "updated_at": conv["updated_at"],
                        "messages": messages
                    }
            except Exception as e:
                logger.error(f"Error getting conversation from Supabase: {e}")

        # Fallback
        if conv_id in _mock_conversations:
            conv = _mock_conversations[conv_id]
            messages = _mock_messages.get(conv_id, [])
            return {
                **conv,
                "messages": messages
            }
        
        return None

    @staticmethod
    async def delete_conversation(conv_id: str, user_id: str) -> bool:
        client = get_supabase_client()
        if client:
            try:
                client.table("conversations").delete().eq("id", conv_id).eq("user_id", user_id).execute()
                return True
            except Exception as e:
                logger.error(f"Error deleting conversation from Supabase: {e}")

        if conv_id in _mock_conversations:
            del _mock_conversations[conv_id]
            _mock_messages.pop(conv_id, None)
            return True
        return False

    @staticmethod
    async def add_message(conv_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> MessageResponse:
        client = get_supabase_client()
        meta = metadata or {}
        now = datetime.now(timezone.utc)

        if client:
            try:
                res = client.table("messages").insert({
                    "conversation_id": conv_id,
                    "role": role,
                    "content": content,
                    "metadata": meta
                }).execute()
                if res.data and len(res.data) > 0:
                    m = res.data[0]
                    # Update conversation timestamp
                    client.table("conversations").update({"updated_at": "NOW()"}).eq("id", conv_id).execute()
                    return MessageResponse(
                        id=m["id"],
                        conversation_id=m["conversation_id"],
                        role=m["role"],
                        content=m["content"],
                        metadata=m.get("metadata", {}),
                        created_at=m["created_at"]
                    )
            except Exception as e:
                logger.error(f"Error adding message in Supabase: {e}")

        # Fallback
        msg_id = str(uuid.uuid4())
        msg_obj = {
            "id": msg_id,
            "conversation_id": conv_id,
            "role": role,
            "content": content,
            "metadata": meta,
            "created_at": now
        }
        if conv_id not in _mock_messages:
            _mock_messages[conv_id] = []
        _mock_messages[conv_id].append(msg_obj)
        
        if conv_id in _mock_conversations:
            _mock_conversations[conv_id]["updated_at"] = now

        return MessageResponse(**msg_obj)
