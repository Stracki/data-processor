import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './ProcedureList.css';

function ProcedureList({ onSelectProcedure, onCreateNew }) {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  const projectId = searchParams.get('project');
  const cycleId = searchParams.get('cycle');
  const scope = searchParams.get('scope') || 'project';

  useEffect(() => {
    fetchProcedures();
  }, [projectId, cycleId, scope]);

  const fetchProcedures = async () => {
    try {
      // Nutze den by-scope Endpunkt mit Filtern
      const params = new URLSearchParams();
      if (scope) params.append('scope', scope);
      if (projectId) params.append('project_id', projectId);
      if (cycleId) params.append('cycle_id', cycleId);
      params.append('include_global', 'true');
      
      const response = await fetch(`http://localhost:8000/api/procedures/by-scope/?${params.toString()}`);
      const data = await response.json();
      setProcedures(data);
    } catch (error) {
      console.error('Fehler beim Laden der Prozeduren:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (procedureId, procedureName) => {
    if (!confirm(`Prozedur "${procedureName}" wirklich löschen?`)) return;

    try {
      await fetch(`http://localhost:8000/api/procedures/${procedureId}`, {
        method: 'DELETE'
      });
      fetchProcedures();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Prozedur');
    }
  };

  if (loading) return <div className="procedure-list-loading">Lade Prozeduren...</div>;

  return (
    <div className="procedure-list">
      <div className="procedure-list-header">
        <h2>Prozeduren</h2>
        <button className="btn-create" onClick={onCreateNew}>
          + Neue Prozedur
        </button>
      </div>

      {procedures.length === 0 ? (
        <div className="procedure-list-empty">
          <p>Noch keine Prozeduren vorhanden</p>
          <button onClick={onCreateNew}>Erste Prozedur erstellen</button>
        </div>
      ) : (
        <div className="procedure-list-items">
          {procedures.map(proc => (
            <div key={proc.id} className="procedure-item">
              <div className="procedure-item-info">
                <h3>{proc.name}</h3>
                <p className="procedure-description">{proc.description || 'Keine Beschreibung'}</p>
                <div className="procedure-meta">
                  <span className="procedure-version">v{proc.version}</span>
                  {proc.is_active && <span className="badge-active">Aktiv</span>}
                </div>
              </div>
              <div className="procedure-item-actions">
                <button 
                  className="btn-execute"
                  onClick={() => onSelectProcedure(proc.name, 'execute')}
                >
                  Ausführen
                </button>
                <button 
                  className="btn-edit"
                  onClick={() => onSelectProcedure(proc.name, 'edit')}
                >
                  Bearbeiten
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(proc.id, proc.name)}
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProcedureList;
