import {
	delay,
	EventEmitter,
	GameStatus,
	type HotkeyChangedEvent,
	HotkeyService,
	LauncherStatus,
	log,
	OverwolfWindow,
	WindowTunnel,
} from "ow-libs";

import {
	kDiscordUrl,
	kEventBusName,
	kHotkeyApp,
	kHotkeyLoading,
	kHotkeyServiceName,
	kLoadingHeight,
	kLoadingTop,
	kMainHeight,
	kMainWidth,
	kNoticesHeight,
	kNoticesWidth,
	kPoe2GameId,
	kToastBugReportSubmitted,
	kToastFeedbackSubmitted,
} from "./config/constants";
import { kWindowNames } from "./config/enums";
import type { EventBusEvents, Notice, Toast } from "./config/types";
import { makeCommonStore } from "./store/common";
import { makePersStore } from "./store/pers";
import { userService } from "./services/userService";

class BackgroundController {
	readonly #eventBus = new EventEmitter<EventBusEvents>();
	readonly #launcherStatus = new LauncherStatus();
	readonly #gameStatus = new GameStatus();
	readonly #hotkey = new HotkeyService();
	readonly #state = makeCommonStore();
	readonly #persState = makePersStore();
	readonly #backgroundWin = new OverwolfWindow(kWindowNames.background);
	readonly #desktopWin = new OverwolfWindow(kWindowNames.desktop);
	readonly #ingameWin = new OverwolfWindow(kWindowNames.ingame);
	readonly #loadingWin = new OverwolfWindow(kWindowNames.loading);
	readonly #noticesWin = new OverwolfWindow(kWindowNames.notices);

	#uid = 0;

	get #startedWithGame() {
		return (
			window.location.search.includes("source=gamelaunchevent") &&
			window.location.search.includes(`gameid=${kPoe2GameId}`)
		);
	}

	async start() {
		console.log("Front App starting");

		this.#bindAppShutdown();

		overwolf.extensions.current.getManifest((e) => {
			console.log("Front App app version:", e.meta.version);
			this.#state.version = e.meta.version;
		});

		this.#initTunnels();

		await Promise.all([
			this.#launcherStatus.start(),
			this.#gameStatus.start(),
			this.#hotkey.start(),
			this.#updateViewports(),
		]);

		this.#state.isPremium = await userService.checkAndSyncSubscription();

		await this.#initHotkeys();

		this.#eventBus.on({
			setStatus: (status) => (this.#state.status = status),
			setScreen: (screen) => (this.#state.screen = screen),
			setPopup: (popup) => (this.#state.popup = popup),
			dragWindow: (windowName) => this.#dragWindow(windowName),
			minimizeWindow: (windowName) => this.#minimizeWindow(windowName),
			closeWindow: (windowName) => this.closeWindow(windowName),
			positionWindow: (windowName) => this.#positionWindow(windowName),
			openLink: (url) => this.#openLink(url),
			openDiscord: () => this.#openLink(kDiscordUrl),
			triggerLaunch: () => this.#openMainWindow(),
			closeNotice: (id) => this.#closeNotice(id),
			closeApp: () => this.#closeApp(),
			closeToast: (id) => this.#closeToast(id),
			submitFeedback: () => this.#submitFeedback(),
			submitBugReport: () => this.#submitBugReport(),
			setSetting: ([key, value]) => ((this.#persState[key] as any) = value),
			setFTUESeen: () => (this.#persState.ftueSeen = true),
		});

		this.#launcherStatus.addListener("running", () => {
			this.#onLauncherRunningChanged();
		});

		this.#gameStatus.on({
			"*": () => this.#updateViewports(),
			running: () => this.#onGameRunningChanged(),
			focus: () => (this.#state.gameFocused = this.#gameStatus.isInFocus),
		});

		this.#hotkey.on({
			changed: (e) => this.#onHotkeyChanged(e),
			pressed: (name) => this.#onHotkeyPressed(name),
		});

		this.#onGameRunningChanged(true);
		this.#onLauncherRunningChanged();

		overwolf.extensions.onAppLaunchTriggered.addListener((e) => {
			console.log("onAppLaunchTriggered():", ...log(e));
			this.#openMainWindow(e.origin);
		});

		if (this.#startedWithGame) {
			if (!this.#persState.autoLaunch) {
				await this.#closeApp();
			}
		} else {
			console.log("Front App started without game");
			await this.#openMainWindow();
		}

		console.log("Front App started successfully");
	}

	/** Make these objects available to all windows via a WindowTunnel */
	#initTunnels() {
		WindowTunnel.set(kEventBusName, this.#eventBus);
		WindowTunnel.set(kHotkeyServiceName, this.#hotkey);
	}

	#submitFeedback() {
		this.#state.popup = null;
		// TODO: Handle feedback submission
		this.#newToast(kToastFeedbackSubmitted);
	}

	#submitBugReport() {
		this.#state.popup = null;
		// TODO: Handle bugReport submission
		this.#newToast(kToastBugReportSubmitted);
	}

	async #initHotkeys() {
		// Use overwolf.settings.hotkeys.get() like the sample app
		return new Promise<void>((resolve) => {
			overwolf.settings.hotkeys.get((result) => {
				console.log(
					"initHotkeys(): raw result:",
					JSON.stringify(result, null, 2),
				);

				if (!result || !result.success) {
					console.error("Failed to get hotkeys. Error:", result?.error);
					console.error("Full result:", result);
					// Set defaults and continue
					this.#state.hotkey = "Ctrl+T";
					this.#state.hotkeyLoading = "Ctrl+Shift+T";
					resolve();
					return;
				}

				if (!result.hotkeys) {
					console.error("No hotkeys array in result");
					this.#state.hotkey = "Ctrl+T";
					this.#state.hotkeyLoading = "Ctrl+Shift+T";
					resolve();
					return;
				}

				console.log("initHotkeys(): all hotkeys:", result.hotkeys);

				// Find our hotkeys - they may be in global or games section
				const appHotkey = result.hotkeys.find(
					(h: any) => h.name === kHotkeyApp,
				);
				const loadingHotkey = result.hotkeys.find(
					(h: any) => h.name === kHotkeyLoading,
				);

				if (appHotkey) {
					// Check game-specific binding first, then global
					const gameBinding = appHotkey.games?.[kPoe2GameId];
					this.#state.hotkey = gameBinding || appHotkey.binding || "Ctrl+T";
					console.log("App hotkey found:", this.#state.hotkey);
				} else {
					console.warn("App hotkey not found in manifest");
					this.#state.hotkey = "Ctrl+T";
				}

				if (loadingHotkey) {
					// Check game-specific binding first, then global
					const gameBinding = loadingHotkey.games?.[kPoe2GameId];
					this.#state.hotkeyLoading =
						gameBinding || loadingHotkey.binding || "Ctrl+Shift+T";
					console.log("Loading hotkey found:", this.#state.hotkeyLoading);
				} else {
					console.warn("Loading hotkey not found in manifest");
					this.#state.hotkeyLoading = "Ctrl+Shift+T";
				}

				resolve();
			});
		});
	}

	#onHotkeyChanged(e: HotkeyChangedEvent) {
		console.log("onHotkeyChanged():", e.name, e.binding);

		switch (e.name) {
			case kHotkeyApp:
				this.#state.hotkey = e.binding;
				break;
			case kHotkeyLoading:
				this.#state.hotkeyLoading = e.binding;
				break;
		}
	}

	async #onHotkeyPressed(name: string) {
		console.log("onHotkeyPressed():", name);

		switch (name) {
			case kHotkeyApp:
				await this.#openMainWindow("hotkey");
				break;
			case kHotkeyLoading:
				await this.#toggleLoadingWindow();
				break;
		}
	}

	async #onGameRunningChanged(firstRun = false) {
		this.#state.gameRunning = this.#gameStatus.isRunning;

		if (this.#gameStatus.isRunning) {
			await this.#onGameLaunched();
		} else if (!firstRun) {
			await this.#onGameClosed();
		}
	}

	async #onLauncherRunningChanged() {
		this.#state.launcherRunning = this.#launcherStatus.isRunning;

		if (this.#launcherStatus.isRunning && this.#persState.autoLaunch) {
			await this.#openMainWindow();
		}
	}

	async #onGameLaunched() {
		console.log(
			"onGameLaunched()",
			this.#gameStatus.gameID,
			this.#gameStatus.gameInfo?.title,
		);

		this.#state.gameRunning = true;

		this.#desktopWin.close();

		await this.#showGameLaunchNotice();
	}

	async #onGameClosed() {
		console.log("onGameClosed()", this.#gameStatus.gameID);

		this.#state.gameRunning = false;

		await Promise.all([this.#ingameWin.close(), this.#loadingWin.close()]);
	}

	async #toggleLoadingWindow() {
		if (this.#gameStatus.isInFocus) {
			await this.#loadingWin.toggle();
		}
	}

	async #openMainWindow(origin?: string) {
		console.log("openMainWindow()", origin);

		if (this.#gameStatus.isInFocus) {
			if (origin === "hotkey") {
				await this.#ingameWin.toggle();
			} else {
				await this.#ingameWin.restore();
			}
		} else {
			if (origin === "hotkey") {
				await this.#desktopWin.toggle();
			} else {
				await this.#desktopWin.restore();
			}
		}
	}

	async #showGameLaunchNotice() {
		if (!this.#persState.notifications) {
			return;
		}

		await this.#showNotice({
			id: "notice-game-launch",
			message: `BonsaiBuild is ready!<br />
Press <kbd>${this.#state.hotkey}</kbd> to show the skill tree`,
		});
	}

	async #showNotice(notice: Notice) {
		if (!this.#persState.notifications) {
			return;
		}

		await this.#noticesWin.restore();

		await delay(1000);

		const { notices } = this.#state;

		notices.push({
			...notice,
			id: `${notice.id}-${this.#uid++}`,
		});

		if (notices.length > 5) {
			notices.shift();
		}

		this.#state.notices = notices;
	}

	#closeNotice(id: string) {
		this.#state.notices = this.#state.notices.filter((v) => v.id !== id);
	}

	async #updateViewports() {
		const newViewport = await OverwolfWindow.getPrimaryViewport();

		const { viewport } = this.#state;

		if (!viewport || viewport?.hash !== newViewport?.hash) {
			this.#state.viewport = newViewport;

			console.log("updateViewports():", ...log(newViewport));
		}
	}

	async #closeApp() {
		await Promise.all([
			this.#desktopWin.close(),
			this.#loadingWin.close(),
			this.#ingameWin.close(),
		]);

		if (this.#gameStatus.isRunning) {
			console.log("closeApp(): game running, cannot close app");
		} else {
			console.log("closeApp(): closing app");
			await this.#backgroundWin.close();
		}
	}

	#openLink(url: string) {
		console.log("openLink():", url);

		if (url.startsWith("https://")) {
			overwolf.utils.openUrlInDefaultBrowser(url);
		}
	}

	#dragWindow(windowName: kWindowNames) {
		switch (windowName) {
			case kWindowNames.desktop:
				this.#desktopWin.dragMove();
				break;
			case kWindowNames.ingame:
				this.#ingameWin.dragMove();
				break;
			case kWindowNames.loading:
				this.#loadingWin.dragMove();
				break;
			case kWindowNames.notices:
				this.#noticesWin.dragMove();
				break;
		}
	}

	#minimizeWindow(windowName: kWindowNames) {
		switch (windowName) {
			case kWindowNames.desktop:
				this.#desktopWin.minimize();
				break;
			case kWindowNames.ingame:
				this.#ingameWin.minimize();
				break;
			case kWindowNames.loading:
				this.#loadingWin.minimize();
				break;
			case kWindowNames.notices:
				this.#noticesWin.minimize();
				break;
		}
	}

	closeWindow(windowName: kWindowNames) {
		switch (windowName) {
			case kWindowNames.desktop:
				this.#desktopWin.close();
				break;
			case kWindowNames.ingame:
				this.#ingameWin.close();
				break;
			case kWindowNames.loading:
				this.#loadingWin.close();
				break;
			case kWindowNames.notices:
				this.#noticesWin.close();
				break;
		}
	}

	#positionWindow(windowName: kWindowNames) {
		switch (windowName) {
			case kWindowNames.desktop:
				this.#positionDesktopWindow();
				break;
			case kWindowNames.ingame:
				this.#positionIngameWindow();
				break;
			case kWindowNames.loading:
				this.#positionLoadingWindow();
				break;
			case kWindowNames.notices:
				this.#positionNoticesWindow();
				break;
		}
	}

	async #positionDesktopWindow() {
		const { viewport } = this.#state;
		const { desktopPositionedFor } = this.#persState;

		if (!viewport || viewport.hash === desktopPositionedFor?.hash) {
			return;
		}

		await this.#desktopWin.changeSize(kMainWidth, kMainHeight, false);
		await this.#desktopWin.centerInViewport(viewport);

		this.#persState.desktopPositionedFor = viewport;
	}

	async #positionIngameWindow() {
		const { viewport } = this.#state;

		console.log("positionIngameWindow():", viewport);

		if (!viewport) {
			return;
		}

		// get scaled viewport size
		const viewportWidthScaled = viewport.width / viewport.scale,
			viewportHeightScaled = viewport.height / viewport.scale;

		// center, then clamp so the window never goes off-screen
		let left = viewport.x + viewportWidthScaled / 2 - kMainWidth / 2;
		let top = viewport.y + viewportHeightScaled / 2 - kMainHeight / 2;
		left = Math.max(viewport.x, Math.min(left, viewport.x + viewportWidthScaled - kMainWidth));
		top = Math.max(viewport.y, Math.min(top, viewport.y + viewportHeightScaled - kMainHeight));

		// get unscaled position
		left = Math.round(left * viewport.scale);
		top = Math.round(top * viewport.scale);

		await this.#ingameWin.changeSize(kMainWidth, kMainHeight, false);
		await this.#ingameWin.changePosition(left, top);
	}

	async #positionNoticesWindow() {
		const { viewport } = this.#state;
		const { noticesPositionedFor } = this.#persState;

		if (!viewport || viewport.hash === noticesPositionedFor?.hash) {
			return;
		}

		const viewportLogicalWidth = viewport.width / viewport.scale,
			viewportLogicalHeight = viewport.height / viewport.scale,
			logicalLeft = viewportLogicalWidth - kNoticesWidth - 20,
			logicalTop = viewportLogicalHeight - kNoticesHeight - 60,
			left = Math.round(Math.floor(logicalLeft) * viewport.scale),
			top = Math.round(Math.floor(logicalTop) * viewport.scale);

		await this.#noticesWin.changePosition(left, top);

		this.#persState.noticesPositionedFor = viewport;
	}

	async #positionLoadingWindow() {
		await this.#loadingWin.changeSize(kLoadingWidth, kLoadingHeight, false);
		await this.#loadingWin.changePosition(kLoadingLeft, kLoadingTop);
	}

	#newToast(toast: Toast) {
		const newToast: Toast = {
			...toast,
			id: `${toast.id}-${this.#uid++}`,
		};

		this.#state.toasts = [newToast, ...this.#state.toasts];
	}

	#closeToast(id: string) {
		this.#state.toasts = this.#state.toasts.filter((v) => v.id !== id);
	}

	#bindAppShutdown() {
		window.addEventListener("beforeunload", (e) => {
			delete e.returnValue;

			console.log("Front App shutting down");
		});
	}
}

new BackgroundController().start().catch((e) => {
	console.log("Front app error:");
	console.error(e);
});
