from fastapi import APIRouter, UploadFile, HTTPException
from google.cloud import firestore
import base64

router = APIRouter()
db = firestore.Client()

CHUNK_SIZE = 300_000


@router.post("/upload/{username}")
async def upload_profile_image(username: str, file: UploadFile):
    contents = await file.read()
    image_id = f"{username}_profile"
    chunks = [contents[i:i+CHUNK_SIZE] for i in range(0, len(contents), CHUNK_SIZE)]

    image_ref = db.collection("images").document(image_id)
    image_ref.set({
        "name": file.filename,
        "contentType": file.content_type,
        "totalChunks": len(chunks),
    })

    for i, chunk in enumerate(chunks):
        image_ref.collection("chunks").document(str(i)).set({
            "data": base64.b64encode(chunk).decode("utf-8")
        })

    # 🟢 Update or create user's profile_pic_uid
    user_ref = db.collection("usernames").document(username)
    user_ref.set({"profile_pic_uid": image_id}, merge=True)

    return {"message": f"Uploaded and linked {file.filename} to {username}", "image_id": image_id}


@router.get("/{image_id}")
def get_image(image_id: str):
    image_ref = db.collection("images").document(image_id)
    doc = image_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Image not found")

    chunks = []
    chunk_docs = image_ref.collection("chunks").stream()
    for chunk_doc in chunk_docs:
        chunks.append(base64.b64decode(chunk_doc.to_dict()["data"]))

    content = b"".join(chunks)
    return {
        "name": doc.to_dict()["name"],
        "contentType": doc.to_dict()["contentType"],
        "data": base64.b64encode(content).decode("utf-8"),
    }
