from fastapi import FastAPI
from agent_setup import get_bro_response
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

class ChatBase(BaseModel):
    query: str
    chat_history: list[tuple[str, str]] = []


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "https://brogpt.stanislavmanolov.com",
    "http://localhost:5173",  # запазваш за local development
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
def chat(request: ChatBase):
    return get_bro_response(request.query, request.chat_history)