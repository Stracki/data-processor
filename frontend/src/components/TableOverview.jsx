import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Breadcrumb from './Breadcrumb'
import './TableOverview.css'

function TableOverview() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tables, setTables] = useState([])
  const [excelFiles, setExcelFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tables') // 'tables' or 'excel'
  const [expandedVersions, setExpandedVersions] = useState({}) // Für Versions-Anzeige
  const [fileVersions, setFileVersions] = useState({}) // Speichert geladene Versionen
  
  const projectId = searchParams.get('project')
  const cycleId = searchParams.get('cycle')

  useEffect(() => {
    loadData()
  }, [projectId, cycleId])

  const loadData = async () => {
    try {
      // Lade Datentabellen mit Projekt-Filter
      const tablesParams = new URLSearchParams()
      if (projectId) tablesParams.append('project_id', projectId)
      
      const tablesResponse = await fetch(`http://localhost:8000/api/tables/?${tablesParams.toString()}`)
      if (tablesResponse.ok) {
        const tablesData = await tablesResponse.json()
        setTables(tablesData)
      }

      // Lade Excel-Dateien mit Projekt-Filter
      const excelParams = new URLSearchParams()
      if (projectId) excelParams.append('project_id', projectId)
      
      const excelResponse = await fetch(`http://localhost:8000/api/files/list?${excelParams.toString()}`)
      if (excelResponse.ok) {
        const excelData = await excelResponse.json()
        setExcelFiles(excelData)
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error)
      alert('Fehler beim Laden der Daten: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTable = (tableId) => {
    navigate(`/tabellen/edit/${tableId}`)
  }

  const handleDeleteTable = async (tableId, tableName) => {
    if (!confirm(`Möchtest du die Tabelle "${tableName}" wirklich löschen?`)) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/tables/${tableId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen')
      }

      alert(`✓ Tabelle "${tableName}" wurde gelöscht`)
      loadData() // Neu laden
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      alert('Fehler beim Löschen: ' + error.message)
    }
  }

  const handleOpenExcel = (file) => {
    localStorage.setItem('currentExcelFile', JSON.stringify({
      id: file.id,
      filename: file.filename,
      displayName: file.display_name,
      baseName: file.base_name,
      version: file.version
    }))
    navigate('/excel-viewer')
  }

  const handleDeleteExcel = async (fileId, fileName) => {
    if (!confirm(`Möchtest du die Excel-Datei "${fileName}" wirklich löschen?`)) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/files/${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen')
      }

      alert(`✓ Excel-Datei "${fileName}" wurde gelöscht`)
      loadData() // Neu laden
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      alert('Fehler beim Löschen: ' + error.message)
    }
  }

  const toggleVersions = async (baseName) => {
    // Wenn bereits expanded, collapse
    if (expandedVersions[baseName]) {
      setExpandedVersions(prev => ({ ...prev, [baseName]: false }))
      return
    }

    // Lade Versionen falls noch nicht geladen
    if (!fileVersions[baseName]) {
      try {
        const response = await fetch(`http://localhost:8000/api/files/versions/${baseName}`)
        if (!response.ok) {
          throw new Error('Versionen konnten nicht geladen werden')
        }
        const versions = await response.json()
        setFileVersions(prev => ({ ...prev, [baseName]: versions }))
      } catch (error) {
        console.error('Fehler beim Laden der Versionen:', error)
        alert('Fehler beim Laden der Versionen: ' + error.message)
        return
      }
    }

    // Expand
    setExpandedVersions(prev => ({ ...prev, [baseName]: true }))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="table-overview">
      <Breadcrumb />
      <div className="table-overview-content">
        <div className="overview-header">
          <h1>📊 Daten-Übersicht</h1>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/import')}
            >
              📥 Excel hochladen
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/tabellen/new')}
            >
              ➕ Neue Datentabelle
            </button>
          </div>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'tables' ? 'active' : ''}`}
              onClick={() => setActiveTab('tables')}
            >
              📋 Datentabellen ({tables.length})
            </button>
            <button 
              className={`tab ${activeTab === 'excel' ? 'active' : ''}`}
              onClick={() => setActiveTab('excel')}
            >
              📊 Excel-Dateien ({excelFiles.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">⏳</div>
            <p>Lade Daten...</p>
          </div>
        ) : (
          <>
            {activeTab === 'tables' && (
            tables.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h2>Keine Datentabellen vorhanden</h2>
                <p>Erstelle deine erste Datentabelle oder importiere Daten aus Excel</p>
                <div className="empty-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/tabellen/new')}
                  >
                    ➕ Neue Tabelle erstellen
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigate('/import')}
                  >
                    📥 Excel importieren
                  </button>
                </div>
              </div>
            ) : (
              <div className="tables-grid">
                {tables.map(table => (
                  <div key={table.id} className="table-card">
                    <div className="table-card-header">
                      <h3>{table.name}</h3>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTable(table.id, table.name)
                        }}
                        title="Löschen"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="table-card-body">
                      <div className="table-stats">
                        <div className="stat">
                          <span className="stat-icon">📊</span>
                          <span className="stat-value">{table.row_count}</span>
                          <span className="stat-label">Zeilen</span>
                        </div>
                        <div className="stat">
                          <span className="stat-icon">📋</span>
                          <span className="stat-value">{table.column_count}</span>
                          <span className="stat-label">Spalten</span>
                        </div>
                      </div>
                      <div className="table-meta">
                        <div className="meta-item">
                          <span className="meta-label">Erstellt:</span>
                          <span className="meta-value">{formatDate(table.created_at)}</span>
                        </div>
                        {table.updated_at && (
                          <div className="meta-item">
                            <span className="meta-label">Aktualisiert:</span>
                            <span className="meta-value">{formatDate(table.updated_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="table-card-footer">
                      <button
                        className="btn btn-primary btn-block"
                        onClick={() => handleOpenTable(table.id)}
                      >
                        Öffnen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'excel' && (
            excelFiles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h2>Keine Excel-Dateien vorhanden</h2>
                <p>Lade deine erste Excel-Datei hoch</p>
                <div className="empty-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/import')}
                  >
                    📥 Excel hochladen
                  </button>
                </div>
              </div>
            ) : (
              <div className="tables-grid">
                {excelFiles.map(file => (
                  <div key={file.id} className="table-card excel-card">
                    <div className="table-card-header excel-header">
                      <h3>{file.display_name}</h3>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteExcel(file.id, file.display_name)
                        }}
                        title="Löschen"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="table-card-body">
                      <div className="table-stats">
                        <div className="stat">
                          <span className="stat-icon">📄</span>
                          <span className="stat-value">v{file.version}</span>
                          <span className="stat-label">Version</span>
                        </div>
                        <div className="stat">
                          <span className="stat-icon">💾</span>
                          <span className="stat-value">{formatFileSize(file.file_size)}</span>
                          <span className="stat-label">Größe</span>
                        </div>
                      </div>
                      <div className="table-meta">
                        <div className="meta-item">
                          <span className="meta-label">Erstellt:</span>
                          <span className="meta-value">{formatDate(file.created_at)}</span>
                        </div>
                        {file.updated_at && (
                          <div className="meta-item">
                            <span className="meta-label">Aktualisiert:</span>
                            <span className="meta-value">{formatDate(file.updated_at)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Versionen-Button */}
                      {file.version > 1 && (
                        <div className="versions-section">
                          <button
                            className="versions-toggle-btn"
                            onClick={() => toggleVersions(file.base_name)}
                          >
                            {expandedVersions[file.base_name] ? '▼' : '▶'} 
                            {file.version} Version{file.version > 1 ? 'en' : ''}
                          </button>
                          
                          {expandedVersions[file.base_name] && fileVersions[file.base_name] && (
                            <div className="versions-list">
                              {fileVersions[file.base_name].map(version => (
                                <div key={version.id} className="version-item">
                                  <div className="version-info">
                                    <span className="version-badge">v{version.version}</span>
                                    <span className="version-date">{formatDate(version.created_at)}</span>
                                    <span className="version-size">{formatFileSize(version.file_size)}</span>
                                  </div>
                                  <button
                                    className="version-open-btn"
                                    onClick={() => handleOpenExcel(version)}
                                  >
                                    Öffnen
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="table-card-footer">
                      <button
                        className="btn btn-primary btn-block"
                        onClick={() => handleOpenExcel(file)}
                      >
                        Öffnen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
      </div>
    </div>
  )
}

export default TableOverview
