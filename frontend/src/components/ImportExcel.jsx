import React, { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import './ImportExcel.css'

function ImportExcel() {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [useTemplate, setUseTemplate] = useState(false)
  const [file, setFile] = useState(null)
  const [sheets, setSheets] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [detectedRange, setDetectedRange] = useState('')
  const [customRange, setCustomRange] = useState('')
  const [useCustomRange, setUseCustomRange] = useState(false)
  const [dataOrientation, setDataOrientation] = useState('columns') // 'columns' or 'rows'
  const [workbook, setWorkbook] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [columnFormats, setColumnFormats] = useState({})
  const [step, setStep] = useState(1) // 1: Upload, 2: Sheet/Range/Orientation, 3: Format, 4: Preview
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const fileInputRef = useRef(null)

  const formats = [
    { id: 'string', label: 'Text', icon: '📝' },
    { id: 'number', label: 'Nummer', icon: '🔢' },
    { id: 'date', label: 'Datum', icon: '📅' },
    { id: 'time', label: 'Zeit', icon: '🕐' },
    { id: 'percent', label: 'Prozent', icon: '%' },
    { id: 'currency', label: 'Währung', icon: '€' }
  ]

  useEffect(() => {
    // Lade gespeicherte Templates
    const savedTemplates = localStorage.getItem('importTemplates')
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates))
      } catch (error) {
        console.error('Fehler beim Laden der Templates:', error)
      }
    }
  }, [])

  const detectCellFormat = (cell) => {
    if (!cell || !cell.t) return 'string'
    
    // Excel Zelltypen: 'n' = number, 's' = string, 'd' = date, 'b' = boolean
    if (cell.t === 'd') return 'date'
    
    if (cell.t === 'n') {
      // Prüfe das Zahlenformat
      const format = cell.z || cell.w
      
      if (format) {
        const formatLower = format.toLowerCase()
        
        // Datum-Formate
        if (formatLower.includes('d') || formatLower.includes('m') || formatLower.includes('y') ||
            formatLower.includes('tag') || formatLower.includes('monat') || formatLower.includes('jahr')) {
          return 'date'
        }
        
        // Zeit-Formate
        if (formatLower.includes('h') || formatLower.includes('m') || formatLower.includes('s') ||
            formatLower.includes('am') || formatLower.includes('pm')) {
          return 'time'
        }
        
        // Prozent-Formate
        if (formatLower.includes('%')) {
          return 'percent'
        }
        
        // Währungs-Formate
        if (formatLower.includes('€') || formatLower.includes('$') || formatLower.includes('currency') ||
            formatLower.includes('währung')) {
          return 'currency'
        }
      }
      
      // Wenn es eine Zahl zwischen 0 und 1 ist, könnte es Prozent sein
      if (cell.v > 0 && cell.v < 1) {
        return 'percent'
      }
      
      // Excel Datum-Seriennummern (typischerweise zwischen 1 und 50000)
      if (cell.v > 1 && cell.v < 50000 && Number.isInteger(cell.v)) {
        return 'date'
      }
      
      return 'number'
    }
    
    return 'string'
  }

  const autoDetectColumnFormats = (wb, sheetName, rangeStr) => {
    const worksheet = wb.Sheets[sheetName]
    const range = XLSX.utils.decode_range(rangeStr)
    const detectedFormats = {}
    
    // Analysiere die ersten 10 Zeilen jeder Spalte
    for (let C = range.s.c; C <= range.e.c; C++) {
      const formatCounts = {}
      let samplesChecked = 0
      
      for (let R = range.s.r; R <= Math.min(range.s.r + 10, range.e.r); R++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        const cell = worksheet[cellAddress]
        
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
          const format = detectCellFormat(cell)
          formatCounts[format] = (formatCounts[format] || 0) + 1
          samplesChecked++
        }
      }
      
      // Wähle das häufigste Format
      if (samplesChecked > 0) {
        const mostCommon = Object.entries(formatCounts)
          .sort((a, b) => b[1] - a[1])[0][0]
        detectedFormats[C - range.s.c] = mostCommon
      } else {
        detectedFormats[C - range.s.c] = 'string'
      }
    }
    
    return detectedFormats
  }

  const formatValue = (value, format) => {
    if (!value || value === '') return value

    try {
      switch (format) {
        case 'number':
          const num = parseFloat(value)
          return isNaN(num) ? value : num.toLocaleString('de-DE')
        
        case 'date':
          let date
          if (typeof value === 'number') {
            const excelEpoch = new Date(1899, 11, 30)
            date = new Date(excelEpoch.getTime() + value * 86400000)
          } else {
            date = new Date(value)
          }
          return isNaN(date.getTime()) ? value : date.toLocaleDateString('de-DE')
        
        case 'time':
          if (typeof value === 'number') {
            const hours = Math.floor(value * 24)
            const minutes = Math.floor((value * 24 * 60) % 60)
            const seconds = Math.floor((value * 24 * 60 * 60) % 60)
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          } else {
            const time = new Date(value)
            return isNaN(time.getTime()) ? value : time.toLocaleTimeString('de-DE')
          }
        
        case 'percent':
          const percent = parseFloat(value)
          if (isNaN(percent)) return value
          const displayValue = percent < 1 && percent > 0 ? percent * 100 : percent
          return `${displayValue.toLocaleString('de-DE')} %`
        
        case 'currency':
          const currency = parseFloat(value)
          return isNaN(currency) ? value : `${currency.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
        
        case 'string':
        default:
          return value
      }
    } catch (error) {
      return value
    }
  }

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    
    // Wenn Template ausgewählt, wende es an
    if (useTemplate && selectedTemplate) {
      applyTemplate(uploadedFile, selectedTemplate)
    } else {
      processFile(uploadedFile)
    }
  }

  const applyTemplate = (uploadedFile, template) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const wb = XLSX.read(data, { type: 'array', cellDates: false, cellNF: true })
        
        setWorkbook(wb)
        setSheets(wb.SheetNames)
        
        // Wende Template-Einstellungen an
        setDataOrientation(template.dataOrientation)
        setSelectedSheet(template.sheetName || wb.SheetNames[0])
        setCustomRange(template.range)
        setUseCustomRange(true)
        setColumnFormats(template.columnFormats)
        
        // Gehe direkt zur Vorschau
        generatePreviewData(template.range, wb, template.sheetName || wb.SheetNames[0])
        setStep(4)
      } catch (error) {
        alert('Fehler beim Anwenden des Templates: ' + error.message)
      }
    }

    reader.readAsArrayBuffer(uploadedFile)
  }

  const processFile = (uploadedFile) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const wb = XLSX.read(data, { type: 'array', cellDates: false, cellNF: true })
        
        setWorkbook(wb)
        setSheets(wb.SheetNames)
        
        if (wb.SheetNames.length === 1) {
          // Nur ein Blatt - automatisch auswählen
          const sheetName = wb.SheetNames[0]
          setSelectedSheet(sheetName)
          detectUsedRange(wb, sheetName)
          setStep(2)
        } else {
          // Mehrere Blätter - Auswahl erforderlich
          setStep(2)
        }
      } catch (error) {
        alert('Fehler beim Lesen der Excel-Datei: ' + error.message)
      }
    }

    reader.readAsArrayBuffer(uploadedFile)
  }

  const detectUsedRange = (wb, sheetName) => {
    const worksheet = wb.Sheets[sheetName]
    const range = XLSX.utils.decode_range(worksheet['!ref'])
    
    // Finde den tatsächlich genutzten Bereich
    let minRow = range.e.r + 1
    let maxRow = 0
    let minCol = range.e.c + 1
    let maxCol = 0

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        const cell = worksheet[cellAddress]
        
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
          minRow = Math.min(minRow, R)
          maxRow = Math.max(maxRow, R)
          minCol = Math.min(minCol, C)
          maxCol = Math.max(maxCol, C)
        }
      }
    }

    if (maxRow >= minRow && maxCol >= minCol) {
      const startCell = XLSX.utils.encode_cell({ r: minRow, c: minCol })
      const endCell = XLSX.utils.encode_cell({ r: maxRow, c: maxCol })
      const usedRange = `${startCell}:${endCell}`
      setDetectedRange(usedRange)
      setCustomRange(usedRange)
    }
  }

  const handleSheetSelect = (sheetName) => {
    setSelectedSheet(sheetName)
    detectUsedRange(workbook, sheetName)
  }

  const proceedToFormatSelection = () => {
    const rangeToUse = useCustomRange ? customRange : detectedRange
    
    // Auto-Erkennung der Formate
    const detected = autoDetectColumnFormats(workbook, selectedSheet, rangeToUse)
    setColumnFormats(detected)
    
    // Generiere Vorschau-Daten für Format-Auswahl
    generatePreviewData(rangeToUse, workbook, selectedSheet)
    setStep(3)
  }

  const generatePreviewData = (rangeToUse, wb = workbook, sheet = selectedSheet) => {
    if (!wb || !sheet) return

    const worksheet = wb.Sheets[sheet]

    try {
      const range = XLSX.utils.decode_range(rangeToUse)
      const data = []

      for (let R = range.s.r; R <= range.e.r; R++) {
        const row = []
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          const cell = worksheet[cellAddress]
          
          let value = ''
          if (cell) {
            if (cell.v !== undefined && cell.v !== null) {
              value = cell.v
            }
          }
          row.push(value)
        }
        data.push(row)
      }

      // Wenn Daten zeilenweise sind, transponiere sie
      if (dataOrientation === 'rows') {
        const transposed = data[0].map((_, colIndex) => data.map(row => row[colIndex]))
        setPreviewData(transposed)
      } else {
        setPreviewData(data)
      }
    } catch (error) {
      alert('Ungültiger Bereich: ' + error.message)
    }
  }

  const handleColumnFormatChange = (colIndex, format) => {
    setColumnFormats(prev => ({
      ...prev,
      [colIndex]: format
    }))
  }

  const proceedToFinalPreview = () => {
    setStep(4)
  }

  const handleImport = () => {
    localStorage.setItem('importedTableData', JSON.stringify({
      data: previewData,
      name: file.name.replace('.xlsx', '').replace('.xls', ''),
      columnFormats: columnFormats
    }))
    
    if (showSaveTemplate) {
      saveAsTemplate()
    }
    
    alert('Daten erfolgreich importiert! Wechsle zu "Neue Tabelle" um sie zu sehen.')
  }

  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      alert('Bitte gib einen Template-Namen ein.')
      return
    }

    const newTemplate = {
      id: Date.now(),
      name: templateName,
      sheetName: selectedSheet,
      range: useCustomRange ? customRange : detectedRange,
      dataOrientation: dataOrientation,
      columnFormats: columnFormats,
      createdAt: new Date().toISOString()
    }

    const updatedTemplates = [...templates, newTemplate]
    setTemplates(updatedTemplates)
    localStorage.setItem('importTemplates', JSON.stringify(updatedTemplates))
    
    setShowSaveTemplate(false)
    setTemplateName('')
  }

  const deleteTemplate = (templateId) => {
    if (!confirm('Template wirklich löschen?')) return
    
    const updatedTemplates = templates.filter(t => t.id !== templateId)
    setTemplates(updatedTemplates)
    localStorage.setItem('importTemplates', JSON.stringify(updatedTemplates))
    
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null)
      setUseTemplate(false)
    }
  }

  const selectTemplate = (template) => {
    setSelectedTemplate(template)
    setUseTemplate(true)
  }

  const resetImport = () => {
    setFile(null)
    setSheets([])
    setSelectedSheet('')
    setDetectedRange('')
    setCustomRange('')
    setUseCustomRange(false)
    setDataOrientation('columns')
    setWorkbook(null)
    setPreviewData(null)
    setColumnFormats({})
    setStep(1)
    setUseTemplate(false)
    setSelectedTemplate(null)
    setShowSaveTemplate(false)
    setTemplateName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getColumnLabel = (index) => {
    let label = ''
    let num = index
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label
      num = Math.floor(num / 26) - 1
    }
    return label
  }

  return (
    <div className="import-excel">
      <div className="import-header">
        <h2>Excel Import</h2>
        {step > 1 && (
          <button className="btn btn-secondary" onClick={resetImport}>
            🔄 Neue Datei
          </button>
        )}
      </div>

      {step === 1 && (
        <div className="import-step">
          {templates.length > 0 && (
            <div className="template-section">
              <h3>📋 Gespeicherte Templates</h3>
              <div className="template-list">
                {templates.map(template => (
                  <div 
                    key={template.id} 
                    className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                  >
                    <div className="template-info" onClick={() => selectTemplate(template)}>
                      <div className="template-name">{template.icon || '📄'} {template.name}</div>
                      <div className="template-details">
                        <span>Blatt: {template.sheetName}</span>
                        <span>Bereich: {template.range}</span>
                        <span>Orientierung: {template.dataOrientation === 'columns' ? 'Spalten' : 'Zeilen'}</span>
                      </div>
                    </div>
                    <button 
                      className="btn-delete-template"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTemplate(template.id)
                      }}
                      title="Template löschen"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              {selectedTemplate && (
                <div className="template-selected-info">
                  ✓ Template "{selectedTemplate.name}" wird verwendet
                </div>
              )}
              <div className="template-divider">
                <span>oder</span>
              </div>
            </div>
          )}

          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              id="file-upload"
              className="file-input"
            />
            <label htmlFor="file-upload" className="upload-label">
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <strong>Excel-Datei auswählen</strong>
                <span>{useTemplate ? 'Template wird angewendet' : 'Neuer Import'}</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="import-step">
          <div className="step-section">
            <h3>1. Blatt auswählen</h3>
            {sheets.length > 1 ? (
              <div className="sheet-selection">
                {sheets.map(sheet => (
                  <button
                    key={sheet}
                    className={`sheet-button ${selectedSheet === sheet ? 'selected' : ''}`}
                    onClick={() => handleSheetSelect(sheet)}
                  >
                    📄 {sheet}
                  </button>
                ))}
              </div>
            ) : (
              <div className="info-box">
                <strong>Ausgewähltes Blatt:</strong> {selectedSheet}
              </div>
            )}
          </div>

          {selectedSheet && (
            <>
              <div className="step-section">
                <h3>2. Bereich auswählen</h3>
                <div className="range-selection">
                  <div className="range-option">
                    <label className="radio-label">
                      <input
                        type="radio"
                        checked={!useCustomRange}
                        onChange={() => setUseCustomRange(false)}
                      />
                      <span>Erkannter Bereich verwenden</span>
                    </label>
                    <div className="range-display">{detectedRange}</div>
                  </div>

                  <div className="range-option">
                    <label className="radio-label">
                      <input
                        type="radio"
                        checked={useCustomRange}
                        onChange={() => setUseCustomRange(true)}
                      />
                      <span>Benutzerdefinierten Bereich eingeben</span>
                    </label>
                    <input
                      type="text"
                      className="range-input"
                      value={customRange}
                      onChange={(e) => setCustomRange(e.target.value)}
                      placeholder="z.B. A1:D10"
                      disabled={!useCustomRange}
                    />
                  </div>
                </div>
              </div>

              <div className="step-section">
                <h3>3. Datenorientierung</h3>
                <div className="orientation-selection">
                  <label className="orientation-option">
                    <input
                      type="radio"
                      name="orientation"
                      value="columns"
                      checked={dataOrientation === 'columns'}
                      onChange={(e) => setDataOrientation(e.target.value)}
                    />
                    <div className="orientation-card">
                      <div className="orientation-icon">📊</div>
                      <div className="orientation-label">Datenpunkte in Spalten</div>
                      <div className="orientation-description">
                        Standard: Jede Spalte ist eine Variable
                      </div>
                    </div>
                  </label>

                  <label className="orientation-option">
                    <input
                      type="radio"
                      name="orientation"
                      value="rows"
                      checked={dataOrientation === 'rows'}
                      onChange={(e) => setDataOrientation(e.target.value)}
                    />
                    <div className="orientation-card">
                      <div className="orientation-icon">📈</div>
                      <div className="orientation-label">Datenpunkte in Zeilen</div>
                      <div className="orientation-description">
                        Transponiert: Jede Zeile ist eine Variable
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button 
                className="btn btn-primary btn-large"
                onClick={proceedToFormatSelection}
              >
                Weiter zu Formatierung →
              </button>
            </>
          )}
        </div>
      )}

      {step === 3 && previewData && (
        <div className="import-step">
          <div className="step-section">
            <h3>4. {dataOrientation === 'columns' ? 'Spalten' : 'Zeilen'}-Formate definieren</h3>
            <div className="info-box">
              <strong>💡 Tipp:</strong> Die Formate wurden automatisch erkannt. Du kannst sie bei Bedarf anpassen.
              {dataOrientation === 'rows' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>📈 Hinweis:</strong> Daten werden zeilenweise interpretiert und für die Anzeige transponiert.
                </div>
              )}
            </div>

            <div className="format-selection-grid">
              {previewData[0]?.map((_, colIndex) => (
                <div key={colIndex} className="column-format-card">
                  <div className="column-format-header">
                    <strong>Spalte {getColumnLabel(colIndex)}</strong>
                  </div>
                  
                  <div className="format-buttons">
                    {formats.map(format => (
                      <button
                        key={format.id}
                        className={`format-select-btn ${columnFormats[colIndex] === format.id ? 'selected' : ''}`}
                        onClick={() => handleColumnFormatChange(colIndex, format.id)}
                        title={format.label}
                      >
                        <span className="format-icon-large">{format.icon}</span>
                        <span className="format-label-small">{format.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="format-preview">
                    <div className="preview-label">Vorschau:</div>
                    {previewData.slice(0, 3).map((row, rowIndex) => (
                      <div key={rowIndex} className="preview-value">
                        {formatValue(row[colIndex], columnFormats[colIndex])}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="import-actions">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                ← Zurück
              </button>
              <button className="btn btn-primary btn-large" onClick={proceedToFinalPreview}>
                Vorschau anzeigen →
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && previewData && (
        <div className="import-step">
          <div className="step-section">
            <h3>4. Finale Vorschau</h3>
            <div className="preview-info">
              <span><strong>Datei:</strong> {file.name}</span>
              <span><strong>Blatt:</strong> {selectedSheet}</span>
              <span><strong>Bereich:</strong> {useCustomRange ? customRange : detectedRange}</span>
              <span><strong>Größe:</strong> {previewData.length} Zeilen × {previewData[0]?.length || 0} Spalten</span>
            </div>

            <div className="preview-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th className="row-number">#</th>
                    {previewData[0]?.map((_, colIndex) => (
                      <th key={colIndex} className="preview-header">
                        <div className="preview-header-content">
                          <span>{getColumnLabel(colIndex)}</span>
                          <span className="format-badge">
                            {formats.find(f => f.id === columnFormats[colIndex])?.icon}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 20).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="row-number">{rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="preview-cell">
                          {formatValue(cell, columnFormats[cellIndex])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 20 && (
                <div className="preview-note">
                  Zeige erste 20 von {previewData.length} Zeilen
                </div>
              )}
            </div>

            <div className="import-actions">
              <button className="btn btn-secondary" onClick={() => setStep(3)}>
                ← Zurück
              </button>
              <div className="save-template-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showSaveTemplate}
                    onChange={(e) => setShowSaveTemplate(e.target.checked)}
                  />
                  <span>Als Template speichern</span>
                </label>
                {showSaveTemplate && (
                  <input
                    type="text"
                    className="template-name-input"
                    placeholder="Template-Name eingeben..."
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                )}
              </div>
              <button className="btn btn-primary btn-large" onClick={handleImport}>
                ✓ Importieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportExcel
