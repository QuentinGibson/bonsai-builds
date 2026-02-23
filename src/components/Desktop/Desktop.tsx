import { useContext, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSSTransition, SwitchTransition } from "react-transition-group";

import "./Desktop.scss";

import {
	kAppPopups,
	kAppScreens,
	kAppStatus,
	kWindowNames,
} from "../../config/enums";
import { CommonStoreContext } from "../../hooks/common-context";
import { PersStoreContext } from "../../hooks/pers-context";
import { useEventBus } from "../../hooks/use-event-bus";
import { classNames } from "../../utils";
import { AdPremium } from "../AdPremium/AdPremium";
import { DesktopHeader } from "../DesktopHeader/DesktopHeader";
import { FTUE } from "../FTUE/FTUE";
import { Navigation } from "../Navigation/Navigation";
import { Popup } from "../Popup/Popup";
import { Premium } from "../Premium/Premium";
import { RootWrapper } from "../RootWrapper/RootWrapper";
import { ScreenError } from "../ScreenError/ScreenError";
import { ScreenBuilder } from "../ScreenBuilder/ScreenBuilder";
import { ScreenPassiveTree } from "../ScreenPassiveTree/ScreenPassiveTree";
import { Settings } from "../Settings/Settings";
import { Toaster } from "../Toaster/Toaster";

export function renderDesktop(element: Element | DocumentFragment) {
	createRoot(element).render(
		<RootWrapper name="Desktop">
			<Desktop />
		</RootWrapper>,
	);
}

export type DesktopProps = {
	className?: string;
};

export function Desktop({ className }: DesktopProps) {
	const eventBus = useEventBus();

	const [navCollapsed, setNavCollapsed] = useState(false);

	const { showChangelog, ftueSeen } = useContext(PersStoreContext);

	const { screen, status } = useContext(CommonStoreContext);

	const ScreenComponent = useMemo(() => {
		if (status === kAppStatus.Error) {
			return ScreenError;
		}

		switch (screen) {
			case kAppScreens.Main:
				return ScreenPassiveTree;
			case kAppScreens.Builder:
				return ScreenBuilder;
			case kAppScreens.Settings:
				return Settings;
			case kAppScreens.Premium:
				return Premium;
		}
	}, [screen, status]);

	useEffect(() => {
		if (showChangelog) {
			eventBus.emit("setPopup", kAppPopups.Changelog);
		}
	}, [eventBus, showChangelog]);

	useEffect(() => {
		eventBus.emit("positionWindow", kWindowNames.desktop);
	}, [eventBus]);

	return (
		<div className={classNames("Desktop", { "nav-collapsed": navCollapsed }, className)}>
			<DesktopHeader />

			<Navigation
				collapsed={navCollapsed}
				onToggle={() => setNavCollapsed((v) => !v)}
			/>

			<SwitchTransition mode="out-in">
				<CSSTransition
					key={ScreenComponent.name}
					classNames="desktop-screen-fade"
					timeout={150}
					mountOnEnter={true}
					unmountOnExit={true}
					appear={true}
				>
					<ScreenComponent className="desktop-screen" />
				</CSSTransition>
			</SwitchTransition>

			<Popup />

			<AdPremium className="desktop-ad-premium" />
			<Toaster className="desktop-toaster" />

			{!ftueSeen && <FTUE />}
			{/* <FTUE /> */}
		</div>
	);
}
