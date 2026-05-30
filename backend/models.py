from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from .database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    category = Column(String(50), nullable=True)
    available = Column(Boolean, default=True)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    order = Column(Integer, default=0)


class DeliveryZone(Base):
    __tablename__ = "delivery_zones"

    id = Column(Integer, primary_key=True, index=True)
    neighborhood = Column(String(100), nullable=False)
    fee = Column(Float, nullable=False, default=0)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, default=1)
    message = Column(Text, nullable=False, default="")
    active = Column(Boolean, default=False)
