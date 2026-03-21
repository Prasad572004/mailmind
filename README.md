# MailMind — AI-Powered Email Management Platform

> A full-stack AI-powered email management platform that connects to Gmail 
> via OAuth2 and uses Groq AI (LLaMA 3.3 70B) to supercharge your email workflow.

## 🔗 Live Demo
Coming soon

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Router v6 |
| Backend | Spring Boot 3.3.2, Java 20, Spring Security, JWT |
| Database | PostgreSQL with JPA/Hibernate |
| AI | Groq API — LLaMA 3.3 70B (free, ultra-fast) |
| Auth | Gmail OAuth2 with automatic token refresh |
| Email | Gmail API + JavaMailSender (SMTP) |

## ✨ Features

### AI-Powered
- **Smart Reply** — generates 4 tone variations (Professional, Casual, Friendly, Brief)
- **AI Writing Assistant** — 7 actions: More Formal, More Friendly, Shorter, Longer, Fix Grammar, Continue, Translate
- **12 Language Support** — translate emails to Hindi, Marathi, Spanish, French, German and more
- **Campaign Generator** — creates 5 tone variations from a rough idea with language selector

### Email Management
- **Gmail OAuth2** — connect your Gmail account securely with auto token refresh
- **Inbox Sync** — sync and manage your Gmail inbox inside MailMind
- **Smart Reply Panel** — Gmail-like compose with tone selector and AI assist
- **Reply History** — collapsible thread history per email
- **Sent Folder** — view all sent emails
- **Email Search** — search emails by keyword
- **File Attachments** — attach files on compose and reply

### Analytics Dashboard
- **Inbox Health Score** — algorithm-based score (0-100) measuring read rate, reply rate, activity
- **Read vs Unread** — donut chart visualization
- **Emails Per Day** — 7-day bar chart
- **Monthly Activity** — line chart trend
- **Top Senders** — who emails you most
- **Campaign Status** — breakdown by draft/active/completed

### Dashboard
- Greeting with user stats
- 4 stat cards — unread, replies, health score, campaigns
- Recent emails preview
- Quick action buttons
- Profile dropdown with Gmail status, logout, disconnect

## 📁 Project Structure
```
mailmind/
├── backend/mailmind-backend/
│   ├── src/main/java/com/mailmind/
│   │   ├── controller/       # REST API endpoints
│   │   ├── service/          # Business logic
│   │   ├── model/            # JPA entities
│   │   ├── repository/       # Spring Data JPA
│   │   ├── security/         # JWT + Spring Security
│   │   ├── dto/              # Data transfer objects
│   │   └── config/           # App configuration
│   └── src/main/resources/
│       └── application.example.properties
│
└── frontend/mailmind-frontend/
    └── src/
        ├── pages/            # Full page components
        ├── components/       # Reusable UI components
        ├── context/          # React Context (Auth)
        └── api/              # Axios + API services
```

## 🗄 Database Schema

| Table | Description |
|-------|-------------|
| users | User accounts with Gmail tokens |
| emails | Synced Gmail emails |
| email_replies | Sent replies per email |
| campaigns | Email campaigns |
| email_variations | AI-generated campaign variations |
| smart_replies | Smart reply history |

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login with JWT |
| GET | /api/auth/google/login-url | Get Gmail OAuth URL |
| GET | /api/inbox | Get synced emails |
| POST | /api/inbox/sync | Sync Gmail inbox |
| POST | /api/inbox/generate-reply | AI generate reply |
| POST | /api/inbox/send-reply | Send reply via Gmail |
| GET | /api/analytics/overview | Dashboard analytics |
| POST | /api/campaigns | Create campaign |
| POST | /api/smart-reply/generate | Generate smart replies |
| POST | /api/ai/assist | AI writing assistant |

## ⚙️ Setup — Backend
```bash
# 1. Clone the repo
git clone https://github.com/Prasad572004/mailmind.git
cd mailmind/backend/mailmind-backend

# 2. Copy and fill in your credentials
cp src/main/resources/application.example.properties src/main/resources/application.properties

# 3. Run
mvn spring-boot:run
```

## ⚙️ Setup — Frontend
```bash
cd mailmind/frontend/mailmind-frontend
npm install
echo VITE_API_URL=http://localhost:8080 > .env
npm run dev
```

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| spring.datasource.password | PostgreSQL password |
| jwt.secret | JWT signing secret |
| groq.api.key | Groq API key |
| google.oauth.client-id | Google OAuth client ID |
| google.oauth.client-secret | Google OAuth client secret |
| spring.mail.password | Gmail app password |

## 💡 Key Technical Decisions

- **JWT stateless auth** — no server-side sessions, scales horizontally
- **Gmail API Bearer token** — Authorization header, not deprecated query param
- **Auto token refresh** — checks expiry 60s before, refreshes automatically
- **Groq over OpenAI** — free tier, LLaMA 3.3 70B, significantly faster
- **PostgreSQL TEXT type** — for email bodies to handle large content

## 👨‍💻 Author

**Prasad Dhanwate**  
GitHub: [@Prasad572004](https://github.com/Prasad572004)