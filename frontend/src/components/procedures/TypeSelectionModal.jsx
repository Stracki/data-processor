import { useState } from 'react';
import './TypeSelectionModal.css';

const AVAILABLE_TYPES = [
  { value: 'Table', label: 'Table (Datentabelle)' },
  { value: 'int', label: 'int (Ganzzahl)' },
  { value: 'float', label: 'float (Dezimalzahl)' },
  { value: 'str', label: 'str (Text)' },
  { value: 'bool', label: 'bool (Ja/Nein)' }
];

function TypeSelectionModal({ parameters, missingTypes, onConfirm, onCancel }) {
  const [selectedTypes, setSelectedTypes] = useState({});

  const handleTypeChange = (paramName, type) => {
    setSelectedTypes(prev => ({
      ...prev,
      [paramName]: type
    }));
  };

  const handleConfirm = () => {
    // Prüfe ob alle Types ausgewählt wurden
    const allSelected = missingTypes.every(param => selectedTypes[param]);
    if (!allSelected) {
      alert('Bitte wähle für alle Parameter einen Typ aus');
      return;
    }
    onConfirm(selectedTypes);
  };

  return (
    <div className="modal-overlay">
      <div className="type-selection-modal">
        <div className="modal-header">
          <h2>Parameter-Typen festlegen</h2>
          <p>Einige Parameter haben keine Type Hints. Bitte wähle die Typen aus:</p>
        </div>

        <div className="modal-body">
          {missingTypes.map(paramName => {
            const paramInfo = parameters[paramName];
            return (
              <div key={paramName} className="type-selection-row">
                <div className="param-info">
                  <span className="param-name">{paramName}</span>
                  {!paramInfo.required && (
                    <span className="param-default">
                      (Default: {JSON.stringify(paramInfo.default)})
                    </span>
                  )}
                </div>
                <select
                  value={selectedTypes[paramName] || ''}
                  onChange={(e) => handleTypeChange(paramName, e.target.value)}
                  className="type-select"
                >
                  <option value="">-- Typ wählen --</option>
                  {AVAILABLE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>
            Abbrechen
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            Typen hinzufügen und speichern
          </button>
        </div>
      </div>
    </div>
  );
}

export default TypeSelectionModal;
