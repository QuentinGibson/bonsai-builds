import { PersState } from '../store/pers'
import { kAppPopups, kAppStatus, kAppScreens, kNoticeActions, kNoticeIcons, kWindowNames } from './enums'

type SetSetting<T extends keyof PersState = keyof PersState> = [T, PersState[T]]

export interface EventBusEvents {
  dragWindow: kWindowNames
  minimizeWindow: kWindowNames
  closeWindow: kWindowNames
  positionWindow: kWindowNames
  setPopup: kAppPopups | null
  setScreen: kAppScreens
  setStatus: kAppStatus
  openLink: string
  triggerLaunch: void
  openDiscord: void
  noticeAction: kNoticeActions
  closeNotice: string
  closeApp: void
  setSetting: SetSetting
  submitFeedback: void
  submitBugReport: void
  closeToast: string
  setFTUESeen: void
  createBuildSet: string
  createBreakpoint: { name: string; level: number }
  editBuildSet: { id: string; name: string; ascendancy: string | null }
  editBreakpoint: { buildSetId: string; breakpointId: string; name: string; level: number }
  deleteBuildSet: string
  deleteBreakpoint: { buildSetId: string; breakpointId: string }
  openEditBuildSet: { id: string; name: string; ascendancy: string | null }
  openEditBreakpoint: { buildSetId: string; breakpointId: string; name: string; level: number }
}

export interface NoticeAction {
  text: string
  id: kNoticeActions
}

export interface Notice {
  id: string
  message: string
  icon?: kNoticeIcons
  devTip?: string
  action?: NoticeAction
  timeout?: number
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  timeout?: number
  devTip?: string
}
