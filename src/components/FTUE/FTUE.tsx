import { Splide, SplideSlide } from "@splidejs/react-splide";
import { useRef } from "react";
import { kWindowNames } from "../../config/enums";
import { useEventBus } from "../../hooks/use-event-bus";
import { classNames } from "../../utils";

import "@splidejs/splide/css/core";
import "./FTUE.scss";

import { Link } from "../Link/Link";

export type FTUEProps = {
	className?: string;
};

export function FTUE({ className }: FTUEProps) {
	const eventBus = useEventBus();

	const sliderRef = useRef<Splide | null>(null);

	const drag = (e: React.MouseEvent) => {
		if (e.button === 0) {
			eventBus.emit("dragWindow", kWindowNames.desktop);
		}
	};

	const close = () => {
		eventBus.emit("closeWindow", kWindowNames.desktop);
	};

	const setSlide = (n: number) => {
		sliderRef.current?.go(n);
	};

	const setFTUESeen = () => {
		eventBus.emit("setFTUESeen");
	};

	return (
		<div className={classNames("FTUE", className)}>
			<button className="close" onClick={close} />

			<div className="drag" onMouseDown={drag} />

			<Splide
				className="slider"
				ref={sliderRef}
				options={{
					arrows: false,
					pagination: true,
					drag: false,
					classes: {
						pagination: "slider-pagination",
					},
				}}
			>
				<SplideSlide className="slide slide-1">
					<h2>Welcome to BonsaiBuild</h2>
					<p>
						Your companion app for planning and perfecting your Path of Exile 2 character builds.
						Plan your passive skill tree and share builds with the community!
					</p>
					<button className="next" onClick={() => setSlide(1)}>
						Start tour
					</button>
				</SplideSlide>

				<SplideSlide className="slide slide-2">
					<h2>Plan Your Builds</h2>
					<p>
						Navigate the full Path of Exile 2 passive skill tree, allocate points,
						and experiment with different build paths before committing in-game.
					</p>
					<button className="next" onClick={() => setSlide(2)}>
						Continue
					</button>
				</SplideSlide>

				<SplideSlide className="slide slide-3">
					<h2>Use In-Game</h2>
					<p>
						Access BonsaiBuild while playing Path of Exile 2 to reference your builds
						and make real-time planning decisions.
					</p>
					<p>
						Press <kbd>Ctrl+T</kbd> to show/hide the app in-game
					</p>
					<button className="next next-cta" onClick={setFTUESeen}>
						Get started
					</button>
				</SplideSlide>
			</Splide>

			<button className="skip" onClick={setFTUESeen}>
				Skip
			</button>
		</div>
	);
}
