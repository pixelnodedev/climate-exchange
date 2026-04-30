from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Form, Query, Depends
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import uuid
import bcrypt
import jwt
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import shutil

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Uploads directory
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Неверный тип токена")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Пользователь не найден")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Срок действия токена истёк")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Неверный токен")

async def get_optional_user(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# App setup
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ===== AUTH ENDPOINTS =====

class RegisterInput(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = ""

class LoginInput(BaseModel):
    email: str
    password: str

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    is_secure = "https" in os.environ.get("FRONTEND_URL", "")
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=is_secure, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=is_secure, samesite="lax", max_age=604800, path="/")

def user_response(user: dict) -> dict:
    return {
        "id": str(user["_id"]) if isinstance(user.get("_id"), ObjectId) else user.get("_id", ""),
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        "phone": user.get("phone", ""),
        "role": user.get("role", "user"),
        "created_at": user.get("created_at", ""),
    }

@api_router.post("/auth/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Электронная почта уже зарегистрирована")
    user_doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "phone": data.phone or "",
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    access = create_access_token(str(result.inserted_id), email)
    refresh = create_refresh_token(str(result.inserted_id))
    set_auth_cookies(response, access, refresh)
    return user_response(user_doc)

@api_router.post("/auth/login")
async def login(data: LoginInput, request: Request, response: Response):
    email = data.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Brute force check
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.now(timezone.utc).isoformat() < locked_until:
            raise HTTPException(status_code=429, detail="Слишком много неудачных попыток. Попробуйте через 15 минут.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    # Clear failed attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    access = create_access_token(str(user["_id"]), email)
    refresh = create_refresh_token(str(user["_id"]))
    set_auth_cookies(response, access, refresh)
    return user_response(user)

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Вы вышли из системы"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user_response(user)

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Токен обновления не найден")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"])
        set_auth_cookies(response, access, token)
        return user_response(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Срок действия refresh токена истёк")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Неверный refresh токен")

# ===== FILE UPLOAD =====

@api_router.post("/upload")
async def upload_files(request: Request, files: List[UploadFile] = File(...)):
    user = await get_current_user(request)
    uploaded = []
    for f in files:
        ext = f.filename.split(".")[-1] if "." in f.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = UPLOAD_DIR / filename
        with open(filepath, "wb") as buffer:
            content = await f.read()
            buffer.write(content)
        uploaded.append({"filename": filename, "original_name": f.filename, "url": f"/api/uploads/{filename}"})
    return {"files": uploaded}

@api_router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    ext = filename.rsplit(".", 1)[-1].lower()
    mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}
    content_type = mime_map.get(ext, "application/octet-stream")
    with open(filepath, "rb") as f:
        data = f.read()
    return Response(content=data, media_type=content_type)

# ===== PRODUCT ENDPOINTS =====

class ProductInput(BaseModel):
    title: str
    description: str
    brand: str
    ac_type: str  # split, portable, industrial
    condition: str  # new, used
    price: float
    images: List[str] = []

