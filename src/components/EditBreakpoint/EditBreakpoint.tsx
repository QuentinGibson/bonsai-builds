import { useMemo, useState, useEffect } from 'react'

import { classNames } from '../../utils'

import './EditBreakpoint.scss'


export type EditBreakpointProps = {
  className?: string
  currentName: string
  currentLevel: number
  onClose: () => void
  onSubmit: (name: string, level: number) => void
}

export function EditBreakpoint({ className, currentName, currentLevel, onClose, onSubmit }: EditBreakpointProps) {
  const [name, setName] = useState(currentName)
  const [level, setLevel] = useState(currentLevel.toString())

  useEffect(() => {
    setName(currentName)
    setLevel(currentLevel.toString())
  }, [currentName, currentLevel])

  const submit = () => {
    if (isValid) {
      onSubmit(name, parseInt(level))
      onClose()
    }
  }

  const isNameValid = useMemo(() => {
    return name.trim().length > 0 && name.length <= 50
  }, [name])

  const isLevelValid = useMemo(() => {
    const levelNum = parseInt(level)
    return !isNaN(levelNum) && levelNum >= 1 && levelNum <= 100
  }, [level])

  const isValid = useMemo(() => {
    return isNameValid && isLevelValid
  }, [isNameValid, isLevelValid])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      submit()
    }
  }

  return (
    <div className={classNames('EditBreakpoint', className)}>
      <h3>Edit Breakpoint</h3>

      <div className="content">
        <div className="form-group">
          <label htmlFor="breakpoint-name">Breakpoint Name</label>
          <input
            id="breakpoint-name"
            className={classNames('text', { invalid: name.length > 0 && !isNameValid })}
            type="text"
            placeholder="e.g., Level 30, Act 3, Early Game"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
          />
          <div className="char-length">{name.length}/50</div>
        </div>

        <div className="form-group">
          <label htmlFor="breakpoint-level">Character Level</label>
          <input
            id="breakpoint-level"
            className={classNames('text', { invalid: level.length > 0 && !isLevelValid })}
            type="number"
            placeholder="1-100"
            min="1"
            max="100"
            value={level}
            onChange={e => setLevel(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          {level.length > 0 && !isLevelValid && (
            <div className="error-message">Level must be between 1 and 100</div>
          )}
        </div>
      </div>

      <div className="actions">
        <button className="action close" onClick={onClose}>Cancel</button>
        <button
          className="action submit"
          onClick={submit}
          disabled={!isValid}
        >Save Changes</button>
      </div>
    </div>
  )
}
