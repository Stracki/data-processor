import { useState } from 'react';
import Breadcrumb from '../Breadcrumb';
import ProcedureList from './ProcedureList';
import ProcedureEditor from './ProcedureEditor';
import ProcedureExecutor from './ProcedureExecutor';
import './ProceduresView.css';

function ProceduresView() {
  const [view, setView] = useState('list'); // 'list', 'editor', 'executor'
  const [selectedProcedure, setSelectedProcedure] = useState(null);

  const handleSelectProcedure = (name, action) => {
    setSelectedProcedure(name);
    if (action === 'execute') {
      setView('executor');
    } else if (action === 'edit') {
      setView('editor');
    }
  };

  const handleCreateNew = () => {
    setSelectedProcedure(null);
    setView('editor');
  };

  const handleSave = () => {
    setView('list');
    setSelectedProcedure(null);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedProcedure(null);
  };

  const handleExecutionSuccess = (tableId) => {
    alert(`Prozedur erfolgreich ausgeführt! Ergebnis-Tabelle ID: ${tableId}`);
    setView('list');
    setSelectedProcedure(null);
  };

  return (
    <div className="procedures-view">
      <Breadcrumb />
      <div className="procedures-view-content">
        {view === 'list' && (
          <ProcedureList
            onSelectProcedure={handleSelectProcedure}
            onCreateNew={handleCreateNew}
          />
        )}

      {view === 'editor' && (
        <ProcedureEditor
          procedureName={selectedProcedure}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {view === 'executor' && (
        <ProcedureExecutor
          procedureName={selectedProcedure}
          onClose={handleCancel}
          onSuccess={handleExecutionSuccess}
        />
      )}
      </div>
    </div>
  );
}

export default ProceduresView;
