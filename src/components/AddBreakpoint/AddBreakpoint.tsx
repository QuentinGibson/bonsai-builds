import { useMemo, useState } from 'react'

import { classNames } from '../../utils'

import './AddBreakpoint.scss'


export type AddBreakpointProps = {
  className?: string
  onClose: () => void
  onSubmit: (name: string) => void
}

export function AddBreakpoint({ className, onClose, onSubmit }: AddBreakpointProps) {
  const [name, setName] = useState('')

  const isNameValid = useMemo(() => {
    return name.trim().length > 0 && name.length <= 50
  }, [name])

  const submit = () => {
    if (isNameValid) {
      onSubmit(name)
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isNameValid) {
      submit()
    }
  }

  return (
    <div className={classNames('AddBreakpoint', className)}>
      <h3>New Step</h3>

      <div className="content">
        <div className="form-group">
          <label htmlFor="breakpoint-name">Step Name</label>
          <input
            id="breakpoint-name"
            className={classNames('text', { invalid: name.length > 0 && !isNameValid })}
            type="text"
            placeholder="e.g., Early Game, Act 3, Endgame"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
          />
          <div className="char-length">{name.length}/50</div>
        </div>
      </div>

      <div className="actions">
        <button className="action close" onClick={onClose}>Cancel</button>
        <button
          className="action submit"
          onClick={submit}
          disabled={!isNameValid}
        >Create Step</button>
      </div>
    </div>
  )
}
