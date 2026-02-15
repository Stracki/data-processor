import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../Breadcrumb'
import WorkflowExecutionDialog from './WorkflowExecutionDialog'
import './WorkflowsView.css'

export default function WorkflowsView() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [executingWorkflow, setExecutingWorkflow] = useState(null)
  const navigate = useNavigate()
  
  const projectId = searchParams.get('project')
  const cycleId = searchParams.get('cycle')
  const scope = searchParams.get('scope') || 'project'

  useEffect(() => {
    fetchWorkflows()
  }, [projectId, cycleId, scope])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      // Nutze den by-scope Endpunkt mit Filtern
      const params = new URLSearchParams();
      if (scope) params.append('scope', scope);
      if (projectId) params.append('project_id', projectId);
      if (cycleId) params.append('cycle_id', cycleId);
      params.append('include_global', 'true');
      
      const response = await fetch(`http://localhost:8000/api/workflows/by-scope/?${params.toString()}`)
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

  const handleExecuteWorkflow = (workflow) => {
    setExecutingWorkflow(workflow)
  }

  const handleExecutionComplete = (result) => {
    alert(`Workflow ausgeführt!\nStatus: ${result.status}\nZeit: ${result.execution_time?.toFixed(2)}s`)
    setExecutingWorkflow(null)
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
      <Breadcrumb />
      <div className="workflows-content">
        <div className="workflows-header">
          <h1>Workflows</h1>
          <div className="header-actions">
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
                    onClick={() => handleExecuteWorkflow(workflow)}
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
      
      {executingWorkflow && (
        <WorkflowExecutionDialog
          workflow={executingWorkflow}
          projectId={projectId}
          cycleId={cycleId}
          onClose={() => setExecutingWorkflow(null)}
          onExecute={handleExecutionComplete}
        />
      )}
    </div>
  )
}
