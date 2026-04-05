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
			<h3>Welcome to Bonsai Builds v.{version}</h3>

			<div className="content">
				<p>Thanks for installing Bonsai Builds — the step-by-step passive tree planner for Path of Exile 2.</p>

				<h4>What's included</h4>
				<ul>
					<li>Full Path of Exile 2 passive skill tree with all classes and ascendancies</li>
					<li>Build steps system — plan your leveling path breakpoint by breakpoint</li>
					<li>Builder screen to manage your builds and steps</li>
					<li>Marketplace to browse and share builds with the community</li>
					<li>In-game overlay — press <strong>Ctrl+T</strong> to show/hide</li>
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
