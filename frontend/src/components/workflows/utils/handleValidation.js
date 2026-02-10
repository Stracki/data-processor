/**
 * Handle-Validierung und Kompatibilitätsprüfung
 * Modulares System für Node-Verbindungen
 */

/**
 * Typ-Kompatibilitäts-Matrix
 * Definiert welche Typen miteinander verbunden werden können
 */
const TYPE_COMPATIBILITY = {
  'Table': ['Table', 'Any'],
  'int': ['int', 'float', 'Any'],
  'float': ['int', 'float', 'Any'],
  'str': ['str', 'Any'],
  'bool': ['bool', 'Any'],
  'List[Table]': ['List[Table]', 'Table', 'Any'],
  'Any': ['Table', 'int', 'float', 'str', 'bool', 'List[Table]', 'Any']
}

/**
 * Prüft ob zwei Typen kompatibel sind
 */
export function areTypesCompatible(sourceType, targetType) {
  if (!sourceType || !targetType) return true // Fallback
  
  const compatibleTypes = TYPE_COMPATIBILITY[sourceType] || ['Any']
  return compatibleTypes.includes(targetType) || targetType === 'Any'
}

/**
 * Prüft ob eine Verbindung zwischen zwei Nodes erlaubt ist
 */
export function isConnectionAllowed(connection, nodes, edges) {
  const { source, target, sourceHandle, targetHandle } = connection
  
  // Finde Source und Target Nodes
  const sourceNode = nodes.find(n => n.id === source)
  const targetNode = nodes.find(n => n.id === target)
  
  if (!sourceNode || !targetNode) return false
  
  // Keine Selbst-Verbindungen
  if (source === target) return false
  
  // Prüfe ob Target-Handle bereits verbunden ist
  const existingConnection = edges.find(
    e => e.target === target && e.targetHandle === targetHandle
  )
  if (existingConnection) return false // Ein Input kann nur eine Verbindung haben
  
  // Typ-Kompatibilität prüfen
  const sourceOutputType = getHandleType(sourceNode, sourceHandle, 'source')
  const targetInputType = getHandleType(targetNode, targetHandle, 'target')
  
  return areTypesCompatible(sourceOutputType, targetInputType)
}

/**
 * Gibt den Typ eines Handles zurück
 */
function getHandleType(node, handleId, handleType) {
  const schema = node.data?.schema
  if (!schema) return 'Any'
  
  const handles = handleType === 'source' ? schema.outputs : schema.inputs
  const handle = handles?.find(h => h.id === handleId)
  
  return handle?.type || 'Any'
}

/**
 * Validiert alle Verbindungen eines Workflows
 */
export function validateWorkflow(nodes, edges) {
  const errors = []
  
  // Prüfe jeden Node
  for (const node of nodes) {
    const schema = node.data?.schema
    if (!schema) continue
    
    // Prüfe Required Inputs
    for (const input of schema.inputs || []) {
      if (input.required && input.default === null) {
        const hasConnection = edges.some(
          e => e.target === node.id && e.targetHandle === input.id
        )
        if (!hasConnection) {
          errors.push({
            nodeId: node.id,
            message: `Required input "${input.label}" is not connected`
          })
        }
      }
    }
  }
  
  // Prüfe auf Zyklen
  if (hasCycle(nodes, edges)) {
    errors.push({
      message: 'Workflow contains cycles'
    })
  }
  
  return errors
}

/**
 * Prüft ob der Graph Zyklen enthält
 */
function hasCycle(nodes, edges) {
  const graph = {}
  const visited = new Set()
  const recursionStack = new Set()
  
  // Erstelle Adjacency List
  nodes.forEach(node => {
    graph[node.id] = []
  })
  
  edges.forEach(edge => {
    if (graph[edge.source]) {
      graph[edge.source].push(edge.target)
    }
  })
  
  // DFS für Zykluserkennung
  function dfs(nodeId) {
    visited.add(nodeId)
    recursionStack.add(nodeId)
    
    for (const neighbor of graph[nodeId] || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true // Zyklus gefunden
      }
    }
    
    recursionStack.delete(nodeId)
    return false
  }
  
  // Prüfe alle Nodes
  for (const nodeId of Object.keys(graph)) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) return true
    }
  }
  
  return false
}

/**
 * Gibt Feedback für ungültige Verbindung
 */
export function getConnectionError(connection, nodes, edges) {
  const { source, target, sourceHandle, targetHandle } = connection
  
  const sourceNode = nodes.find(n => n.id === source)
  const targetNode = nodes.find(n => n.id === target)
  
  if (source === target) {
    return 'Cannot connect node to itself'
  }
  
  const existingConnection = edges.find(
    e => e.target === target && e.targetHandle === targetHandle
  )
  if (existingConnection) {
    return 'This input is already connected'
  }
  
  const sourceOutputType = getHandleType(sourceNode, sourceHandle, 'source')
  const targetInputType = getHandleType(targetNode, targetHandle, 'target')
  
  if (!areTypesCompatible(sourceOutputType, targetInputType)) {
    return `Type mismatch: ${sourceOutputType} cannot connect to ${targetInputType}`
  }
  
  return null
}
