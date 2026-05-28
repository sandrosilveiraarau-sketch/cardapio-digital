from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    admin_password: str = "admin123"
    secret_key: str = "dev-secret-key-troque-em-producao"
    database_url: str = ""
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    whatsapp_number: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
