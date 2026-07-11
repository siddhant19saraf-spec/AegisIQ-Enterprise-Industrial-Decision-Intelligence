"""
AegisIQ seed data script.
Usage: python scripts/seed_data.py
"""
import asyncio
from uuid import uuid4

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import get_settings


async def seed():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine)

    async with session_factory() as session:
        # Placeholder — will be expanded in future milestones
        print("Seed script ready for Milestone 1+")
        await session.commit()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
