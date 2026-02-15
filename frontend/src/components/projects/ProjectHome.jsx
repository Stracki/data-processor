import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../Breadcrumb'
import './ProjectHome.css'

function ProjectHome() {
  const [projects, setProjects] = useState([])
  const [cycles, setCycles] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState({})
  const [expandedCycles, setExpandedCycles] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Prüfe ob ein Projekt ausgewählt ist
  const selectedProjectId = searchParams.get('project')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/projects/')
      const projectsData = await response.json()
      setProjects(projectsData)
      
      // Lade Zyklen für jedes Projekt
      const cyclesData = {}
      for (const project of projectsData) {
        if (!project.is_global) {
          const cyclesRes = await fetch(`http://localhost:8000/api/projects/${project.id}/cycles`)
          cyclesData[project.id] = await cyclesRes.json()
        }
      }
      setCycles(cyclesData)
      
      // Expandiere Global standardmäßig
      const globalProject = projectsData.find(p => p.is_global)
      if (globalProject) {
        setExpandedProjects({ [globalProject.id]: true })
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
  }

  const toggleCycle = (cycleId) => {
    setExpandedCycles(prev => ({
      ...prev,
      [cycleId]: !prev[cycleId]
    }))
  }

  const createNextCycle = async (projectId) => {
    try {
      await fetch(`http://localhost:8000/api/projects/${projectId}/cycles`, {
        method: 'POST'
      })
      fetchData()
    } catch (error) {
      console.error('Fehler beim Erstellen:', error)
    }
  }

  const navigateToResource = (type, projectId, cycleId = null, scope = 'project') => {
    const params = new URLSearchParams()
    params.append('project', projectId)
    if (cycleId) params.append('cycle', cycleId)
    params.append('scope', scope)
    
    navigate(`/${type}?${params.toString()}`)
  }

  if (loading) {
    return <div className="loading">Lade Projekte...</div>
  }

  // Wenn ein Projekt ausgewählt ist, zeige Projekt-Detailseite
  if (selectedProjectId) {
    const project = projects.find(p => p.id === parseInt(selectedProjectId))
    if (project) {
      const selectedCycleId = searchParams.get('cycle')
      
      // Wenn auch ein Zyklus ausgewählt ist, zeige Zyklus-Detailseite
      if (selectedCycleId) {
        const projectCycles = cycles[project.id] || []
        const cycle = projectCycles.find(c => c.id === parseInt(selectedCycleId))
        if (cycle) {
          return (
            <CycleDetailView
              project={project}
              cycle={cycle}
              onRefresh={fetchData}
            />
          )
        }
      }
      
      // Sonst zeige Projekt-Detailseite
      return (
        <ProjectDetailView 
          project={project}
          cycles={cycles[project.id] || []}
          onBack={() => navigate('/home')}
          onCreateCycle={() => createNextCycle(project.id)}
          onRefresh={fetchData}
        />
      )
    }
  }

  const globalProject = projects.find(p => p.is_global)
  const regularProjects = projects.filter(p => !p.is_global)

  return (
    <div className="project-home">
      <div className="home-header">
        <h1>📁 Projekt-Verwaltung</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ Neues Projekt
        </button>
      </div>

      <div className="project-tree">
        {/* Global Projekt */}
        {globalProject && (
          <ProjectTreeItem
            project={globalProject}
            expanded={expandedProjects[globalProject.id]}
            onToggle={() => toggleProject(globalProject.id)}
            onNavigate={navigateToResource}
          />
        )}

        {/* Reguläre Projekte */}
        {regularProjects.map(project => (
          <ProjectTreeItem
            key={project.id}
            project={project}
            cycles={cycles[project.id] || []}
            expanded={expandedProjects[project.id]}
            expandedCycles={expandedCycles}
            onToggle={() => toggleProject(project.id)}
            onToggleCycle={toggleCycle}
            onNavigate={navigateToResource}
            onCreateCycle={() => createNextCycle(project.id)}
          />
        ))}
      </div>

      {showCreateModal && (
        <CreateProjectModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  )
}

// Neue Komponente: Projekt-Detailseite
function ProjectDetailView({ project, cycles, onBack, onCreateCycle, onRefresh }) {
  const navigate = useNavigate()
  
  // Finde den aktuellsten Zyklus
  const currentCycle = cycles.length > 0 ? cycles[cycles.length - 1] : null

  const handleCurrentCycle = () => {
    if (currentCycle) {
      navigate(`/home?project=${project.id}&cycle=${currentCycle.id}`)
    } else {
      alert('Kein Zyklus vorhanden. Bitte erstelle zuerst einen Zyklus.')
    }
  }

  const handleCreateCycle = async () => {
    await onCreateCycle()
    onRefresh()
  }

  return (
    <div className="project-detail-view">
      <Breadcrumb />
      
      <div className="detail-content">
        <div className="project-info">
          <div className="project-icon">
            {project.is_global ? '🌐' : '📂'}
          </div>
          <h1>{project.name}</h1>
          {project.description && (
            <p className="project-description">{project.description}</p>
          )}
        </div>

        <div className="project-stats">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <div className="stat-value">{cycles.length}</div>
              <div className="stat-label">Zyklen</div>
            </div>
          </div>
          
          {currentCycle && (
            <div className="stat-card">
              <div className="stat-icon">🔄</div>
              <div className="stat-info">
                <div className="stat-value">{currentCycle.name}</div>
                <div className="stat-label">Aktueller Zyklus</div>
              </div>
            </div>
          )}
        </div>

        <div className="project-actions">
          <button 
            className="btn-action btn-primary"
            onClick={handleCurrentCycle}
            disabled={!currentCycle}
          >
            📅 Aktueller Zyklus
          </button>
          
          <button 
            className="btn-action btn-secondary"
            onClick={handleCreateCycle}
          >
            ➕ Nächster Zyklus anlegen
          </button>
        </div>

        {/* Platzhalter für zukünftige Stammdaten */}
        <div className="project-metadata-placeholder">
          <h3>Stammdaten</h3>
          <p className="placeholder-text">
            Hier werden zukünftig Projekt-Stammdaten angezeigt (Kontakte, Adressen, etc.)
          </p>
        </div>
      </div>
    </div>
  )
}

// Neue Komponente: Zyklus-Detailseite
function CycleDetailView({ project, cycle, onRefresh }) {
  const navigate = useNavigate()
  const subfolders = cycle.cycle_metadata?.subfolders || ['Input', 'Konfiguration', 'Output']

  const handleFolderClick = (folder) => {
    navigate(`/home?project=${project.id}&cycle=${cycle.id}&folder=${folder}`)
  }

  return (
    <div className="cycle-detail-view">
      <Breadcrumb />
      
      <div className="detail-content">
        <div className="cycle-info">
          <div className="cycle-icon">📅</div>
          <h1>{cycle.name}</h1>
          <p className="cycle-project">Projekt: {project.name}</p>
        </div>

        <div className="cycle-folders">
          <h3>Unterordner</h3>
          <div className="folder-grid">
            {subfolders.map(folder => (
              <div 
                key={folder}
                className="folder-card"
                onClick={() => handleFolderClick(folder)}
              >
                <div className="folder-icon">📁</div>
                <div className="folder-name">{folder}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Platzhalter für zukünftige Zyklus-Informationen */}
        <div className="cycle-metadata-placeholder">
          <h3>Zyklus-Informationen</h3>
          <p className="placeholder-text">
            Hier werden zukünftig Zyklus-spezifische Informationen angezeigt
          </p>
        </div>
      </div>
    </div>
  )
}

function ProjectTreeItem({ 
  project, 
  cycles = [], 
  expanded, 
  expandedCycles = {},
  onToggle, 
  onToggleCycle,
  onNavigate,
  onCreateCycle 
}) {
  const navigate = useNavigate()

  const handleProjectClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/home?project=${project.id}`)
  }

  return (
    <div className="tree-item">
      <div className="tree-node project-node" onClick={onToggle}>
        <span className="expand-icon">
          {expanded ? '▼' : '▶'}
        </span>
        <span className="node-icon">{project.is_global ? '🌐' : '📂'}</span>
        <button 
          className="node-name-button" 
          onClick={handleProjectClick}
          type="button"
        >
          {project.name}
        </button>
        {project.description && <span className="node-description">{project.description}</span>}
      </div>

      {expanded && (
        <div className="tree-children">
          {/* Ressourcen direkt unter Projekt */}
          <div 
            className="tree-node resource-node"
            onClick={() => onNavigate('procedures', project.id, null, project.is_global ? 'global' : 'project')}
          >
            <span className="node-icon">⚙️</span>
            <span className="node-name">Prozeduren</span>
          </div>
          <div 
            className="tree-node resource-node"
            onClick={() => onNavigate('workflows', project.id, null, project.is_global ? 'global' : 'project')}
          >
            <span className="node-icon">🔄</span>
            <span className="node-name">Workflows</span>
          </div>
          <div 
            className="tree-node resource-node"
            onClick={() => onNavigate('tables', project.id, null, project.is_global ? 'global' : 'project')}
          >
            <span className="node-icon">📊</span>
            <span className="node-name">Datentabellen</span>
          </div>
          {project.is_global && (
            <div 
              className="tree-node resource-node"
              onClick={() => onNavigate('global-values', project.id)}
            >
              <span className="node-icon">💎</span>
              <span className="node-name">Globale Werte</span>
            </div>
          )}

          {/* Zyklen */}
          {!project.is_global && (
            <>
              {cycles.map(cycle => (
                <CycleTreeItem
                  key={cycle.id}
                  cycle={cycle}
                  projectId={project.id}
                  expanded={expandedCycles[cycle.id]}
                  onToggle={() => onToggleCycle(cycle.id)}
                  onNavigate={onNavigate}
                />
              ))}
              
              <div className="tree-node action-node" onClick={onCreateCycle}>
                <span className="node-icon">➕</span>
                <span className="node-name">Nächster Zyklus</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function CycleTreeItem({ cycle, projectId, expanded, onToggle, onNavigate }) {
  const navigate = useNavigate()
  const subfolders = cycle.cycle_metadata?.subfolders || ['Input', 'Konfiguration', 'Output']
  
  const handleCycleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/home?project=${projectId}&cycle=${cycle.id}`)
  }

  const handleFolderClick = (folder) => {
    navigate(`/home?project=${projectId}&cycle=${cycle.id}&folder=${folder}`)
  }

  return (
    <div className="tree-item">
      <div className="tree-node cycle-node" onClick={onToggle}>
        <span className="expand-icon">
          {expanded ? '▼' : '▶'}
        </span>
        <span className="node-icon">📅</span>
        <button 
          className="node-name-button" 
          onClick={handleCycleClick}
          type="button"
        >
          {cycle.name}
        </button>
      </div>

      {expanded && (
        <div className="tree-children">
          {subfolders.map(subfolder => (
            <div 
              key={subfolder} 
              className="tree-node folder-node"
              onClick={() => handleFolderClick(subfolder)}
            >
              <span className="node-icon">📁</span>
              <span className="node-name">{subfolder}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateProjectModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cycleType: 'yearly'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('http://localhost:8000/api/projects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          is_global: false,
          cycle_config: {
            cycleType: formData.cycleType,
            cyclePattern: formData.cycleType === 'yearly' ? 'Jahr_{year}' : 
                         formData.cycleType === 'quarterly' ? 'Q{quarter}_{year}' :
                         'Monat_{month}_{year}',
            subfolders: ['01_Eingangsdaten', '02_Verarbeitung', '03_Ausgabe', '04_Archiv'],
            autoCreateSubfolders: true
          }
        })
      })

      if (response.ok) {
        onCreated()
        onClose()
      }
    } catch (error) {
      console.error('Fehler beim Erstellen:', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Neues Projekt erstellen</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Projektname *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Zyklustyp</label>
            <select
              value={formData.cycleType}
              onChange={e => setFormData({...formData, cycleType: e.target.value})}
            >
              <option value="yearly">Jährlich</option>
              <option value="quarterly">Quartalsweise</option>
              <option value="monthly">Monatlich</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn-primary">
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectHome
