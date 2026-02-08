import { useState, useEffect } from 'react';
import './ProcedureExecutor.css';

function ProcedureExecutor({ procedureName, onClose, onSuccess }) {
  const [schema, setSchema] = useState(null);
  const [tables, setTables] = useState([]);
  const [parameters, setParameters] = useState({});
  const [useDefaults, setUseDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSchema();
    loadTables();
  }, [procedureName]);

  const loadSchema = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/procedures/${procedureName}/schema`);
      const data = await response.json();
      setSchema(data);
      
      // Initialisiere useDefaults für Parameter mit Defaults
      const defaults = {};
      Object.entries(data.parameters).forEach(([name, info]) => {
        if (!info.required && info.default !== null) {
          defaults[name] = true;
        }
      });
      setUseDefaults(defaults);
    } catch (error) {
      console.error('Fehler beim Laden des Schemas:', error);
      setError('Fehler beim Laden der Prozedur');
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tables/');
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Fehler beim Laden der Tabellen:', error);
    }
  };

  const handleParameterChange = (paramName, value) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleDefaultToggle = (paramName) => {
    setUseDefaults(prev => ({
      ...prev,
      [paramName]: !prev[paramName]
    }));
  };

  const handleExecute = async () => {
    setError('');
    setExecuting(true);
    setResult(null);

    try {
      // Baue Parameter-Objekt
      const execParams = {};
      Object.entries(schema.parameters).forEach(([name, info]) => {
        if (useDefaults[name] && info.default !== null) {
          execParams[name] = info.default;
        } else if (parameters[name] !== undefined) {
          // Type-Konvertierung
          if (info.type === 'int') {
            execParams[name] = parseInt(parameters[name]);
          } else if (info.type === 'float') {
            execParams[name] = parseFloat(parameters[name]);
          } else if (info.type === 'bool') {
            execParams[name] = parameters[name] === 'true' || parameters[name] === true;
          } else {
            execParams[name] = parameters[name];
          }
        }
      });

      const response = await fetch(`http://localhost:8000/api/procedures/${procedureName}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: execParams,
          project_id: null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Fehler bei Ausführung');
      }

      const data = await response.json();
      setResult(data);

      if (data.status === 'success') {
        setTimeout(() => {
          onSuccess && onSuccess(data.output_table_id);
        }, 2000);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setExecuting(false);
    }
  };

  const renderParameterInput = (paramName, paramInfo) => {
    const isUsingDefault = useDefaults[paramName];

    // Table-Parameter: Dropdown mit allen Tabellen
    if (paramInfo.type === 'Table') {
      return (
        <select
          value={parameters[paramName] || ''}
          onChange={(e) => handleParameterChange(paramName, parseInt(e.target.value))}
          disabled={isUsingDefault}
        >
          <option value="">-- Tabelle wählen --</option>
          {tables.map(table => (
            <option key={table.id} value={table.id}>
              {table.name} ({table.row_count} Zeilen)
            </option>
          ))}
        </select>
      );
    }

    // Numerische Parameter
    if (paramInfo.type === 'int' || paramInfo.type === 'float') {
      return (
        <input
          type="number"
          step={paramInfo.type === 'float' ? '0.01' : '1'}
          value={parameters[paramName] || ''}
          onChange={(e) => handleParameterChange(paramName, e.target.value)}
          disabled={isUsingDefault}
          placeholder={isUsingDefault ? `Default: ${paramInfo.default}` : ''}
        />
      );
    }

    // Boolean Parameter
    if (paramInfo.type === 'bool') {
      return (
        <select
          value={parameters[paramName] || 'false'}
          onChange={(e) => handleParameterChange(paramName, e.target.value)}
          disabled={isUsingDefault}
        >
          <option value="false">Nein</option>
          <option value="true">Ja</option>
        </select>
      );
    }

    // String und andere Parameter
    return (
      <input
        type="text"
        value={parameters[paramName] || ''}
        onChange={(e) => handleParameterChange(paramName, e.target.value)}
        disabled={isUsingDefault}
        placeholder={isUsingDefault ? `Default: ${paramInfo.default}` : ''}
      />
    );
  };

  if (loading) {
    return <div className="procedure-executor-loading">Lade Prozedur...</div>;
  }

  return (
    <div className="procedure-executor">
      <div className="procedure-executor-header">
        <h2>Prozedur ausführen: {procedureName}</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      {schema?.description && (
        <div className="procedure-description">
          {schema.description}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className={`result-message ${result.status}`}>
          {result.status === 'success' ? (
            <>
              ✓ Erfolgreich ausgeführt in {result.execution_time?.toFixed(2)}s<br/>
              Ergebnis-Tabelle ID: {result.output_table_id}
            </>
          ) : (
            <>
              ✗ Fehler: {result.error_message}
            </>
          )}
        </div>
      )}

      <div className="parameters-form">
        <h3>Parameter</h3>
        {Object.entries(schema.parameters).map(([paramName, paramInfo]) => (
          <div key={paramName} className="parameter-group">
            <label>
              {paramName}
              {paramInfo.required && <span className="required">*</span>}
              <span className="param-type">({paramInfo.type})</span>
            </label>
            
            <div className="parameter-input-wrapper">
              {renderParameterInput(paramName, paramInfo)}
              
              {!paramInfo.required && paramInfo.default !== null && (
                <label className="default-checkbox">
                  <input
                    type="checkbox"
                    checked={useDefaults[paramName] || false}
                    onChange={() => handleDefaultToggle(paramName)}
                  />
                  Default nutzen ({paramInfo.default})
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="executor-actions">
        <button className="btn-cancel" onClick={onClose}>
          Abbrechen
        </button>
        <button 
          className="btn-execute" 
          onClick={handleExecute}
          disabled={executing}
        >
          {executing ? 'Führe aus...' : 'Ausführen'}
        </button>
      </div>
    </div>
  );
}

export default ProcedureExecutor;
