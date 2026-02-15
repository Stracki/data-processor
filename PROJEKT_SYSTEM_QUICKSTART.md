# Projekt-System Quickstart

## Installation & Initialisierung

### 1. Backend starten

```bash
cd backend

# Initialisiere Global-Projekt und Standard-Werte
python init_global.py

# Starte Backend
uvicorn main:app --reload
```

### 2. Frontend starten

```bash
cd frontend
npm install  # Falls noch nicht geschehen
npm run dev
```

## Erste Schritte

### 1. Global-Projekt erkunden

1. Öffne http://localhost:5173/projects
2. Klicke auf das "🌐 Global" Projekt
3. Erkunde die Struktur:
   - **Prozeduren**: Globale, wiederverwendbare Funktionen
   - **Workflows**: Globale Workflow-Templates
   - **Datentabellen**: Globale Referenzdaten
   - **Globale Werte**: Konstanten wie MWST_SATZ, WAEHRUNG

### 2. Globale Werte verwalten

1. Im Global-Projekt auf "Globale Werte" klicken
2. Siehst du Standard-Werte wie:
   - `global.MWST_SATZ = 0.19`
   - `global.WAEHRUNG = "EUR"`
3. Klicke "➕ Neuer Wert" um eigene Werte hinzuzufügen

**Beispiel: Firmenadresse**
```
Key: FIRMEN_ADRESSE
Typ: Object
Wert: {
  "strasse": "Musterstraße 123",
  "plz": "12345",
  "ort": "Musterstadt"
}
Kategorie: Adressen
```

### 3. Erstes Projekt erstellen

1. Zurück zu Projekten (/projects)
2. Klicke "➕ Neues Projekt"
3. Eingeben:
   - **Name**: "Mein erstes Projekt"
   - **Beschreibung**: "Test-Projekt für 2024"
   - **Zyklustyp**: Jährlich
4. Klicke "Erstellen"

### 4. Ersten Zyklus erstellen

1. Öffne das neue Projekt
2. Klicke "➕ Nächster Zyklus"
3. Es wird automatisch "Jahr_2024" erstellt mit Unterordnern:
   - 01_Eingangsdaten
   - 02_Verarbeitung
   - 03_Ausgabe
   - 04_Archiv

### 5. Prozedur im Projekt erstellen

1. In der Projektstruktur: `_shared` → `Prozeduren` klicken
2. Erstelle eine neue Prozedur
3. Diese ist nur in diesem Projekt verfügbar

**Beispiel: Projekt-spezifische Berechnung**
```python
def berechne_rabatt(betrag: float, kunde_typ: str) -> float:
    """Berechnet Rabatt basierend auf Kundentyp"""
    if kunde_typ == "premium":
        return betrag * 0.9  # 10% Rabatt
    elif kunde_typ == "standard":
        return betrag * 0.95  # 5% Rabatt
    return betrag
```

### 6. Globale Werte in Prozedur nutzen

```python
def berechne_brutto(netto: float) -> float:
    """Berechnet Bruttopreis mit globalem MwSt-Satz"""
    # global.MWST_SATZ ist automatisch verfügbar!
    return netto * (1 + global.MWST_SATZ)
```

### 7. Globale Prozedur kopieren und anpassen

1. Gehe zu Global-Projekt → Prozeduren
2. Wähle eine Prozedur
3. Klicke "In Projekt kopieren"
4. Wähle Ziel-Projekt
5. Passe die Kopie an deine Bedürfnisse an

## Typische Anwendungsfälle

### Use Case 1: Monatliche Berichte

**Setup:**
```
Projekt: "Monatsberichte 2024"
Zyklustyp: Monatlich
Pattern: "Monat_{month}_{year}"
```

**Workflow:**
1. Jeden Monat: "Nächster Zyklus" → erstellt "Monat_01_2024", "Monat_02_2024", etc.
2. In jedem Zyklus: Spezifische Daten und Workflows
3. Globale Prozeduren für wiederkehrende Berechnungen

### Use Case 2: Jahresabschluss

