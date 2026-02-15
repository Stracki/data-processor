import { useState, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import './Sidebar.css'

function Sidebar() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [expandedItems, setExpandedItems] = useState({})
  const [currentContext, setCurrentContext] = useState(null)
  
  const projectId = searchParams.get('project')
  const cycleId = searchParams.get('cycle')
  const scope = searchParams.get('scope')

  useEffect(() => {
    // Lade Projekt-Info wenn projectId vorhanden
    if (projectId) {
      fetchProjectContext()
    } else {
      setCurrentContext(null)
    }
  }, [projectId, cycleId])

  const fetchProjectContext = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}`)
      const project = await response.json()
      
      let cycleName = null
      if (cycleId) {
        const cyclesResponse = await fetch(`http://localhost:8000/api/projects/${projectId}/cycles`)
        const cycles = await cyclesResponse.json()
        const cycle = cycles.find(c => c.id === parseInt(cycleId))
        cycleName = cycle?.name
      }
      
      setCurrentContext({
        project,
        cycleName,
        scope
      })
    } catch (error) {
      console.error('Fehler beim Laden des Kontexts:', error)
    }
  }

  const buildLinkWithContext = (path) => {
    if (!projectId) return path
    
    const params = new URLSearchParams()
    params.append('project', projectId)
    if (cycleId) params.append('cycle', cycleId)
    if (scope) params.append('scope', scope)
    
    return `${path}?${params.toString()}`
  }
  
  const menuItems = [
    { id: 'home', path: '/home', label: 'Home', icon: '🏠', noContext: true },
    { 
      id: 'tabellen', 
      label: 'Tabellen', 
      icon: '📊',
      subItems: [
        { id: 'tabellen-overview', path: '/tabellen/overview', label: 'Übersicht', icon: '📋' },
        { id: 'tabellen-new', path: '/tabellen/new', label: 'Neue Datentabelle', icon: '➕' },
        { id: 'tabellen-import', path: '/import', label: 'Excel hochladen', icon: '📥' },
        { id: 'tabellen-prozeduren', path: '/tabellen/prozeduren', label: 'Prozeduren', icon: '⚙️' }
      ]
    },
    { id: 'workflows', path: '/workflows', label: 'Workflows', icon: '🔄' }
  ]

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const isPathActive = (item) => {
    if (item.path) {
      return location.pathname === item.path
    }
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path)
    }
    return false
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Data Processor</h2>
        {currentContext && (
          <div className="current-context">
            <div className="context-project">
              <span className="context-icon">{currentContext.project.is_global ? '🌐' : '📂'}</span>
              <span className="context-name">{currentContext.project.name}</span>
            </div>
            {currentContext.cycleName && (
              <div className="context-cycle">
                <span className="context-icon">📅</span>
                <span className="context-name">{currentContext.cycleName}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <div key={item.id} className="sidebar-item-wrapper">
            {item.subItems ? (
              <>
                <button
                  className={`sidebar-item ${isPathActive(item) ? 'active' : ''}`}
                  onClick={() => toggleExpand(item.id)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                  <span className={`expand-icon ${expandedItems[item.id] ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedItems[item.id] && (
                  <div className="sidebar-submenu">
                    {item.subItems.map(subItem => (
                      <Link
                        key={subItem.id}
                        to={buildLinkWithContext(subItem.path)}
                        className={`sidebar-subitem ${location.pathname === subItem.path ? 'active' : ''}`}
                      >
                        <span className="sidebar-icon">{subItem.icon}</span>
                        <span className="sidebar-label">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link 
                to={item.noContext ? item.path : buildLinkWithContext(item.path)}
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
