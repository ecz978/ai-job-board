# AI Job Board 🤖

Automated job board for AI & No-Code automation experts (Make.com, Zapier, n8n, LangChain specialists).

## 🚀 Features

- **Automated Job Scraping**: Daily scraper runs at 08:00 UTC using Playwright
- **AI-Powered Summaries**: Gemini 1.5 Flash generates compelling job summaries
- **Smart Filtering**: Validates job relevance to automation niche automatically
- **Tag Extraction**: Intelligent tag extraction (Make, Zapier, n8n, LangChain, AI, etc.)
- **Modern Frontend**: Astro + Tailwind CSS with responsive design
- **Full-Text Search**: Filter by title, company, location, and skills
- **Dynamic Routing**: Individual job detail pages

## 🛠️ Tech Stack

- **Frontend**: Astro, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Scraping**: Playwright (headless browser automation)
- **AI**: Google Gemini 1.5 Flash
- **Hosting**: Cloudflare Pages
- **CI/CD**: GitHub Actions

## 📋 Setup Guide

### 1. Environment Variables

Copy `.env.example` to `.env.local` and add your credentials:

```bash
# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini API
PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### 2. Database Setup

1. Open Supabase SQL Editor
2. Paste the SQL schema below
3. Execute the schema creation

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  salary_range VARCHAR(255),
  description TEXT NOT NULL,
  apply_url VARCHAR(500) NOT NULL,
  
  gemini_summary TEXT,
  tags VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR[],
  
  source VARCHAR(50) DEFAULT 'linkedin',
  is_relevant BOOLEAN DEFAULT true,
  
  UNIQUE(apply_url, company)
);

CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_tags ON jobs USING GIN(tags);
CREATE INDEX idx_jobs_source ON jobs(source);
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Run scraper manually
npm run scrape
```

## 🔄 How It Works

### Daily Scraping (GitHub Actions)
- Runs daily at 08:00 UTC
- Scrapes LinkedIn and Indeed for relevant jobs
- Uses Gemini to validate relevance
- Generates summaries and extracts tags
- Saves to Supabase (avoids duplicates)

### Frontend
- Home page with filterable job grid
- Search by title, company, location
- Filter by technology/skills
- Individual job detail pages
- Responsive mobile-friendly design

## 🔐 GitHub Secrets

Set these secrets in your GitHub repository for the workflow:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `GEMINI_API_KEY`: Google Gemini API key

## 📦 Deployment

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Set environment variables in Cloudflare dashboard

## 🎯 Next Steps

- [ ] Create Supabase project and execute SQL schema
- [ ] Get Gemini API key from Google Cloud
- [ ] Update GitHub Secrets for workflow automation
- [ ] Test the scraper locally: `npm run scrape`
- [ ] Deploy to Cloudflare Pages
- [ ] Monitor workflow runs in GitHub Actions

## 📝 Notes

- Playwright automatically handles browser setup
- Gemini API implements retry logic for rate limits
- Duplicate jobs are prevented with UNIQUE constraint
- Search and filters work client-side for instant feedback
- Dark mode supported via Tailwind CSS

## 📄 License

MIT
