FROM postgres:15-alpine

# Copy initialization SQL
COPY northwind.sql /docker-entrypoint-initdb.d/

# Set default environment variables
ENV POSTGRES_DB=northwind
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

EXPOSE 5432

