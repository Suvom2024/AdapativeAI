#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test if the app imports correctly with upgraded SQLAlchemy"""
import sys
import io

# Fix Windows encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from app.database import init_db
    print("[OK] Database import successful")
    
    from app.main import app
    print("[OK] Main app import successful")
    
    print("\n[SUCCESS] All imports successful! Ready to deploy.")
except Exception as e:
    print(f"[ERROR] Import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

