import { classNames } from "../../utils";
import { Tip } from "../Tip/Tip";

import "./ScreenMain.scss";

export type ScreenMainProps = {
	className?: string;
};

export function ScreenMain({ className }: ScreenMainProps) {
	return (
		<div className={classNames("ScreenMain", className)}>
			<div className="primary">
				<h2>Section Header</h2>
				<p>
					Here is the main section where you present the primary value to the
					user
				</p>
			</div>
			<aside className="secondary">
				<p>Additional Value</p>

				<Tip
					top="20px"
					left="169px"
					position="rightEdge bottom"
					arrowPosition="center bottom"
				>
					<h6>Additional Value</h6>
					<p>
						While users brows for the primary content, a snap view or summary of
						their profile or key indicators can be added to enrich their
						experience. You can also add short tips, jokes, game-specific advice
						or any other valuable information your users will like.
					</p>
				</Tip>
			</aside>
		</div>
	);
}
