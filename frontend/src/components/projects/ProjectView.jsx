import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './ProjectView.css'

function ProjectView() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState({})

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      const [projectRes, cyclesRes] = await Promise.all([
        fetch(`http://localhost:8000/api/projects/${projectId}`),
        fetch(`http://localhost:8000/api/projects/${projectId}/cycles`)
      ])
      
      const projectData = await projectRes.json()
      const cyclesData = await cyclesRes.json()
      
      setProject(projectData)
      setCycles(cyclesData)
      
      // Speichere aktuelles Projekt
      localStorage.setItem('currentProject', JSON.stringify(projectData))
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNextCycle = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/cycles`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchProjectData()
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Zyklus:', error)
    }
  }

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }))
  }

  if (loading) {
    return <div className="loading">Lade Projekt...</div>
  }

  if (!project) {
    return <div className="error">Projekt nicht gefunden</div>
  }

  return (
    <div className="project-view">
      <div className="project-header">
        <button className="back-button" onClick={() => navigate('/projects')}>
          ← Zurück zu Projekten
        </button>
        <div className="project-title">
          <h1>{project.is_global ? '🌐' : '📂'} {project.name}</h1>
          <p>{project.description}</p>
        </div>
        {!project.is_global && (
          <button className="btn-primary" onClick={createNextCycle}>
            ➕ Nächster Zyklus
          </button>
        )}
      </div>

      <div className="project-content">
        <div className="filesystem-view">
          <h2>Projektstruktur</h2>
          
          {/* Shared/Global Bereich */}
          <div className="folder-tree">
            <FolderItem
              name={project.is_global ? "Global" : "_shared"}
              icon="🌐"
              path={`/${project.name}/_shared`}
              expanded={expandedFolders[`/${project.name}/_shared`]}
              onToggle={() => toggleFolder(`/${project.name}/_shared`)}
              projectId={projectId}
              isGlobal={project.is_global}
            >
              <FileItem name="Prozeduren" icon="⚙️" type="procedures" projectId={projectId} scope="project" />
              <FileItem name="Workflows" icon="🔄" type="workflows" projectId={projectId} scope="project" />
              <FileItem name="Datentabellen" icon="📊" type="tables" projectId={projectId} scope="project" />
              <FileItem name="Globale Werte" icon="💎" type="global-values" projectId={projectId} />
            </FolderItem>

            {/* Zyklen */}
            {!project.is_global && cycles.map(cycle => (
              <FolderItem
                key={cycle.id}
                name={cycle.name}
                icon="📅"
                path={cycle.path}
                expanded={expandedFolders[cycle.path]}
                onToggle={() => toggleFolder(cycle.path)}
                projectId={projectId}
                cycleId={cycle.id}
              >
                {cycle.cycle_metadata?.subfolders?.map(subfolder => (
                  <FolderItem
                    key={subfolder}
                    name={subfolder}
                    icon="📁"
                    path={`${cycle.path}/${subfolder}`}
                    expanded={expandedFolders[`${cycle.path}/${subfolder}`]}
                    onToggle={() => toggleFolder(`${cycle.path}/${subfolder}`)}
                    isSubfolder
                  >
                    <FileItem name="Prozeduren" icon="⚙️" type="procedures" projectId={projectId} cycleId={cycle.id} scope="cycle" />
                    <FileItem name="Workflows" icon="🔄" type="workflows" projectId={projectId} cycleId={cycle.id} scope="cycle" />
                    <FileItem name="Datentabellen" icon="📊" type="tables" projectId={projectId} cycleId={cycle.id} scope="cycle" />
                  </FolderItem>
                ))}
              </FolderItem>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FolderItem({ name, icon, path, expanded, onToggle, children, isSubfolder, projectId, cycleId, isGlobal }) {
  return (
    <div className={`folder-item ${isSubfolder ? 'subfolder' : ''}`}>
      <div className="folder-header" onClick={onToggle}>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
        <span className="folder-icon">{icon}</span>
        <span className="folder-name">{name}</span>
      </div>
      {expanded && (
        <div className="folder-content">
          {children}
        </div>
      )}
    </div>
  )
}

function FileItem({ name, icon, type, projectId, cycleId, scope }) {
  const navigate = useNavigate()

  const handleClick = () => {
    // Navigiere zur entsprechenden Ansicht mit Kontext
    const params = new URLSearchParams()
    if (projectId) params.append('project', projectId)
    if (cycleId) params.append('cycle', cycleId)
    if (scope) params.append('scope', scope)
    
    navigate(`/${type}?${params.toString()}`)
  }

  return (
    <div className="file-item" onClick={handleClick}>
      <span className="file-icon">{icon}</span>
      <span className="file-name">{name}</span>
    </div>
  )
}

export default ProjectView
