import asyncio
from app.core.database import Base, engine
from app.models.user import User
from app.models.order import Order, OrderItem


async def init_models():
    async with engine.begin() as conn:
        print("Creating tables in PostgreSQL...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_models())
