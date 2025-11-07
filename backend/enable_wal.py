#!/usr/bin/env python
"""
Script to manually enable WAL mode on SQLite database.
Run this once to enable Write-Ahead Logging for better concurrency.

Usage:
    python enable_wal.py
"""
import sqlite3
import os
from pathlib import Path

# Get the database path
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'db.sqlite3'

if not DB_PATH.exists():
    print(f"Error: Database not found at {DB_PATH}")
    print("Please run migrations first: python manage.py migrate")
    exit(1)

print(f"Connecting to database: {DB_PATH}")

# Connect to database
conn = sqlite3.connect(str(DB_PATH))
cursor = conn.cursor()

# Check current journal mode
cursor.execute("PRAGMA journal_mode;")
current_mode = cursor.fetchone()[0]
print(f"Current journal mode: {current_mode}")

# Enable WAL mode
print("Enabling WAL mode...")
cursor.execute("PRAGMA journal_mode=WAL;")
new_mode = cursor.fetchone()[0]
print(f"New journal mode: {new_mode}")

# Set additional optimizations
print("Setting additional SQLite optimizations...")
cursor.execute("PRAGMA synchronous=NORMAL;")
cursor.execute("PRAGMA temp_store=MEMORY;")
cursor.execute("PRAGMA mmap_size=30000000000;")
cursor.execute("PRAGMA cache_size=10000;")

# Verify settings
cursor.execute("PRAGMA journal_mode;")
print(f"Verified journal mode: {cursor.fetchone()[0]}")

cursor.execute("PRAGMA synchronous;")
print(f"Synchronous mode: {cursor.fetchone()[0]}")

conn.commit()
conn.close()

print("\n✅ WAL mode enabled successfully!")
print("📝 Note: WAL mode will persist across server restarts.")
print("🔄 Restart your Django server for best results.")
print("\nFiles created:")
print(f"  - {DB_PATH}")
print(f"  - {DB_PATH}-wal (Write-Ahead Log)")
print(f"  - {DB_PATH}-shm (Shared Memory)")
