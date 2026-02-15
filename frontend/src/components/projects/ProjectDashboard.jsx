import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProjectDashboard.css'

function ProjectDashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/projects/')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectClick = (project) => {
    // Speichere aktuelles Projekt im localStorage
    localStorage.setItem('currentProject', JSON.stringify(project))
    navigate(`/projects/${project.id}`)
  }

  if (loading) {
    return <div className="loading">Lade Projekte...</div>
  }

  const globalProject = projects.find(p => p.is_global)
  const regularProjects = projects.filter(p => !p.is_global)

  return (
    <div className="project-dashboard">
      <div className="dashboard-header">
        <h1>Projekte</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Neues Projekt
        </button>
      </div>

      {globalProject && (
        <div className="global-project-section">
          <h2>🌐 Global</h2>
          <div 
            className="project-card global"
            onClick={() => handleProjectClick(globalProject)}
          >
            <div className="project-icon">🌐</div>
            <div className="project-info">
              <h3>{globalProject.name}</h3>
              <p>{globalProject.description || 'Globale Ressourcen für alle Projekte'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="projects-section">
        <h2>Meine Projekte</h2>
        <div className="projects-grid">
          {regularProjects.map(project => (
            <div 
              key={project.id}
              className="project-card"
              onClick={() => handleProjectClick(project)}
            >
              <div className="project-icon">📂</div>
              <div className="project-info">
                <h3>{project.name}</h3>
                <p>{project.description || 'Keine Beschreibung'}</p>
                <div className="project-meta">
                  <span>Erstellt: {new Date(project.created_at).toLocaleDateString('de-DE')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <CreateProjectModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchProjects}
        />
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

export default ProjectDashboard
