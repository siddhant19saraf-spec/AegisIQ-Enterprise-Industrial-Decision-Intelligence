from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import get_settings
from app.core.exceptions import AegisIQException

limiter = Limiter(key_func=get_remote_address)


def register_middleware(app: FastAPI) -> None:
    settings = get_settings()

    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if settings.environment == "development":
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
    else:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=origins if origins != ["*"] else ["*"],
        )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AegisIQException)
    async def aegisiq_exception_handler(request: Request, exc: AegisIQException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code},
        )
