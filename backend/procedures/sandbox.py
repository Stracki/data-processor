import pandas as pd
import numpy as np
import math
from datetime import datetime, timedelta


# Dummy-Klasse für Type Hints
class Table:
    """Dummy-Klasse für Table Type Hints - wird nicht verwendet"""
    pass


def create_safe_namespace():
    """Erstellt einen sicheren Namespace für User-Code"""
    
    # Erlaubte Module
    safe_namespace = {
        'pd': pd,
        'np': np,
        'math': math,
        'datetime': datetime,
        'timedelta': timedelta,
        'Table': Table,  # Für Type Hints
    }
    
    # Erlaubte Built-ins
    safe_builtins = {
        'len': len,
        'range': range,
        'enumerate': enumerate,
        'zip': zip,
        'map': map,
        'filter': filter,
        'sum': sum,
        'min': min,
        'max': max,
        'abs': abs,
        'round': round,
        'sorted': sorted,
        'list': list,
        'dict': dict,
        'set': set,
        'tuple': tuple,
        'str': str,
        'int': int,
        'float': float,
        'bool': bool,
        'print': print,  # Für Debugging
        'isinstance': isinstance,
        'type': type,
    }
    
    safe_namespace['__builtins__'] = safe_builtins
    
    return safe_namespace


# Blacklist für gefährliche Operationen
DANGEROUS_PATTERNS = [
    '__import__',
    'eval',
    'exec',
    'compile',
    'open',
    'file',
    'input',
    'raw_input',
    '__subclasses__',
    '__bases__',
    '__globals__',
    'os.',
    'sys.',
    'subprocess',
    'socket',
    'urllib',
    'requests',
]


def validate_code(code: str) -> tuple[bool, str]:
    """Validiert User-Code auf gefährliche Operationen"""
    code_lower = code.lower()
    
    for pattern in DANGEROUS_PATTERNS:
        if pattern.lower() in code_lower:
            return False, f"Gefährliche Operation nicht erlaubt: {pattern}"
    
    return True, ""
