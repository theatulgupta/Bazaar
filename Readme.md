# Amazon Clone v2

A production-grade full-stack e-commerce mobile app built with **React Native (Expo)** and a **Node.js / Express** REST API.

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Expo SDK 51 + Expo Router (file-based routing) |
| Language | TypeScript (strict) |
| State | Zustand (cart, auth, wishlist) |
| Server state | TanStack Query v5 |
| Forms | react-hook-form + Zod |
| Styling | StyleSheet (React Native) |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| Language | TypeScript (strict) |
| Database | MongoDB via Mongoose |
| Auth | JWT (jsonwebtoken) |
| Validation | Zod |
| Security | Helmet + express-rate-limit |
| Dev server | tsx watch |

---

## Project Structure

```
Amazon-Clone/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login, Register
│   ├── (tabs)/             # Home, Search, Wishlist, Cart, Profile
│   ├── product/[id].tsx    # Product detail
│   ├── checkout.tsx        # 4-step checkout
│   ├── order/[id].tsx      # Order detail
│   ├── address/            # Add / list addresses
│   └── order-success.tsx   # Post-order animation
├── src/
│   ├── components/         # SearchBar, ProductCard, BannerCarousel, Skeleton, etc.
│   ├── store/              # Zustand stores (auth, cart, wishlist)
│   ├── hooks/              # TanStack Query hooks (useApi.ts)
│   ├── lib/                # Axios client with JWT interceptor
│   ├── types/              # Shared TypeScript interfaces
│   └── constants/          # Static data (deals, offers, banners)
└── api/
    └── src/
        ├── controllers/    # auth, address, order, profile
        ├── models/         # User, Order (Mongoose)
        ├── routes/         # Express routers
        ├── middlewares/    # JWT auth, error handler
        ├── utils/          # response helpers, email
        └── config/         # env, database
```

---

## Getting Started

### 1. Clone
```bash
git clone https://github.com/theatulgupta/Amazon-Clone.git
cd Amazon-Clone
```

### 2. Backend setup
```bash
cd api
cp .env .env.local   # fill in your values
npm install
npm run dev          # starts on http://0.0.0.0:8000
```

**Required `.env` values:**
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/amazon-clone
JWT_SECRET=your-strong-random-secret
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### 3. Frontend setup
```bash
# from project root
npm install
```

Update `src/lib/api.ts` — set `API_URL` to your machine's local IP:
```ts
export const API_URL = 'http://192.168.x.x:8000/api/v1';
```

```bash
npx expo start        # scan QR with Expo Go
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/users/register` | Register |
| POST | `/api/v1/users/login` | Login → JWT |
| GET | `/api/v1/users/verify/:token` | Email verification |
| GET | `/api/v1/user/profile/:userId` | Get profile |
| POST | `/api/v1/address/add` | Add address |
| GET | `/api/v1/address/:userId` | Get addresses |
| DELETE | `/api/v1/address/:userId/:addressId` | Delete address |
| POST | `/api/v1/order/add` | Place order |
| GET | `/api/v1/order/:userId` | Get user orders |
| GET | `/api/v1/order/detail/:id` | Get order by ID |
| GET | `/health` | Health check |

---

## Features

- ✅ JWT authentication with token expiry check
- ✅ Email verification on register
- ✅ Product browsing by category (FakeStore API)
- ✅ Live search with 400ms debounce
- ✅ Wishlist with heart toggle
- ✅ Cart with quantity controls
- ✅ 4-step checkout (address → delivery → payment → confirm)
- ✅ Order history with status timeline
- ✅ Skeleton loaders on all data screens
- ✅ Empty states on cart, wishlist, orders
- ✅ Rate limiting + security headers on API
- ✅ Zod validation on all API inputs

---

## License

MIT
