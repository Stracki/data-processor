import React, { useState, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import './NodeStyles.css'

export default function ValueNode({ data, id }) {
  const [value, setValue] = useState(data.value || '')
  const [valueType, setValueType] = useState(data.valueType || 'string')

  useEffect(() => {
    updateSchema()
  }, [valueType])

  const updateSchema = () => {
    const typeMap = {
      'string': 'str',
      'number': 'float',
      'boolean': 'bool',
      'json': 'Any'
    }
    
    data.schema = {
      inputs: [],
      outputs: [{ id: 'output', label: 'Value', type: typeMap[valueType] || 'Any' }]
    }
  }

  const handleValueChange = (e) => {
    const newValue = e.target.value
    setValue(newValue)
    data.value = newValue
  }

  const handleTypeChange = (e) => {
    const newType = e.target.value
    setValueType(newType)
    data.valueType = newType
    updateSchema()
  }

  return (
    <div className="custom-node value-node">
      <div className="node-header">
        <span className="node-icon">🔢</span>
        <span className="node-title">Wert</span>
      </div>
      <div className="node-content">
        <select 
          value={valueType} 
          onChange={handleTypeChange}
          className="node-select"
        >
          <option value="string">Text (str)</option>
          <option value="number">Zahl (float)</option>
          <option value="boolean">Boolean</option>
          <option value="json">JSON (Any)</option>
        </select>
        <input
          type="text"
          value={value}
          onChange={handleValueChange}
          placeholder="Wert eingeben..."
          className="node-input"
        />
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        id="output"
        style={{ background: '#FF9800' }}
      />
    </div>
  )
}
