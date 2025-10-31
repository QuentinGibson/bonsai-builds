import { makeNiceState, StateManager, Viewport } from 'ow-libs'

import { kAppScreens } from '../config/enums'

export interface PersState {
  screen: kAppScreens
  autoLaunch: boolean
  notifications: boolean
  showChangelog: boolean
  desktopPositionedFor: Viewport | null
  ingamePositionedFor: Viewport | null
  noticesPositionedFor: Viewport | null
  ftueSeen: boolean
}

export const kPersStateDefaults: PersState = {
  screen: kAppScreens.Main,
  autoLaunch: true,
  notifications: true,
  showChangelog: true,
  desktopPositionedFor: null,
  ingamePositionedFor: null,
  noticesPositionedFor: null,
  ftueSeen: false
}

export const kPersStoreName = 'persistent'

/** Store that persists between sessions */
export const makePersStore = () => {
  return makeNiceState(
    new StateManager(kPersStoreName, kPersStateDefaults, true)
  )
}
