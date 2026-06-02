import { useMemo, useState, useEffect } from 'react'

import { classNames } from '../../utils'

import './EditBreakpoint.scss'


export type EditBreakpointProps = {
  className?: string
  currentName: string
  currentOrder: number
  onClose: () => void
  onSubmit: (name: string, order: number) => void
}

export function EditBreakpoint({ className, currentName, currentOrder, onClose, onSubmit }: EditBreakpointProps) {
  const [name, setName] = useState(currentName)
  const [order, setOrder] = useState(currentOrder.toString())

  useEffect(() => {
    setName(currentName)
    setOrder(currentOrder.toString())
  }, [currentName, currentOrder])

  const submit = () => {
    if (isValid) {
      onSubmit(name, parseInt(order))
      onClose()
    }
  }

  const isNameValid = useMemo(() => {
    return name.trim().length > 0 && name.length <= 50
  }, [name])

  const isOrderValid = useMemo(() => {
    const num = parseInt(order)
    return !isNaN(num) && num >= 0
  }, [order])

  const isValid = useMemo(() => {
    return isNameValid && isOrderValid
  }, [isNameValid, isOrderValid])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      submit()
    }
  }

  return (
    <div className={classNames('EditBreakpoint', className)}>
      <h3>Edit Step</h3>

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

        <div className="form-group">
          <label htmlFor="breakpoint-order">Order</label>
          <input
            id="breakpoint-order"
            className={classNames('text', { invalid: order.length > 0 && !isOrderValid })}
            type="number"
            placeholder="0, 1, 2, ..."
            min="0"
            value={order}
            onChange={e => setOrder(e.target.value)}
            onKeyPress={handleKeyPress}
          />
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
