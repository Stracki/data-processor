import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './WorkflowsView.css'

export default function WorkflowsView() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projects, setProjects] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
    fetchWorkflows()
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const url = selectedProject 
        ? `http://localhost:8000/api/workflows?project_id=${selectedProject}`
        : 'http://localhost:8000/api/workflows'
      const response = await fetch(url)
      const data = await response.json()
      setWorkflows(data)
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkflow = () => {
    navigate('/workflows/new')
  }

  const handleEditWorkflow = (workflowId) => {
    navigate(`/workflows/edit/${workflowId}`)
  }

  const handleExecuteWorkflow = async (workflowId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_params: {}, project_id: selectedProject })
      })
      const result = await response.json()
      alert(`Workflow ausgeführt!\nStatus: ${result.status}\nZeit: ${result.execution_time?.toFixed(2)}s`)
    } catch (error) {
      console.error('Error executing workflow:', error)
      alert('Fehler beim Ausführen des Workflows')
    }
  }

  const handleDeleteWorkflow = async (workflowId) => {
    if (!confirm('Workflow wirklich löschen?')) return
    
    try {
      await fetch(`http://localhost:8000/api/workflows/${workflowId}`, {
        method: 'DELETE'
      })
      fetchWorkflows()
    } catch (error) {
      console.error('Error deleting workflow:', error)
    }
  }

  return (
    <div className="workflows-view">
      <div className="workflows-header">
        <h1>Workflows</h1>
        <div className="header-actions">
          <select 
            value={selectedProject || ''} 
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="project-filter"
          >
            <option value="">Alle Projekte</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button onClick={handleCreateWorkflow} className="btn-create">
            + Neuer Workflow
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Lade Workflows...</div>
      ) : workflows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔄</div>
          <h2>Keine Workflows vorhanden</h2>
          <p>Erstelle deinen ersten Workflow, um Tabellen und Prozeduren zu verbinden</p>
          <button onClick={handleCreateWorkflow} className="btn-create-large">
            Workflow erstellen
          </button>
        </div>
      ) : (
        <div className="workflows-grid">
          {workflows.map(workflow => (
            <div key={workflow.id} className="workflow-card">
              <div className="workflow-card-header">
                <h3>{workflow.name}</h3>
                <span className={`status-badge ${workflow.is_active ? 'active' : 'inactive'}`}>
                  {workflow.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              <p className="workflow-description">
                {workflow.description || 'Keine Beschreibung'}
              </p>
              <div className="workflow-stats">
                <span>📊 {workflow.graph?.nodes?.length || 0} Nodes</span>
                <span>🔗 {workflow.graph?.edges?.length || 0} Verbindungen</span>
              </div>
              <div className="workflow-actions">
                <button 
                  onClick={() => handleEditWorkflow(workflow.id)}
                  className="btn-edit"
                >
                  Bearbeiten
                </button>
                <button 
                  onClick={() => handleExecuteWorkflow(workflow.id)}
                  className="btn-execute"
                  disabled={!workflow.is_active}
                >
                  Ausführen
                </button>
                <button 
                  onClick={() => handleDeleteWorkflow(workflow.id)}
                  className="btn-delete"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
