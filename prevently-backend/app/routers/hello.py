from fastapi import APIRouter

router = APIRouter()

@router.get("/hello")
async def hello_world():
    return {"message": "hello_world"}