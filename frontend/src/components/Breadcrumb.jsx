import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './Breadcrumb.css'

function Breadcrumb() {
  const [searchParams] = useSearchParams()
  const [breadcrumbs, setBreadcrumbs] = useState([])
  
  const projectId = searchParams.get('project')
  const cycleId = searchParams.get('cycle')
  const folder = searchParams.get('folder')

  useEffect(() => {
    if (projectId) {
      fetchBreadcrumbs()
    } else {
      setBreadcrumbs([])
    }
  }, [projectId, cycleId, folder])

  const fetchBreadcrumbs = async () => {
    try {
      const crumbs = []
      
      // Projekt laden
      const projectRes = await fetch(`http://localhost:8000/api/projects/${projectId}`)
      const project = await projectRes.json()
      crumbs.push({
        icon: project.is_global ? '🌐' : '📂',
        name: project.name,
        link: `/home?project=${projectId}`
      })
      
      // Zyklus laden
      if (cycleId) {
        const cyclesRes = await fetch(`http://localhost:8000/api/projects/${projectId}/cycles`)
        const cycles = await cyclesRes.json()
        const cycle = cycles.find(c => c.id === parseInt(cycleId))
        if (cycle) {
          crumbs.push({
            icon: '📅',
            name: cycle.name,
            link: `/home?project=${projectId}&cycle=${cycleId}`
          })
        }
      }
      
      // Unterordner
      if (folder) {
        crumbs.push({
          icon: '📁',
          name: folder,
          link: `/home?project=${projectId}&cycle=${cycleId}&folder=${folder}`
        })
      }
      
      setBreadcrumbs(crumbs)
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    }
  }

  if (breadcrumbs.length === 0) return null

  return (
    <div className="kiro-breadcrumb">
      <Link to="/home" className="kiro-breadcrumb-item">
        🏠 Home
      </Link>
      {breadcrumbs.map((crumb, index) => (
        <span key={index}>
          <span className="kiro-breadcrumb-separator">/</span>
          {index === breadcrumbs.length - 1 ? (
            <span className="kiro-breadcrumb-item kiro-breadcrumb-current">
              {crumb.icon} {crumb.name}
            </span>
          ) : (
            <Link to={crumb.link} className="kiro-breadcrumb-item">
              {crumb.icon} {crumb.name}
            </Link>
          )}
        </span>
      ))}
    </div>
  )
}

export default Breadcrumb
