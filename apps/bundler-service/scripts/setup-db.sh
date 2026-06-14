#!/bin/bash
# Create D1 database for bundler
wrangler d1 create cinacoin-bundler-db

# Run schema migration
wrangler d1 execute cinacoin-bundler-db --file=./migrations/001_init.sql
