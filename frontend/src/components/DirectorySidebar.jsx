import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './DirectorySidebar.css'

function DirectorySidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentPath, setCurrentPath] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentProject, setCurrentProject] = useState(null)
  const [currentCycle, setCurrentCycle] = useState(null)

  useEffect(() => {
    // Parse current path from URL
    const path = parsePathFromLocation()
    setCurrentPath(path)
    loadDirectory(path)
  }, [location])

  const parsePathFromLocation = () => {
    // Extrahiere Pfad aus URL
    const pathname = location.pathname
    const searchParams = new URLSearchParams(location.search)
    
    const projectId = searchParams.get('project')
    const cycleId = searchParams.get('cycle')
    const folder = searchParams.get('folder')
    
    // Wenn keine Parameter, dann Root
    if (!projectId && (pathname === '/home' || pathname === '/')) {
      return []
    }
    
    const path = []
    if (projectId) path.push({ type: 'project', id: projectId })
    if (cycleId) path.push({ type: 'cycle', id: cycleId })
    if (folder) path.push({ type: 'folder', name: folder })
    
    return path
  }

  const loadDirectory = async (path) => {
    setLoading(true)
    try {
      if (path.length === 0) {
        // Root: Zeige alle Projekte
        await loadProjects()
      } else if (path[path.length - 1].type === 'project') {
        // In Projekt: Zeige Ressourcen + Zyklen
        await loadProjectContents(path[path.length - 1].id)
      } else if (path[path.length - 1].type === 'cycle') {
        // In Zyklus: Zeige Unterordner
        await loadCycleContents(path[path.length - 1].id)
      } else if (path[path.length - 1].type === 'folder') {
        // In Unterordner: Zeige Ressourcen
        await loadFolderContents(path)
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    const response = await fetch('http://localhost:8000/api/projects/')
    const projects = await response.json()
    
    // Reset Projekt/Zyklus-Info wenn in Root
    setCurrentProject(null)
    setCurrentCycle(null)
    
    setItems(projects.map(p => ({
      type: 'project',
      id: p.id,
      name: p.name,
      icon: p.is_global ? '🌐' : '📂',
      isGlobal: p.is_global
    })))
  }

  const loadProjectContents = async (projectId) => {
    const [projectRes, cyclesRes] = await Promise.all([
      fetch(`http://localhost:8000/api/projects/${projectId}`),
      fetch(`http://localhost:8000/api/projects/${projectId}/cycles`)
    ])
    
    const project = await projectRes.json()
    const cycles = await cyclesRes.json()
    
    // Speichere Projekt-Info für Anzeige
    setCurrentProject(project)
    
    const contents = [
      { type: 'resource', name: 'Prozeduren', icon: '⚙️', resource: 'procedures' },
      { type: 'resource', name: 'Workflows', icon: '🔄', resource: 'workflows' },
      { type: 'resource', name: 'Datentabellen', icon: '📊', resource: 'tables' }
    ]
    
    if (project.is_global) {
      contents.push({ type: 'resource', name: 'Globale Werte', icon: '💎', resource: 'global-values' })
    }
    
    // Füge Zyklen hinzu
    cycles.forEach(cycle => {
      contents.push({
        type: 'cycle',
        id: cycle.id,
        name: cycle.name,
        icon: '📅',
        metadata: cycle.cycle_metadata
      })
    })
    
    // Füge "Nächster Zyklus" Button hinzu (wenn nicht global)
    if (!project.is_global) {
      contents.push({
        type: 'action',
        name: 'Nächster Zyklus',
        icon: '➕',
        action: 'create-cycle'
      })
    }
    
    setItems(contents)
  }

  const loadCycleContents = async (cycleId) => {
    const projectId = currentPath.find(p => p.type === 'project')?.id
    const cyclesRes = await fetch(`http://localhost:8000/api/projects/${projectId}/cycles`)
    const cycles = await cyclesRes.json()
    const cycle = cycles.find(c => c.id === parseInt(cycleId))
    
    // Speichere Zyklus-Info für Anzeige
    setCurrentCycle(cycle)
    
    const subfolders = cycle?.cycle_metadata?.subfolders || ['Input', 'Konfiguration', 'Output']
    
    setItems(subfolders.map(folder => ({
      type: 'folder',
      name: folder,
      icon: '📁'
    })))
  }

  const loadFolderContents = async (path) => {
    // In Unterordner: Zeige Ressourcen
    setItems([
      { type: 'resource', name: 'Datentabellen', icon: '📊', resource: 'tables' },
      { type: 'resource', name: 'Workflow-Ausführungen', icon: '▶️', resource: 'executions' }
    ])
  }

  const handleItemClick = async (item) => {
    if (item.type === 'project') {
      // Navigiere ins Projekt
      navigate(`/home?project=${item.id}`)
    } else if (item.type === 'cycle') {
      // Navigiere in Zyklus
      const projectId = currentPath.find(p => p.type === 'project')?.id
      navigate(`/home?project=${projectId}&cycle=${item.id}`)
    } else if (item.type === 'folder') {
      // Navigiere in Unterordner
      const projectId = currentPath.find(p => p.type === 'project')?.id
      const cycleId = currentPath.find(p => p.type === 'cycle')?.id
      navigate(`/home?project=${projectId}&cycle=${cycleId}&folder=${item.name}`)
    } else if (item.type === 'resource') {
      // Öffne Ressource
      const projectId = currentPath.find(p => p.type === 'project')?.id
      const cycleId = currentPath.find(p => p.type === 'cycle')?.id
      const folder = currentPath.find(p => p.type === 'folder')?.name
      
      const params = new URLSearchParams()
      if (projectId) params.append('project', projectId)
      if (cycleId) params.append('cycle', cycleId)
      if (folder) params.append('folder', folder)
      
      const scope = cycleId ? 'cycle' : 'project'
      params.append('scope', scope)
      
      navigate(`/${item.resource}?${params.toString()}`)
    } else if (item.type === 'action' && item.action === 'create-cycle') {
      // Erstelle nächsten Zyklus
      const projectId = currentPath.find(p => p.type === 'project')?.id
      await createNextCycle(projectId)
    }
  }

  const createNextCycle = async (projectId) => {
    try {
      await fetch(`http://localhost:8000/api/projects/${projectId}/cycles`, {
        method: 'POST'
      })
      loadDirectory(currentPath)
    } catch (error) {
      console.error('Fehler beim Erstellen:', error)
    }
  }

  const handleBack = () => {
    if (currentPath.length === 0) return
    
    const newPath = currentPath.slice(0, -1)
    
    if (newPath.length === 0) {
      navigate('/home')
    } else if (newPath[newPath.length - 1].type === 'project') {
      navigate(`/home?project=${newPath[newPath.length - 1].id}`)
    } else if (newPath[newPath.length - 1].type === 'cycle') {
      const projectId = newPath.find(p => p.type === 'project')?.id
      const cycleId = newPath[newPath.length - 1].id
      navigate(`/home?project=${projectId}&cycle=${cycleId}`)
    }
  }

  const getCurrentName = () => {
    if (currentPath.length === 0) return 'Root'
    
    const last = currentPath[currentPath.length - 1]
    
    // Zeige echte Namen statt IDs
    if (last.type === 'project' && currentProject) {
      return currentProject.name
    } else if (last.type === 'cycle' && currentCycle) {
      return currentCycle.name
    } else if (last.type === 'folder') {
      return last.name
    }
    
    return last.name || `${last.type} ${last.id}`
  }

  return (
    <aside className="directory-sidebar">
      <div className="sidebar-header">
        <h2>Data Processor</h2>
      </div>

      <div className="sidebar-navigation">
        {currentPath.length > 0 && (
          <button className="back-button" onClick={handleBack}>
            ← Zurück
          </button>
        )}
        
        <div className="current-location">
          <span className="location-icon">📍</span>
          <span className="location-name">{getCurrentName()}</span>
        </div>
      </div>

      <nav className="sidebar-content">
        {loading ? (
          <div className="sidebar-loading">Lade...</div>
        ) : (
          <div className="directory-items">
            {items.map((item, index) => (
              <div
                key={index}
                className={`directory-item ${item.type}`}
                onClick={() => handleItemClick(item)}
              >
                <span className="item-icon">{item.icon}</span>
                <span className="item-name">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </nav>
    </aside>
  )
}

export default DirectorySidebar
