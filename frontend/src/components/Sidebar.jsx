import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

function Sidebar() {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState({})
  
  const menuItems = [
    { id: 'home', path: '/', label: 'Projekte', icon: '🏠' },
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
                        to={subItem.path}
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
                to={item.path} 
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
