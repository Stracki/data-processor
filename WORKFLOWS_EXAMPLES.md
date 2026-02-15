# Workflow-System - Beispiele & Use Cases

## 📚 Inhaltsverzeichnis

1. [Einfache Beispiele](#einfache-beispiele)
2. [Fortgeschrittene Workflows](#fortgeschrittene-workflows)
3. [Reale Use Cases](#reale-use-cases)
4. [Best Practices](#best-practices)

## Einfache Beispiele

### Beispiel 1: Daten filtern

**Szenario**: Filtere Kundendaten nach bestimmten Kriterien

```
┌─────────────┐     ┌──────────────┐     ┌─────────┐
│ Kundendaten │────▶│ Filter-Proz. │────▶│ Output  │
└─────────────┘     └──────────────┘     └─────────┘
                           ▲
                           │
                    ┌──────────────┐
                    │ Wert: "aktiv"│
                    └──────────────┘
```

**Nodes:**
1. **Tabelle**: Kundendaten (alle Kunden)
2. **Wert**: Status = "aktiv"
3. **Prozedur**: Filtert nach Status
4. **Output**: Nur aktive Kunden

**Prozedur-Code:**
```python
def filter_by_status(tabelle: Table, status: str) -> Table:
    filtered = [row for row in tabelle if row['status'] == status]
    return create_table(filtered)
```

---

### Beispiel 2: Berechnungen durchführen

**Szenario**: Berechne Gesamtpreis mit MwSt

```
┌──────────────┐     ┌─────────────┐     ┌─────────┐
│ Rechnungen   │────▶│ MwSt-Proz.  │────▶│ Output  │
└──────────────┘     └─────────────┘     └─────────┘
                           ▲
                           │
                    ┌──────────────┐
                    │ Wert: 1.19   │
                    └──────────────┘
```

**Nodes:**
1. **Tabelle**: Rechnungen (Netto-Beträge)
2. **Wert**: MwSt-Satz = 1.19
3. **Prozedur**: Multipliziert Beträge mit MwSt
4. **Output**: Rechnungen mit Brutto-Beträgen

**Prozedur-Code:**
```python
def calculate_tax(tabelle: Table, tax_rate: float) -> Table:
    for row in tabelle:
        row['brutto'] = row['netto'] * tax_rate
    return tabelle
```

---

### Beispiel 3: Daten zusammenführen

**Szenario**: Kombiniere Kunden mit ihren Bestellungen

```
┌─────────┐
│ Kunden  │────┐
└─────────┘    │
               ▼
         ┌─────────────┐     ┌─────────┐
         │ Merge-Proz. │────▶│ Output  │
         └─────────────┘     └─────────┘
               ▲
┌─────────┐    │
│Bestellun│────┘
└─────────┘
```

**Nodes:**
1. **Tabelle**: Kunden
2. **Tabelle**: Bestellungen
3. **Prozedur**: Merged Tabellen nach Kunden-ID
4. **Output**: Kunden mit Bestellungen

**Prozedur-Code:**
```python
def merge_tables(kunden: Table, bestellungen: Table) -> Table:
    result = []
    for kunde in kunden:
        kunde_bestellungen = [b for b in bestellungen if b['kunde_id'] == kunde['id']]
        kunde['bestellungen'] = kunde_bestellungen
        result.append(kunde)
    return result
```

---

## Fortgeschrittene Workflows

### Beispiel 4: Multi-Step Verarbeitung

**Szenario**: Datenbereinigung → Filterung → Aggregation

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌────────┐
│ Rohdaten │────▶│ Bereinig.│────▶│ Filter   │────▶│ Aggregat.│────▶│ Output │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └────────┘
```

**Schritte:**
1. **Bereinigung**: Entferne ungültige Einträge
2. **Filter**: Nur Daten aus 2024
3. **Aggregation**: Summiere nach Kategorie
4. **Output**: Bereinigte, gefilterte, aggregierte Daten

---

### Beispiel 5: Parallele Verarbeitung

**Szenario**: Verschiedene Analysen auf gleichen Daten

```
                    ┌──────────────┐     ┌─────────────┐
              ┌────▶│ Statistik    │────▶│ Output: Stat│
              │     └──────────────┘     └─────────────┘
┌──────────┐  │
│ Verkäufe │──┤     ┌──────────────┐     ┌─────────────┐
└──────────┘  ├────▶│ Top-Produkte │────▶│ Output: Top │
              │     └──────────────┘     └─────────────┘
              │
              │     ┌──────────────┐     ┌─────────────┐
              └────▶│ Trend-Analys.│────▶│ Output: Trnd│
                    └──────────────┘     └─────────────┘
```

**Analysen:**
1. **Statistik**: Durchschnitt, Min, Max
2. **Top-Produkte**: Meistverkaufte Artikel
3. **Trend**: Verkaufsentwicklung über Zeit

---

### Beispiel 6: Komplexe Datenverarbeitung

**Szenario**: E-Commerce Reporting

```
┌─────────┐
│ Kunden  │────┐
└─────────┘    │
               ▼
         ┌─────────────┐     ┌──────────────┐     ┌─────────┐
         │ Join        │────▶│ Berechnung   │────▶│ Output  │
         └─────────────┘     └──────────────┘     └─────────┘
               ▲                     ▲
┌─────────┐    │                     │
│Bestellun│────┘              ┌──────────────┐
└─────────┘                   │ Wert: Rabatt │
                              └──────────────┘
```

**Workflow:**
1. Lade Kunden und Bestellungen
2. Verbinde Tabellen
3. Berechne Rabatte
4. Erstelle Report

---

## Reale Use Cases

### Use Case 1: Monatliches Reporting

**Business-Anforderung**: Jeden Monat automatisch Sales-Report erstellen

**Workflow:**
```
Verkaufsdaten → Filter (aktueller Monat) → Aggregation → Formatierung → Output
```

**Vorteile:**
- ✅ Automatisiert
- ✅ Konsistent
- ✅ Wiederverwendbar
- ✅ Nachvollziehbar

---

### Use Case 2: Datenqualität-Check

**Business-Anforderung**: Prüfe importierte Daten auf Vollständigkeit

**Workflow:**
```
Import-Daten → Validierung → Filter (Fehler) → Benachrichtigung → Output
```

**Checks:**
- Pflichtfelder vorhanden?
- Datentypen korrekt?
- Wertebereiche eingehalten?
- Duplikate vorhanden?

---

### Use Case 3: Kunden-Segmentierung

**Business-Anforderung**: Teile Kunden in Segmente für Marketing

**Workflow:**
```
                    ┌──────────────┐     ┌──────────────┐
              ┌────▶│ VIP-Filter   │────▶│ Output: VIP  │
              │     └──────────────┘     └──────────────┘
┌──────────┐  │
│ Kunden   │──┤     ┌──────────────┐     ┌──────────────┐
└──────────┘  ├────▶│ Aktiv-Filter │────▶│ Output: Aktiv│
              │     └──────────────┘     └──────────────┘
              │
              │     ┌──────────────┐     ┌──────────────┐
              └────▶│ Inaktiv-Filtr│────▶│ Output: Inakt│
                    └──────────────┘     └──────────────┘
```

**Segmente:**
- VIP: Umsatz > 10.000€
- Aktiv: Letzte Bestellung < 30 Tage
- Inaktiv: Letzte Bestellung > 90 Tage

---

### Use Case 4: Preiskalkulation

**Business-Anforderung**: Berechne Verkaufspreise basierend auf Kosten

**Workflow:**
```
Produkte → Kosten laden → Marge berechnen → MwSt hinzufügen → Runden → Output
```

**Berechnungen:**
1. Einkaufspreis laden
2. Marge aufschlagen (z.B. 30%)
3. MwSt hinzufügen (19%)
4. Auf .99 runden
5. Preisliste ausgeben

---

### Use Case 5: Bestandsverwaltung

**Business-Anforderung**: Identifiziere Produkte mit niedrigem Bestand

**Workflow:**
```
Lagerbestand → Filter (< Mindestbestand) → Sortierung → Benachrichtigung → Output
```

**Logik:**
1. Lade aktuellen Bestand
2. Filtere Produkte unter Mindestbestand
3. Sortiere nach Dringlichkeit
4. Erstelle Nachbestellliste

---

## Best Practices

### 1. Workflow-Design

#### ✅ DO:
- Klare, beschreibende Namen verwenden
- Workflows in logische Schritte unterteilen
- Wiederverwendbare Prozeduren erstellen
- Dokumentation in Beschreibung einfügen

#### ❌ DON'T:
- Zu komplexe Workflows (max. 10-15 Nodes)
- Zyklen erstellen
- Unbenannte Nodes lassen
- Workflows ohne Beschreibung

---

### 2. Node-Organisation

#### Layout-Tipps:
- **Links nach Rechts**: Datenfluss von links nach rechts
- **Gruppierung**: Ähnliche Nodes gruppieren
- **Abstand**: Genug Platz zwischen Nodes
- **Ausrichtung**: Nodes horizontal/vertikal ausrichten

#### Beispiel gutes Layout:
```
Input-Nodes (links) → Verarbeitung (mitte) → Output-Nodes (rechts)
```

---

### 3. Fehlerbehandlung

#### Robuste Workflows:
- Validierung am Anfang
- Fehlerhafte Daten filtern
- Fallback-Werte definieren
- Logging aktivieren

#### Beispiel:
```
Daten → Validierung → [Gültig] → Verarbeitung → Output
                   → [Ungültig] → Fehler-Output
```

---

### 4. Performance

#### Optimierungen:
- Große Tabellen früh filtern
- Unnötige Berechnungen vermeiden
- Prozeduren optimieren
- Indizes auf Tabellen nutzen

#### Beispiel:
```
❌ Schlecht: Alle Daten laden → Filtern
✅ Gut: Gefilterte Daten laden
```

---

### 5. Wartbarkeit

#### Dokumentation:
- Workflow-Beschreibung ausfüllen
- Node-Namen aussagekräftig
- Prozeduren kommentieren
- Änderungen dokumentieren

#### Versionierung:
- Workflows vor Änderungen duplizieren
- Testumgebung nutzen
- Schrittweise testen

---

### 6. Testing

#### Test-Strategie:
1. **Unit-Tests**: Prozeduren einzeln testen
2. **Integration-Tests**: Workflow mit Test-Daten
3. **End-to-End**: Kompletter Workflow mit echten Daten

#### Test-Daten:
- Klein und überschaubar
- Verschiedene Szenarien abdecken
- Edge Cases einbeziehen

---

## Workflow-Templates

### Template 1: Daten-Import-Pipeline

```
Excel-Import → Validierung → Transformation → Speichern → Benachrichtigung
```

**Verwendung:**
- CSV/Excel-Dateien importieren
- Datenqualität sicherstellen
- In Datenbank speichern

---

### Template 2: Report-Generator

```
Daten laden → Filter → Aggregation → Formatierung → Export
```

**Verwendung:**
- Regelmäßige Reports
- Verschiedene Formate
- Automatisierte Verteilung

---

### Template 3: Daten-Synchronisation

```
Quelle A → Transformation → Merge ← Transformation ← Quelle B
                              ↓
                           Ziel-System
```

**Verwendung:**
- Systeme synchronisieren
- Daten konsolidieren
- Master-Data-Management

---

## Troubleshooting-Guide

### Problem: Workflow schlägt fehl

**Lösungsschritte:**
1. Prüfe Execution Log
2. Teste Prozeduren einzeln
3. Validiere Input-Daten
4. Prüfe Node-Konfiguration

---

### Problem: Falsche Ergebnisse

**Lösungsschritte:**
1. Prüfe Datenfluss
2. Validiere Prozedur-Logik
3. Teste mit kleinen Daten
4. Prüfe Parameter-Mapping

---

### Problem: Langsame Ausführung

**Lösungsschritte:**
1. Profiling aktivieren
2. Große Tabellen filtern
3. Prozeduren optimieren
4. Indizes prüfen

---

## Nächste Schritte

1. **Starte mit einfachen Workflows**
   - Ein oder zwei Nodes
   - Bekannte Prozeduren
   - Test-Daten

2. **Erweitere schrittweise**
   - Mehr Nodes hinzufügen
   - Komplexere Logik
   - Echte Daten

3. **Optimiere und dokumentiere**
   - Performance messen
   - Best Practices anwenden
   - Team schulen

4. **Automatisiere**
   - Regelmäßige Ausführung
   - Monitoring einrichten
   - Fehlerbehandlung verbessern

---

## Ressourcen

- **Vollständige Dokumentation**: `WORKFLOWS_README.md`
- **Schnellstart**: `WORKFLOWS_QUICKSTART.md`
- **Implementierung**: `WORKFLOWS_IMPLEMENTATION.md`
- **Prozeduren**: `PROZEDUREN_README.md`
- **Tabellen**: `DATENTABELLE_README.md`

---

**Viel Erfolg beim Erstellen deiner Workflows! 🚀**
