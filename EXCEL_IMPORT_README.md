# 📊 Excel Import & Viewer System

## Was wurde implementiert?

Ein komplett neues System zum Hochladen, Speichern und Bearbeiten von Excel-Dateien - **Excel bleibt Excel**!

## ✨ Features

### 1. **Excel Upload** (`/import`)
- Drag & Drop Excel-Dateien hochladen
- Dateien werden auf dem Server gespeichert
- Liste aller hochgeladenen Dateien
- Direkt öffnen im Excel-Viewer

### 2. **Excel Viewer** (`/excel-viewer`)
- **Echte Excel-Darstellung** mit x-spreadsheet
- Alle Formate bleiben erhalten (Datum, Währung, Prozent, etc.)
- Editierbar wie in Excel
- Toolbar mit Excel-Funktionen
- Export zurück zu Excel möglich

### 3. **Backend File Management**
- Upload Endpoint: `POST /api/files/upload`
- Download Endpoint: `GET /api/files/download/{filename}`
- List Endpoint: `GET /api/files/list`
- Delete Endpoint: `DELETE /api/files/{filename}`

## 🚀 Wie starten?

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Neue Dateien

### Frontend
- `src/components/ImportExcel.jsx` - Upload-Interface (komplett neu)
- `src/components/ImportExcel.css` - Styling
- `src/components/ExcelViewer.jsx` - Excel-Viewer mit x-spreadsheet
- `src/components/ExcelViewer.css` - Viewer-Styling

### Backend
- `routers/files.py` - File-Upload/Download API
- `uploads/` - Verzeichnis für hochgeladene Dateien (wird automatisch erstellt)

## 🎯 Workflow

1. **Upload**: Gehe zu "Tabellen → Excel Import"
2. **Datei wählen**: Klicke auf Upload-Bereich
3. **Hochladen**: Klicke "Hochladen & Öffnen"
4. **Bearbeiten**: Excel wird im Viewer geöffnet - alle Formate bleiben erhalten!
5. **Speichern**: Änderungen speichern oder als neue Excel exportieren

## 💡 Vorteile dieser Lösung

✅ **Keine Formatverluste** - Excel-Formate bleiben 1:1 erhalten
✅ **Keine Konvertierung** - Excel bleibt Excel
✅ **Editierbar** - Wie in Excel bearbeiten
✅ **Zweistufiger Prozess möglich** - Später kannst du Bereiche definieren
✅ **Einfach** - Minimaler Code, maximale Funktionalität

## 🔧 Nächste Schritte (optional)

1. **Bereichs-Selektion**: User kann Bereiche in der Excel markieren
2. **Datenbank-Integration**: Markierte Bereiche in DB speichern
3. **Prozessierung**: Definierte Bereiche verarbeiten
4. **Validierung**: Datentyp-Checks auf markierte Bereiche

## 📦 Dependencies

- **x-data-spreadsheet**: Excel-ähnliche Spreadsheet-Komponente
- **xlsx**: Excel-Datei-Parsing
- **python-multipart**: File-Upload im Backend

## 🎨 UI-Highlights

- Moderne, saubere Upload-Oberfläche
- Datei-Liste mit Metadaten
- Vollständiger Excel-Editor
- Responsive Design
