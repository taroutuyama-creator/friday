from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="Friday API",
    description="外部公開用 Claude チャットサービス",
    version="0.1.0"
)

# CORS設定
origins = os.getenv("CORS_ORIGINS", "http://localhost:3003").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Friday API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# TODO: Add routers
# from app.routers import chat, conversations, skills
# app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
# app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
# app.include_router(skills.router, prefix="/api/skills", tags=["skills"])
