import { useState } from "react";
import { BuildSet } from "../../services/buildStorage";

import "./BuildSelectorModal.scss";

type Props = {
	buildSets: BuildSet[];
	currentBuildSetId: string | null;
	onSelect: (id: string) => void;
	onNew: () => void;
	onEdit: (id: string, name: string, ascendancy: string | null) => void;
	onDelete: (id: string) => void;
	onClose: () => void;
};

function getCardMeta(buildSet: BuildSet) {
	const { breakpoints } = buildSet;

	// Prefer the build-level ascendancy; fall back to the first breakpoint's
	const ascendancy =
		buildSet.ascendancy ??
		(breakpoints.length > 0
			? [...breakpoints].sort((a, b) => a.level - b.level)[0].selectedAscendancy
			: null) ??
		null;

	if (breakpoints.length === 0) {
		return { ascendancy, levelRange: null, stepCount: 0 };
	}

	const sorted = [...breakpoints].sort((a, b) => a.level - b.level);
	const minLevel = sorted[0].level;
	const maxLevel = sorted[sorted.length - 1].level;
	const levelRange = minLevel === maxLevel ? `L${minLevel}` : `L${minLevel}–L${maxLevel}`;

	return { ascendancy, levelRange, stepCount: breakpoints.length };
}

export function BuildSelectorModal({
	buildSets,
	currentBuildSetId,
	onSelect,
	onNew,
	onEdit,
	onDelete,
	onClose,
}: Props) {
	const [hoveredId, setHoveredId] = useState<string | null>(null);

	const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
		e.stopPropagation();
		if (window.confirm(`Delete build "${name}"? This will also delete all breakpoints.`)) {
			onDelete(id);
		}
	};

	const handleEdit = (e: React.MouseEvent, buildSet: BuildSet) => {
		e.stopPropagation();
		// Use the effective ascendancy (same logic as the card display) so the
		// form pre-selects whatever the card is already showing.
		const { ascendancy } = getCardMeta(buildSet);
		onEdit(buildSet.id, buildSet.name, ascendancy);
	};

	return (
		<div className="BuildSelectorModal" onClick={onClose}>
			<div className="modal-panel" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<span className="modal-title">My Builds</span>
					<button className="modal-close" onClick={onClose} title="Close">
						×
					</button>
				</div>

				<div className="modal-grid">
					{buildSets.map((buildSet) => {
						const { ascendancy, levelRange, stepCount } = getCardMeta(buildSet);
						const isActive = buildSet.id === currentBuildSetId;
						const isHovered = hoveredId === buildSet.id;

						return (
							<div
								key={buildSet.id}
								className={`build-card ${isActive ? "active" : ""}`}
								onClick={() => onSelect(buildSet.id)}
								onMouseEnter={() => setHoveredId(buildSet.id)}
								onMouseLeave={() => setHoveredId(null)}
							>
								{isHovered && (
									<div className="card-actions">
										<button
											className="card-action-btn edit-btn"
											title="Edit build (name & ascendancy)"
											onClick={(e) => handleEdit(e, buildSet)}
										>
											<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor">
												<path d="M11.498 2.002a1.5 1.5 0 0 1 2.122 2.12l-8.5 8.501a.5.5 0 0 1-.2.122l-3 1a.5.5 0 0 1-.633-.633l1-3a.5.5 0 0 1 .122-.2l8.5-8.5z"/>
											</svg>
										</button>
										<button
											className="card-action-btn delete-btn"
											title="Delete build"
											onClick={(e) => handleDelete(e, buildSet.id, buildSet.name)}
										>
											<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor">
												<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
												<path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
											</svg>
										</button>
									</div>
								)}

								<div className="card-name">{buildSet.name}</div>

								{ascendancy ? (
									<div className="card-ascendancy">{ascendancy}</div>
								) : (
									<div className="card-ascendancy unset">No ascendancy set</div>
								)}

								<div className="card-meta">
									{levelRange && <span className="card-levels">{levelRange}</span>}
									<span className="card-steps">
										{stepCount === 0 ? "No steps" : stepCount === 1 ? "1 step" : `${stepCount} steps`}
									</span>
								</div>
							</div>
						);
					})}

					{/* + New Build card */}
					<div className="build-card new-card" onClick={onNew}>
						<div className="new-card-icon">+</div>
						<div className="new-card-label">New Build</div>
					</div>
				</div>
			</div>
		</div>
	);
}
