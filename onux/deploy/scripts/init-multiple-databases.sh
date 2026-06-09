#!/bin/bash
# Initialize multiple PostgreSQL databases
# Used by docker-compose to create separate databases for each service

set -e
set -u

POSTGRES_USER="${POSTGRES_USER:-cinacoin}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-changeme}"

# Create multiple databases from POSTGRES_MULTIPLE_DATABASES env var
# Format: db1,db2,db3
if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
    echo "Creating multiple databases: $POSTGRES_MULTIPLE_DATABASES"
    
    for DB in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
        echo "Creating database: $DB"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
            CREATE USER $DB WITH PASSWORD '$POSTGRES_PASSWORD';
            CREATE DATABASE $DB OWNER $DB;
            GRANT ALL PRIVILEGES ON DATABASE $DB TO $DB;
EOSQL
        echo "✓ Database $DB created"
    done
fi

echo "All databases initialized successfully"
