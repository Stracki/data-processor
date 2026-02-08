import { useState, useEffect } from 'react';
import TypeSelectionModal from './TypeSelectionModal';
import './ProcedureEditor.css';

function ProcedureEditor({ procedureName, onSave, onCancel }) {
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Type Selection Modal
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [validationData, setValidationData] = useState(null);

  useEffect(() => {
    if (procedureName) {
      loadProcedure();
    } else {
      // Template für neue Prozedur
      setCode(`def beispiel(tabelle, wert1: int, wert2: int = 2):
    """
    Beschreibung der Prozedur
    """
    # Manipulation der Tabelle
    tabelle['neue_spalte'] = tabelle['alte_spalte'] * wert1 + wert2
    return tabelle`);
    }
  }, [procedureName]);

  const loadProcedure = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/procedures/${procedureName}`);
      const data = await response.json();
      setDescription(data.description || '');
      setCode(data.code);
      setIsNewVersion(true);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      setError('Fehler beim Laden der Prozedur');
    }
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Validiere Code und prüfe auf fehlende Types
      const validateResponse = await fetch('http://localhost:8000/api/procedures/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          code: code
        })
      });

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        throw new Error(errorData.detail || 'Validierung fehlgeschlagen');
      }

      const validation = await validateResponse.json();
      
      // 2. Wenn fehlende Types → Modal zeigen
      if (validation.missing_types && validation.missing_types.length > 0) {
        setValidationData(validation);
        setShowTypeModal(true);
        setLoading(false);
        return;
      }

      // 3. Keine fehlenden Types → direkt speichern
      await saveProcedure(null);
      
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleTypeSelection = async (selectedTypes) => {
    setShowTypeModal(false);
    setLoading(true);
    
    try {
      await saveProcedure(selectedTypes);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const saveProcedure = async (parameterTypes) => {
    const payload = {
      description: description.trim(),
      code: code,
      parameter_types: parameterTypes
    };

    let url, method;
    if (isNewVersion) {
      url = `http://localhost:8000/api/procedures/${procedureName}/versions`;
      method = 'POST';
    } else {
      url = 'http://localhost:8000/api/procedures/';
      method = 'POST';
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Fehler beim Speichern');
    }

    onSave();
  };

  return (
    <div className="procedure-editor">
      {showTypeModal && validationData && (
        <TypeSelectionModal
          parameters={validationData.parameters}
          missingTypes={validationData.missing_types}
          onConfirm={handleTypeSelection}
          onCancel={() => {
            setShowTypeModal(false);
            setLoading(false);
          }}
        />
      )}

      <div className="procedure-editor-header">
        <h2>{isNewVersion ? `Neue Version: ${procedureName}` : 'Neue Prozedur'}</h2>
        <button className="btn-close" onClick={onCancel}>✕</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="procedure-editor-form">
        <div className="form-group">
          <label>Beschreibung</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Was macht diese Prozedur?"
          />
        </div>

        <div className="form-group">
          <label>Python Code</label>
          <textarea
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="def meine_funktion(tabelle, ...):"
            rows={20}
            spellCheck={false}
          />
          <small>
            Erlaubte Module: pandas (pd), numpy (np), math, datetime<br/>
            Funktion muss pandas DataFrame zurückgeben<br/>
            Der Funktionsname wird automatisch aus dem Code extrahiert<br/>
            <strong>Tipp:</strong> Verwende Type Hints (z.B. <code>wert: int</code>) oder wähle die Typen beim Speichern aus
          </small>
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Abbrechen
          </button>
          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={loading || !code.trim()}
          >
            {loading ? 'Speichere...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProcedureEditor;
