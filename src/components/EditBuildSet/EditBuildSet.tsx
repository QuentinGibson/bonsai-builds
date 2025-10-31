import { useMemo, useState, useEffect } from 'react'

import { classNames } from '../../utils'

import './EditBuildSet.scss'


export type EditBuildSetProps = {
  className?: string
  currentName: string
  onClose: () => void
  onSubmit: (name: string) => void
}

export function EditBuildSet({ className, currentName, onClose, onSubmit }: EditBuildSetProps) {
  const [name, setName] = useState(currentName)

  useEffect(() => {
    setName(currentName)
  }, [currentName])

  const submit = () => {
    if (isNameValid) {
      onSubmit(name)
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
