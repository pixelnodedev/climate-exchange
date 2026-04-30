# ClimateExchange — Маркетплейс кондиционеров

Полнофункциональный веб-приложение для покупки и продажи новых и б/у кондиционеров (сплит-системы, портативные и промышленные установки).

## Возможности

- **Аутентификация пользователей** — регистрация, вход и выход с JWT (httpOnly cookie)
- **Каталог товаров** — поиск и фильтры (бренд, тип, состояние, диапазон цен)
- **Карточка товара** — галерея изображений, информация о продавце, добавление в корзину
- **Объявления продавцов** — создание, редактирование, удаление объявлений с загрузкой нескольких изображений
- **Корзина** — добавление/удаление товаров, изменение количества
- **Оформление заказа** — оплата/оформление с корзины, история заказов
- **Профиль пользователя** — просмотр своих объявлений и заказов
- **Админ-пользователь** — админ создаётся автоматически при старте (seeding)
- **Защита от брутфорса** — ограничение попыток входа
- **REST API** — полный API доступен по префиксу `/api`

## Технологии

| Слой       | Технологии                                   |
|------------|-----------------------------------------------|
| Фронтенд   | React, Tailwind CSS, Shadcn UI, Lucide Icons |
| Бэкенд     | FastAPI, Motor (асинхронный драйвер MongoDB)  |
| База данных| MongoDB                                       |
| Аутентификация | JWT (PyJWT) + bcrypt для хеширования паролей |
| Шрифты     | Outfit (заголовки), IBM Plex Sans (текст)    |

## Структура проекта

```
climate-exchange/
├── backend/
│   ├── server.py           # FastAPI приложение (эндпоинты)
│   ├── requirements.txt    # Python зависимости
│   ├── .env                # Переменные окружения для бэкенда
│   └── uploads/            # Загруженные изображения
├── frontend/
│   ├── src/
│   │   ├── App.js          # Основное приложение с маршрутизацией
│   │   ├── App.css         # Кастомные стили и анимации
	│   ├── index.js        # React точка входа
	│   ├── index.css       # Tailwind + переменные темы
	│   ├── contexts/
	│   │   ├── AuthContext.js   # Управление аутентификацией
	│   │   └── CartContext.js   # Управление корзиной
	│   ├── pages/
	│   │   ├── HomePage.js          # Главная
	│   │   ├── CatalogPage.js       # Каталог + фильтры
	│   │   ├── ProductDetailPage.js # Карточка товара + галерея
	│   │   ├── LoginPage.js         # Форма входа
	│   │   ├── RegisterPage.js      # Форма регистрации
	│   │   ├── CreateListingPage.js # Создание объявления
	│   │   ├── EditListingPage.js   # Редактирование объявления
	│   │   ├── CartPage.js          # Корзина
	│   │   └── ProfilePage.js       # Профиль (объявления + заказы)
	│   └── components/
	│       ├── Navbar.js        # Верхняя навигация
	│       ├── ProductCard.js   # Компонент карточки товара
	│       ├── Footer.js        # Подвал сайта
	│       └── ui/              # Компоненты Shadcn UI
	├── public/
	├── package.json
	├── tailwind.config.js
	├── postcss.config.js
	├── craco.config.js
	└── .env
└── README.md
```

## Требования

- **Node.js** >= 18
- **Python** >= 3.10
- **MongoDB** >= 4.0
- **yarn** (менеджер пакетов)

## Установка и запуск

### 1. Настройка бэкенда

```bash
cd backend
```
### 2. Установка баззы данных
```bash
docker pull mongo:4.4 
docker run -d --name mongo -v mongodata:/data/db -p 27017:27017 mongo:4.4
docker ps #для просмотра контейнеров там должен ноходиться mongo это наша база
```
# Создайте виртуальное окружение
```bash
python -m venv venv
source venv/bin/activate        

# Установите зависимости
pip install -r requirements.txt

# .env фаил по дефолту должен содержать данные значение что
# Отредактируйте .env и установите значения:
#   MONGO_URL="mongodb://localhost:27017"
#   DB_NAME="climate_exchange"
#   JWT_SECRET="<your-random-secret-key>"
#   ADMIN_EMAIL="admin@example.com"
#   ADMIN_PASSWORD="admin123"
#   FRONTEND_URL="http://localhost:3000"

# Запуск бэкенда
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Бэкенд будет доступен по адресу **http://localhost:8001**. Админ-пользователь создаётся автоматически при первом запуске.

### 3. Настройка фронтенда

```bash
cd frontend

# Установите зависимости
yarn install

# Настройте переменные окружения
# Отредактируйте .env и установите:
#   REACT_APP_BACKEND_URL=http://localhost:8001

# Запуск dev-сервера фронтенда
yarn start
```

Фронтенд будет доступен по адресу **http://localhost:3000**.

### 4. Откройте в браузере

Перейдите по адресу **http://localhost:3000** чтобы открыть приложение.

## Учетные данные по умолчанию

| Роль  | Email               | Пароль   |
|-------|---------------------|----------|
| Admin | admin@example.com   | admin123 |

## API Эндпоинты

### Аутентификация
| Method | Endpoint              | Описание             | Auth |
|--------|-----------------------|----------------------|------|
| POST   | /api/auth/register    | Регистрация нового пользователя | Нет   |
| POST   | /api/auth/login       | Вход                 | Нет  |
| POST   | /api/auth/logout      | Выход                | Да   |
| GET    | /api/auth/me          | Текущий пользователь | Да   |
| POST   | /api/auth/refresh     | Обновление токена     | Да   |

### Товары
| Method | Endpoint              | Описание                        | Auth |
|--------|-----------------------|----------------------------------|------|
| GET    | /api/products         | Список товаров (с фильтрами)     | Нет  |
| GET    | /api/products/:id     | Получить карточку товара         | Нет  |
| POST   | /api/products         | Создать объявление               | Да   |
| PUT    | /api/products/:id     | Обновить товар (только владелец) | Да   |
| DELETE | /api/products/:id     | Удалить товар (только владелец)  | Да   |

**Параметры запроса для GET /api/products:**
`search`, `brand`, `ac_type` (split/portable/industrial), `condition` (new/used), `min_price`, `max_price`, `page`, `limit`

### Корзина
| Method | Endpoint          | Описание            | Auth |
|--------|-------------------|----------------------|------|
| GET    | /api/cart          | Получить корзину     | Да   |
| POST   | /api/cart/add      | Добавить товар в корзину | Да |
| PUT    | /api/cart/update   | Обновить количество  | Да   |
| POST   | /api/cart/remove   | Удалить товар из корзины | Да |

### Заказы
| Method | Endpoint          | Описание            | Auth |
|--------|-------------------|----------------------|------|
| POST   | /api/orders        | Оформить заказ из корзины | Да |
| GET    | /api/orders        | Список заказов пользователя | Да |
| GET    | /api/orders/:id    | Получить детали заказа | Да |

### Прочее
| Method | Endpoint              | Описание          | Auth |
|--------|-----------------------|-------------------|------|
| POST   | /api/upload           | Загрузить изображения | Да  |
| GET    | /api/uploads/:file    | Обслуживание загруженных файлов | Нет |
| GET    | /api/brands           | Список брендов    | Нет  |
| GET    | /api/stats            | Статистика маркетплейса | Нет |
| GET    | /api/profile/listings | Получить объявления пользователя | Да |

## Переменные окружения

### Backend (.env)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="climate_exchange"
JWT_SECRET="your-random-secret-64-chars"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## License

MIT


&copy; {new Date().getFullYear()} get a full year automatically on footer