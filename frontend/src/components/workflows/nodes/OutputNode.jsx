import React, { useState, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import './NodeStyles.css'

// Erweiterbare Output-Aktionen
const OUTPUT_ACTIONS = {
  'save_table': {
    label: 'Als Tabelle speichern',
    icon: '💾',
    fields: ['name', 'project'],
    description: 'Speichert das Ergebnis als neue Datentabelle'
  },
  'display': {
    label: 'Anzeigen',
    icon: '👁️',
    fields: ['name'],
    description: 'Zeigt das Ergebnis direkt an (zukünftig)'
  },
  'export_csv': {
    label: 'Als CSV exportieren',
    icon: '📄',
    fields: ['filename'],
    description: 'Exportiert als CSV-Datei (zukünftig)'
  },
  'export_excel': {
    label: 'Als Excel exportieren',
    icon: '📊',
    fields: ['filename'],
    description: 'Exportiert als Excel-Datei (zukünftig)'
  },
  'export_pdf': {
    label: 'Als PDF exportieren',
    icon: '📑',
    fields: ['filename', 'template'],
    description: 'Exportiert als PDF-Datei (zukünftig)'
  }
}

export default function OutputNode({ data, id }) {
  const [action, setAction] = useState(data.action || 'save_table')
  const [name, setName] = useState(data.name || 'result')
  const [filename, setFilename] = useState(data.filename || 'export')
  const [project, setProject] = useState(data.project || '')
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetchProjects()
    updateSchema()
  }, [])

  useEffect(() => {
    updateSchema()
  }, [action])

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const updateSchema = () => {
    data.schema = {
      inputs: [{ id: 'input', label: 'Input', type: 'Any', required: true, default: null }],
      outputs: []
    }
  }

  const handleActionChange = (e) => {
    const newAction = e.target.value
    setAction(newAction)
    data.action = newAction
  }

  const handleNameChange = (e) => {
    const newName = e.target.value
    setName(newName)
    data.name = newName
    data.label = newName
  }

  const handleFilenameChange = (e) => {
    const newFilename = e.target.value
    setFilename(newFilename)
    data.filename = newFilename
  }

  const handleProjectChange = (e) => {
    const newProject = e.target.value
    setProject(newProject)
    data.project = newProject
  }

  const currentAction = OUTPUT_ACTIONS[action]
  const isImplemented = action === 'save_table'

  return (
    <div className="custom-node output-node">
      <div className="node-header">
        <span className="node-icon">📤</span>
        <span className="node-title">Output</span>
      </div>
      <div className="node-content">
        <div className="output-action-select">
          <label className="output-label">Aktion:</label>
          <select 
            value={action} 
            onChange={handleActionChange}
            className="node-select"
          >
            {Object.entries(OUTPUT_ACTIONS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>

        {!isImplemented && (
          <div className="node-info">
            ⚠️ {currentAction.description}
          </div>
        )}

        {/* Dynamische Felder basierend auf Aktion */}
        {currentAction.fields.includes('name') && (
          <div className="output-field">
            <label className="output-label">Name:</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Ergebnis-Name..."
              className="node-input"
            />
          </div>
        )}

        {currentAction.fields.includes('filename') && (
          <div className="output-field">
            <label className="output-label">Dateiname:</label>
            <input
              type="text"
              value={filename}
              onChange={handleFilenameChange}
              placeholder="dateiname"
              className="node-input"
            />
          </div>
        )}

        {currentAction.fields.includes('project') && (
          <div className="output-field">
            <label className="output-label">Projekt:</label>
            <select 
              value={project} 
              onChange={handleProjectChange}
              className="node-select"
            >
              <option value="">Kein Projekt</option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {currentAction.fields.includes('template') && (
          <div className="output-field">
            <label className="output-label">Template:</label>
            <select className="node-select">
              <option value="">Standard</option>
              <option value="report">Report</option>
              <option value="invoice">Rechnung</option>
            </select>
          </div>
        )}
      </div>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="input"
        style={{ background: '#f44336' }}
      />
    </div>
  )
}
