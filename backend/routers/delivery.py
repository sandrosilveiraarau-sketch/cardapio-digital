from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/delivery", tags=["delivery"])
bearer = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        jwt.decode(credentials.credentials, settings.secret_key, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.get("/zones", response_model=list[schemas.DeliveryZoneOut])
def list_zones(db: Session = Depends(get_db)):
    return db.query(models.DeliveryZone).order_by(models.DeliveryZone.neighborhood).all()


@router.post("/zones", response_model=schemas.DeliveryZoneOut, dependencies=[Depends(verify_token)])
def create_zone(body: schemas.DeliveryZoneCreate, db: Session = Depends(get_db)):
    zone = models.DeliveryZone(neighborhood=body.neighborhood, fee=body.fee)
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.put("/zones/{zone_id}", response_model=schemas.DeliveryZoneOut, dependencies=[Depends(verify_token)])
def update_zone(zone_id: int, body: schemas.DeliveryZoneCreate, db: Session = Depends(get_db)):
    zone = db.get(models.DeliveryZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")
    zone.neighborhood = body.neighborhood
    zone.fee = body.fee
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/zones/{zone_id}", dependencies=[Depends(verify_token)])
def delete_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.get(models.DeliveryZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")
    db.delete(zone)
    db.commit()
    return {"ok": True}
