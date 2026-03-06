"""
Multi-Storage Service with Fallback
Priority: Cloudinary → Qiniu → Local (or other alternatives)
"""
import cloudinary
import cloudinary.uploader
from typing import Optional, Dict, List

from fastapi import HTTPException
from app.core.config import settings


# Configure Cloudinary
if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET
    )


class ImageStorageService:
    """Multi-storage service with automatic fallback"""
    
    @staticmethod
    async def upload_image(
        file_bytes: bytes,
        filename: str,
        folder: str = "images"
    ) -> Dict:
        """
        Upload with fallback priority:
        1. Cloudinary (Global)
        2. Qiniu (China)
        3. Local storage (fallback)
        """
        result = {
            "primary_url": None,
            "storage_provider": None,
            "cloudinary_url": None,
            "cloudinary_public_id": None,
            "qiniu_url": None,
            "qiniu_key": None,
            "local_path": None
        }
        
        # ========== TRY CLOUDINARY FIRST ==========
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
            try:
                cloudinary_result = cloudinary.uploader.upload(
                    file_bytes,
                    folder=f"nexusflow/{folder}",
                    resource_type="image",
                    transformation=[
                        {"quality": "auto:good"},
                        {"fetch_format": "auto"}
                    ]
                )
                
                result["cloudinary_url"] = cloudinary_result["secure_url"]
                result["cloudinary_public_id"] = cloudinary_result["public_id"]
                result["primary_url"] = cloudinary_result["secure_url"]
                result["storage_provider"] = "cloudinary"
                
                # Success! Return immediately
                return result
                
            except Exception as e:
                print(f"⚠️ Cloudinary upload failed: {e}")
                # Continue to next provider
        
        # ========== TRY QINIU SECOND ==========
        if settings.QINIU_ACCESS_KEY and settings.QINIU_SECRET_KEY:
            try:
                import qiniu
                from qiniu import Auth, put_data
                import uuid
                
                # Initialize Qiniu Auth
                auth = Auth(settings.QINIU_ACCESS_KEY, settings.QINIU_SECRET_KEY)
                
                # Generate unique key
                key = f"{folder}/{uuid.uuid4().hex}_{filename}"
                
                # Get upload token
                token = auth.upload_token(settings.QINIU_BUCKET, key)
                
                # Upload file
                ret, info = put_data(token, key, file_bytes)
                
                if info.status_code == 200:
                    qiniu_url = f"https://{settings.QINIU_DOMAIN}/{key}"
                    
                    result["qiniu_url"] = qiniu_url
                    result["qiniu_key"] = key
                    result["primary_url"] = qiniu_url
                    result["storage_provider"] = "qiniu"
                    
                    # Success! Return immediately
                    return result
                else:
                    print(f"⚠️ Qiniu upload failed: {info.error}")
                    
            except Exception as e:
                print(f"⚠️ Qiniu upload error: {e}")
                # Continue to next provider
        
        # ========== FALLBACK: LOCAL STORAGE ==========
        try:
            import os
            import uuid
            
            # Create folder if not exists
            local_folder = f"app/static/{folder}"
            os.makedirs(local_folder, exist_ok=True)
            
            # Generate unique filename
            ext = filename.split(".")[-1] if "." in filename else "jpg"
            local_filename = f"{uuid.uuid4().hex}.{ext}"
            local_path = os.path.join(local_folder, local_filename)
            
            # Save file
            with open(local_path, "wb") as f:
                f.write(file_bytes)
            
            # Generate URL (for local development)
            local_url = f"/static/{folder}/{local_filename}"
            
            result["local_path"] = local_path
            result["primary_url"] = local_url
            result["storage_provider"] = "local"
            
            print(f"ℹ️ Using local storage fallback: {local_path}")
            return result
            
        except Exception as e:
            print(f"❌ All storage providers failed: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to upload image. All storage providers unavailable."
            )
    
    @staticmethod
    async def delete_image(
        cloudinary_public_id: Optional[str] = None,
        qiniu_key: Optional[str] = None,
        local_path: Optional[str] = None,
        storage_provider: str = "cloudinary"
    ):
        """Delete from the appropriate storage provider"""
        
        if storage_provider == "cloudinary" and cloudinary_public_id:
            try:
                cloudinary.uploader.destroy(cloudinary_public_id)
                print(f"✅ Deleted from Cloudinary: {cloudinary_public_id}")
            except Exception as e:
                print(f"⚠️ Cloudinary delete failed: {e}")
        
        elif storage_provider == "qiniu" and qiniu_key:
            try:
                import qiniu
                from qiniu.services.storage import bucket as bucket_manager
                
                auth = qiniu.Auth(settings.QINIU_ACCESS_KEY, settings.QINIU_SECRET_KEY)
                bm = bucket_manager.BucketManager(auth)
                bm.delete(settings.QINIU_BUCKET, qiniu_key)
                print(f"✅ Deleted from Qiniu: {qiniu_key}")
            except Exception as e:
                print(f"⚠️ Qiniu delete failed: {e}")
        
        elif storage_provider == "local" and local_path:
            try:
                import os
                if os.path.exists(local_path):
                    os.remove(local_path)
                    print(f"✅ Deleted local file: {local_path}")
            except Exception as e:
                print(f"⚠️ Local delete failed: {e}")