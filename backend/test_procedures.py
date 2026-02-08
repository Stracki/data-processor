"""
Test-Skript für Prozeduren-System
Kann verwendet werden um die API manuell zu testen
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

# Beispiel-Prozedur Code
EXAMPLE_CODE = """def multiply_column(tabelle, spalte: str, faktor: int = 2):
    \"\"\"
    Multipliziert eine Spalte mit einem Faktor
    \"\"\"
    if spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte}' nicht gefunden")
    
    tabelle[f'{spalte}_x{faktor}'] = tabelle[spalte] * faktor
    return tabelle
"""

def create_procedure():
    """Erstellt eine neue Prozedur"""
    payload = {
        "description": "Multipliziert eine Spalte mit einem Faktor",
        "code": EXAMPLE_CODE
    }
    
    response = requests.post(f"{BASE_URL}/procedures/", json=payload)
    print(f"Create Procedure: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

def list_procedures():
    """Listet alle Prozeduren"""
    response = requests.get(f"{BASE_URL}/procedures/")
    print(f"List Procedures: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

def get_procedure_schema(name):
    """Holt das Schema einer Prozedur"""
    response = requests.get(f"{BASE_URL}/procedures/{name}/schema")
    print(f"Get Schema: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

def execute_procedure(name, table_id, spalte, faktor=2):
    """Führt eine Prozedur aus"""
    payload = {
        "parameters": {
            "tabelle": table_id,
            "spalte": spalte,
            "faktor": faktor
        },
        "project_id": None
    }
    
    response = requests.post(f"{BASE_URL}/procedures/{name}/execute", json=payload)
    print(f"Execute Procedure: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

def list_executions():
    """Listet Execution History"""
    response = requests.get(f"{BASE_URL}/procedures/executions/")
    print(f"List Executions: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

if __name__ == "__main__":
    print("=== Prozeduren Test ===\n")
    
    # 1. Prozedur erstellen
    print("1. Erstelle Prozedur...")
    create_procedure()
    print("\n" + "="*50 + "\n")
    
    # 2. Prozeduren auflisten
    print("2. Liste Prozeduren...")
    list_procedures()
    print("\n" + "="*50 + "\n")
    
    # 3. Schema abrufen
    print("3. Hole Schema...")
    get_procedure_schema("multiply_column")
    print("\n" + "="*50 + "\n")
    
    # 4. Prozedur ausführen (benötigt existierende Tabelle!)
    # print("4. Führe Prozedur aus...")
    # execute_procedure("multiply_column", table_id=1, spalte="wert", faktor=3)
    # print("\n" + "="*50 + "\n")
    
    # 5. Execution History
    # print("5. Liste Executions...")
    # list_executions()
