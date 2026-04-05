import { useEffect, useRef, useState } from "react";
import { kWindowNames } from "../../config/enums";
import { useEventBus } from "../../hooks/use-event-bus";
import { classNames } from "../../utils";

import "./FTUE.scss";

export type FTUEProps = {
	className?: string;
};

type Step = {
	title: string;
	description: string;
	highlightSelector?: string;
	position:
		| "center"
		| "top-left"
		| "top-right"
		| "bottom-left"
		| "bottom-right";
};

const TOUR_STEPS: Step[] = [
	{
		title: "Welcome to BonsaiBuild",
		description:
			"Your companion app for planning and perfecting your Path of Exile 2 character builds. Let's take a quick tour!",
		position: "center",
	},
	{
		title: "Navigation",
		description:
			"Use the navigation menu to switch between different sections of the app.",
		highlightSelector: "Navigation",
		position: "top-left",
	},
	{
		title: "Passive Skill Tree",
		description:
			"Navigate the full Path of Exile 2 passive skill tree, allocate points, and experiment with different build paths.",
		highlightSelector: "ScreenPassiveTree",
		position: "center",
	},
	{
		title: "Settings & More",
		description:
			"Access settings, premium features, and customize your experience from the top bar.",
		highlightSelector: "DesktopHeader",
		position: "top-right",
	},
	{
		title: "Ready to Build!",
		description:
			"Press Ctrl+T to show/hide the app in-game. Start planning your perfect build!",
		position: "center",
	},
];

export function FTUE({ className }: FTUEProps) {
	const eventBus = useEventBus();
	const [currentStep, setCurrentStep] = useState(0);
	const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
	const spotlightRef = useRef<HTMLDivElement>(null);

	const drag = (e: React.MouseEvent) => {
		if (e.button === 0) {
			eventBus.emit("dragWindow", kWindowNames.desktop);
		}
	};

	const close = () => {
		eventBus.emit("closeWindow", kWindowNames.desktop);
	};

	const setFTUESeen = () => {
		eventBus.emit("setFTUESeen");
	};

	const nextStep = () => {
		if (currentStep < TOUR_STEPS.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			setFTUESeen();
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const step = TOUR_STEPS[currentStep];
	const isFirstStep = currentStep === 0;
	const isLastStep = currentStep === TOUR_STEPS.length - 1;
	const hasSpotlight = step.highlightSelector && !!spotlightStyle.width;

	// Update spotlight position when step changes
	useEffect(() => {
		if (!step.highlightSelector) {
			setSpotlightStyle({})
			return
		}

		let retryId: ReturnType<typeof setTimeout>
		const retryDelays = [0, 100, 250, 500, 1000]
		let attempt = 0

		const updateSpotlight = () => {
			const element = document.getElementById(step.highlightSelector!)
			if (element) {
				const rect = element.getBoundingClientRect()
				setSpotlightStyle({
					top: `${rect.top}px`,
					left: `${rect.left}px`,
					width: `${rect.width}px`,
					height: `${rect.height}px`,
				})
				return
			}

			// Element not found yet — retry up to the limit, then give up gracefully
			attempt++
			if (attempt < retryDelays.length) {
				retryId = setTimeout(updateSpotlight, retryDelays[attempt])
			} else {
				console.warn(`FTUE: element #${step.highlightSelector} not found — showing step without highlight`)
				setSpotlightStyle({})
			}
		}

		retryId = setTimeout(updateSpotlight, retryDelays[0])
		window.addEventListener("resize", updateSpotlight)

		return () => {
			clearTimeout(retryId)
			window.removeEventListener("resize", updateSpotlight)
		}
	}, [step.highlightSelector]);

	return (
		<div className={classNames("FTUE", className)}>
			<button className="close" onClick={close} />
			<div className="drag" onMouseDown={drag} />

			{/* Dark overlay - only show when no spotlight */}
			{!hasSpotlight && (
				<div className="ftue-overlay" onClick={nextStep} />
			)}

			{/* Spotlight highlight — only render when element was actually found */}
			{hasSpotlight && (
				<div
					ref={spotlightRef}
					className="ftue-spotlight"
					style={spotlightStyle}
				/>
			)}

			{/* Tooltip */}
			<div
				className={classNames("ftue-tooltip", `ftue-tooltip-${step.position}`)}
			>
				<div className="ftue-tooltip-content">
					<h2>{step.title}</h2>
					<p>{step.description}</p>

					<div className="ftue-tooltip-actions">
						{!isFirstStep && (
							<button
								className="ftue-btn ftue-btn-secondary"
								onClick={prevStep}
							>
								Back
							</button>
						)}
						<button
							className={classNames(
								"ftue-btn",
								isLastStep ? "ftue-btn-cta" : "ftue-btn-primary",
							)}
							onClick={nextStep}
						>
							{isLastStep ? "Get started" : isFirstStep ? "Start tour" : "Next"}
						</button>
					</div>

					{/* Progress indicator */}
					<div className="ftue-progress">
						{TOUR_STEPS.map((_, index) => (
							<button
								key={index}
								className={classNames("ftue-progress-dot", {
									active: index === currentStep,
								})}
								onClick={() => setCurrentStep(index)}
								aria-label={`Go to step ${index + 1}`}
							/>
						))}
					</div>
				</div>
			</div>

			<button className="skip" onClick={setFTUESeen}>
				Skip tour
			</button>
		</div>
	);
}
