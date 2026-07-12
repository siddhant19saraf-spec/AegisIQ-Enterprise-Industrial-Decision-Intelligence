from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import v1_router
from app.core.cache import close_redis
from app.core.config import get_settings
from app.core.database import engine
from app.core.logging import configure_logging
from app.core.middleware import register_exception_handlers, register_middleware

configure_logging()
settings = get_settings()

if settings.sentry_dsn:
    import sentry_sdk
    sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_redis()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

register_middleware(app)
register_exception_handlers(app)
app.include_router(v1_router)
