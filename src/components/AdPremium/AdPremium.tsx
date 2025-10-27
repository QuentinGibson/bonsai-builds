//TODO: Make subscription and ads work
import { kAppScreens } from "../../config/enums";
import { useEventBus } from "../../hooks/use-event-bus";
import { classNames } from "../../utils";

import "./AdPremium.scss";

import { Ad } from "../Ad/Ad";

export type AdPremiumProps = {
	className?: string;
};

export function AdPremium({ className }: AdPremiumProps) {
	const eventBus = useEventBus();

	const goPremuim = () => {
		eventBus.emit("setScreen", kAppScreens.Premium);
	};

	return (
		<div className={classNames("AdPremium", className)}>
			<div className="premium">
				<p>Remove ads and get extra features</p>

				<button className="go-premium" onClick={goPremuim}>
					Go premium
				</button>
			</div>

			<Ad></Ad>
		</div>
	);
}