@api_router.post("/products")
async def create_product(data: ProductInput, request: Request):
    user = await get_current_user(request)
    doc = {
        "id": str(uuid.uuid4()),
        "title": data.title,
        "description": data.description,
        "brand": data.brand,
        "ac_type": data.ac_type,
        "condition": data.condition,
        "price": data.price,
        "images": data.images,
        "seller_id": user["_id"],
        "seller_name": user.get("name", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
    }
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/products")
async def list_products(
    search: Optional[str] = None,
    brand: Optional[str] = None,
    ac_type: Optional[str] = None,
    condition: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    seller_id: Optional[str] = None,
    page: int = 1,
    limit: int = 12,
):
    query = {"is_active": True}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
        ]
    if brand:
        query["brand"] = {"$regex": f"^{brand}$", "$options": "i"}
    if ac_type:
        query["ac_type"] = ac_type
    if condition:
        query["condition"] = condition
    if min_price is not None:
        query["price"] = query.get("price", {})
        query["price"]["$gte"] = min_price
    if max_price is not None:
        query["price"] = query.get("price", {})
        query["price"]["$lte"] = max_price
    if seller_id:
        query["seller_id"] = seller_id
    
    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": (total + limit - 1) // limit if total > 0 else 1}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id, "is_active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return product

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, data: ProductInput, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    if product["seller_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Нет доступа")
    update_data = {
        "title": data.title,
        "description": data.description,
        "brand": data.brand,
        "ac_type": data.ac_type,
        "condition": data.condition,
        "price": data.price,
        "images": data.images,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    if product["seller_id"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Нет доступа")
    await db.products.update_one({"id": product_id}, {"$set": {"is_active": False}})
    return {"message": "Объявление удалено"}

# ===== CART ENDPOINTS =====

@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not cart:
        return {"user_id": user["_id"], "items": [], "total": 0}
    
    # Populate product details
    enriched_items = []
    total = 0
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"], "is_active": True}, {"_id": 0})
        if product:
            enriched = {**item, "product": product}
            enriched_items.append(enriched)
            total += product["price"] * item["quantity"]
    
    return {"user_id": user["_id"], "items": enriched_items, "total": round(total, 2)}

class CartAddInput(BaseModel):
    product_id: str
    quantity: int = 1

@api_router.post("/cart/add")
async def add_to_cart(data: CartAddInput, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"id": data.product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart:
        await db.carts.insert_one({"user_id": user["_id"], "items": [{"product_id": data.product_id, "quantity": data.quantity}]})
    else:
        existing_item = next((i for i in cart["items"] if i["product_id"] == data.product_id), None)
        if existing_item:
            await db.carts.update_one(
                {"user_id": user["_id"], "items.product_id": data.product_id},
                {"$inc": {"items.$.quantity": data.quantity}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["_id"]},
                {"$push": {"items": {"product_id": data.product_id, "quantity": data.quantity}}}
            )
    return {"message": "Добавлено в корзину"}

class CartUpdateInput(BaseModel):
    product_id: str
    quantity: int

@api_router.put("/cart/update")
async def update_cart_item(data: CartUpdateInput, request: Request):
    user = await get_current_user(request)
    if data.quantity <= 0:
        await db.carts.update_one(
            {"user_id": user["_id"]},
            {"$pull": {"items": {"product_id": data.product_id}}}
        )
    else:
        await db.carts.update_one(
            {"user_id": user["_id"], "items.product_id": data.product_id},
            {"$set": {"items.$.quantity": data.quantity}}
        )
    return {"message": "Корзина обновлена"}

class CartRemoveInput(BaseModel):
    product_id: str

@api_router.post("/cart/remove")
async def remove_from_cart(data: CartRemoveInput, request: Request):
    user = await get_current_user(request)
    await db.carts.update_one(
        {"user_id": user["_id"]},
        {"$pull": {"items": {"product_id": data.product_id}}}
    )
    return {"message": "Удалено из корзины"}

# ===== ORDER ENDPOINTS =====

@api_router.post("/orders")
async def create_order(request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Корзина пуста")
    
    order_items = []
    total = 0
    for item in cart["items"]:
        product = await db.products.find_one({"id": item["product_id"], "is_active": True}, {"_id": 0})
        if product:
            order_items.append({
                "product_id": item["product_id"],
                "title": product["title"],
                "price": product["price"],
                "quantity": item["quantity"],
                "image": product["images"][0] if product.get("images") else "",
            })
            total += product["price"] * item["quantity"]
    
    if not order_items:
        raise HTTPException(status_code=400, detail="Нет доступных товаров в корзине")
    
    order = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "items": order_items,
        "total": round(total, 2),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order)
    # Clear cart
    await db.carts.delete_one({"user_id": user["_id"]})
    order.pop("_id", None)
    return order

@api_router.get("/orders")
async def list_orders(request: Request):
    user = await get_current_user(request)
    orders = await db.orders.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"id": order_id, "user_id": user["_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order


class OrderStatusInput(BaseModel):
    status: str


@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusInput, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Нет доступа")

    allowed = {"pending", "confirmed", "shipped", "delivered", "cancelled"}
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail="Недопустимый статус")

    res = await db.orders.update_one({"id": order_id}, {"$set": {"status": data.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated

# ===== PROFILE ENDPOINTS =====

@api_router.get("/profile/listings")
async def get_my_listings(request: Request):
    user = await get_current_user(request)
    listings = await db.products.find({"seller_id": user["_id"], "is_active": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"listings": listings}

# ===== BRANDS/STATS =====

@api_router.get("/brands")
async def get_brands():
    brands = await db.products.distinct("brand", {"is_active": True})
    return {"brands": sorted(brands)}

@api_router.get("/stats")
async def get_stats():
    total_products = await db.products.count_documents({"is_active": True})
    total_users = await db.users.count_documents({})
    total_orders = await db.orders.count_documents({})
    return {"total_products": total_products, "total_users": total_users, "total_orders": total_orders}

# Include router
app.include_router(api_router)

# CORS - specific origins for cookie credentials
cors_origins = [
    os.environ.get("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup
@app.on_event("startup")
async def startup():
    try:
        # Indexes
        await db.users.create_index("email", unique=True)
        await db.login_attempts.create_index("identifier")
        await db.products.create_index("seller_id")
        await db.products.create_index([("title", 1), ("brand", 1)])
        await db.carts.create_index("user_id", unique=True)
        await db.orders.create_index("user_id")

        # Seed admin
        admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
        admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
        existing = await db.users.find_one({"email": admin_email})
        if not existing:
            hashed = hash_password(admin_password)
            await db.users.insert_one({
                "email": admin_email,
                "password_hash": hashed,
                "name": "Admin",
                "phone": "",
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            logger.info(f"Admin user created: {admin_email}")
        elif not verify_password(admin_password, existing["password_hash"]):
            await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
            logger.info("Admin password updated")

        # Write test credentials (use project-local memory directory)
        creds_path = ROOT_DIR / 'memory' / 'test_credentials.md'
        creds_path.parent.mkdir(parents=True, exist_ok=True)
        creds_path.write_text(f"""# Test Credentials
## Admin
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
""")
        logger.info("Startup complete")
    except Exception as e:
        logger.error(f"Startup DB initialization failed: {e}")
        logger.info("Skipping DB initialization. Ensure MongoDB is running and MONGO_URL is correct.")
        return

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
