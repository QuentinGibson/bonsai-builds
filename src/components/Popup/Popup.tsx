import { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SwitchTransition, CSSTransition } from 'react-transition-group'

import { kAppPopups } from '../../config/enums'
import { useEventBus } from '../../hooks/use-event-bus'
import { CommonStoreContext } from '../../hooks/common-context'

import './Popup.scss'

import { Changelog } from '../Changelog/Changelog'
import { Feedback } from '../Feedback/Feedback'
import { BugReport } from '../BugReport/BugReport'
import { AddBuildSet } from '../AddBuildSet/AddBuildSet'
import { AddBreakpoint } from '../AddBreakpoint/AddBreakpoint'
import { EditBuildSet } from '../EditBuildSet/EditBuildSet'
import { EditBreakpoint } from '../EditBreakpoint/EditBreakpoint'


export function Popup() {
  const popupEl = useRef<HTMLDivElement | null>(null)

  const eventBus = useEventBus()

  const { popup } = useContext(CommonStoreContext)

  // State for edit popups
  const [editBuildSetData, setEditBuildSetData] = useState<{ id: string; name: string } | null>(null)
  const [editBreakpointData, setEditBreakpointData] = useState<{ buildSetId: string; breakpointId: string; name: string; level: number } | null>(null)

  const setPopup = useCallback((popup: kAppPopups | null) => {
    eventBus.emit('setPopup', popup)
  }, [eventBus])

  const onPopupClick = useCallback((e: React.MouseEvent) => {
    if (popupEl.current && e.target === popupEl.current) {
      setPopup(null)
    }
  }, [setPopup])

  const popupContentComponent = useMemo(() => {
    let el: ReactNode | null = null

    switch (popup) {
      case kAppPopups.Changelog:
        el = <Changelog onClose={() => setPopup(null)} />
        break
      case kAppPopups.Feedback:
        el = <Feedback onClose={() => setPopup(null)} />
        break
      case kAppPopups.BugReport:
        el = <BugReport onClose={() => setPopup(null)} />
        break
      case kAppPopups.AddBuildSet:
        el = <AddBuildSet onClose={() => setPopup(null)} onSubmit={(name) => {
          // The onSubmit handler will be set via event bus
          eventBus.emit('createBuildSet', name)
        }} />
        break
      case kAppPopups.AddBreakpoint:
        el = <AddBreakpoint onClose={() => setPopup(null)} onSubmit={(name, level) => {
          // The onSubmit handler will be set via event bus
          eventBus.emit('createBreakpoint', { name, level })
        }} />
        break
      case kAppPopups.EditBuildSet:
        if (editBuildSetData) {
          el = <EditBuildSet
            currentName={editBuildSetData.name}
            onClose={() => setPopup(null)}
            onSubmit={(name) => {
              eventBus.emit('editBuildSet', { id: editBuildSetData.id, name })
            }}
          />
        }
        break
      case kAppPopups.EditBreakpoint:
        if (editBreakpointData) {
          el = <EditBreakpoint
            currentName={editBreakpointData.name}
            currentLevel={editBreakpointData.level}
            onClose={() => setPopup(null)}
            onSubmit={(name, level) => {
              eventBus.emit('editBreakpoint', {
                buildSetId: editBreakpointData.buildSetId,
                breakpointId: editBreakpointData.breakpointId,
                name,
                level
              })
            }}
          />
        }
        break
    }

    return el
  }, [popup, setPopup, eventBus, editBuildSetData, editBreakpointData])

  const renderPopupComponent = useCallback(() => {
    if (popup === null || !popupContentComponent) {
      return <></>
    }

    return (
      <div
        className="Popup"
        ref={popupEl}
        onClick={onPopupClick}
      >
        <div className="popup-content">
          <button
            className="popup-close"
            onClick={() => setPopup(null)}
          />
          {popupContentComponent}
        </div>
      </div>
    )
  }, [popup, popupContentComponent, onPopupClick, setPopup])

  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      delete e.returnValue

      if (popup !== null) {
        eventBus.emit('setPopup', null)
      }
    }

    window.addEventListener('beforeunload', listener)

    return () => {
      window.removeEventListener('beforeunload', listener)
    }
  }, [eventBus, popup])

  // Listen for edit popup events
  useEffect(() => {
    const handleOpenEditBuildSet = (data: { id: string; name: string }) => {
      setEditBuildSetData(data)
      setPopup(kAppPopups.EditBuildSet)
    }

    const handleOpenEditBreakpoint = (data: { buildSetId: string; breakpointId: string; name: string; level: number }) => {
      setEditBreakpointData(data)
      setPopup(kAppPopups.EditBreakpoint)
    }

    eventBus.on({
      openEditBuildSet: handleOpenEditBuildSet,
      openEditBreakpoint: handleOpenEditBreakpoint
    })
  }, [eventBus, setPopup])

  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        key={popup}
        classNames="Popup"
        timeout={150}
        mountOnEnter={true}
        unmountOnExit={true}
        appear={true}
      >
        {renderPopupComponent()}
      </CSSTransition>
    </SwitchTransition>
  )
}
