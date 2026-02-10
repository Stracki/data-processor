import React, { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './WorkflowEditor.css'

import TableNode from './nodes/TableNode'
import ProcedureNode from './nodes/ProcedureNode'
import ValueNode from './nodes/ValueNode'
import ApiNode from './nodes/ApiNode'
import OutputNode from './nodes/OutputNode'

import { isConnectionAllowed, validateWorkflow, getConnectionError } from './utils/handleValidation'

const nodeTypes = {
  table: TableNode,
  procedure: ProcedureNode,
  value: ValueNode,
  api: ApiNode,
  output: OutputNode,
}

export default function WorkflowEditor({ workflow, onSave }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.graph?.nodes || [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.graph?.edges || [])
  const [workflowName, setWorkflowName] = useState(workflow?.name || '')
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '')
  const [showNodePalette, setShowNodePalette] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [connectionError, setConnectionError] = useState(null)

  // Validiere Workflow bei Änderungen
  useEffect(() => {
    const errors = validateWorkflow(nodes, edges)
    setValidationErrors(errors)
  }, [nodes, edges])

  const onConnect = useCallback(
    (connection) => {
      // Prüfe ob Verbindung erlaubt ist
      if (isConnectionAllowed(connection, nodes, edges)) {
        setEdges((eds) => addEdge(connection, eds))
        setConnectionError(null)
      } else {
        const error = getConnectionError(connection, nodes, edges)
        setConnectionError(error)
        setTimeout(() => setConnectionError(null), 3000)
      }
    },
    [nodes, edges, setEdges]
  )

  const addNode = (type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: `${type} Node`,
        schema: null // Wird von Node-Komponente gesetzt
      },
    }
    setNodes((nds) => [...nds, newNode])
    setShowNodePalette(false)
  }

  const handleSave = async () => {
    // Validiere vor dem Speichern
    const errors = validateWorkflow(nodes, edges)
    if (errors.length > 0) {
      const confirmSave = window.confirm(
        `Workflow hat ${errors.length} Validierungsfehler:\n\n` +
        errors.map(e => `- ${e.message}`).join('\n') +
        '\n\nTrotzdem speichern?'
      )
      if (!confirmSave) return
    }

    const workflowData = {
      name: workflowName,
      description: workflowDescription,
      graph: {
        nodes,
        edges,
      },
    }
    await onSave(workflowData)
  }

  return (
    <div className="workflow-editor">
      <div className="workflow-header">
        <div className="workflow-info">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow Name"
            className="workflow-name-input"
          />
          <input
            type="text"
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            placeholder="Beschreibung"
            className="workflow-description-input"
          />
        </div>
        <div className="workflow-actions">
          {validationErrors.length > 0 && (
            <span className="validation-badge">
              ⚠️ {validationErrors.length} Fehler
            </span>
          )}
          <button onClick={handleSave} className="btn-save">
            Speichern
          </button>
        </div>
      </div>

      {connectionError && (
        <div className="connection-error-toast">
          ❌ {connectionError}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="validation-panel">
          <div className="validation-header">Validierungsfehler:</div>
          {validationErrors.map((error, index) => (
            <div key={index} className="validation-error">
              {error.nodeId && <span className="error-node">Node {error.nodeId}: </span>}
              {error.message}
            </div>
          ))}
        </div>
      )}

      <div className="workflow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Panel position="top-left">
            <button
              onClick={() => setShowNodePalette(!showNodePalette)}
              className="btn-add-node"
            >
              + Node hinzufügen
            </button>
            {showNodePalette && (
              <div className="node-palette">
                <button onClick={() => addNode('table')} className="palette-item">
                  📊 Tabelle
                </button>
                <button onClick={() => addNode('procedure')} className="palette-item">
                  ⚙️ Prozedur
                </button>
                <button onClick={() => addNode('value')} className="palette-item">
                  🔢 Wert
                </button>
                <button onClick={() => addNode('api')} className="palette-item">
                  🌐 API Call
                </button>
                <button onClick={() => addNode('output')} className="palette-item">
                  📤 Output
                </button>
              </div>
            )}
          </Panel>
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  )
}
