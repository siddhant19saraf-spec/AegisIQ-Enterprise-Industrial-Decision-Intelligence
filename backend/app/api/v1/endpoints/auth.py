from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login():
    return {"message": "Auth not yet implemented"}


@router.post("/refresh")
async def refresh():
    return {"message": "Auth not yet implemented"}


@router.post("/logout")
async def logout():
    return {"message": "Auth not yet implemented"}
