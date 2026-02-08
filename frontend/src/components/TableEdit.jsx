import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './NewTable.css'

function TableEdit() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const [tableName, setTableName] = useState('Datentabelle')
  const [columns, setColumns] = useState([])
  const [data, setData] = useState([])
  const [selectedCell, setSelectedCell] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nextColumnId, setNextColumnId] = useState(1)
  const [nextRowId, setNextRowId] = useState(1)
  
  const inputRef = useRef(null)

  const columnTypes = [
    { id: 'string', label: 'Text', icon: '📝' },
    { id: 'number', label: 'Nummer', icon: '🔢' },
    { id: 'date', label: 'Datum', icon: '📅' },
    { id: 'time', label: 'Zeit', icon: '🕐' },
    { id: 'percent', label: 'Prozent', icon: '%' },
    { id: 'currency', label: 'Währung', icon: '€' }
  ]

  useEffect(() => {
    loadTable()
  }, [tableId])

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  const loadTable = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/tables/${tableId}`)
      if (!response.ok) {
        throw new Error('Tabelle nicht gefunden')
      }
      const table = await response.json()
      
      setTableName(table.name)
      setColumns(table.columns)
      setData(table.data)
      
      // Berechne nächste IDs
      if (table.columns.length > 0) {
        setNextColumnId(Math.max(...table.columns.map(c => c.id)) + 1)
      }
      if (table.data.length > 0) {
        setNextRowId(Math.max(...table.data.map(r => r.id)) + 1)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Fehler beim Laden:', error)
      alert('Fehler beim Laden der Tabelle: ' + error.message)
      navigate('/tabellen/overview')
    }
  }

  const formatValue = (value, type) => {
    if (!value || value === '') return value

    try {
      switch (type) {
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

  const getCellValue = (rowId, columnId) => {
    const row = data.find(r => r.id === rowId)
    return row ? (row[`col_${columnId}`] || '') : ''
  }

  const getDisplayValue = (rowId, columnId) => {
    const value = getCellValue(rowId, columnId)
    const column = columns.find(c => c.id === columnId)
    return formatValue(value, column?.type || 'string')
  }

  const setCellValue = (rowId, columnId, value) => {
    setData(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, [`col_${columnId}`]: value }
        : row
    ))
  }

  const handleCellClick = (rowId, columnId) => {
    setSelectedCell({ rowId, columnId })
    setEditingCell({ rowId, columnId })
  }

  const handleCellChange = (e) => {
    if (editingCell) {
      setCellValue(editingCell.rowId, editingCell.columnId, e.target.value)
    }
  }

  const handleCellBlur = () => {
    setEditingCell(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && editingCell) {
      setEditingCell(null)
      e.preventDefault()
      return
    }

    if (!selectedCell) return

    const { rowId, columnId } = selectedCell
    const rowIndex = data.findIndex(r => r.id === rowId)
    const colIndex = columns.findIndex(c => c.id === columnId)

    switch (e.key) {
      case 'Enter':
        if (editingCell) {
          setEditingCell(null)
          if (rowIndex < data.length - 1) {
            const nextRow = data[rowIndex + 1]
            setSelectedCell({ rowId: nextRow.id, columnId })
            setEditingCell({ rowId: nextRow.id, columnId })
          }
        } else {
          setEditingCell({ rowId, columnId })
        }
        e.preventDefault()
        break
      case 'Tab':
        setEditingCell(null)
        if (colIndex < columns.length - 1) {
          const nextCol = columns[colIndex + 1]
          setSelectedCell({ rowId, columnId: nextCol.id })
          setEditingCell({ rowId, columnId: nextCol.id })
        } else if (rowIndex < data.length - 1) {
          const nextRow = data[rowIndex + 1]
          const firstCol = columns[0]
          setSelectedCell({ rowId: nextRow.id, columnId: firstCol.id })
          setEditingCell({ rowId: nextRow.id, columnId: firstCol.id })
        }
        e.preventDefault()
        break
      case 'ArrowUp':
        if (!editingCell && rowIndex > 0) {
          const prevRow = data[rowIndex - 1]
          setSelectedCell({ rowId: prevRow.id, columnId })
        }
        break
      case 'ArrowDown':
        if (!editingCell && rowIndex < data.length - 1) {
          const nextRow = data[rowIndex + 1]
          setSelectedCell({ rowId: nextRow.id, columnId })
        }
        break
      case 'ArrowLeft':
        if (!editingCell && colIndex > 0) {
          const prevCol = columns[colIndex - 1]
          setSelectedCell({ rowId, columnId: prevCol.id })
        }
        break
      case 'ArrowRight':
        if (!editingCell && colIndex < columns.length - 1) {
          const nextCol = columns[colIndex + 1]
          setSelectedCell({ rowId, columnId: nextCol.id })
        }
        break
      default:
        if (!editingCell && e.key.length === 1) {
          setEditingCell({ rowId, columnId })
          setCellValue(rowId, columnId, e.key)
        }
    }
  }

  const addColumn = () => {
    const newColumn = {
      id: nextColumnId,
      name: `Spalte ${nextColumnId}`,
      type: 'string'
    }
    setColumns([...columns, newColumn])
    setNextColumnId(nextColumnId + 1)
  }

  const addRow = () => {
    const newRow = { id: nextRowId }
    setData([...data, newRow])
    setNextRowId(nextRowId + 1)
  }

  const updateColumnName = (columnId, newName) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, name: newName } : col
    ))
  }

  const updateColumnType = (columnId, newType) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, type: newType } : col
    ))
  }

  const deleteColumn = (columnId) => {
    if (columns.length === 1) {
      alert('Die letzte Spalte kann nicht gelöscht werden')
      return
    }
    setColumns(columns.filter(col => col.id !== columnId))
  }

  const deleteRow = (rowId) => {
    if (data.length === 1) {
      alert('Die letzte Zeile kann nicht gelöscht werden')
      return
    }
    setData(data.filter(row => row.id !== rowId))
  }

  const saveTable = async () => {
    try {
      const tableData = {
        name: tableName,
        columns: columns,
        data: data
      }

      const response = await fetch(`http://localhost:8000/api/tables/${tableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tableData)
      })

      if (!response.ok) {
        throw new Error('Speichern fehlgeschlagen')
      }

      const result = await response.json()
      alert(`✓ Tabelle "${tableName}" wurde aktualisiert!\n${result.row_count} Zeilen × ${result.column_count} Spalten`)
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      alert('Fehler beim Speichern: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Lade Tabelle...</p>
      </div>
    )
  }

  return (
    <div className="new-table" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="new-table-header">
        <div className="header-left">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/tabellen/overview')}
          >
            ← Zurück
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

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="row-number-header">#</th>
              {columns.map((column) => (
                <th key={column.id} className="column-header">
                  <div className="column-header-content">
                    <input
                      type="text"
                      className="column-name-input"
                      value={column.name}
                      onChange={(e) => updateColumnName(column.id, e.target.value)}
                    />
                    <select
                      className="column-type-select"
                      value={column.type}
                      onChange={(e) => updateColumnType(column.id, e.target.value)}
                      title="Datentyp"
                    >
                      {columnTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="delete-column-btn"
                      onClick={() => deleteColumn(column.id)}
                      title="Spalte löschen"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={row.id}>
                <td className="row-number">
                  <span>{rowIndex + 1}</span>
                  <button
                    className="delete-row-btn"
                    onClick={() => deleteRow(row.id)}
                    title="Zeile löschen"
                  >
                    ×
                  </button>
                </td>
                {columns.map((column) => {
                  const isSelected = selectedCell?.rowId === row.id && selectedCell?.columnId === column.id
                  const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id
                  
                  return (
                    <td
                      key={column.id}
                      className={`data-cell ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleCellClick(row.id, column.id)}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          className="cell-input"
                          value={getCellValue(row.id, column.id)}
                          onChange={handleCellChange}
                          onBlur={handleCellBlur}
                        />
                      ) : (
                        <span className="cell-content">
                          {getDisplayValue(row.id, column.id)}
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

      <div className="new-table-footer">
        <span className="table-info">
          {data.length} Zeilen × {columns.length} Spalten
        </span>
      </div>
    </div>
  )
}

export default TableEdit
