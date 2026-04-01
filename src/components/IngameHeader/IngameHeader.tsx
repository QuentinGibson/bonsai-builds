import { useContext } from 'react'

import { CommonStoreContext } from '../../hooks/common-context'
import { useEventBus } from '../../hooks/use-event-bus'
import { kAppPopups, kWindowNames } from '../../config/enums'
import { classNames } from '../../utils'

import './IngameHeader.scss'


export type IngameHeaderProps = {
  className?: string
}

export function IngameHeader({ className }: IngameHeaderProps) {
  const { status, hotkey } = useContext(CommonStoreContext)

  const eventBus = useEventBus()

  const drag = (e: React.MouseEvent) => {
    if (e.button === 0) {
      eventBus.emit('dragWindow', kWindowNames.ingame)
    }
  }

  const minimize = () => {
    eventBus.emit('minimizeWindow', kWindowNames.ingame)
  }

  const close = () => {
    eventBus.emit('closeWindow', kWindowNames.ingame)
  }

  const openPopup = (popup: kAppPopups) => {
    eventBus.emit('setPopup', popup)
  }

  const openDiscord = () => {
    eventBus.emit('openDiscord')
  }

  return (
    <header
      className={classNames('IngameHeader', className)}
      id="IngameHeader"
      onMouseDown={drag}
    >
      {hotkey && (
        <div className="hotkey">
          Show/hide <kbd>{hotkey}</kbd>
        </div>
      )}

      <div className="window-controls">
        <button
          className="window-control bug-report"
          onClick={() => openPopup(kAppPopups.BugReport)}
        />

        <button className="window-control discord" onClick={openDiscord} />

        <button className="window-control help" />

        <div className="help-dropdown">
          <button onClick={openDiscord}>Q&A</button>
          <button onClick={() => openPopup(kAppPopups.Changelog)}>
            Changelog
          </button>
        </div>

        <button className="window-control minimize" onClick={minimize} />

        <button className="window-control close" onClick={close} />
      </div>
    </header>
  )
}
