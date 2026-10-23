
# StockFlow – Inventory Management System

StockFlow is a web-based inventory management application that helps small businesses manage products, monitor stock levels, and view inventory summaries through a dashboard.

## Live Demo

- **Live Website:** https://stockflow-eta-three.vercel.app
- **GitHub Repository:** https://github.com/944194/stockflow

## Features

- User registration and login
- Organization-specific inventory management
- Add, view, edit, delete, and search products
- Product quantity and price management
- Dashboard with inventory summaries
- Low-stock alerts
- Configurable default low-stock threshold
- Persistent PostgreSQL database storage

## Technology Stack

| Technology | Purpose |
|---|---|
| React.js | User interface |
| Vite | Frontend development and build |
| CSS | Styling and layout |
| Node.js | Backend JavaScript runtime |
| Express.js | REST API |
| PostgreSQL | Database |
| Prisma ORM | Database queries and schema management |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Vercel | Frontend deployment |
| Render | Backend deployment |
| Neon | Hosted PostgreSQL database |

## Architecture

1. **Frontend:** React provides the login, dashboard, product management, and settings interfaces.
2. **Backend:** Express handles authentication and product-related API requests.
3. **Authentication:** bcryptjs hashes passwords, and JWT tokens authenticate protected API requests.
4. **Database:** PostgreSQL stores users, organizations, and products. Prisma communicates with the database.
5. **Deployment:** The frontend is hosted on Vercel, the backend on Render, and the database on Neon.

## Local Setup

### Prerequisites

- Node.js and npm
- PostgreSQL database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/944194/stockflow.git
cd stockflow
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with these variables:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_random_secret
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Use your own local database connection string and secret values. Never commit `.env` to GitHub.

Generate the Prisma client and apply the database migrations using the commands configured for this project:

```bash
npx prisma generate
npx prisma migrate deploy
```

Start the backend:

```bash
npm start
```

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL shown in the terminal, usually `http://localhost:5173`.

## Security Notes

- Passwords are hashed before being stored.
- Protected API endpoints require authentication.
- Inventory data is scoped by organization.
- Environment variables and credentials must remain private.

## Future Improvements

- Automated testing
- Stock movement history
- CSV import and export
- Improved reporting and analytics
- Password reset functionality

## Author

**Chethan**

