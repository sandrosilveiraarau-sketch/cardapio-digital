import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..config import settings

if settings.cloudinary_cloud_name:
    import cloudinary
    import cloudinary.uploader
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
    )

router = APIRouter(prefix="/items", tags=["items"])
bearer = HTTPBearer()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        jwt.decode(credentials.credentials, settings.secret_key, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


@router.get("/config")
def get_config():
    return {"whatsapp_number": settings.whatsapp_number}


@router.get("/", response_model=list[schemas.ItemOut])
def list_items(db: Session = Depends(get_db)):
    return db.query(models.Item).filter(models.Item.available == True).all()


@router.get("/all", response_model=list[schemas.ItemOut], dependencies=[Depends(verify_token)])
def list_all_items(db: Session = Depends(get_db)):
    return db.query(models.Item).all()


@router.post("/", response_model=schemas.ItemOut, dependencies=[Depends(verify_token)])
async def create_item(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: float = Form(...),
    category: Optional[str] = Form(None),
    available: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    image_url = None
    if image:
        image_url = await _save_image(image)

    item = models.Item(
        name=name,
        description=description,
        price=price,
        category=category,
        available=available,
        image_url=image_url,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=schemas.ItemOut, dependencies=[Depends(verify_token)])
async def update_item(
    item_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    available: Optional[bool] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    item = db.get(models.Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    if name is not None:
        item.name = name
    if description is not None:
        item.description = description
    if price is not None:
        item.price = price
    if category is not None:
        item.category = category
    if available is not None:
        item.available = available
    if image:
        item.image_url = await _save_image(image)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", dependencies=[Depends(verify_token)])
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(models.Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    db.delete(item)
    db.commit()
    return {"ok": True}


async def _save_image(upload: UploadFile) -> str:
    content = await upload.read()
    if settings.cloudinary_cloud_name:
        result = cloudinary.uploader.upload(content, folder="cardapio")
        return result["secure_url"]
    ext = os.path.splitext(upload.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(content)
    return f"/uploads/{filename}"
