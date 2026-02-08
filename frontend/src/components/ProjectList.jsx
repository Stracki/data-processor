import React, { useState, useEffect } from 'react'
import './ProjectList.css'

function ProjectList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Lade Projekte...</div>
  }

  return (
    <div className="project-list">
      <h1>Projekte</h1>
      <div className="projects-grid">
        {projects.length === 0 ? (
          <p>Keine Projekte vorhanden</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="project-card">
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className="project-meta">
                <span>Erstellt: {new Date(project.created_at).toLocaleDateString('de-DE')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ProjectList
