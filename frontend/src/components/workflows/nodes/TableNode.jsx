import React, { useState, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import './NodeStyles.css'

export default function TableNode({ data, id }) {
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(data.tableId || '')

  useEffect(() => {
    fetchTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      updateSchema()
    }
  }, [selectedTable])

  const fetchTables = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tables')
      const fetchedTables = await response.json()
      setTables(fetchedTables)
    } catch (error) {
      console.error('Error fetching tables:', error)
    }
  }

  const updateSchema = () => {
    const table = tables.find(t => t.id == selectedTable)
    data.schema = {
      inputs: [],
      outputs: [{ id: 'output', label: table?.name || 'Table', type: 'Table' }]
    }
  }

  const handleTableChange = (e) => {
    const tableId = e.target.value
    setSelectedTable(tableId)
    data.tableId = tableId
    const table = tables.find(t => t.id == tableId)
    data.label = table?.name || 'Tabelle'
    updateSchema()
  }

  return (
    <div className="custom-node table-node">
      <div className="node-header">
        <span className="node-icon">📊</span>
        <span className="node-title">Tabelle</span>
      </div>
      <div className="node-content">
        <select 
          value={selectedTable} 
          onChange={handleTableChange}
          className="node-select"
        >
          <option value="">Tabelle wählen...</option>
          {tables.map(table => (
            <option key={table.id} value={table.id}>
              {table.name}
            </option>
          ))}
        </select>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        id="output"
        style={{ background: '#2196F3' }}
      />
    </div>
  )
}
