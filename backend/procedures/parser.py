import inspect
import ast
from typing import Dict, Any, Optional, get_type_hints, get_origin, get_args, Tuple


def extract_function_name(code: str) -> str:
    """
    Extrahiert den Funktionsnamen aus dem Code
    
    Returns:
        Funktionsname
    """
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"Syntax-Fehler im Code: {e}")
    
    # Finde die erste Funktion
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            return node.name
    
    raise ValueError("Keine Funktion im Code gefunden")


def add_type_hints_to_code(code: str, parameter_types: Dict[str, str]) -> str:
    """
    Fügt Type Hints zu Funktions-Parametern hinzu
    
    Args:
        code: Original Python-Code
        parameter_types: Dict mit {"param_name": "type"}
    
    Returns:
        Code mit Type Hints
    
    Note:
        "Table" wird jetzt auch als Type Hint hinzugefügt (Dummy-Klasse im Namespace)
    """
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"Syntax-Fehler im Code: {e}")
    
    # Finde die Funktion
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            # Füge Type Annotations hinzu
            for arg in node.args.args:
                param_name = arg.arg
                if param_name in parameter_types and not arg.annotation:
                    type_name = parameter_types[param_name]
                    
                    # Erstelle Type Annotation für alle Typen (inkl. Table)
                    arg.annotation = ast.Name(id=type_name, ctx=ast.Load())
            break
    
    # Konvertiere AST zurück zu Code
    return ast.unparse(tree)


def parse_function_signature(code: str, func_name: str) -> Dict[str, Dict[str, Any]]:
    """
    Analysiert Python-Funktion und extrahiert Parameter-Informationen
    
    Returns:
        {
            "param_name": {
                "type": "Table" | "int" | "float" | "str" | "bool" | "List[Table]",
                "required": bool,
                "default": Any
            }
        }
    """
    
    # Parse den Code
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"Syntax-Fehler im Code: {e}")
    
    # Finde die Funktion
    func_def = None
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.args.args:
            if node.name == func_name:
                func_def = node
                break
    
    if not func_def:
        raise ValueError(f"Funktion '{func_name}' nicht gefunden")
    
    # Extrahiere Parameter
    params = {}
    args = func_def.args
    
    # Defaults sammeln
    defaults = {}
    if args.defaults:
        # Defaults sind von rechts nach links zugeordnet
        default_offset = len(args.args) - len(args.defaults)
        for i, default in enumerate(args.defaults):
            arg_index = default_offset + i
            try:
                defaults[args.args[arg_index].arg] = ast.literal_eval(default)
            except (ValueError, SyntaxError):
                # Fallback: Verwende ast.unparse für komplexere Defaults
                defaults[args.args[arg_index].arg] = ast.unparse(default)
    
    # Parameter durchgehen
    for arg in args.args:
        param_name = arg.arg
        
        # Type Annotation extrahieren
        param_type = "Any"
        if arg.annotation:
            param_type = _extract_type_annotation(arg.annotation)
        
        # Parameter-Info zusammenstellen
        params[param_name] = {
            "type": param_type,
            "required": param_name not in defaults,
            "default": defaults.get(param_name, None)
        }
    
    return params


def _extract_type_annotation(annotation) -> str:
    """Extrahiert Type-Annotation als String"""
    if isinstance(annotation, ast.Name):
        return annotation.id
    elif isinstance(annotation, ast.Subscript):
        # z.B. List[Table]
        if isinstance(annotation.value, ast.Name):
            base_type = annotation.value.id
            if isinstance(annotation.slice, ast.Name):
                inner_type = annotation.slice.id
                return f"{base_type}[{inner_type}]"
    elif isinstance(annotation, ast.Constant):
        return str(annotation.value)
    
    return "Any"


def validate_function_structure(code: str) -> Tuple[bool, str, str]:
    """
    Validiert dass die Funktion korrekt strukturiert ist
    
    Returns:
        (is_valid, error_message, function_name)
    """
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Syntax-Fehler: {e}", ""
    
    # Prüfe ob Funktion existiert
    func_name = ""
    func_found = False
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            func_found = True
            func_name = node.name
            
            # Prüfe ob Return-Statement vorhanden
            has_return = any(isinstance(n, ast.Return) for n in ast.walk(node))
            if not has_return:
                return False, "Funktion muss ein Return-Statement haben", func_name
            
            break
    
    if not func_found:
        return False, "Keine Funktion im Code gefunden", ""
    
    return True, "", func_name
