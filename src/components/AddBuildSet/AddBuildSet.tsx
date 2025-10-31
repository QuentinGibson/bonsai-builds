import { useMemo, useState } from 'react'

import { classNames } from '../../utils'

import './AddBuildSet.scss'


export type AddBuildSetProps = {
  className?: string
  onClose: () => void
  onSubmit: (name: string) => void
}

export function AddBuildSet({ className, onClose, onSubmit }: AddBuildSetProps) {
  const [name, setName] = useState('')

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
    <div className={classNames('AddBuildSet', className)}>
      <h3>New Build Set</h3>

      <div className="content">
        <label htmlFor="build-name">Build Set Name</label>
        <input
          id="build-name"
          className={classNames('text', { invalid: name.length > 0 && !isNameValid })}
          type="text"
          placeholder="e.g., Arc Witch, Marauder Tank"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus
        />
        <div className="name-length">{name.length}/50</div>
      </div>

      <div className="actions">
        <button className="action close" onClick={onClose}>Cancel</button>
        <button
          className="action submit"
          onClick={submit}
          disabled={!isNameValid}
        >Create</button>
      </div>
    </div>
  )
}
