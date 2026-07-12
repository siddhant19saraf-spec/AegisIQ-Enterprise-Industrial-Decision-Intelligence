from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    app_name: str = "AegisIQ"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"

    # JWT — MUST be set via environment variable in production
    secret_key: str = ""

    # Database — set DATABASE_URL to override (e.g. for SQLite demo)
    database_url: str = ""

    # PostgreSQL (used when DATABASE_URL is not set)
    postgres_server: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "aegisiq"
    postgres_user: str = "aegisiq"
    postgres_password: str = ""

    @property
    def resolved_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"

    @property
    def sync_database_url(self) -> str:
        return self.resolved_database_url

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Sentry
    sentry_dsn: str = ""

    # Rate limiting
    rate_limit_per_minute: int = 60

    def validate_production(self) -> None:
        if self.environment == "production":
            if not self.secret_key or self.secret_key == "change-this-to-a-random-secret-key":
                raise ValueError("SECRET_KEY must be set to a secure random value in production")
            if not self.postgres_password:
                raise ValueError("POSTGRES_PASSWORD must be set in production")
            if not self.neo4j_password:
                raise ValueError("NEO4J_PASSWORD must be set in production")


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if s.environment == "production":
        s.validate_production()
    return s
