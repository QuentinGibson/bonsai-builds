import { useMemo, useState, useEffect } from 'react'

import { classNames } from '../../utils'

import './EditBuildSet.scss'

const CLASS_ASCENDANCIES: { className: string; ascendancies: string[] }[] = [
  { className: 'Warrior', ascendancies: ['Titan', 'Warbringer', 'Smith of Kitava'] },
  { className: 'Ranger', ascendancies: ['Deadeye', 'Pathfinder'] },
  { className: 'Huntress', ascendancies: ['Amazon', 'Ritualist'] },
  { className: 'Mercenary', ascendancies: ['Tactician', 'Witchhunter', 'Gemling Legionnaire'] },
  { className: 'Sorceress', ascendancies: ['Stormweaver', 'Chronomancer', 'Disciple of Varashta'] },
  { className: 'Witch', ascendancies: ['Infernalist', 'Blood Mage', 'Lich'] },
  { className: 'Monk', ascendancies: ['Invoker', 'Acolyte of Chayula'] },
  { className: 'Druid', ascendancies: ['Oracle', 'Shaman'] },
]

export type EditBuildSetProps = {
  className?: string
  currentName: string
  currentAscendancy?: string | null
  onClose: () => void
  onSubmit: (name: string, ascendancy: string | null) => void
}

export function EditBuildSet({ className, currentName, currentAscendancy, onClose, onSubmit }: EditBuildSetProps) {
  const [name, setName] = useState(currentName)
  const [ascendancy, setAscendancy] = useState<string>(currentAscendancy ?? '')

  useEffect(() => {
    setName(currentName)
    setAscendancy(currentAscendancy ?? '')
  }, [currentName, currentAscendancy])

  const submit = () => {
    if (isNameValid) {
      onSubmit(name, ascendancy || null)
      onClose()
    }
  }

  const isNameValid = useMemo(() => {
    return name.trim().length > 0 && name.length <= 50
  }, [name])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isNameValid) {
      submit()
    }
  }

  return (
    <div className={classNames('EditBuildSet', className)}>
      <h3>Edit Build Set</h3>

      <div className="content">
        <div className="form-group">
          <label htmlFor="buildset-name">Build Set Name</label>
          <input
            id="buildset-name"
            className={classNames('text', { invalid: name.length > 0 && !isNameValid })}
            type="text"
            placeholder="Enter a name for this build set"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
          />
          <div className="char-length">{name.length}/50</div>
        </div>

        <div className="form-group">
          <label htmlFor="buildset-ascendancy">Ascendancy</label>
          <select
            id="buildset-ascendancy"
            className="select"
            value={ascendancy}
            onChange={e => setAscendancy(e.target.value)}
          >
            <option value="">— None —</option>
            {CLASS_ASCENDANCIES.map(({ className: cls, ascendancies }) => (
              <optgroup key={cls} label={cls}>
                {ascendancies.map(asc => (
                  <option key={asc} value={asc}>{asc}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="actions">
        <button className="action close" onClick={onClose}>Cancel</button>
        <button
          className="action submit"
          onClick={submit}
          disabled={!isNameValid}
        >Save Changes</button>
      </div>
    </div>
  )
}
