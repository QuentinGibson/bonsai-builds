import { useContext } from "react";
import { kHotkeyApp } from "../../config/constants";
import { CommonStoreContext } from "../../hooks/common-context";
import { PersStoreContext } from "../../hooks/pers-context";
import { useEventBus } from "../../hooks/use-event-bus";
import { useOverwolfUser } from "../../hooks/use-overwolf-user";
import type { PersState } from "../../store/pers";
import { classNames } from "../../utils";

import "./Settings.scss";

import { HotkeyEditor } from "../HotkeyEditor/HotkeyEditor";

export type SettingsProps = {
	className?: string;
};

export function Settings({ className }: SettingsProps) {
	const eventBus = useEventBus();
	const _user = useOverwolfUser();

	const { version } = useContext(CommonStoreContext);

	const { autoLaunch, notifications } = useContext(PersStoreContext);

	const _setSetting = <T extends keyof PersState>(
		key: T,
		value: PersState[T],
	) => {
		eventBus.emit("setSetting", [key, value]);
	};

	return (
		<div className={classNames("Settings", className)}>
			<div className="primary">
				<h2>
					Settings
					{/* <Tip */}
					{/*   top="2px" */}
					{/*   left="90px" */}
					{/*   position="right topEdge" */}
					{/*   arrowPosition="right center" */}
					{/* > */}
					{/*   <h6>Settings</h6> */}
					{/*   <p> */}
					{/*     Provide simple, clear and useful settings for your users here. */}
					{/*     Place your settings in intuitive categories by function or theme, */}
					{/*     so that your users can easily find what they are looking for. */}
					{/*   </p> */}
					{/**/}
					{/*   <p> */}
					{/*     Note that we recommend saving settings on change, rather than */}
					{/*     adding &quot;Save&quot; or &quot;Apply Settings&quot; buttons at */}
					{/*     the bottom. */}
					{/*   </p> */}
					{/* </Tip> */}
				</h2>

				{/* <h3> */}
				{/* 	Launcher: */}
				{/* 	<Tip */}
				{/* 		top="0" */}
				{/* 		left="90px" */}
				{/* 		position="right topEdge" */}
				{/* 		arrowPosition="right center" */}
				{/* 	> */}
				{/* 		<h6>App control </h6> */}
				{/**/}
				{/* 		<p> */}
				{/* 			Empower users to shape their app experience by defining which */}
				{/* 			events trigger its actions. For instance, they can decide whether */}
				{/* 			the app launches with the game or only when the game session ends. */}
				{/* 		</p> */}
				{/* 	</Tip> */}
				{/* </h3> */}

				{/* <Switch */}
				{/* 	className="setting-field" */}
				{/* 	value={autoLaunch} */}
				{/* 	onChange={(v) => setSetting("autoLaunch", v)} */}
				{/* > */}
				{/* 	Auto launch when the game starts */}
				{/* </Switch> */}
				{/**/}
				{/* <Switch */}
				{/* 	className="setting-field" */}
				{/* 	value={matchStart} */}
				{/* 	onChange={(v) => setSetting("matchStart", v)} */}
				{/* > */}
				{/* 	Auto launch when a match starts */}
				{/* </Switch> */}
				{/**/}
				{/* <div className="setting-field setting-field-dropdown"> */}
				{/* 	When a match ends */}
				{/* 	<DropDown */}
				{/* 		options={kMatchEndOptions} */}
				{/* 		value={matchEndAction} */}
				{/* 		onChange={(v) => setSetting("matchEndAction", v)} */}
				{/* 	/> */}
				{/* 	<ToolTip */}
				{/* 		top="6px" */}
				{/* 		left="calc(100% + 8px)" */}
				{/* 		position="leftEdge top" */}
				{/* 		arrowPosition="center top" */}
				{/* 	> */}
				{/* 		Choose the action of the app when a match ends. */}
				{/* 	</ToolTip> */}
				{/* 	<Tip */}
				{/* 		top="4px" */}
				{/* 		left="calc(100% + 36px)" */}
				{/* 		position="rightEdge bottom" */}
				{/* 		arrowPosition="center bottom" */}
				{/* 	> */}
				{/* 		<h6>Tooltip indicators (?)</h6> */}
				{/**/}
				{/* 		<p> */}
				{/* 			Tooltips are a useful way to explain concepts and functions to */}
				{/* 			your users, especially when introducing new features. */}
				{/* 		</p> */}
				{/* 		<p> */}
				{/* 			Make sure your tooltips explain related functions in a simple, */}
				{/* 			understandable manner. */}
				{/* 		</p> */}
				{/* 		<p> */}
				{/* 			We recommend keeping tooltips few and focused, increasing the */}
				{/* 			chances of users reading through them. */}
				{/* 		</p> */}
				{/* 	</Tip> */}
				{/* </div> */}
				{/**/}
				<h3>General Settings:</h3>

				{/* <Switch */}
				{/* 	className="setting-field" */}
				{/* 	value={notifications} */}
				{/* 	onChange={(v) => setSetting("notifications", v)} */}
				{/* > */}
				{/* 	Allow app notifications */}
				{/* </Switch> */}

				{/* NOTE: This is how to get user infomation */}

				{/* <div className="setting-field setting-field-hotkey"> */}
				{/* 	<ul> */}
				{/* 		<li>UserName: {user.user?.username}</li> */}
				{/* 		<li> */}
				{/* 			Avatar: <img src={user.user?.avatar} alt="avatar-ui" /> */}
				{/* 		</li> */}
				{/* 		<li>Display Name: {user.user?.displayName}</li> */}
				{/* 		<li>UserId: {user.user?.userId}</li> */}
				{/* 	</ul> */}
				{/* </div> */}
				{/**/}

				<div className="setting-field setting-field-hotkey">
					Show/Hide App
					<HotkeyEditor hotkeyName={kHotkeyApp} />
					{/* <Tip */}
					{/* 	top="4px" */}
					{/* 	left="calc(100% + 8px)" */}
					{/* 	position="right center" */}
					{/* 	arrowPosition="right center" */}
					{/* > */}
					{/* 	<h6>Hotkey Setting</h6> */}
					{/* 	<p> */}
					{/* 		In the app&apos;s overlay mode, we&apos;ve incorporated hotkeys */}
					{/* 		for convenient access to in-game overlays. These hotkeys empower */}
					{/* 		users to seamlessly Show/Hide the app and access advanced */}
					{/* 		functions. */}
					{/* 	</p> */}
					{/* 	<p> */}
					{/* 		Users should directly modify the hotkey settings within the app. */}
					{/* 	</p> */}
					{/* 	<p> */}
					{/* 		For detailed instructions on setting hotkeys for your app, please */}
					{/* 		refer to this&nbsp; */}
					{/* 		<Link url="https://overwolf.github.io/topics/best-practices/hotkeys-best-practices"> */}
					{/* 			link */}
					{/* 		</Link> */}
					{/* 		. */}
					{/* 	</p> */}
					{/* </Tip> */}
				</div>

				{/* <div className="setting-field setting-field-hotkey"> */}
				{/* 	Show/Hide loading screen */}
				{/* 	<HotkeyEditor hotkeyName={kHotkeyLoading} /> */}
				{/* </div> */}

				<div className="setting-version">
					Version {version}
					{/* <Tip */}
					{/* 	bottom="0" */}
					{/* 	right="-4px" */}
					{/* 	position="rightEdge top" */}
					{/* 	arrowPosition="center top" */}
					{/* > */}
					{/* 	<h6>App Version</h6> */}
					{/* 	<p> */}
					{/* 		Versioning is a critical component of your app upgrade and */}
					{/* 		maintenance strategy. */}
					{/* 	</p> */}
					{/* 	<p>We recommend placing it inside the settings screen.</p> */}
					{/* </Tip> */}
				</div>
			</div>

			<aside className="secondary">
				{/* Placeholder for ads - they are positioned absolutely */}
			</aside>
		</div>
	);
}
