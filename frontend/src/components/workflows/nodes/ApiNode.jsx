import React, { useState, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import './NodeStyles.css'

export default function ApiNode({ data, id }) {
  const [apiType, setApiType] = useState(data.apiType || 'rest')
  const [endpoint, setEndpoint] = useState(data.endpoint || '')
  const [method, setMethod] = useState(data.method || 'GET')

  useEffect(() => {
    updateSchema()
  }, [])

  const updateSchema = () => {
    data.schema = {
      inputs: [{ id: 'params', label: 'Parameters', type: 'Any', required: false, default: {} }],
      outputs: [{ id: 'output', label: 'Response', type: 'Any' }]
    }
  }

  const handleEndpointChange = (e) => {
    const newEndpoint = e.target.value
    setEndpoint(newEndpoint)
    data.endpoint = newEndpoint
  }

  const handleMethodChange = (e) => {
    const newMethod = e.target.value
    setMethod(newMethod)
    data.method = newMethod
  }

  const handleApiTypeChange = (e) => {
    const newType = e.target.value
    setApiType(newType)
    data.apiType = newType
  }

  return (
    <div className="custom-node api-node">
      <div className="node-header">
        <span className="node-icon">🌐</span>
        <span className="node-title">API Call</span>
      </div>
      <div className="node-content">
        <select 
          value={apiType} 
          onChange={handleApiTypeChange}
          className="node-select"
        >
          <option value="rest">REST API</option>
          <option value="graphql">GraphQL</option>
          <option value="soap">SOAP</option>
          <option value="webhook">Webhook</option>
        </select>
        <select 
          value={method} 
          onChange={handleMethodChange}
          className="node-select"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input
          type="text"
          value={endpoint}
          onChange={handleEndpointChange}
          placeholder="API Endpoint..."
          className="node-input"
        />
        <div className="node-info">
          ⚠️ Wird in zukünftiger Version implementiert
        </div>
      </div>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="params"
        style={{ background: '#9C27B0' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="output"
        style={{ background: '#9C27B0' }}
      />
    </div>
  )
}
