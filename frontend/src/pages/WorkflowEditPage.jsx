import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import WorkflowEditor from '../components/workflows/WorkflowEditor'

export default function WorkflowEditPage() {
  const { workflowId } = useParams()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (workflowId && workflowId !== 'new') {
      fetchWorkflow()
    } else {
      setLoading(false)
    }
  }, [workflowId])

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/workflows/${workflowId}`)
      const data = await response.json()
      setWorkflow(data)
    } catch (error) {
      console.error('Error fetching workflow:', error)
      alert('Fehler beim Laden des Workflows')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (workflowData) => {
    try {
      const url = workflowId && workflowId !== 'new'
        ? `http://localhost:8000/api/workflows/${workflowId}`
        : 'http://localhost:8000/api/workflows'
      
      const method = workflowId && workflowId !== 'new' ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      })

      if (response.ok) {
        alert('Workflow gespeichert!')
        navigate('/workflows')
      } else {
        alert('Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
      alert('Fehler beim Speichern des Workflows')
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Lade Workflow...</div>
  }

  return <WorkflowEditor workflow={workflow} onSave={handleSave} />
}
