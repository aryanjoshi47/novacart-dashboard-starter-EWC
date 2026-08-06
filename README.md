# NovaCart Account Dashboard

## What it is

A full-stack analytics dashboard for the NovaCart franchise. The backend is a Python + FastAPI API connected to a SQLite database (30,000 orders · 400 customers · 15 products). The frontend is a React 18 app with three views — Orders, Products, and Customers. An NGINX reverse proxy ties them together.

---

## Setup Steps

**Backend**

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
```

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
```

---

## Run Instructions

**Backend**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Swagger UI available at **http://localhost:8000/docs**

**Frontend**

```bash
cd frontend
npm start
```

App available at **http://localhost:3000**

---

## Deployment Step

Once your endpoints are working and the UI is connected:

```bash
export REPO_URL=<provided by your facilitator>
export GROUP=<your team number>

bash build-and-push.sh
```

Notify your facilitator — they will deploy your services and provide the public URL.
