import { useEffect, useRef, useState } from "react";
import { AiOutlineUnorderedList } from "react-icons/ai";
import { classNames } from "../../utils";
import { PassiveTreeManager } from "./passiveTreeLogic";
import { BuildSet } from "../../services/buildStorage";
import { useEventBus } from "../../hooks/use-event-bus";
import { kAppPopups } from "../../config/enums";
import { BuildSelectorModal } from "../BuildSelectorModal/BuildSelectorModal";
import { BreakpointTimeline } from "../BreakpointTimeline/BreakpointTimeline";

import "./ScreenPassiveTree.scss";

export type ScreenPassiveTreeProps = {
	className?: string;
};

export function ScreenPassiveTree({ className }: ScreenPassiveTreeProps) {
	const treeContainerRef = useRef<HTMLDivElement>(null);
	const treeManagerRef = useRef<PassiveTreeManager | null>(null);
	const eventBus = useEventBus();
	const [zoomLevel, setZoomLevel] = useState(1.0);

	// Build management state (mirrored from PassiveTreeManager)
	const [buildSets, setBuildSets] = useState<BuildSet[]>([]);
	const [currentBuildSetId, setCurrentBuildSetId] = useState<string | null>(null);
	const [currentBreakpointId, setCurrentBreakpointId] = useState<string | null>(null);
	const [isReadOnly, setIsReadOnly] = useState(true);
	const [showBuildModal, setShowBuildModal] = useState(false);

	const ZOOM_MIN = 0.5;
	const ZOOM_MAX = 10.0;
	const zoomPercent = ((zoomLevel - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100;

	// Derive sorted breakpoints for the currently active build
	const currentBreakpointSortedList =
		buildSets
			.find((b) => b.id === currentBuildSetId)
			?.breakpoints.slice()
			.sort((a, b) => a.level - b.level) ?? [];

	const currentBuildSet = buildSets.find((b) => b.id === currentBuildSetId) ?? null;
	const currentBreakpoint = currentBuildSet?.breakpoints.find((bp) => bp.id === currentBreakpointId) ?? null;

	useEffect(() => {
		const handleZoomChange = (e: Event) => {
			setZoomLevel((e as CustomEvent<{ zoom: number }>).detail.zoom);
		};
		document.addEventListener('treezoomchange', handleZoomChange);
		return () => document.removeEventListener('treezoomchange', handleZoomChange);
	}, []);

	useEffect(() => {
		const handleCreateBuildSet = (name: string) => {
			if (treeManagerRef.current) {
				treeManagerRef.current.handleCreateBuildSet(name);
			}
		};

		const handleCreateBreakpoint = (data: { name: string; level: number }) => {
			if (treeManagerRef.current) {
				treeManagerRef.current.handleCreateBreakpoint(data.name, data.level);
			}
		};

		const handleEditBuildSet = (data: { id: string; name: string; ascendancy: string | null }) => {
			if (treeManagerRef.current) {
				treeManagerRef.current.handleEditBuildSet(data.id, data.name, data.ascendancy);
			}
		};

		const handleEditBreakpoint = (data: { buildSetId: string; breakpointId: string; name: string; level: number }) => {
			if (treeManagerRef.current) {
				treeManagerRef.current.handleEditBreakpoint(data.buildSetId, data.breakpointId, data.name, data.level);
			}
		};

		const handleDeleteBuildSet = (id: string) => {
			if (treeManagerRef.current) {
				treeManagerRef.current.handleDeleteBuildSet(id);
			}
		};

		const handleDeleteBreakpoint = (data: { buildSetId: string; breakpointId: string }) => {
			if (treeManagerRef.current) {
				treeManagerRef.current.handleDeleteBreakpoint(data.buildSetId, data.breakpointId);
			}
		};

		if (treeContainerRef.current) {
			treeManagerRef.current = new PassiveTreeManager(
				() => eventBus.emit('setPopup', kAppPopups.AddBuildSet),
				() => eventBus.emit('setPopup', kAppPopups.AddBreakpoint),
				eventBus,
				(state) => {
					setBuildSets(state.buildSets);
					setCurrentBuildSetId(state.currentBuildSetId);
					setCurrentBreakpointId(state.currentBreakpointId);
					setIsReadOnly(state.isReadOnly);
				}
			);
			treeManagerRef.current.initialize(treeContainerRef.current);
		}

		// Listen for events from popups
		eventBus.on({
			createBuildSet: handleCreateBuildSet,
			createBreakpoint: handleCreateBreakpoint,
			editBuildSet: handleEditBuildSet,
			editBreakpoint: handleEditBreakpoint,
			deleteBuildSet: handleDeleteBuildSet,
			deleteBreakpoint: handleDeleteBreakpoint
		});

		return () => {
			// Cleanup
			treeManagerRef.current = null;
		};
	}, [eventBus]);

	return (
		<div className={classNames("ScreenPassiveTree", className)} id="ScreenPassiveTree">
			<div className="primary">
				<div id="tree-container" ref={treeContainerRef}></div>
				<div id="node-tooltip" style={{ display: "none" }}>
					<div className="tooltip-title"></div>
					<div className="tooltip-stats"></div>
				</div>

				{/* Floating Zoom Widget — bottom-left, shifts up when timeline is visible */}
				<div
					className="zoom-widget"
					style={{ bottom: currentBuildSetId ? 84 : 28 }}
				>
					<button className="zoom-step-btn" id="zoom-in-btn" title="Zoom In">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
							<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
						</svg>
					</button>

					<div className="zoom-track">
						<div className="zoom-fill" style={{ height: `${zoomPercent}%` }} />
					</div>

					<button className="zoom-step-btn" id="zoom-out-btn" title="Zoom Out">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
					</button>

					<span className="zoom-label">{zoomLevel.toFixed(1)}×</span>

					<button className="zoom-reset-btn" id="reset-camera-btn" title="Reset View">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
							<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
							<line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
							<line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
						</svg>
					</button>
				</div>

				{/* Breakpoint timeline — shown whenever a build is active so the
				    user can always create the first step */}
				{currentBuildSetId && (
					<BreakpointTimeline
						breakpoints={currentBreakpointSortedList}
						currentBreakpointId={currentBreakpointId}
						onSelect={(id) => treeManagerRef.current?.handleBreakpointChange(id)}
					/>
				)}
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

						{/* Hidden — passiveTreeLogic drives these by DOM ID; visible selectors live in ScreenBuilder */}
						<div className="class-selection" style={{ display: 'none' }}>
							<label htmlFor="class-dropdown">Starting Class</label>
							<select id="class-dropdown">
								<option value="">-- Select Class --</option>
								<option value="47175">Warrior</option>
								<option value="50459">Ranger</option>
								<option value="50459">Huntress</option>
								<option value="50986">Mercenary</option>
								<option value="54447">Sorceress</option>
								<option value="54447">Witch</option>
								<option value="44683">Monk</option>
								<option value="61525">Druid</option>
							</select>
						</div>
						<div className="class-selection" style={{ display: 'none' }}>
							<label htmlFor="ascendancy-dropdown">Ascendancy</label>
							<select id="ascendancy-dropdown">
								<option value="">-- Select Class First --</option>
							</select>
						</div>

						{/* Active build bar — replaces the old build-management dropdowns */}
						<div className="active-build-bar">
							<div className="active-build-info">
								<span className="active-build-label">Build</span>
								<span className="active-build-name">
									{currentBuildSet?.name ?? "None"}
								</span>
							</div>
							<button
								className="change-build-btn"
								onClick={() => setShowBuildModal(true)}
							>
								<AiOutlineUnorderedList />
								Change
							</button>
						</div>

						{/* Step selector — visible when a build is active */}
						{currentBuildSetId && (
							<div className="step-select-bar">
								<div className="step-select-header">
									<span className="step-select-label">Step</span>
									{!isReadOnly && <span className="editing-badge">Editing</span>}
								</div>
								{currentBreakpointSortedList.length === 0 ? (
									<div className="step-select-empty">
										No steps yet — go to Builder to create one
									</div>
								) : (
									<select
										className="step-select-dropdown"
										value={currentBreakpointId ?? ""}
										onChange={(e) =>
											treeManagerRef.current?.handleBreakpointChange(e.target.value)
										}
									>
										<option value="">— Select Step —</option>
										{currentBreakpointSortedList.map((step) => (
											<option key={step.id} value={step.id}>
												L{step.level} · {step.name || "Unnamed"}
											</option>
										))}
									</select>
								)}
							</div>
						)}

						{/* Skill gems for the active step */}
						{currentBreakpoint && (
							<div className="skill-gems-section">
								<div className="skill-gems-label">Skill Gems</div>
								{currentBreakpoint.skills.length === 0 ? (
									<div className="skill-gems-empty">No skills set — add them in the Builder.</div>
								) : (
									<div className="skill-gems-list">
										{currentBreakpoint.skills.map((skill) => {
											const colorClass =
												skill.color === 1 ? "red" :
												skill.color === 2 ? "green" :
												skill.color === 3 ? "blue" : "white";
											return (
												<div key={skill.id} className={`skill-gem-row gem-color-${colorClass}`}>
													<div className={`skill-gem-dot gem-color-${colorClass}`}>
														{skill.iconUrl
															? <img src={skill.iconUrl} alt={skill.name} className="skill-gem-img" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
															: skill.name[0]}
													</div>
													<span className="skill-gem-name">{skill.name}</span>
													<div className="skill-support-dots">
														{skill.supports.map((sup, i) => {
															if (!sup) return (
																<div key={i} className="support-dot empty" />
															);
															const sc =
																sup.color === 1 ? "red" :
																sup.color === 2 ? "green" :
																sup.color === 3 ? "blue" : "white";
															return (
																<div
																	key={i}
																	className={`support-dot filled gem-color-${sc}`}
																	title={sup.name}
																/>
															);
														})}
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}

						{/* Hidden DOM dropdowns — passiveTreeLogic still reads/writes these */}
						<div className="build-management">
							<div className="build-set-selection">
								<div className="dropdown-container">
									<select id="build-set-dropdown">
										<option value="">-- New Build Set --</option>
									</select>
									<button id="new-set-btn" title="Create New Build Set">+</button>
									<button id="edit-set-btn" title="Edit Build Set Name">✎</button>
									<button id="delete-set-btn" title="Delete Build Set">×</button>
								</div>
							</div>

							<div className="breakpoint-selection">
								<div className="dropdown-container">
									<select id="breakpoint-dropdown">
										<option value="">-- Select Breakpoint --</option>
									</select>
									<button id="add-breakpoint-btn" title="Add Level Breakpoint">+</button>
									<button id="edit-breakpoint-btn" title="Edit Breakpoint Name">✎</button>
									<button id="delete-breakpoint-btn-quick" title="Delete Breakpoint">×</button>
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

			{/* Build selector modal */}
			{showBuildModal && (
				<BuildSelectorModal
					buildSets={buildSets}
					currentBuildSetId={currentBuildSetId}
					onSelect={(id) => {
						treeManagerRef.current?.handleBuildSetChange(id);
						setShowBuildModal(false);
					}}
					onNew={() => {
						eventBus.emit('setPopup', kAppPopups.AddBuildSet);
						setShowBuildModal(false);
					}}
					onEdit={(id, name, ascendancy) => {
						eventBus.emit('openEditBuildSet', { id, name, ascendancy });
						setShowBuildModal(false);
					}}
					onDelete={(id) => treeManagerRef.current?.handleDeleteBuildSet(id)}
					onClose={() => setShowBuildModal(false)}
				/>
			)}
		</div>
	);
}
