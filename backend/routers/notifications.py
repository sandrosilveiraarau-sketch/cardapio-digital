from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/notification", tags=["notification"])
bearer = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        jwt.decode(credentials.credentials, settings.secret_key, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.get("/", response_model=schemas.NotificationOut)
def get_notification(db: Session = Depends(get_db)):
    n = db.query(models.Notification).first()
    if not n:
        return schemas.NotificationOut(message="", active=False)
    return n


@router.put("/", response_model=schemas.NotificationOut, dependencies=[Depends(verify_token)])
def update_notification(body: schemas.NotificationUpdate, db: Session = Depends(get_db)):
    n = db.query(models.Notification).first()
    if not n:
        n = models.Notification(id=1, message=body.message, active=body.active)
        db.add(n)
    else:
        n.message = body.message
        n.active = body.active
    db.commit()
    db.refresh(n)
    return n
