#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Chat Database Agent - Startup Script  ${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to detect package manager
detect_package_manager() {
    if command -v bun &> /dev/null; then
        echo "bun"
    elif command -v pnpm &> /dev/null; then
        echo "pnpm"
    elif command -v npm &> /dev/null; then
        echo "npm"
    else
        echo ""
    fi
}

# Function to check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
}

# Function to start a database container
start_database() {
    local container_name=$1
    local port=$2
    local dockerfile_path=$3
    local context_path=$4
    local image_name=$5

    echo -e "${YELLOW}Starting $container_name on port $port...${NC}"

    # Check if container exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        # Check if container is running
        if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
            echo -e "${GREEN}$container_name is already running.${NC}"
        else
            echo -e "${YELLOW}Starting existing $container_name container...${NC}"
            docker start $container_name
        fi
    else
        # Build and run new container
        echo -e "${YELLOW}Building $container_name image...${NC}"
        docker build -t $image_name -f $dockerfile_path $context_path
        
        echo -e "${YELLOW}Running $container_name container...${NC}"
        docker run -d \
            --name $container_name \
            -p $port:5432 \
            $image_name
    fi

    # Wait for database to be ready
    echo -e "${YELLOW}Waiting for $container_name to be ready...${NC}"
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker exec $container_name pg_isready -U postgres &> /dev/null; then
            echo -e "${GREEN}$container_name is ready!${NC}"
            break
        fi
        attempt=$((attempt + 1))
        sleep 1
    done

    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}Timeout waiting for $container_name to be ready.${NC}"
        exit 1
    fi
}

# Function to check if system-db needs initialization
check_and_init_system_db() {
    local pm=$1
    
    echo -e "${YELLOW}Checking if system-db needs initialization...${NC}"
    
    # Check if migrations have been applied by checking if users table exists
    local table_exists=$(docker exec system-db psql -U postgres -d chat_database_agent -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');" 2>/dev/null || echo "false")
    
    # Generate Prisma client
    echo -e "${YELLOW}Generating Prisma client...${NC}"
    $pm run db:generate
    
    if [ "$table_exists" != "t" ]; then
        echo -e "${YELLOW}Initializing system-db...${NC}"
        
        # Run Prisma migrations
        echo -e "${YELLOW}Running Prisma migrations...${NC}"
        $pm run db:migrate:deploy
    else
        echo -e "${GREEN}System-db migrations already applied.${NC}"
    fi
    
    # Always check and run seed if admin user doesn't exist
    echo -e "${YELLOW}Checking if seed is needed...${NC}"
    local admin_exists=$(docker exec system-db psql -U postgres -d chat_database_agent -tAc "SELECT EXISTS (SELECT FROM users WHERE email = 'admin@example.com');" 2>/dev/null || echo "false")
    
    if [ "$admin_exists" != "t" ]; then
        echo -e "${YELLOW}Seeding database...${NC}"
        $pm run db:seed
        echo -e "${GREEN}Database seeded successfully!${NC}"
    else
        echo -e "${GREEN}Database already seeded.${NC}"
    fi
}

# Main script
main() {
    # Check Docker
    check_docker
    
    # Detect package manager
    PM=$(detect_package_manager)
    if [ -z "$PM" ]; then
        echo -e "${RED}Error: No package manager found. Please install bun, pnpm, or npm.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Using package manager: $PM${NC}"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        $PM install
    fi
    
    # Create system-db Dockerfile if it doesn't exist
    if [ ! -f "db/system-database/Dockerfile" ]; then
        echo -e "${YELLOW}Creating system-db Dockerfile...${NC}"
        mkdir -p db/system-database
        cat > db/system-database/Dockerfile << 'EOF'
FROM postgres:15-alpine

ENV POSTGRES_DB=chat_database_agent
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

EXPOSE 5432
EOF
    fi
    
    # Start system-db (port 5433)
    start_database "system-db" "5433" "db/system-database/Dockerfile" "db/system-database" "system-db-image"
    
    # Start northwind-db (port 5434)
    start_database "northwind-db" "5434" "db/northwind-database/Dockerfile" "db/northwind-database" "northwind-db-image"
    
    # Set DATABASE_URL for system-db
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/chat_database_agent?schema=public"
    
    # Check and initialize system-db
    check_and_init_system_db $PM
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  All services started successfully!    ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}System Database:${NC}    postgresql://postgres:postgres@localhost:5433/chat_database_agent"
    echo -e "${GREEN}Northwind Database:${NC} postgresql://postgres:postgres@localhost:5434/northwind"
    echo ""
    
    # Start the development server
    echo -e "${YELLOW}Starting development server...${NC}"
    $PM run dev
}

# Run main function
main

