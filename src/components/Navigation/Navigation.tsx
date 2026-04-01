import { useContext } from "react";
import {
	AiOutlineHome,
	AiOutlineLeft,
	AiOutlineRight,
	AiOutlineSetting,
	AiOutlineShop,
	AiOutlineTool,
} from "react-icons/ai";
import { kAppScreens } from "../../config/enums";
import { CommonStoreContext } from "../../hooks/common-context";
import { useEventBus } from "../../hooks/use-event-bus";
import { classNames } from "../../utils";

import "./Navigation.scss";

export type NavigationProps = {
	className?: string;
	collapsed?: boolean;
	onToggle?: () => void;
};

export function Navigation({ className, collapsed, onToggle }: NavigationProps) {
	const eventBus = useEventBus();

	const { screen } = useContext(CommonStoreContext);

	const setScreen = (newScreen: kAppScreens) => {
		eventBus.emit("setScreen", newScreen);
	};

	return (
		<div
			className={classNames("menu-navigation", { collapsed }, className)}
			id="Navigation"
		>
			<button
				className={classNames("menu-item", {
					selected: screen === kAppScreens.Main,
				})}
				onClick={() => setScreen(kAppScreens.Main)}
			>
				<AiOutlineHome className="menu-icon" />
				{!collapsed && <span>Tree</span>}
			</button>
			<button
				className={classNames("menu-item", {
					selected: screen === kAppScreens.Builder,
				})}
				onClick={() => setScreen(kAppScreens.Builder)}
			>
				<AiOutlineTool className="menu-icon" />
				{!collapsed && <span>Builder</span>}
			</button>
			<button
				className={classNames("menu-item", {
					selected: screen === kAppScreens.Marketplace,
				})}
				onClick={() => setScreen(kAppScreens.Marketplace)}
			>
				<AiOutlineShop className="menu-icon" />
				{!collapsed && <span>Market</span>}
			</button>
			<button
				className={classNames("menu-item", {
					selected: screen === kAppScreens.Settings,
				})}
				onClick={() => setScreen(kAppScreens.Settings)}
			>
				<AiOutlineSetting className="menu-icon" />
				{!collapsed && <span>Settings</span>}
			</button>

			<button className="nav-toggle-btn" onClick={onToggle} aria-label="Toggle navigation">
				{collapsed ? <AiOutlineRight /> : <AiOutlineLeft />}
			</button>
		</div>
	);
}
