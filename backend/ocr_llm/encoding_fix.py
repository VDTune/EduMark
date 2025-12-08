import sys
import io

def force_utf8():
    try:
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')    
    except Exception as e:
        print(f"Warning: could not set UTF-8 encoding for stdout: {e}")
