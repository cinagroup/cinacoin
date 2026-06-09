#!/bin/bash
# Restore a Cinacoin database from backup
# Usage: ./restore-database.sh <backup-file> <database-url>

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <backup-file> <database-url>"
    echo ""
    echo "Example:"
    echo "  $0 /tmp/cinacoin-backups/auth-20260608-120000.sql.gz postgresql://user:pass@host:5432/db"
    exit 1
fi

BACKUP_FILE="$1"
DATABASE_URL="$2"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will OVERWRITE the target database!"
echo ""
echo "   Backup: $BACKUP_FILE"
echo "   Target: $(echo "$DATABASE_URL" | sed 's|://[^@]*@|://***@|')"
echo ""
read -p "   Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "   Aborted."
    exit 0
fi

echo ""
echo "🔄 Restoring database..."

# Decompress and restore
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
else
    psql "$DATABASE_URL" < "$BACKUP_FILE"
fi

echo ""
echo "✅ Restore complete"
