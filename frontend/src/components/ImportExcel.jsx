import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './ImportExcel.css'

function ImportExcel() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [expandedVersions, setExpandedVersions] = useState({}) // Für Versions-Anzeige
  const [fileVersions, setFileVersions] = useState({}) // Speichert geladene Versionen
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Bitte wähle eine Excel-Datei aus')
      return
    }

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/api/files/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload fehlgeschlagen')
      }

      const result = await response.json()
      
      // Speichere Dateiinfo für Excel-Viewer
      localStorage.setItem('currentExcelFile', JSON.stringify({
        id: result.id,
        filename: result.filename,
        displayName: result.display_name,
        baseName: result.base_name,
        version: result.version
      }))

      alert('Excel erfolgreich hochgeladen!')
      
      // Navigiere zum Excel-Viewer
      navigate('/excel-viewer')
      
    } catch (error) {
      console.error('Upload-Fehler:', error)
      alert('Fehler beim Hochladen: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const loadUploadedFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/files/list')
      const files = await response.json()
      setUploadedFiles(files)
    } catch (error) {
      console.error('Fehler beim Laden der Dateien:', error)
    }
  }

  const deleteFile = async (fileId, displayName) => {
    if (!confirm(`Möchtest du "${displayName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/files/${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen')
      }

      alert(`✓ "${displayName}" wurde gelöscht`)
      
      // Aktualisiere die Liste
      loadUploadedFiles()
      
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

  const openFile = (file) => {
    localStorage.setItem('currentExcelFile', JSON.stringify({
      id: file.id,
      filename: file.filename,
      displayName: file.display_name,
      baseName: file.base_name,
      version: file.version
    }))
    navigate('/excel-viewer')
  }

  React.useEffect(() => {
    loadUploadedFiles()
  }, [])

  return (
    <div className="import-excel">
      <div className="import-header">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/tabellen/overview')}
        >
          ← Zurück zur Übersicht
        </button>
        <h2>📊 Excel hochladen</h2>
      </div>

      <div className="upload-section">
        <div className="upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            id="file-upload"
            className="file-input"
          />
          <label htmlFor="file-upload" className="upload-label">
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              <strong>Excel-Datei auswählen</strong>
              <span>Klicken zum Durchsuchen</span>
            </div>
          </label>
        </div>

        {file && (
          <div className="file-selected">
            <div className="file-info">
              <span className="file-icon">📄</span>
              <span className="file-name">{file.name}</span>
              <span className="file-size">
                {(file.size / 1024).toFixed(2)} KB
              </span>
            </div>
            <button 
              className="btn btn-primary btn-large"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? '⏳ Wird hochgeladen...' : '✓ Hochladen & Öffnen'}
            </button>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-section">
          <h3>📂 Hochgeladene Dateien</h3>
          <div className="files-list">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="file-card-wrapper">
                <div className="file-card">
                  <div className="file-card-icon">📊</div>
                  <div className="file-card-info">
                    <div className="file-card-name">
                      {file.display_name}
                      <span className="version-badge">v{file.version}</span>
                    </div>
                    <div className="file-card-meta">
                      {(file.file_size / 1024).toFixed(2)} KB • {new Date(file.created_at).toLocaleString('de-DE')}
                    </div>
                  </div>
                  <div className="file-card-actions">
                    {file.version > 1 && (
                      <button 
                        className="btn btn-versions"
                        onClick={() => toggleVersions(file.base_name)}
                        title="Ältere Versionen anzeigen"
                      >
                        {expandedVersions[file.base_name] ? '▼' : '▶'} Versionen
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary"
                      onClick={() => openFile(file)}
                    >
                      Öffnen
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => deleteFile(file.id, file.display_name)}
                      title="Datei löschen"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Versionen-Liste */}
                {expandedVersions[file.base_name] && fileVersions[file.base_name] && (
                  <div className="versions-list">
                    <div className="versions-header">Ältere Versionen:</div>
                    {fileVersions[file.base_name]
                      .filter(v => v.id !== file.id) // Aktuelle Version ausblenden
                      .map((version) => (
                        <div key={version.id} className="version-item">
                          <div className="version-info">
                            <span className="version-badge-small">v{version.version}</span>
                            <span className="version-date">
                              {new Date(version.created_at).toLocaleString('de-DE')}
                            </span>
                            <span className="version-size">
                              {(version.file_size / 1024).toFixed(2)} KB
                            </span>
                          </div>
                          <div className="version-actions">
                            <button 
                              className="btn btn-small btn-secondary"
                              onClick={() => openFile(version)}
                            >
                              Öffnen
                            </button>
                            <button 
                              className="btn btn-small btn-danger"
                              onClick={() => deleteFile(version.id, `${version.display_name} v${version.version}`)}
                              title="Version löschen"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportExcel
