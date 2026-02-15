import { useState, useEffect } from 'react'
import './WorkflowExecutionDialog.css'

function WorkflowExecutionDialog({ workflow, projectId, cycleId, onClose, onExecute }) {
  const [parameters, setParameters] = useState({})
  const [inputMapping, setInputMapping] = useState({})
  const [availableTables, setAvailableTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [instance, setInstance] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Lade verfügbare Tabellen
      const params = new URLSearchParams()
      if (projectId) params.append('project_id', projectId)
      
      const tablesRes = await fetch(`http://localhost:8000/api/tables/?${params.toString()}`)
      const tables = await tablesRes.json()
      setAvailableTables(tables)

      // Lade gespeicherte Workflow-Instanz falls vorhanden
      if (cycleId) {
        const instancesRes = await fetch(`http://localhost:8000/api/workflows/instances/by-cycle/${cycleId}`)
        const instances = await instancesRes.json()
        const workflowInstance = instances.find(i => i.workflow_id === workflow.id)
        
        if (workflowInstance) {
          setInstance(workflowInstance)
          setParameters(workflowInstance.parameters || {})
          setInputMapping(workflowInstance.input_mapping || {})
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    }
  }

  const handleExecute = async () => {
    setLoading(true)
    try {
      // Speichere/Update Workflow-Instanz wenn in Zyklus
      if (cycleId) {
        if (instance) {
          // Update bestehende Instanz
          await fetch(`http://localhost:8000/api/workflows/instances/${instance.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parameters,
              input_mapping: inputMapping
            })
          })
        } else {
          // Erstelle neue Instanz
          await fetch(`http://localhost:8000/api/workflows/${workflow.id}/instances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workflow_id: workflow.id,
              cycle_id: parseInt(cycleId),
              parameters,
              input_mapping: inputMapping
            })
          })
        }
      }

      // Führe Workflow aus
      const response = await fetch(`http://localhost:8000/api/workflows/${workflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_params: { ...parameters, ...inputMapping },
          project_id: projectId ? parseInt(projectId) : null,
          cycle_id: cycleId ? parseInt(cycleId) : null
        })
      })

      const result = await response.json()
      onExecute(result)
      onClose()
    } catch (error) {
      console.error('Fehler bei Ausführung:', error)
      alert('Fehler bei Workflow-Ausführung: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Extrahiere benötigte Inputs aus Workflow-Graph
  const getRequiredInputs = () => {
    const nodes = workflow.graph?.nodes || []
    const tableNodes = nodes.filter(n => n.type === 'table')
    return tableNodes.map(n => ({
      id: n.id,
      label: n.data?.label || n.id
    }))
  }

  const requiredInputs = getRequiredInputs()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content execution-dialog" onClick={e => e.stopPropagation()}>
        <h2>Workflow ausführen: {workflow.name}</h2>
        
        {workflow.description && (
          <p className="workflow-description">{workflow.description}</p>
        )}

        {requiredInputs.length > 0 && (
          <div className="section">
            <h3>Input-Daten</h3>
            <p className="section-hint">Wähle die Tabellen für die Workflow-Inputs</p>
            
            {requiredInputs.map(input => (
              <div key={input.id} className="form-group">
                <label>{input.label}</label>
                <select
                  value={inputMapping[input.id] || ''}
                  onChange={e => setInputMapping({
                    ...inputMapping,
                    [input.id]: parseInt(e.target.value)
                  })}
                >
                  <option value="">-- Tabelle wählen --</option>
                  {availableTables.map(table => (
                    <option key={table.id} value={table.id}>
                      {table.name} ({table.row_count} Zeilen)
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <div className="section">
          <h3>Parameter (Optional)</h3>
          <p className="section-hint">Zusätzliche Parameter für die Ausführung</p>
          
          <div className="form-group">
            <label>Parameter (JSON)</label>
            <textarea
              value={JSON.stringify(parameters, null, 2)}
              onChange={e => {
                try {
                  setParameters(JSON.parse(e.target.value))
                } catch (err) {
                  // Ignoriere Parse-Fehler während der Eingabe
                }
              }}
              rows="5"
              placeholder='{"schwellwert": 1000, "faktor": 1.2}'
            />
          </div>
        </div>

        {cycleId && (
          <div className="info-box">
            ℹ️ Die Konfiguration wird für diesen Zyklus gespeichert
          </div>
        )}

        <div className="modal-actions">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-secondary"
            disabled={loading}
          >
            Abbrechen
          </button>
          <button 
            onClick={handleExecute} 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Wird ausgeführt...' : '▶️ Ausführen'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WorkflowExecutionDialog
