from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# --- Async PostgreSQL Configuration ---
# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Set to False in production
    future=True,
)

# Create async session factory
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Declarative base for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Dependency to get PostgreSQL session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# --- Async MongoDB Configuration ---
class MongoDBManager:
    def __init__(self) -> None:
        self.client: AsyncIOMotorClient = None
        self.db = None

    def connect(self) -> None:
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        self.db = self.client[settings.MONGODB_DB_NAME]

    def close(self) -> None:
        if self.client:
            self.client.close()


mongodb_manager = MongoDBManager()

# Dependency to get MongoDB database instance
async def get_mongodb():
    return mongodb_manager.db
