import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Spreadsheet from 'x-data-spreadsheet'
import * as XLSX from 'xlsx'
import './xspreadsheet.css'
import './ExcelViewer.css'

function ExcelViewer() {
  const navigate = useNavigate()
  const [fileName, setFileName] = useState('')
  const [baseName, setBaseName] = useState('') // Original-Basisname ohne Timestamp
  const [currentVersion, setCurrentVersion] = useState(1)
  const [fileId, setFileId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [selectedRange, setSelectedRange] = useState(null)
  const spreadsheetRef = useRef(null)
  const containerRef = useRef(null)
  const xsRef = useRef(null)

  useEffect(() => {
    loadExcelFile()
  }, [])

  const loadExcelFile = async () => {
    try {
      // Hole Dateiinfo aus localStorage
      const fileInfo = localStorage.getItem('currentExcelFile')
      if (!fileInfo) {
        alert('Keine Datei ausgewählt')
        navigate('/import')
        return
      }

      const { id, filename, displayName, baseName: storedBaseName, version } = JSON.parse(fileInfo)
      setFileName(displayName)
      setBaseName(storedBaseName)
      setCurrentVersion(version)
      setFileId(id)

      // Lade Excel-Datei vom Backend
      const response = await fetch(`http://localhost:8000/api/files/download/${filename}`)
      if (!response.ok) {
        throw new Error('Datei konnte nicht geladen werden')
      }

      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      // Konvertiere Excel zu x-spreadsheet Format
      const xsData = convertWorkbookToXSpreadsheet(workbook)

      // Initialisiere x-spreadsheet
      if (containerRef.current) {
        xsRef.current = new Spreadsheet(containerRef.current, {
          mode: 'edit',
          showToolbar: true,
          showGrid: true,
          showContextmenu: true,
          view: {
            height: () => window.innerHeight - 200,
            width: () => window.innerWidth - 100,
          },
          row: {
            len: 100,
            height: 25,
          },
          col: {
            len: 26,
            width: 100,
            indexWidth: 60,
            minWidth: 60,
          },
        })

        xsRef.current.loadData(xsData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Fehler beim Laden:', error)
      alert('Fehler beim Laden der Excel-Datei: ' + error.message)
      setLoading(false)
    }
  }

  const convertWorkbookToXSpreadsheet = (workbook) => {
    const sheets = []

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

      const rows = {}
      const cells = {}

      // Konvertiere Zellen
      for (let R = range.s.r; R <= range.e.r; R++) {
        const rowData = { cells: {} }
        
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          const cell = worksheet[cellAddress]

          if (cell) {
            let cellValue = ''
            let cellType = 'string'

            // Extrahiere Wert basierend auf Typ
            if (cell.v !== undefined && cell.v !== null) {
              cellValue = cell.v

              // Formatiere basierend auf Excel-Typ
              if (cell.t === 'n') {
                cellType = 'number'
                // Prüfe ob es ein Datum ist
                if (cell.w && (cell.w.includes('/') || cell.w.includes('-'))) {
                  cellValue = cell.w
                }
              } else if (cell.t === 'd') {
                cellValue = cell.w || cellValue
              } else if (cell.t === 's') {
                cellType = 'string'
              }
            }

            rowData.cells[C] = {
              text: String(cellValue),
            }

            // Übernehme Styling wenn vorhanden
            if (cell.s) {
              const style = {}
              if (cell.s.font) {
                if (cell.s.font.bold) style.bold = true
                if (cell.s.font.italic) style.italic = true
              }
              if (Object.keys(style).length > 0) {
                rowData.cells[C].style = style
              }
            }
          }
        }

        if (Object.keys(rowData.cells).length > 0) {
          rows[R] = rowData
        }
      }

      sheets.push({
        name: sheetName,
        rows: rows,
        merges: [],
        cols: {},
      })
    })

    return sheets.length > 0 ? sheets[0] : { name: 'Sheet1', rows: {}, cols: {} }
  }

  const handleSave = async () => {
    if (!xsRef.current) return

    try {
      const data = xsRef.current.getData()
      console.log('Spreadsheet Data:', data) // Debug
      
      // x-spreadsheet gibt ein Array von Sheets zurück oder ein einzelnes Sheet-Objekt
      const sheetData = Array.isArray(data) ? data[0] : data
      
      if (!sheetData || !sheetData.rows) {
        throw new Error('Keine Daten zum Speichern gefunden')
      }
      
      // Konvertiere zu Excel - rows ist ein Objekt mit row-indices als keys
      const rowsArray = []
      const rowIndices = Object.keys(sheetData.rows).map(Number).sort((a, b) => a - b)
      
      for (const rowIndex of rowIndices) {
        const row = sheetData.rows[rowIndex]
        const rowArray = []
        
        if (row && row.cells) {
          const colIndices = Object.keys(row.cells).map(Number).sort((a, b) => a - b)
          const maxCol = Math.max(...colIndices, 0)
          
          for (let colIndex = 0; colIndex <= maxCol; colIndex++) {
            const cell = row.cells[colIndex]
            rowArray[colIndex] = cell ? (cell.text || '') : ''
          }
        }
        
        rowsArray.push(rowArray)
      }

      const ws = XLSX.utils.aoa_to_sheet(rowsArray)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetData.name || 'Sheet1')
      
      // Konvertiere zu Blob
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // Verwende den Original-Basisnamen (ohne vorherige Timestamps)
      const newFileName = `${baseName}.xlsx`
      
      // Upload als neue Version mit original_name Parameter
      const formData = new FormData()
      formData.append('file', blob, newFileName)
      formData.append('original_name', `${baseName}.xlsx`)
      
      const response = await fetch('http://localhost:8000/api/files/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Speichern fehlgeschlagen')
      }

      const result = await response.json()
      
      // Zeige neue Version
      const newVersion = result.version
      alert(`✓ Neue Version gespeichert: ${result.display_name} (v${newVersion})`)
      
      // Aktualisiere die aktuelle Datei-Referenz
      localStorage.setItem('currentExcelFile', JSON.stringify({
        id: result.id,
        filename: result.filename,
        displayName: result.display_name,
        baseName: result.base_name,
        version: result.version
      }))
      
      // Aktualisiere State
      setFileName(result.display_name)
      setCurrentVersion(result.version)
      setFileId(result.id)
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      alert('Fehler beim Speichern: ' + error.message)
    }
  }

  const handleExport = () => {
    if (!xsRef.current) return

    const data = xsRef.current.getData()
    
    // Konvertiere zurück zu Excel
    const ws = XLSX.utils.aoa_to_sheet(
      Object.entries(data.rows).map(([rowIndex, row]) => {
        const rowArray = []
        Object.entries(row.cells).forEach(([colIndex, cell]) => {
          rowArray[parseInt(colIndex)] = cell.text
        })
        return rowArray
      })
    )

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, data.name || 'Sheet1')
    XLSX.writeFile(wb, fileName || 'export.xlsx')
  }

  const handleBack = () => {
    navigate('/import')
  }

  const handleDelete = async () => {
    if (!fileId) return

    if (!confirm(`Möchtest du "${fileName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/files/${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen')
      }

      alert(`✓ "${fileName}" wurde gelöscht`)
      
      // Zurück zur Übersicht
      navigate('/import')
      
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      alert('Fehler beim Löschen: ' + error.message)
    }
  }

  const handleConvertToDataTable = () => {
    if (!xsRef.current) return

    // Hole die aktuelle Selektion
    const data = xsRef.current.getData()
    const sheetData = Array.isArray(data) ? data[0] : data

    // Zeige Dialog zur Bereichsauswahl
    setShowConvertDialog(true)
  }

  const convertRangeToDataTable = () => {
    if (!xsRef.current) return

    try {
      const data = xsRef.current.getData()
      const sheetData = Array.isArray(data) ? data[0] : data

      if (!sheetData || !sheetData.rows) {
        alert('Keine Daten zum Konvertieren gefunden')
        return
      }

      // Wenn kein Bereich ausgewählt, nimm alle Daten
      const rowIndices = Object.keys(sheetData.rows).map(Number).sort((a, b) => a - b)
      
      if (rowIndices.length === 0) {
        alert('Keine Daten vorhanden')
        return
      }

      // Bestimme Spaltenanzahl
      let maxCol = 0
      rowIndices.forEach(rowIndex => {
        const row = sheetData.rows[rowIndex]
        if (row && row.cells) {
          const colIndices = Object.keys(row.cells).map(Number)
          maxCol = Math.max(maxCol, ...colIndices)
        }
      })

      // Erste Zeile als Spaltenüberschriften verwenden
      const firstRowIndex = rowIndices[0]
      const firstRow = sheetData.rows[firstRowIndex]
      
      const columns = []
      for (let colIndex = 0; colIndex <= maxCol; colIndex++) {
        const cell = firstRow?.cells?.[colIndex]
        const columnName = cell?.text || `Spalte ${colIndex + 1}`
        
        // Versuche Datentyp zu erkennen
        let detectedType = 'string'
        for (let i = 1; i < Math.min(rowIndices.length, 10); i++) {
          const sampleRow = sheetData.rows[rowIndices[i]]
          const sampleCell = sampleRow?.cells?.[colIndex]
          if (sampleCell?.text) {
            const value = sampleCell.text
            if (!isNaN(parseFloat(value)) && isFinite(value)) {
              detectedType = 'number'
            } else if (!isNaN(Date.parse(value))) {
              detectedType = 'date'
            }
            break
          }
        }

        columns.push({
          id: colIndex + 1,
          name: columnName,
          type: detectedType
        })
      }

      // Konvertiere Datenzeilen (ab zweiter Zeile)
      const dataRows = []
      for (let i = 1; i < rowIndices.length; i++) {
        const rowIndex = rowIndices[i]
        const row = sheetData.rows[rowIndex]
        const dataRow = { id: i }

        for (let colIndex = 0; colIndex <= maxCol; colIndex++) {
          const cell = row?.cells?.[colIndex]
          dataRow[`col_${colIndex + 1}`] = cell?.text || ''
        }

        dataRows.push(dataRow)
      }

      // Speichere in localStorage für NewTable
      const tableData = {
        name: `${baseName} - Datentabelle`,
        columns: columns,
        data: dataRows
      }

      localStorage.setItem('tableDataFromExcel', JSON.stringify(tableData))

      // Navigiere zu NewTable
      navigate('/tabellen/new')
      
    } catch (error) {
      console.error('Fehler beim Konvertieren:', error)
      alert('Fehler beim Konvertieren: ' + error.message)
    }
  }

  return (
    <div className="excel-viewer">
      <div className="viewer-header">
        <div className="header-left">
          <button className="btn btn-secondary" onClick={handleBack}>
            ← Zurück
          </button>
          <h2>
            📊 {fileName}
            <span className="version-badge-viewer">v{currentVersion}</span>
          </h2>
        </div>
        <div className="header-actions">
          <button className="btn btn-success" onClick={handleConvertToDataTable}>
            📋 In Datentabelle umwandeln
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            🗑️ Löschen
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            📥 Exportieren
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 Speichern
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Excel wird geladen...</p>
        </div>
      ) : (
        <div className="spreadsheet-container">
          <div ref={containerRef} className="spreadsheet-wrapper"></div>
        </div>
      )}

      {showConvertDialog && (
        <div className="convert-dialog-overlay" onClick={() => setShowConvertDialog(false)}>
          <div className="convert-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>In Datentabelle umwandeln</h3>
            <p>
              Die erste Zeile wird als Spaltenüberschriften verwendet.
              Die restlichen Zeilen werden als Daten importiert.
            </p>
            <p className="convert-info">
              ℹ️ Datentypen werden automatisch erkannt (Text, Nummer, Datum)
            </p>
            <div className="convert-dialog-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowConvertDialog(false)}
              >
                Abbrechen
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  convertRangeToDataTable()
                  setShowConvertDialog(false)
                }}
              >
                Umwandeln
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExcelViewer
