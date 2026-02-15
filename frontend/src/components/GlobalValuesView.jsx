import { useState, useEffect } from 'react'
import './GlobalValuesView.css'

function GlobalValuesView() {
  const [values, setValues] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [valuesRes, categoriesRes] = await Promise.all([
        fetch('http://localhost:8000/api/global-values/'),
        fetch('http://localhost:8000/api/global-values/categories')
      ])
      
      const valuesData = await valuesRes.json()
      const categoriesData = await categoriesRes.json()
      
      setValues(valuesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredValues = selectedCategory
    ? values.filter(v => v.category === selectedCategory)
    : values

  const groupedByCategory = filteredValues.reduce((acc, value) => {
    const cat = value.category || 'Ohne Kategorie'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(value)
    return acc
  }, {})

  if (loading) {
    return <div className="loading">Lade globale Werte...</div>
  }

  return (
    <div className="global-values-view">
      <div className="values-header">
        <h1>🌐 Globale Werte</h1>
        <p>Diese Werte sind in allen Projekten und Prozeduren verfügbar</p>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ Neuer Wert
        </button>
      </div>

      <div className="values-content">
        <div className="categories-sidebar">
          <h3>Kategorien</h3>
          <div 
            className={`category-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            Alle
          </div>
          {categories.map(cat => (
            <div
              key={cat}
              className={`category-item ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </div>

        <div className="values-list">
          {Object.entries(groupedByCategory).map(([category, categoryValues]) => (
            <div key={category} className="category-section">
              <h2>{category}</h2>
              <div className="values-grid">
                {categoryValues.map(value => (
                  <ValueCard key={value.id} value={value} onUpdate={fetchData} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <CreateValueModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchData}
          categories={categories}
        />
      )}
    </div>
  )
}

function ValueCard({ value, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)

  const displayValue = () => {
    if (value.value_type === 'object') {
      return <pre>{JSON.stringify(value.value, null, 2)}</pre>
    }
    return <span className="value-display">{JSON.stringify(value.value)}</span>
  }

  const handleDelete = async () => {
    if (!confirm(`Wert "${value.key}" wirklich löschen?`)) return

    try {
      await fetch(`http://localhost:8000/api/global-values/${value.key}`, {
        method: 'DELETE'
      })
      onUpdate()
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
    }
  }

  return (
    <div className="value-card">
      <div className="value-header">
        <code className="value-key">global.{value.key}</code>
        <span className="value-type">{value.value_type}</span>
      </div>
      <div className="value-content">
        {displayValue()}
      </div>
      {value.description && (
        <div className="value-description">{value.description}</div>
      )}
      <div className="value-actions">
        <button onClick={() => setIsEditing(true)} className="btn-edit">
          ✏️ Bearbeiten
        </button>
        <button onClick={handleDelete} className="btn-delete">
          🗑️ Löschen
        </button>
      </div>

      {isEditing && (
        <EditValueModal
          value={value}
          onClose={() => setIsEditing(false)}
          onUpdated={onUpdate}
        />
      )}
    </div>
  )
}

function CreateValueModal({ onClose, onCreated, categories }) {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    value_type: 'string',
    category: '',
    description: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    let parsedValue
    try {
      if (formData.value_type === 'number') {
        parsedValue = parseFloat(formData.value)
      } else if (formData.value_type === 'boolean') {
        parsedValue = formData.value === 'true'
      } else if (formData.value_type === 'object') {
        parsedValue = JSON.parse(formData.value)
      } else {
        parsedValue = formData.value
      }
    } catch (error) {
      alert('Ungültiger Wert für den gewählten Typ')
      return
    }

    try {
      const response = await fetch('http://localhost:8000/api/global-values/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: parsedValue
        })
      })

      if (response.ok) {
        onCreated()
        onClose()
      }
    } catch (error) {
      console.error('Fehler beim Erstellen:', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Neuer globaler Wert</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Key (Name) *</label>
            <input
              type="text"
              value={formData.key}
              onChange={e => setFormData({...formData, key: e.target.value})}
              placeholder="z.B. MWST_SATZ"
              required
            />
            <small>Wird als global.{formData.key || 'KEY'} referenziert</small>
          </div>

          <div className="form-group">
            <label>Typ *</label>
            <select
              value={formData.value_type}
              onChange={e => setFormData({...formData, value_type: e.target.value})}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="object">Object/Array</option>
            </select>
          </div>

          <div className="form-group">
            <label>Wert *</label>
            {formData.value_type === 'object' ? (
              <textarea
                value={formData.value}
                onChange={e => setFormData({...formData, value: e.target.value})}
                placeholder='{"key": "value"} oder ["item1", "item2"]'
                rows="5"
                required
              />
            ) : formData.value_type === 'boolean' ? (
              <select
                value={formData.value}
                onChange={e => setFormData({...formData, value: e.target.value})}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <input
                type={formData.value_type === 'number' ? 'number' : 'text'}
                value={formData.value}
                onChange={e => setFormData({...formData, value: e.target.value})}
                step={formData.value_type === 'number' ? 'any' : undefined}
                required
              />
            )}
          </div>

          <div className="form-group">
            <label>Kategorie</label>
            <input
              type="text"
              list="categories"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              placeholder="z.B. Finanzen, Adressen"
            />
            <datalist id="categories">
              {categories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows="2"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn-primary">
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditValueModal({ value, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    value: value.value_type === 'object' ? JSON.stringify(value.value, null, 2) : value.value,
    value_type: value.value_type,
    category: value.category || '',
    description: value.description || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    let parsedValue
    try {
      if (formData.value_type === 'number') {
        parsedValue = parseFloat(formData.value)
      } else if (formData.value_type === 'boolean') {
        parsedValue = formData.value === 'true' || formData.value === true
      } else if (formData.value_type === 'object') {
        parsedValue = JSON.parse(formData.value)
      } else {
        parsedValue = formData.value
      }
    } catch (error) {
      alert('Ungültiger Wert für den gewählten Typ')
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/global-values/${value.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: parsedValue,
          value_type: formData.value_type,
          category: formData.category,
          description: formData.description
        })
      })

      if (response.ok) {
        onUpdated()
        onClose()
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Wert bearbeiten: {value.key}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Wert *</label>
            {formData.value_type === 'object' ? (
              <textarea
                value={formData.value}
                onChange={e => setFormData({...formData, value: e.target.value})}
                rows="8"
                required
              />
            ) : (
              <input
                type={formData.value_type === 'number' ? 'number' : 'text'}
                value={formData.value}
                onChange={e => setFormData({...formData, value: e.target.value})}
                step={formData.value_type === 'number' ? 'any' : undefined}
                required
              />
            )}
          </div>

          <div className="form-group">
            <label>Kategorie</label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows="2"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn-primary">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GlobalValuesView
