#!/bin/bash
# Initialize multiple PostgreSQL databases

set -e
set -u

# Function to create database and user
create_database() {
    local dbname=$1
    local dbuser=$2
    local dbpass=$3
    
    echo "Creating database: $dbname"
    
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE USER $dbuser WITH PASSWORD '$dbpass';
        CREATE DATABASE $dbname OWNER $dbuser;
        GRANT ALL PRIVILEGES ON DATABASE $dbname TO $dbuser;
EOSQL
    
    echo "Database $dbname created successfully"
}

# Create multiple databases from environment variable
if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        create_database $db $POSTGRES_USER ${POSTGRES_PASSWORD:-cinacoin_dev_2026}
    done
fi

echo "All databases initialized successfully"
