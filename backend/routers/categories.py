from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/categories", tags=["categories"])
bearer = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        jwt.decode(credentials.credentials, settings.secret_key, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.get("/", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).order_by(models.Category.order, models.Category.name).all()


@router.post("/", response_model=schemas.CategoryOut, dependencies=[Depends(verify_token)])
def create_category(body: schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.name == body.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Categoria já existe")
    cat = models.Category(name=body.name, order=body.order)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}", dependencies=[Depends(verify_token)])
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.get(models.Category, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    db.delete(cat)
    db.commit()
    return {"ok": True}
