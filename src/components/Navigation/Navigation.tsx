import { useContext } from "react";
import { AiOutlineHome, AiOutlineSetting } from "react-icons/ai";
import { kAppScreens } from "../../config/enums";
import { CommonStoreContext } from "../../hooks/common-context";
import { useEventBus } from "../../hooks/use-event-bus";
import { classNames } from "../../utils";

import "./Navigation.scss";

export type NavigationProps = {
	className?: string;
};

export function Navigation({ className }: NavigationProps) {
	const eventBus = useEventBus();

	const { screen } = useContext(CommonStoreContext);

	const setScreen = (newScreen: kAppScreens) => {
		eventBus.emit("setScreen", newScreen);
	};

	return (
		<div className={classNames("menu-navigation", className)}>
			<button
				className={classNames("menu-item", {
					selected: screen === kAppScreens.Main,
				})}
				onClick={() => setScreen(kAppScreens.Main)}
			>
				<AiOutlineHome className="menu-icon" />
				<span>Tree</span>
			</button>
			<button
				className={classNames("menu-item", {
					selected: screen === kAppScreens.Settings,
				})}
				onClick={() => setScreen(kAppScreens.Settings)}
			>
				<AiOutlineSetting className="menu-icon" />
				<span>Settings</span>
			</button>
		</div>
	);
}
