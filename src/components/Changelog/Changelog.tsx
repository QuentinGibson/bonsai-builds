import { useContext } from "react";

import { CommonStoreContext } from "../../hooks/common-context";
import { PersStoreContext } from "../../hooks/pers-context";
import { useEventBus } from "../../hooks/use-event-bus";
import { classNames } from "../../utils";

import "./Changelog.scss";

import { Checkbox } from "../Checkbox/Checkbox";

export type ChangelogProps = {
	className?: string;
	onClose: () => void;
};

export function Changelog({ className, onClose }: ChangelogProps) {
	const eventBus = useEventBus();

	const { version } = useContext(CommonStoreContext);

	const { showChangelog } = useContext(PersStoreContext);

	const setShowChangelog = (value: boolean) => {
		eventBus.emit("setSetting", ["showChangelog", !value]);
	};

	return (
		<div className={classNames("Changelog", className)}>
			<h3>Change Log v.{version}</h3>

			<div className="content">
				<p>
					Change log points:
					<br />
					In bullets, try to show the main points you would like to pass to your
					user.
				</p>
			</div>

			<div className="actions">
				<Checkbox value={!showChangelog} onChange={setShowChangelog}>
					Don&apos;t show this again
				</Checkbox>

				<button className="action-close" onClick={onClose}>
					Got it
				</button>
			</div>
		</div>
	);
}
