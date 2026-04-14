# LitPath AI - Intelligent Thesis Search System

**PBL Team:**
- **Project Lead:** Jenine Elaine Dulay
- **QA Tester:** Tracie Tomon
- **Developer:** Charijoy Cempron
- **Developer:** Marielle Kloie Concepcion

---

## 🚀 Quick Start

### ⚠️ First Time Setup - IMPORTANT!

**1. Setup Environment Variables:**
```powershell
# Copy the example file
Copy-Item backend\.env.example backend\.env

# Edit backend\.env with your own credentials:
# - Get Gemini API key from: https://aistudio.google.com/app/apikey
# - Get Supabase credentials from your Supabase dashboard
```

**🔒 SECURITY WARNING:** Never commit `.env` files to git! See `SECURITY_SETUP.md` for details.

### Backend (Django)
```powershell
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_admins  # Create default admin accounts
python manage.py runserver
```
Backend runs at: `http://localhost:8000`

### Frontend (React + Vite + TypeScript)
```powershell
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

**Or use the startup script:**
```powershell
.\start-backend.ps1
```

---

## 📁 Project Structure

```
LitPath-AI/
├── backend/                   # Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── litpath_backend/       # Django project settings
│   └── rag_api/               # RAG API app
│       ├── views.py           # API endpoints
│       ├── rag_service.py     # RAG core logic
│       └── urls.py
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx            # Router & layout
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable UI components
│   │   └── context/           # React contexts
│   └── package.json
├── RAG/                       # Data processing & indexing
│   ├── requirements.txt       # ML/NLP dependencies
│   ├── theses/                # Thesis text files + metadata
│   └── chromadb_data/         # Vector database (gitignored)
└── docs/                      # All documentation & diagrams
```

---

## 🔄 Recent Changes

### ✅ Migrated to Django Framework
- Replaced custom HTTP server with Django
- Better code organization and scalability
- Built-in admin panel at `/admin/`
- Database ORM ready for your ERD
- Production-ready architecture

**See:** `DJANGO_MIGRATION_SUMMARY.md` and `MIGRATION_GUIDE.md`

---

## 🎯 Features

- **AI-Powered Search**: Semantic search using ChromaDB vector database
- **Intelligent Summaries**: Gemini AI generates comprehensive overviews
- **Document References**: Citations linked to source theses
- **Metadata Extraction**: Automatic thesis metadata extraction
- **Subject Filtering**: 37 controlled subject categories
- **RESTful API**: Clean Django REST Framework endpoints

---

## 📊 API Endpoints

### Health Check
```
GET http://localhost:8000/api/health/
```

### Search
```
POST http://localhost:8000/api/search/
Content-Type: application/json

{
  "question": "What is the impact of climate change on rice production?"
}
```

---

## 🔐 Auth Hardening Environment Variables

Add these in `backend/.env` to control registration hardening:

```env
# Terms and consent audit
TERMS_VERSION=v2026-04-01

# Registration throttling (per client IP)
REGISTER_RATE_LIMIT=10
REGISTER_RATE_WINDOW_SECONDS=3600

# CAPTCHA enforcement
REQUIRE_CAPTCHA=false
RECAPTCHA_SECRET_KEY=
CAPTCHA_VERIFY_URL=https://www.google.com/recaptcha/api/siteverify
```

Recommended production values:

- `TERMS_VERSION`: update this whenever terms text changes (example: `v2026-04-01`)
- `REGISTER_RATE_LIMIT`: `5` to `10` attempts
- `REGISTER_RATE_WINDOW_SECONDS`: `900` to `3600` seconds
- `REQUIRE_CAPTCHA`: `true`
- `RECAPTCHA_SECRET_KEY`: required when CAPTCHA is enabled
- `CAPTCHA_VERIFY_URL`: keep default unless using a trusted proxy/enterprise verifier

Notes:

- Rate limiting is applied on `POST /api/auth/register/` by client IP.
- If `REQUIRE_CAPTCHA=true`, registration rejects requests without a valid CAPTCHA token.

---

## 🗂️ Database Schema

See your ERD implementation in `backend/rag_api/models.py` (ready to add):
- `DocumentCache` - Cached thesis metadata
- `SearchHistory` - User search tracking
- `Bookmark` - Saved documents
- `UsageStatistics` - Action tracking
- `FeedbackLog` - User feedback
- `StaffAccount` - Admin users

---

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3

**Backend:**
- Django 5.0
- Django REST Framework
- ChromaDB (Vector DB)
- SentenceTransformers
- Google Gemini AI

**Data Processing:**
- PyPDF2 (PDF extraction)
- Tesseract OCR (fallback)
- Custom metadata extraction

---

## 📚 Documentation

- `backend/README.md` - Django backend setup
- `docs/SDS_LitPathAI.md` - Software Design Specification
- `docs/ACCURACY_METHODOLOGY.md` - Search accuracy methodology
- `docs/RAG_EVALUATION_METHODOLOGY.md` - RAG evaluation methodology
- `docs/CITATION_GENERATOR.md` - Citation generation documentation

---

## 🔧 Development


### Create Admin User
```powershell
python manage.py createsuperuser
```

### Database Migrations
```powershell
python manage.py makemigrations
python manage.py migrate
```

---

## 🚀 Deployment

Ready for production with:
- PostgreSQL/MySQL database
- Gunicorn WSGI server
- Nginx reverse proxy
- HTTPS with Let's Encrypt

See deployment checklist in `backend/README.md`

---

## 📝 Team Roles

- **Project Lead** - Project management and coordination
- **QA Tester** - Quality assurance and testing
- **Developers** - Full-stack development

---
