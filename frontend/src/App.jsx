import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Sidebar from './components/Sidebar'
import ProjectList from './components/ProjectList'
import NewTable from './components/NewTable'
import TableOverview from './components/TableOverview'
import TableEdit from './components/TableEdit'
import ImportExcel from './components/ImportExcel'
import ExcelViewer from './components/ExcelViewer'
import ProceduresView from './components/procedures/ProceduresView'

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/import" element={<ImportExcel />} />
            <Route path="/excel-viewer" element={<ExcelViewer />} />
            <Route path="/tabellen/overview" element={<TableOverview />} />
            <Route path="/tabellen/new" element={<NewTable />} />
            <Route path="/tabellen/edit/:tableId" element={<TableEdit />} />
            <Route path="/tabellen/prozeduren" element={<ProceduresView />} />
            <Route path="/workflows" element={<div className="placeholder">Workflows - In Entwicklung</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
