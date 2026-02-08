import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import './NewTable.css'

function NewTable() {
  const navigate = useNavigate()
  const [tableName, setTableName] = useState('Neue Tabelle')
  const [numColumns, setNumColumns] = useState(10)
  const [numRows, setNumRows] = useState(50)
  const [data, setData] = useState(() => {
    const initialData = {}
    for (let row = 0; row < 50; row++) {
      for (let col = 0; col < 10; col++) {
        initialData[`${row}-${col}`] = ''
      }
    }
    return initialData
  })
  const [columnFormats, setColumnFormats] = useState({})
  const [showFormatMenu, setShowFormatMenu] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Neue Einstellungen
  const [showSettings, setShowSettings] = useState(true)
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [dataOrientation, setDataOrientation] = useState('columns')
  const [importFile, setImportFile] = useState(null)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [showFormatSettings, setShowFormatSettings] = useState(false)
  const [formatSettingsMode, setFormatSettingsMode] = useState('dropdown') // 'dropdown' or 'detailed'
  const [formatFromCol, setFormatFromCol] = useState(1)
  const [formatToCol, setFormatToCol] = useState('')
  const [formatType, setFormatType] = useState('string')
  
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const formatMenuRef = useRef(null)
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
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formatMenuRef.current && !formatMenuRef.current.contains(event.target)) {
        setShowFormatMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

    // Prüfe ob importierte Daten vorhanden sind
    const importedData = localStorage.getItem('importedTableData')
    if (importedData) {
      try {
        const { data: importedArray, name, columnFormats: importedFormats } = JSON.parse(importedData)
        
        // Konvertiere Array zu unserem Datenformat
        const newData = {}
        const rows = importedArray.length
        const cols = importedArray[0]?.length || 0
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            newData[`${row}-${col}`] = importedArray[row][col] || ''
          }
        }
        
        setData(newData)
        setNumRows(rows)
        setNumColumns(cols)
        setTableName(name)
        
        // Übernehme die Spalten-Formate
        if (importedFormats) {
          setColumnFormats(importedFormats)
        }
        
        // Lösche die importierten Daten
        localStorage.removeItem('importedTableData')
        setShowSettings(false)
      } catch (error) {
        console.error('Fehler beim Laden der importierten Daten:', error)
      }
    }
  }, [])

  const formatValue = (value, format) => {
    if (!value || value === '') return value

    try {
      switch (format) {
        case 'number':
          const num = parseFloat(value)
          return isNaN(num) ? value : num.toLocaleString('de-DE')
        
        case 'date':
          // Excel speichert Daten als Seriennummer (Tage seit 1900-01-01)
          let date
          if (typeof value === 'number') {
            // Excel Seriennummer zu Datum konvertieren
            const excelEpoch = new Date(1899, 11, 30)
            date = new Date(excelEpoch.getTime() + value * 86400000)
          } else {
            date = new Date(value)
          }
          return isNaN(date.getTime()) ? value : date.toLocaleDateString('de-DE')
        
        case 'time':
          let time
          if (typeof value === 'number') {
            // Excel Zeit als Bruchteil eines Tages
            const hours = Math.floor(value * 24)
            const minutes = Math.floor((value * 24 * 60) % 60)
            const seconds = Math.floor((value * 24 * 60 * 60) % 60)
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          } else {
            time = new Date(value)
            return isNaN(time.getTime()) ? value : time.toLocaleTimeString('de-DE')
          }
        
        case 'percent':
          const percent = parseFloat(value)
          if (isNaN(percent)) return value
          // Wenn der Wert zwischen 0 und 1 ist, multipliziere mit 100
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

  const getCellValue = (row, col) => {
    return data[`${row}-${col}`] || ''
  }

  const getDisplayValue = (row, col) => {
    const value = getCellValue(row, col)
    const format = columnFormats[col]
    return formatValue(value, format)
  }

  const setCellValue = (row, col, value) => {
    setData(prev => ({
      ...prev,
      [`${row}-${col}`]: value
    }))
  }

  const setColumnFormat = (col, format) => {
    setColumnFormats(prev => ({
      ...prev,
      [col]: format
    }))
    setShowFormatMenu(null)
  }

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col })
    setEditingCell({ row, col })
  }

  const handleCellChange = (e) => {
    if (editingCell) {
      setCellValue(editingCell.row, editingCell.col, e.target.value)
    }
  }

  const handleCellBlur = () => {
    setEditingCell(null)
  }

  const handleColumnHeaderClick = (e, col) => {
    e.stopPropagation()
    setShowFormatMenu(showFormatMenu === col ? null : col)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen()
      } catch (err) {
        console.error('Fehler beim Aktivieren des Vollbildmodus:', err)
      }
    } else {
      try {
        await document.exitFullscreen()
      } catch (err) {
        console.error('Fehler beim Beenden des Vollbildmodus:', err)
      }
    }
  }

  const handleKeyDown = (e) => {
    // ESC im Vollbildmodus wird automatisch vom Browser behandelt
    if (e.key === 'Escape' && !document.fullscreenElement && editingCell) {
      setEditingCell(null)
      e.preventDefault()
      return
    }

    if (!selectedCell) return

    const { row, col } = selectedCell

    switch (e.key) {
      case 'Enter':
        if (editingCell) {
          setEditingCell(null)
          if (row < numRows - 1) {
            setSelectedCell({ row: row + 1, col })
            setEditingCell({ row: row + 1, col })
          }
        } else {
          setEditingCell({ row, col })
        }
        e.preventDefault()
        break
      case 'Tab':
        setEditingCell(null)
        if (col < numColumns - 1) {
          setSelectedCell({ row, col: col + 1 })
          setEditingCell({ row, col: col + 1 })
        } else if (row < numRows - 1) {
          setSelectedCell({ row: row + 1, col: 0 })
          setEditingCell({ row: row + 1, col: 0 })
        }
        e.preventDefault()
        break
      case 'ArrowUp':
        if (!editingCell && row > 0) {
          setSelectedCell({ row: row - 1, col })
        }
        break
      case 'ArrowDown':
        if (!editingCell && row < numRows - 1) {
          setSelectedCell({ row: row + 1, col })
        }
        break
      case 'ArrowLeft':
        if (!editingCell && col > 0) {
          setSelectedCell({ row, col: col - 1 })
        }
        break
      case 'ArrowRight':
        if (!editingCell && col < numColumns - 1) {
          setSelectedCell({ row, col: col + 1 })
        }
        break
      default:
        if (!editingCell && e.key.length === 1) {
          setEditingCell({ row, col })
          setCellValue(row, col, e.key)
        }
    }
  }

  const addColumn = () => {
    setNumColumns(prev => prev + 1)
  }

  const addRow = () => {
    setNumRows(prev => prev + 1)
  }

  const saveTable = async () => {
    console.log('Tabelle speichern:', { tableName, numColumns, numRows, data, columnFormats })
    alert('Tabelle gespeichert!')
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

  const getFormatIcon = (col) => {
    const format = columnFormats[col]
    const formatObj = formats.find(f => f.id === format)
    return formatObj ? formatObj.icon : '📝'
  }

  const applyFormatRange = () => {
    const from = formatFromCol
    const to = formatToCol === '' ? formatFromCol : parseInt(formatToCol)
    
    if (!from || from < 1 || from > numColumns) {
      alert('Ungültige Spalten-Nummer')
      return
    }
    
    if (to < from || to > numColumns) {
      alert('Ungültiger Bereich')
      return
    }
    
    const newFormats = { ...columnFormats }
    for (let i = from - 1; i < to; i++) {
      newFormats[i] = formatType
    }
    setColumnFormats(newFormats)
    
    // Springe zur nächsten Spalte
    setFormatFromCol(to + 1)
    setFormatToCol('')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setImportFile(file)
  }

  const applyTemplate = (template) => {
    setSelectedTemplate(template)
    setDataOrientation(template.dataOrientation)
    setColumnFormats(template.columnFormats || {})
    setNumColumns(template.numColumns || Object.keys(template.columnFormats || {}).length || 10)
    setNumRows(template.numRows || 50)
    setTableName(template.name)
  }

  const loadTemplate = () => {
    if (!selectedTemplate) {
      alert('Bitte wähle ein Template aus.')
      return
    }
    applyTemplate(selectedTemplate)
  }

  const processImport = async () => {
    if (!importFile) {
      alert('Bitte wähle eine Excel-Datei aus.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const wb = XLSX.read(data, { type: 'array', cellDates: false, cellNF: true })
        
        // Nimm das erste Blatt
        const sheetName = wb.SheetNames[0]
        const worksheet = wb.Sheets[sheetName]
        const range = XLSX.utils.decode_range(worksheet['!ref'])
        
        const importedData = []
        for (let R = range.s.r; R <= range.e.r; R++) {
          const row = []
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
            const cell = worksheet[cellAddress]
            let value = ''
            if (cell && cell.v !== undefined && cell.v !== null) {
              value = cell.v
            }
            row.push(value)
          }
          importedData.push(row)
        }

        // Transponiere wenn nötig
        const finalData = dataOrientation === 'rows' 
          ? importedData[0].map((_, colIndex) => importedData.map(row => row[colIndex]))
          : importedData

        // Konvertiere zu unserem Format
        const newData = {}
        const rows = finalData.length
        const cols = finalData[0]?.length || 0
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            newData[`${row}-${col}`] = finalData[row][col] || ''
          }
        }
        
        setData(newData)
        setNumRows(rows)
        setNumColumns(cols)
        setTableName(importFile.name.replace('.xlsx', '').replace('.xls', ''))
        setShowSettings(false)

        // Speichere Template wenn gewünscht
        if (showSaveTemplate && templateName.trim()) {
          saveAsTemplate()
        }
      } catch (error) {
        alert('Fehler beim Importieren: ' + error.message)
      }
    }
    reader.readAsArrayBuffer(importFile)
  }

  const createEmptyTable = () => {
    const newData = {}
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numColumns; col++) {
        newData[`${row}-${col}`] = ''
      }
    }
    setData(newData)
    setShowSettings(false)

    if (showSaveTemplate && templateName.trim()) {
      saveAsTemplate()
    }
  }

  const saveAsTemplate = () => {
    const newTemplate = {
      id: Date.now(),
      name: templateName,
      dataOrientation: dataOrientation,
      columnFormats: columnFormats,
      numColumns: numColumns,
      numRows: numRows,
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
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`new-table ${isFullscreen ? 'fullscreen' : ''}`} 
      onKeyDown={handleKeyDown} 
      tabIndex={0}
    >
      {showSettings ? (
        <div className="table-settings">
          <h2>Neue Tabelle erstellen</h2>
          
          <div className="settings-grid">
            {/* Template Auswahl */}
            <div className="settings-section full-width">
              <h3>📋 Template</h3>
              <div className="template-actions">
                <select 
                  className="template-dropdown"
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === parseInt(e.target.value))
                    setSelectedTemplate(template || null)
                  }}
                >
                  <option value="">Kein Template (Neue Tabelle)</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.dataOrientation === 'columns' ? 'Spalten' : 'Zeilen'})
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <>
                    <button 
                      className="btn btn-secondary"
                      onClick={loadTemplate}
                    >
                      Template laden
                    </button>
                    <button 
                      className="btn-icon-only"
                      onClick={() => deleteTemplate(selectedTemplate.id)}
                      title="Template löschen"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
              {selectedTemplate && (
                <div className="template-info-box">
                  <strong>Template-Info:</strong> {Object.keys(selectedTemplate.columnFormats || {}).length} Formate definiert, 
                  {selectedTemplate.numColumns} Spalten × {selectedTemplate.numRows} Zeilen
                </div>
              )}
            </div>

            {/* Tabellenname */}
            <div className="settings-section">
              <label className="settings-label">Tabellenname</label>
              <input
                type="text"
                className="settings-input"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Tabellenname eingeben"
              />
            </div>

            {/* Datenorientierung */}
            <div className="settings-section">
              <label className="settings-label">Datenorientierung</label>
              <div className="orientation-buttons">
                <button
                  className={`orientation-btn ${dataOrientation === 'columns' ? 'active' : ''}`}
                  onClick={() => setDataOrientation('columns')}
                >
                  <span className="orientation-icon-small">📊</span>
                  <span>Spalten</span>
                </button>
                <button
                  className={`orientation-btn ${dataOrientation === 'rows' ? 'active' : ''}`}
                  onClick={() => setDataOrientation('rows')}
                >
                  <span className="orientation-icon-small">📈</span>
                  <span>Zeilen</span>
                </button>
              </div>
            </div>

            {/* Dimensionen */}
            <div className="settings-section">
              <label className="settings-label">Spalten</label>
              <input
                type="number"
                className="settings-input"
                value={numColumns}
                onChange={(e) => setNumColumns(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
              />
            </div>

            <div className="settings-section">
              <label className="settings-label">Zeilen</label>
              <input
                type="number"
                className="settings-input"
                value={numRows}
                onChange={(e) => setNumRows(parseInt(e.target.value) || 1)}
                min="1"
                max="10000"
              />
            </div>

            {/* Spalten-Formate */}
            <div className="settings-section full-width">
              <div className="format-header">
                <label className="settings-label">
                  {dataOrientation === 'columns' ? 'Spalten' : 'Zeilen'}-Formate (optional)
                </label>
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => setShowFormatSettings(!showFormatSettings)}
                >
                  {showFormatSettings ? '▼ Ausblenden' : '▶ Formate definieren'}
                </button>
              </div>

              {showFormatSettings && (
                <div className="format-settings-container">
                  <div className="format-mode-toggle">
                    <button
                      className={`mode-btn ${formatSettingsMode === 'dropdown' ? 'active' : ''}`}
                      onClick={() => setFormatSettingsMode('dropdown')}
                    >
                      Schnellauswahl
                    </button>
                    <button
                      className={`mode-btn ${formatSettingsMode === 'detailed' ? 'active' : ''}`}
                      onClick={() => setFormatSettingsMode('detailed')}
                    >
                      Detailliert
                    </button>
                  </div>

                  {formatSettingsMode === 'dropdown' ? (
                    <div className="format-dropdown-mode">
                      <div className="format-dropdown-grid">
                        <div className="format-dropdown-item">
                          <label>Von Spalte:</label>
                          <input 
                            type="number" 
                            className="format-range-input"
                            value={formatFromCol}
                            onChange={(e) => setFormatFromCol(parseInt(e.target.value) || 1)}
                            min="1"
                            max={numColumns}
                          />
                        </div>
                        <div className="format-dropdown-item">
                          <label>Bis Spalte (optional):</label>
                          <input 
                            type="number" 
                            className="format-range-input"
                            value={formatToCol}
                            onChange={(e) => setFormatToCol(e.target.value)}
                            placeholder="leer = nur eine Spalte"
                            min={formatFromCol}
                            max={numColumns}
                          />
                        </div>
                        <div className="format-dropdown-item">
                          <label>Format:</label>
                          <select 
                            className="format-range-select"
                            value={formatType}
                            onChange={(e) => setFormatType(e.target.value)}
                          >
                            {formats.map(fmt => (
                              <option key={fmt.id} value={fmt.id}>
                                {fmt.icon} {fmt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button 
                          className="btn btn-primary"
                          onClick={applyFormatRange}
                        >
                          Anwenden
                        </button>
                      </div>
                      <div className="format-summary">
                        <strong>Aktuell definiert:</strong>
                        {Object.keys(columnFormats).length === 0 ? (
                          <span> Keine (alle Spalten: Text)</span>
                        ) : (
                          <div className="format-summary-list">
                            {Object.entries(columnFormats).map(([col, format]) => (
                              <span key={col} className="format-tag">
                                {getColumnLabel(parseInt(col))}: {formats.find(f => f.id === format)?.icon}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="format-detailed-mode">
                      <div className="format-quick-select">
                        {Array.from({ length: Math.min(numColumns, 20) }, (_, i) => (
                          <div key={i} className="format-column-quick">
                            <span className="format-column-label">{getColumnLabel(i)}</span>
                            <select
                              className="format-select"
                              value={columnFormats[i] || 'string'}
                              onChange={(e) => setColumnFormat(i, e.target.value)}
                            >
                              {formats.map(fmt => (
                                <option key={fmt.id} value={fmt.id}>
                                  {fmt.icon} {fmt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                      {numColumns > 20 && (
                        <div className="format-more-info">
                          +{numColumns - 20} weitere Spalten (Standard: Text, nutze Schnellauswahl für Bereichs-Formatierung)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Excel Import */}
            <div className="settings-section full-width">
              <label className="settings-label">Excel-Datei importieren (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="file-input-settings"
              />
              {importFile && (
                <div className="file-selected">
                  ✓ {importFile.name}
                </div>
              )}
            </div>

            {/* Template speichern */}
            <div className="settings-section full-width">
              <label className="checkbox-label-settings">
                <input
                  type="checkbox"
                  checked={showSaveTemplate}
                  onChange={(e) => setShowSaveTemplate(e.target.checked)}
                />
                <span>Einstellungen als Template speichern</span>
              </label>
              {showSaveTemplate && (
                <input
                  type="text"
                  className="settings-input"
                  placeholder="Template-Name eingeben..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  style={{ marginTop: '0.5rem' }}
                />
              )}
            </div>
          </div>

          {/* Aktionen */}
          <div className="settings-actions">
            <button 
              className="btn btn-secondary btn-large"
              onClick={createEmptyTable}
            >
              Leere Tabelle erstellen
            </button>
            {importFile && (
              <button 
                className="btn btn-primary btn-large"
                onClick={processImport}
              >
                Excel importieren & Tabelle erstellen
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="new-table-header">
            <div className="header-left">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSettings(true)}
                title="Einstellungen"
              >
                ⚙️
              </button>
              <input
                type="text"
                className="table-name-input"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Tabellenname"
              />
            </div>
            <div className="new-table-actions">
          <button 
            className="btn btn-secondary" 
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Vollbild beenden (ESC)' : 'Vollbild'}
          >
            {isFullscreen ? '🗗' : '⛶'}
          </button>
          <button className="btn btn-secondary" onClick={addColumn}>
            + Spalte
          </button>
          <button className="btn btn-secondary" onClick={addRow}>
            + Zeile
          </button>
          <button className="btn btn-primary" onClick={saveTable}>
            💾 Speichern
          </button>
        </div>
      </div>

      <div className="grid-container">
        <div className="excel-grid">
          <table className="grid-table">
            <thead>
              <tr>
                <th className="row-header"></th>
                {Array.from({ length: numColumns }, (_, i) => (
                  <th key={i} className="column-header">
                    <div className="column-header-content">
                      <span>{getColumnLabel(i)}</span>
                      <button 
                        className="format-button"
                        onClick={(e) => handleColumnHeaderClick(e, i)}
                        title="Format ändern"
                      >
                        {getFormatIcon(i)}
                      </button>
                    </div>
                    {showFormatMenu === i && (
                      <div ref={formatMenuRef} className="format-menu">
                        {formats.map(format => (
                          <button
                            key={format.id}
                            className={`format-option ${columnFormats[i] === format.id ? 'active' : ''}`}
                            onClick={() => setColumnFormat(i, format.id)}
                          >
                            <span className="format-icon">{format.icon}</span>
                            <span>{format.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: numRows }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="row-header">{rowIndex + 1}</td>
                  {Array.from({ length: numColumns }, (_, colIndex) => {
                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex
                    
                    return (
                      <td
                        key={colIndex}
                        className={`grid-cell ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            className="cell-input"
                            value={getCellValue(rowIndex, colIndex)}
                            onChange={handleCellChange}
                            onBlur={handleCellBlur}
                          />
                        ) : (
                          <span className="cell-content">
                            {getDisplayValue(rowIndex, colIndex)}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="new-table-footer">
        <span className="table-info">
          {numRows} Zeilen × {numColumns} Spalten
        </span>
        {isFullscreen && (
          <span className="fullscreen-hint">
            Drücke ESC zum Beenden des Vollbildmodus
          </span>
        )}
      </div>
        </>
      )}
    </div>
  )
}

export default NewTable
