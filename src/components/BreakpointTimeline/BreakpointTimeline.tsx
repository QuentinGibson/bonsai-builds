import { Breakpoint } from "../../services/buildStorage";

import "./BreakpointTimeline.scss";

type Props = {
	breakpoints: Breakpoint[]; // sorted by level, already from PassiveTreeManager
	currentBreakpointId: string | null;
	onSelect: (id: string) => void;
};

export function BreakpointTimeline({
	breakpoints,
	currentBreakpointId,
	onSelect,
}: Props) {
	const currentIndex = breakpoints.findIndex((bp) => bp.id === currentBreakpointId);
	const isEmpty = breakpoints.length === 0;

	const handlePrev = () => {
		if (currentIndex > 0) {
			onSelect(breakpoints[currentIndex - 1].id);
		}
	};

	const handleNext = () => {
		if (currentIndex < breakpoints.length - 1) {
			onSelect(breakpoints[currentIndex + 1].id);
		}
	};

	return (
		<div className="BreakpointTimeline">
			{!isEmpty && (
				<button
					className="timeline-arrow"
					onClick={handlePrev}
					disabled={currentIndex <= 0}
					title="Previous step"
				>
					‹
				</button>
			)}

			<div className="timeline-track">
				{isEmpty ? (
					<span className="timeline-empty">No steps yet — go to the Builder tab to create your first step</span>
				) : (
					<>
						<div className="timeline-line" />
						{breakpoints.map((bp, i) => {
							const isActive = bp.id === currentBreakpointId;
							const isPast = i < currentIndex;

							return (
								<button
									key={bp.id}
									className={`timeline-dot ${isActive ? "active" : isPast ? "past" : "future"}`}
									onClick={() => onSelect(bp.id)}
									title={`${bp.name} — Level ${bp.level}`}
								>
									<span className="dot-label">L{bp.level}</span>
									{bp.name && <span className="dot-name">{bp.name}</span>}
								</button>
							);
						})}
					</>
				)}
			</div>

			{!isEmpty && (
				<button
					className="timeline-arrow"
					onClick={handleNext}
					disabled={currentIndex >= breakpoints.length - 1}
					title="Next step"
				>
					›
				</button>
			)}
		</div>
	);
}
