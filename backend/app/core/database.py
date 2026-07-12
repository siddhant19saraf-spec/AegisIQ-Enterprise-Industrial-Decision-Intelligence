from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()
is_sqlite = settings.resolved_database_url.startswith("sqlite")

engine = create_async_engine(
    settings.resolved_database_url,
    echo=settings.debug,
    **({} if is_sqlite else {"pool_size": 20, "max_overflow": 10, "pool_pre_ping": True}),
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
