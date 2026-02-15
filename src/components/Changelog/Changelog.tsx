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
				<h4>0.4.0d</h4>
				<ul>
					<li>Fixed ascendancy trees not displaying for classes with multi-word names (Blood Mage, Smith of Kitava, Gemling Legionnaire, Acolyte of Chayula, Disciple of Varashta)</li>
				</ul>

				<h4>0.4.0c</h4>
				<ul>
					<li>Fixed passive tree errors and added dock image</li>
					<li>Fixed errors on checklist</li>
					<li>Fixed ad errors</li>
				</ul>
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