**Setup:**
```
Projekt: "Jahresabschluss"
Zyklustyp: Jährlich
Pattern: "Jahr_{year}"
```

**Struktur:**
```
_shared/
  ├─ Prozeduren (wiederverwendbare Berechnungen)
  └─ Workflows (Standard-Ablauf)
Jahr_2024/
  ├─ 01_Eingangsdaten (Rohdaten)
  ├─ 02_Verarbeitung (Berechnungen)
  ├─ 03_Ausgabe (Berichte)
  └─ 04_Archiv (Backup)
```

### Use Case 3: Multi-Mandanten

**Setup:**
```
Global: Gemeinsame Prozeduren und Werte
Projekt pro Kunde:
  - "Kunde A"
  - "Kunde B"
  - "Kunde C"
```

**Vorteile:**
- Globale Prozeduren für alle Kunden
- Kunde-spezifische Anpassungen im Projekt
- Saubere Trennung der Daten

## Tipps & Tricks

### 1. Globale Werte organisieren

Nutze Kategorien für bessere Übersicht:
- **Finanzen**: MWST_SATZ, WAEHRUNG, ZAHLUNGSZIEL
- **Adressen**: FIRMEN_ADRESSE, LAGER_ADRESSE
- **Formatierung**: DATUM_FORMAT, DEZIMAL_TRENNZEICHEN
- **Limits**: MAX_BESTELLWERT, MIN_BESTELLMENGE

### 2. Namenskonventionen

**Globale Werte:**
- GROSSBUCHSTABEN mit Unterstrichen
- Beispiel: `MWST_SATZ`, `MAX_ANZAHL`

**Projekte:**
- Beschreibend und eindeutig
- Beispiel: "Jahresabschluss 2024", "Monatsberichte Q1"

**Zyklen:**
- Automatisch durch Pattern generiert
- Beispiel: "Jahr_2024", "Q1_2024", "Monat_01_2024"

### 3. Projekt-Metadaten nutzen

Beim Erstellen/Bearbeiten eines Projekts:
```json
{
  "contacts": {
    "responsible": "Max Mustermann",
    "contact": "max@example.com"
  },
  "custom": {
    "sap_nummer": "12345",
    "kostenstelle": "K-001"
  }
}
```

### 4. Scope richtig wählen

**Global:**
- ✅ Standard-Berechnungen (MwSt, Rabatte)
- ✅ Datenvalidierung
- ✅ Formatierungen
- ❌ Projekt-spezifische Logik

**Project:**
- ✅ Projekt-spezifische Berechnungen
- ✅ Kunde-spezifische Anpassungen
- ✅ Wiederverwendbar innerhalb des Projekts

**Cycle:**
- ✅ Zeitraum-spezifische Anpassungen
- ✅ Einmalige Sonderfälle
- ❌ Wiederverwendbare Logik

## Häufige Fragen

**Q: Kann ich ein bestehendes Projekt in ein anderes kopieren?**
A: Aktuell nicht direkt. Du kannst aber einzelne Prozeduren/Workflows kopieren.

**Q: Was passiert wenn ich einen Zyklus lösche?**
A: Alle Ressourcen (Prozeduren, Workflows, Daten) in diesem Zyklus werden gelöscht.

**Q: Kann ich globale Werte überschreiben?**
A: Nein, globale Werte sind read-only. Du kannst aber projekt-spezifische Werte mit gleichem Namen erstellen.

**Q: Wie viele Projekte kann ich haben?**
A: Unbegrenzt. Achte aber auf Übersichtlichkeit.

**Q: Kann ich die Zyklen-Konfiguration nachträglich ändern?**
A: Ja, über die Projekt-Einstellungen. Bestehende Zyklen bleiben unverändert.

## Nächste Schritte

1. Erstelle dein erstes echtes Projekt
2. Definiere globale Werte für deine Anwendungsfälle
3. Erstelle wiederverwendbare Prozeduren im Global-Projekt
4. Baue projekt-spezifische Workflows

Viel Erfolg! 🚀
