import React, { useState, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import './NodeStyles.css'

export default function ProcedureNode({ data, id }) {
  const [procedures, setProcedures] = useState([])
  const [selectedProcedure, setSelectedProcedure] = useState(data.procedureId || '')
  const [schema, setSchema] = useState(data.schema || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProcedures()
  }, [])

  useEffect(() => {
    if (selectedProcedure) {
      fetchProcedureSchema(selectedProcedure)
    }
  }, [selectedProcedure])

  const fetchProcedures = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/procedures')
      const data = await response.json()
      setProcedures(data)
    } catch (error) {
      console.error('Error fetching procedures:', error)
    }
  }

  const fetchProcedureSchema = async (procId) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8000/api/workflows/node-schema/procedure/${procId}`)
      const schemaData = await response.json()
      setSchema(schemaData)
      data.schema = schemaData // Update node data
    } catch (error) {
      console.error('Error fetching procedure schema:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcedureChange = (e) => {
    const procId = e.target.value
    setSelectedProcedure(procId)
    data.procedureId = procId
    const proc = procedures.find(p => p.id == procId)
    data.label = proc?.name || 'Prozedur'
  }

  return (
    <div className="custom-node procedure-node">
      <div className="node-header">
        <span className="node-icon">⚙️</span>
        <span className="node-title">Prozedur</span>
      </div>
      <div className="node-content">
        <select 
          value={selectedProcedure} 
          onChange={handleProcedureChange}
          className="node-select"
        >
          <option value="">Prozedur wählen...</option>
          {procedures.map(proc => (
            <option key={proc.id} value={proc.id}>
              {proc.name} (v{proc.version})
            </option>
          ))}
        </select>
        
        {loading && <div className="node-loading">Lade Schema...</div>}
        
        {schema && schema.inputs && schema.inputs.length > 0 && (
          <div className="node-handles-container">
            <div className="handles-label">Inputs:</div>
            {schema.inputs.map((input, index) => (
              <div key={input.id} className="handle-item">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={input.id}
                  style={{ 
                    background: input.required && input.default === null ? '#f44336' : '#4CAF50'
                  }}
                />
                <span className="handle-label-left">
                  {input.label}
                  {input.required && input.default === null && <span className="required-mark">*</span>}
                  <span className="handle-type">{input.type}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Output Handle */}
      {schema && schema.outputs && schema.outputs.map((output) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          style={{ background: '#4CAF50' }}
        />
      ))}
    </div>
  )
}

