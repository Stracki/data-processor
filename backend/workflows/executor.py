"""
Workflow Executor - Führt Workflows basierend auf Graph-Definition aus
"""
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from models import DataTable, Procedure
from procedures.executor import execute_procedure_code
import json


class WorkflowExecutor:
    def __init__(self, db: Session):
        self.db = db
        self.node_outputs = {}  # Speichert Outputs von Nodes
        self.execution_log = []
        self.graph_nodes = []  # Speichert Node-Definitionen
        
    def execute(self, graph: dict, input_params: dict) -> dict:
        """
        Führt einen Workflow aus
        
        Args:
            graph: Graph-Definition mit nodes und edges
            input_params: Initiale Parameter
            
        Returns:
            dict mit output und log
        """
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])
        
        # Speichere Nodes für späteren Zugriff
        self.graph_nodes = nodes
        
        # Topologische Sortierung für Ausführungsreihenfolge
        execution_order = self._topological_sort(nodes, edges)
        
        # Initiale Parameter setzen
        self.node_outputs["__input__"] = input_params
        
        # Nodes in Reihenfolge ausführen
        for node_id in execution_order:
            node = next((n for n in nodes if n["id"] == node_id), None)
            if node:
                self._execute_node(node, edges)
        
        # Output sammeln
        output_nodes = [n for n in nodes if n.get("type") == "output"]
        output = {}
        for out_node in output_nodes:
            node_id = out_node["id"]
            if node_id in self.node_outputs:
                output[node_id] = self.node_outputs[node_id]
        
        return {
            "output": output,
            "log": self.execution_log
        }
    
    def _execute_node(self, node: dict, edges: List[dict]):
        """Führt einen einzelnen Node aus"""
        node_id = node["id"]
        node_type = node["type"]
        node_data = node.get("data", {})
        
        self._log(f"Executing node {node_id} (type: {node_type})")
        
        try:
            if node_type == "table":
                result = self._execute_table_node(node_data)
            elif node_type == "procedure":
                result = self._execute_procedure_node(node_data, node_id, edges)
            elif node_type == "value":
                result = self._execute_value_node(node_data)
            elif node_type == "api":
                result = self._execute_api_node(node_data, node_id, edges)
            elif node_type == "output":
                result = self._execute_output_node(node_id, edges)
            else:
                raise ValueError(f"Unknown node type: {node_type}")
            
            self.node_outputs[node_id] = result
            self._log(f"Node {node_id} completed successfully")
            
        except Exception as e:
            self._log(f"Node {node_id} failed: {str(e)}", level="error")
            raise
    
    def _execute_table_node(self, data: dict) -> dict:
        """Lädt eine Tabelle"""
        table_id = data.get("tableId")
        if not table_id:
            raise ValueError("Table node requires tableId")
        
        table = self.db.query(DataTable).filter(DataTable.id == table_id).first()
        if not table:
            raise ValueError(f"Table {table_id} not found")
        
        return {
            "type": "table",
            "id": table.id,
            "name": table.name,
            "columns": table.columns,
            "data": table.data
        }
    
    def _execute_procedure_node(self, data: dict, node_id: str, edges: List[dict]) -> dict:
        """Führt eine Prozedur aus"""
        procedure_id = data.get("procedureId")
        if not procedure_id:
            raise ValueError("Procedure node requires procedureId")
        
        procedure = self.db.query(Procedure).filter(Procedure.id == procedure_id).first()
        if not procedure:
            raise ValueError(f"Procedure {procedure_id} not found")
        
        # Input-Parameter sammeln
        params = self._collect_node_inputs(node_id, edges, data.get("parameterMapping", {}))
        
        # Prozedur ausführen
        result = execute_procedure_code(procedure.code, params, self.db)
        
        return {
            "type": "procedure_result",
            "procedure_id": procedure.id,
            "procedure_name": procedure.name,
            "result": result
        }
    
    def _execute_value_node(self, data: dict) -> Any:
        """Gibt einen statischen Wert zurück"""
        return {
            "type": "value",
            "value": data.get("value"),
            "valueType": data.get("valueType", "string")
        }
    
    def _execute_api_node(self, data: dict, node_id: str, edges: List[dict]) -> dict:
        """
        Führt einen API-Call aus (Platzhalter für zukünftige Implementierung)
        """
        # TODO: Implementierung für API-Calls
        # Hier können später verschiedene API-Typen unterstützt werden:
        # - REST API
        # - GraphQL
        # - SOAP
        # - Webhooks
        
        api_type = data.get("apiType", "rest")
        endpoint = data.get("endpoint")
        method = data.get("method", "GET")
        
        # Input-Parameter sammeln
        params = self._collect_node_inputs(node_id, edges, data.get("parameterMapping", {}))
        
        self._log(f"API call placeholder: {method} {endpoint}", level="warning")
        
        return {
            "type": "api_result",
            "api_type": api_type,
            "endpoint": endpoint,
            "method": method,
            "status": "not_implemented",
            "message": "API calls will be implemented in future version"
        }
    
    def _execute_output_node(self, node_id: str, edges: List[dict]) -> dict:
        """Sammelt Outputs für finale Ausgabe und führt Aktion aus"""
        inputs = self._collect_node_inputs(node_id, edges, {})
        
        # Hole Node-Daten aus dem Graph
        node = next((n for n in self.graph_nodes if n["id"] == node_id), None)
        if not node:
            return inputs
        
        node_data = node.get("data", {})
        action = node_data.get("action", "save_table")
        
        # Führe Aktion aus
        if action == "save_table":
            return self._execute_save_table_action(inputs, node_data)
        elif action == "display":
            return self._execute_display_action(inputs, node_data)
        elif action in ["export_csv", "export_excel", "export_pdf"]:
            return self._execute_export_action(inputs, node_data, action)
        else:
            return inputs
    
    def _execute_save_table_action(self, inputs: dict, node_data: dict) -> dict:
        """Speichert Ergebnis als Tabelle"""
        from models import DataTable
        
        # Hole das Input-Ergebnis
        input_data = inputs.get("input", {})
        
        # Wenn es ein Prozedur-Ergebnis ist, extrahiere die Tabelle
        if isinstance(input_data, dict) and input_data.get("type") == "procedure_result":
            result = input_data.get("result", {})
            if isinstance(result, dict) and "columns" in result and "data" in result:
                table_data = result
            else:
                # Fallback: Erstelle einfache Tabelle
                table_data = {"columns": [], "data": []}
        elif isinstance(input_data, dict) and input_data.get("type") == "table":
            table_data = {"columns": input_data.get("columns", []), "data": input_data.get("data", [])}
        else:
            # Fallback
            table_data = {"columns": [], "data": []}
        
        # Erstelle neue Tabelle
        name = node_data.get("name", "workflow_result")
        project_id = node_data.get("project") or None
        
        new_table = DataTable(
            name=name,
            project_id=int(project_id) if project_id else None,
            columns=table_data.get("columns", []),
            data=table_data.get("data", []),
            row_count=len(table_data.get("data", [])),
            column_count=len(table_data.get("columns", []))
        )
        
        self.db.add(new_table)
        self.db.commit()
        self.db.refresh(new_table)
        
        self._log(f"Saved result as table '{name}' (ID: {new_table.id})")
        
        return {
            "action": "save_table",
            "table_id": new_table.id,
            "table_name": name,
            "data": inputs
        }
    
    def _execute_display_action(self, inputs: dict, node_data: dict) -> dict:
        """Bereitet Daten für Anzeige vor (zukünftig)"""
        name = node_data.get("name", "result")
        
        self._log(f"Display action '{name}' (not yet implemented)")
        
        return {
            "action": "display",
            "name": name,
            "data": inputs,
            "status": "not_implemented"
        }
    
    def _execute_export_action(self, inputs: dict, node_data: dict, action: str) -> dict:
        """Exportiert Daten (zukünftig)"""
        filename = node_data.get("filename", "export")
        
        self._log(f"Export action '{action}' to '{filename}' (not yet implemented)")
        
        return {
            "action": action,
            "filename": filename,
            "data": inputs,
            "status": "not_implemented"
        }
    
    def _collect_node_inputs(self, node_id: str, edges: List[dict], param_mapping: dict) -> dict:
        """Sammelt alle Inputs für einen Node basierend auf Edges"""
        inputs = {}
        
        # Finde alle eingehenden Edges
        incoming_edges = [e for e in edges if e["target"] == node_id]
        
        for edge in incoming_edges:
            source_id = edge["source"]
            target_handle = edge.get("targetHandle", "default")
            
            if source_id in self.node_outputs:
                source_output = self.node_outputs[source_id]
                
                # Mapping anwenden falls vorhanden
                if target_handle in param_mapping:
                    param_name = param_mapping[target_handle]
                    inputs[param_name] = source_output
                else:
                    inputs[target_handle] = source_output
        
        return inputs
    
    def _topological_sort(self, nodes: List[dict], edges: List[dict]) -> List[str]:
        """
        Topologische Sortierung für Ausführungsreihenfolge
        """
        # Adjacency List erstellen
        graph = {node["id"]: [] for node in nodes}
        in_degree = {node["id"]: 0 for node in nodes}
        
        for edge in edges:
            source = edge["source"]
            target = edge["target"]
            if source in graph and target in graph:
                graph[source].append(target)
                in_degree[target] += 1
        
        # Nodes ohne eingehende Edges finden
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            node_id = queue.pop(0)
            result.append(node_id)
            
            for neighbor in graph[node_id]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        # Zyklus-Check
        if len(result) != len(nodes):
            raise ValueError("Workflow contains cycles")
        
        return result
    
    def _log(self, message: str, level: str = "info"):
        """Fügt einen Log-Eintrag hinzu"""
        self.execution_log.append({
            "level": level,
            "message": message
        })
