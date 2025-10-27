import { useEffect, useRef } from "react";
import { classNames } from "../../utils";
import { PassiveTreeManager } from "./passiveTreeLogic";

import "./ScreenPassiveTree.scss";

export type ScreenPassiveTreeProps = {
	className?: string;
};

export function ScreenPassiveTree({ className }: ScreenPassiveTreeProps) {
	const treeContainerRef = useRef<HTMLDivElement>(null);
	const treeManagerRef = useRef<PassiveTreeManager | null>(null);

	useEffect(() => {
		if (treeContainerRef.current) {
			treeManagerRef.current = new PassiveTreeManager();
			treeManagerRef.current.initialize(treeContainerRef.current);
		}

		return () => {
			// Cleanup if needed
			treeManagerRef.current = null;
		};
	}, []);

	return (
		<div className={classNames("ScreenPassiveTree", className)}>
			<div className="primary">
				<div id="tree-container" ref={treeContainerRef}></div>
				<div id="node-tooltip" style={{ display: "none" }}>
					<div className="tooltip-title"></div>
					<div className="tooltip-stats"></div>
				</div>
			</div>

			<aside className="secondary">
				<div className="tree-controls-wrapper">
					<div className="tree-controls">
						<h3>Passive Tree Planner</h3>

						<div className="points-display">
							<div className="points-row">
								<span className="points-label">Skill Points:</span>
								<span className="points-value">
									<span id="points-used">0</span> /{" "}
									<span id="points-max">123</span>
								</span>
							</div>
							<div className="points-row">
								<span className="points-label">Ascendancy:</span>
								<span className="points-value">
									<span id="ascendancy-points-used">0</span> /{" "}
									<span id="ascendancy-points-max">8</span>
								</span>
							</div>
						</div>

						<div className="class-selection">
							<label htmlFor="class-dropdown">Starting Class</label>
							<select id="class-dropdown">
								<option value="">-- Select Class --</option>
								<option value="50986">Mercenary</option>
								<option value="54447">Sorceress</option>
								<option value="54447">Witch</option>
								<option value="50459">Ranger</option>
								<option value="50459">Huntress</option>
								<option value="47175">Warrior</option>
								<option value="44683">Monk</option>
							</select>
						</div>

						<div className="class-selection">
							<label htmlFor="ascendancy-dropdown">Ascendancy</label>
							<select id="ascendancy-dropdown">
								<option value="">-- Select Class First --</option>
							</select>
						</div>

						<div className="build-management">
							<h4>Build Management</h4>

							<div className="build-set-selection">
								<div className="dropdown-container">
									<select id="build-set-dropdown">
										<option value="">-- New Build Set --</option>
									</select>
									<button id="new-set-btn" title="Create New Build Set">
										+
									</button>
									<button id="edit-set-btn" title="Edit Build Set Name">
										✎
									</button>
									<button id="delete-set-btn" title="Delete Build Set">
										×
									</button>
								</div>
							</div>

							<div className="breakpoint-selection">
								<div className="dropdown-container">
									<select id="breakpoint-dropdown">
										<option value="">-- Select Breakpoint --</option>
									</select>
									<button id="add-breakpoint-btn" title="Add Level Breakpoint">
										+
									</button>
									<button id="edit-breakpoint-btn" title="Edit Breakpoint Name">
										✎
									</button>
									<button
										id="delete-breakpoint-btn-quick"
										title="Delete Breakpoint"
									>
										×
									</button>
								</div>
							</div>

							<div className="build-actions">
								<button id="save-breakpoint-btn">Save Current</button>
								<button id="load-breakpoint-btn">Load</button>
							</div>
						</div>
					</div>
				</div>
			</aside>
		</div>
	);
}
