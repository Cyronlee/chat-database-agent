# Chat Database Agent

A Next.js application for interacting with databases using natural language. Built with AI capabilities to help users query and visualize data.

## Tech Stack

- **Runtime**: Bun / Node.js
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Database ORM**: Prisma
- **AI**: Google Generative AI

## Quick Start

### One-Click Startup (Recommended)

The easiest way to start the project is using the startup script:

```bash
./start.sh
```

This script will:

1. Start the **System Database** (PostgreSQL on port 5433) - stores user data and application data
2. Start the **Northwind Database** (PostgreSQL on port 5434) - sample database for querying
3. Initialize and seed the system database if needed
4. Start the Next.js development server

**Requirements:**

- Docker (must be running)
- One of: bun, pnpm, or npm

### Default Credentials

After startup, you can login with:

- **Email**: admin@example.com
- **Password**: 123456

The Northwind sample database will be automatically added as an external database connection.

## Manual Setup

### 1. Start System Database Only

```bash
# Create the db/system-database directory if it doesn't exist
mkdir -p db/system-database

# Create Dockerfile for system-db
cat > db/system-database/Dockerfile << 'EOF'
FROM postgres:15-alpine

ENV POSTGRES_DB=chat_database_agent
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

EXPOSE 5432
EOF

# Build and run
docker build -t system-db-image -f db/system-database/Dockerfile db/system-database
docker run -d --name system-db -p 5433:5432 system-db-image
```

### 2. Start Northwind Database Only

```bash
# Build and run
docker build -t northwind-db-image -f db/northwind-database/Dockerfile db/northwind-database
docker run -d --name northwind-db -p 5434:5432 northwind-db-image
```

### 3. Configure Environment

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Update `.env` with your settings:

```env
# Google Generative AI API Key
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key-here

# System Database (for user data and application data)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/chat_database_agent?schema=public"
```

### 4. Initialize Database

```bash
# Install dependencies
bun install

# Run migrations
bun run prisma migrate deploy

# Seed the database
bun run prisma db seed
```

### 5. Start Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Connections

| Database  | Host      | Port | Database            | Username | Password |
| --------- | --------- | ---- | ------------------- | -------- | -------- |
| System DB | localhost | 5433 | chat_database_agent | postgres | postgres |
| Northwind | localhost | 5434 | northwind           | postgres | postgres |

## Docker Commands

### Stop Databases

```bash
docker stop system-db northwind-db
```

### Remove Containers

```bash
docker rm system-db northwind-db
```

### View Logs

```bash
docker logs system-db
docker logs northwind-db
```

### Reset Databases

```bash
# Stop and remove containers
docker stop system-db northwind-db
docker rm system-db northwind-db

# Remove images (optional, for full rebuild)
docker rmi system-db-image northwind-db-image

# Restart with start.sh
./start.sh
```

## Project Structure

```
├── agent/              # AI agent configuration
├── api-clients/        # API client functions
├── app/                # Next.js app directory
│   ├── (main)/         # Main application routes
│   └── api/            # API routes
├── components/         # React components
│   ├── ai-elements/    # AI-related components
│   ├── chart/          # Chart components
│   ├── chat/           # Chat components
│   └── ui/             # Shadcn/ui components
├── db/                 # Database configurations
│   ├── northwind-database/ # Northwind sample database
│   └── system-database/    # System database configuration
├── lib/                # Utility functions
├── prisma/             # Prisma schema and migrations
└── tools/              # AI tools
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com)
- [Google AI SDK](https://ai.google.dev)
