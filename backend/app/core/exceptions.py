class AegisIQError(Exception):
    status_code: int = 500
    detail: str = "Internal server error"
    code: str = "internal_error"


class NotFoundError(AegisIQError):
    status_code = 404
    code = "not_found"

    def __init__(self, detail: str = "Resource not found") -> None:
        self.detail = detail


class UnauthorizedError(AegisIQError):
    status_code = 401
    code = "unauthorized"

    def __init__(self, detail: str = "Not authenticated") -> None:
        self.detail = detail


class ForbiddenError(AegisIQError):
    status_code = 403
    code = "forbidden"

    def __init__(self, detail: str = "Permission denied") -> None:
        self.detail = detail


class ConflictError(AegisIQError):
    status_code = 409
    code = "conflict"

    def __init__(self, detail: str = "Resource already exists") -> None:
        self.detail = detail


class ValidationError(AegisIQError):
    status_code = 422
    code = "validation_error"

    def __init__(self, detail: str = "Validation failed") -> None:
        self.detail = detail
