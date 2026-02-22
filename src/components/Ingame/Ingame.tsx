import { useContext, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { kAppScreens, kAppStatus, kWindowNames } from "../../config/enums";
import { CommonStoreContext } from "../../hooks/common-context";
import { useEventBus } from "../../hooks/use-event-bus";
import { classNames } from "../../utils";

import "./Ingame.scss";

import { AdPremium } from "../AdPremium/AdPremium";
import { DesktopHeader } from "../DesktopHeader/DesktopHeader";
import { Navigation } from "../Navigation/Navigation";
import { Popup } from "../Popup/Popup";
import { Premium } from "../Premium/Premium";
import { RootWrapper } from "../RootWrapper/RootWrapper";
import { ScreenError } from "../ScreenError/ScreenError";
import { ScreenPassiveTree } from "../ScreenPassiveTree/ScreenPassiveTree";
import { Settings } from "../Settings/Settings";
import { Toaster } from "../Toaster/Toaster";

export function renderIngame(element: Element | DocumentFragment) {
	createRoot(element).render(
		<RootWrapper name="Ingame">
			<Ingame />
		</RootWrapper>,
	);
}

export type IngameProps = {
	className?: string;
};

export function Ingame({ className }: IngameProps) {
	const eventBus = useEventBus();

	const [navCollapsed, setNavCollapsed] = useState(false);

	const { screen, status } = useContext(CommonStoreContext);

	const ScreenComponent = useMemo(() => {
		if (status === kAppStatus.Error) {
			return ScreenError;
		}

		switch (screen) {
			case kAppScreens.Main:
				return ScreenPassiveTree;
			case kAppScreens.Settings:
				return Settings;
			case kAppScreens.Premium:
				return Premium;
		}
	}, [screen, status]);

	useEffect(() => {
		eventBus.emit("positionWindow", kWindowNames.ingame);
	}, [eventBus]);

	return (
		<div className={classNames("Ingame", { "nav-collapsed": navCollapsed }, className)}>
			<DesktopHeader />

			<Navigation
				collapsed={navCollapsed}
				onToggle={() => setNavCollapsed((v) => !v)}
			/>

			<SwitchTransition mode="out-in">
				<CSSTransition
					key={ScreenComponent.name}
					classNames="ingame-screen-fade"
					timeout={150}
					mountOnEnter={true}
					unmountOnExit={true}
					appear={true}
				>
					<ScreenComponent className="ingame-screen" />
				</CSSTransition>
			</SwitchTransition>

			<Popup />

			<AdPremium className="ingame-ad-premium" />
			<Toaster className="ingame-toaster" />
		</div>
	);
}
