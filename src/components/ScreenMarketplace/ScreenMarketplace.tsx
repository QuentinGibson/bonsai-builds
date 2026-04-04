import React, { useEffect, useState } from "react";
import { classNames } from "../../utils";
import {
  marketplaceService,
  type MarketplaceBuild,
  type MarketplaceComment,
} from "../../services/marketplaceService";
import { buildStorage } from "../../services/buildStorage";

import "./ScreenMarketplace.scss";

export type ScreenMarketplaceProps = {
  className?: string;
};

type View = { kind: "list" } | { kind: "detail"; id: string };

const CLASSES: { name: string; ascendancies: string[] }[] = [
  { name: "Warrior",   ascendancies: ["Titan", "Warbringer", "Smith of Kitava"] },
  { name: "Ranger",    ascendancies: ["Deadeye", "Pathfinder"] },
  { name: "Huntress",  ascendancies: ["Amazon", "Ritualist"] },
  { name: "Mercenary", ascendancies: ["Tactician", "Witchhunter", "Gemling Legionnaire"] },
  { name: "Sorceress", ascendancies: ["Stormweaver", "Chronomancer", "Disciple of Varashta"] },
  { name: "Witch",     ascendancies: ["Infernalist", "Blood Mage", "Lich"] },
  { name: "Monk",      ascendancies: ["Invoker", "Acolyte of Chayula"] },
  { name: "Druid",     ascendancies: ["Oracle", "Shaman"] },
];

function StarRating({
  value,
  interactive,
  onRate,
}: {
  value: number;
  interactive?: boolean;
  onRate?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className={classNames("StarRating", { interactive })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={classNames("star", { filled: n <= display })}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate?.(n)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ListingCard({
  listing,
  onOpen,
}: {
  listing: MarketplaceBuild;
  onOpen: () => void;
}) {
  return (
    <div className="ListingCard" onClick={onOpen}>
      <div className="card-header">
        <span className="card-name">{listing.name}</span>
        {listing.className && (
          <span className="card-class">
            {listing.className}
            {listing.ascendancy ? ` · ${listing.ascendancy}` : ""}
          </span>
        )}
      </div>

      <p className="card-description">{listing.description || "No description."}</p>

      <div className="card-meta">
        <span className="card-author">by {listing.authorName}</span>

        <div className="card-stats">
          <StarRating value={listing.averageRating} />
          {listing.ratingCount > 0 && (
            <span className="stat-count">({listing.ratingCount})</span>
          )}
          <span className="stat">♥ {listing.likeCount}</span>
          <span className="stat">↓ {listing.downloadCount}</span>
        </div>
      </div>
    </div>
  );
}

const REPORT_REASONS = ["Spam", "Inappropriate content", "Misinformation", "Harassment", "Other"];

function ReportModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="ReportModal-overlay" onClick={onClose}>
      <div className="ReportModal" onClick={(e) => e.stopPropagation()}>
        <h3>Report content</h3>
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">Select a reason…</option>
          {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="report-submit-btn"
            disabled={!reason}
            onClick={() => { onSubmit(reason); onClose(); }}
          >Submit report</button>
        </div>
      </div>
    </div>
  );
}

type CommentNode = MarketplaceComment & { replies: CommentNode[] };

function buildTree(flat: MarketplaceComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  const roots: CommentNode[] = [];
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function DetailView({
  listingId,
  myUserId,
  onBack,
}: {
  listingId: string;
  myUserId: string;
  onBack: () => void;
}) {
  const [listing, setListing] = useState<MarketplaceBuild | null>(null);
  const [liked, setLiked] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [hiddenComments, setHiddenComments] = useState<Set<string>>(new Set());
  const [reportTarget, setReportTarget] = useState<{ id: string; type: "comment" | "listing" } | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [showEdit, setShowEdit] = useState(false);

  const isMyListing = !!myUserId && myUserId !== "anon" && listing?.authorId === myUserId;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      marketplaceService.getListing(listingId),
      marketplaceService.getUserLike(listingId),
      marketplaceService.getUserRating(listingId),
      marketplaceService.getUserCommentVotes(listingId),
      marketplaceService.getUserHiddenComments(listingId),
    ]).then(([detail, userLiked, userRating, userVotes, userHidden]) => {
      if (cancelled) return;
      setListing(detail);
      setLiked(userLiked);
      setMyRating(userRating);
      setMyVotes(userVotes);
      setHiddenComments(new Set(userHidden));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [listingId]);

  const handleLike = async () => {
    if (!listing || myUserId === "anon") return;
    const nowLiked = await marketplaceService.toggleLike(listingId);
    setLiked(nowLiked);
    setListing((prev) =>
      prev
        ? { ...prev, likeCount: prev.likeCount + (nowLiked ? 1 : -1) }
        : prev
    );
  };

  const handleRate = async (value: number) => {
    if (myUserId === "anon") return;
    const isNew = myRating === null;
    const oldRating = myRating ?? 0;
    setMyRating(value);
    await marketplaceService.setRating(listingId, value);
    setListing((prev) => {
      if (!prev) return prev;
      const newCount = isNew ? prev.ratingCount + 1 : prev.ratingCount;
      const newSum = prev.averageRating * prev.ratingCount - oldRating + value;
      return {
        ...prev,
        ratingCount: newCount,
        averageRating: newCount > 0 ? newSum / newCount : 0,
      };
    });
  };

  const handleDownload = async () => {
    if (!listing) return;
    const newBuild = await buildStorage.createBuildSet(listing.name);
    await buildStorage.updateBuildSet(newBuild.id, {
      className: listing.className || undefined,
      ascendancy: listing.ascendancy || undefined,
    });
    for (const bp of listing.breakpoints ?? []) {
      await buildStorage.addBreakpoint(newBuild.id, {
        name: bp.name,
        level: bp.level,
        allocatedNodes: bp.allocatedNodes,
        allocatedAscendancyNodes: bp.allocatedAscendancyNodes,
        selectedClass: bp.selectedClass ?? null,
        selectedAscendancy: bp.selectedAscendancy ?? null,
      });
    }
    buildStorage.setCurrentBuildSetId(newBuild.id);
    await marketplaceService.incrementDownload(listingId);
    setListing((prev) =>
      prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : prev
    );
    alert(`"${listing.name}" imported as a new build.`);
  };

  const handleDeleteListing = async () => {
    if (!confirm("Delete this listing from the marketplace?")) return;
    await marketplaceService.deleteListing(listingId);
    onBack();
  };

  const handleSubmitComment = async (parentId?: string) => {
    const text = parentId ? replyText : comment;
    if (!text.trim() || myUserId === "anon") return;
    setSubmittingComment(true);
    await marketplaceService.addComment(listingId, text.trim(), parentId);
    const updated = await marketplaceService.getListing(listingId);
    setListing(updated);
    if (parentId) {
      setReplyText("");
      setReplyingTo(null);
    } else {
      setComment("");
    }
    setSubmittingComment(false);
  };

  const handleHideComment = async (commentId: string) => {
    const isHidden = hiddenComments.has(commentId);
    setHiddenComments((prev) => {
      const next = new Set(prev);
      isHidden ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    await marketplaceService.toggleHideComment(commentId);
  };

  const handleReport = async (reason: string) => {
    if (!reportTarget) return;
    const alreadyReported = await marketplaceService.reportContent(reportTarget.id, reportTarget.type, reason);
    if (alreadyReported === false) {
      alert("You have already reported this content.");
    } else {
      setReportedIds((prev) => new Set([...prev, reportTarget.id]));
    }
  };

  const handleVoteComment = async (commentId: string, value: 1 | -1 | 0) => {
    if (myUserId === "anon") return;
    const prev = myVotes[commentId] ?? 0;
    const delta = value - prev;
    setMyVotes((v) => ({ ...v, [commentId]: value }));
    setListing((prev) =>
      prev
        ? {
            ...prev,
            comments: prev.comments?.map((c) =>
              c.id === commentId ? { ...c, score: c.score + delta } : c
            ),
          }
        : prev
    );
    await marketplaceService.voteComment(commentId, value);
  };

  const handleDeleteComment = async (commentId: string) => {
    await marketplaceService.deleteComment(commentId);
    setListing((prev) =>
      prev
        ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }
        : prev
    );
  };

  const renderComment = (node: CommentNode, depth: number): React.ReactNode => {
    const isHidden = hiddenComments.has(node.id);

    if (isHidden) {
      return (
        <div key={node.id} className="comment comment-hidden" style={{ marginLeft: depth * 16 }}>
          <span className="hidden-label">[comment hidden]</span>
          <button className="unhide-btn" onClick={() => handleHideComment(node.id)}>Unhide</button>
          {node.replies.length > 0 && node.replies.map((child) => renderComment(child, depth + 1))}
        </div>
      );
    }

    return (
      <div key={node.id} className={classNames("comment", { nested: depth > 0 })} style={{ marginLeft: depth * 16 }}>
        <div className="comment-vote-col">
          <button
            className={classNames("vote-btn up", { active: (myVotes[node.id] ?? 0) === 1 })}
            onClick={() => handleVoteComment(node.id, (myVotes[node.id] ?? 0) === 1 ? 0 : 1)}
            title="Upvote"
          >▲</button>
          <span className="vote-score">{node.score}</span>
          <button
            className={classNames("vote-btn down", { active: (myVotes[node.id] ?? 0) === -1 })}
            onClick={() => handleVoteComment(node.id, (myVotes[node.id] ?? 0) === -1 ? 0 : -1)}
            title="Downvote"
          >▼</button>
        </div>

        <div className="comment-body-col">
          <div className="comment-header">
            <span className="comment-author">{node.authorName}</span>
            <span className="comment-date">{new Date(node.createdAt).toLocaleDateString()}</span>
            {myUserId !== "anon" && (
              <button className="reply-btn" onClick={() => {
                setReplyingTo(replyingTo === node.id ? null : node.id);
                setReplyText("");
              }}>Reply</button>
            )}
            <button className="hide-btn" onClick={() => handleHideComment(node.id)}>Hide</button>
            {!reportedIds.has(node.id) ? (
              <button className="report-btn" onClick={() => setReportTarget({ id: node.id, type: "comment" })}>
                Report
              </button>
            ) : (
              <span className="reported-label">Reported</span>
            )}
            {node.authorId === myUserId && (
              <button className="comment-delete" onClick={() => handleDeleteComment(node.id)}>×</button>
            )}
          </div>

          <p className="comment-body">{node.body}</p>

          {replyingTo === node.id && (
            <div className="reply-input-row">
              <input
                className="comment-input"
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitComment(node.id);
                  if (e.key === "Escape") setReplyingTo(null);
                }}
                autoFocus
              />
              <button
                className="comment-submit"
                disabled={!replyText.trim() || submittingComment}
                onClick={() => handleSubmitComment(node.id)}
              >Reply</button>
              <button className="reply-cancel" onClick={() => setReplyingTo(null)}>Cancel</button>
            </div>
          )}

          {node.replies.map((child) => renderComment(child, depth + 1))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="DetailView loading">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <p>Loading…</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="DetailView error">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <p>Listing not found.</p>
      </div>
    );
  }

  return (
    <div className="DetailView">
      <div className="detail-topbar">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="topbar-actions">
          {!isMyListing && (
            !reportedIds.has(listingId) ? (
              <button className="report-btn" onClick={() => setReportTarget({ id: listingId, type: "listing" })}>
                Report build
              </button>
            ) : (
              <span className="reported-label">Reported</span>
            )
          )}
          {isMyListing && (
            <>
              <button className="edit-btn" onClick={() => setShowEdit(true)}>
                Edit listing
              </button>
              <button className="delete-btn" onClick={handleDeleteListing}>
                Delete listing
              </button>
            </>
          )}
        </div>
      </div>

      {reportTarget && (
        <ReportModal
          onClose={() => setReportTarget(null)}
          onSubmit={handleReport}
        />
      )}

      {showEdit && listing && (
        <EditListingModal
          listing={listing}
          onClose={() => setShowEdit(false)}
          onSaved={async () => {
            setShowEdit(false);
            const updated = await marketplaceService.getListing(listingId);
            setListing(updated);
          }}
        />
      )}

      <div className="detail-header">
        <div className="detail-title-row">
          <h2 className="detail-name">{listing.name}</h2>
          {listing.className && (
            <span className="detail-class">
              {listing.className}
              {listing.ascendancy ? ` · ${listing.ascendancy}` : ""}
            </span>
          )}
        </div>
        <span className="detail-author">by {listing.authorName}</span>
      </div>

      <p className="detail-description">{listing.description || "No description."}</p>

      <div className="detail-actions">
        <div className="action-group">
          <StarRating value={listing.averageRating} />
          <span className="rating-label">
            {listing.averageRating > 0
              ? `${listing.averageRating.toFixed(1)} (${listing.ratingCount})`
              : "No ratings yet"}
          </span>
        </div>

        <div className="action-group">
          <span className="action-label">Your rating:</span>
          <StarRating
            value={myRating ?? 0}
            interactive
            onRate={handleRate}
          />
        </div>

        <button
          className={classNames("like-btn", { liked })}
          onClick={handleLike}
        >
          ♥ {liked ? "Liked" : "Like"} · {listing.likeCount}
        </button>

        <button className="download-btn" onClick={handleDownload}>
          ↓ Import as new build · {listing.downloadCount}
        </button>
      </div>

      {listing.breakpoints.length > 0 && (
        <div className="detail-steps">
          <h3>Steps ({listing.breakpoints.length})</h3>
          <div className="steps-list">
            {[...listing.breakpoints]
              .sort((a, b) => a.level - b.level)
              .map((bp, i) => (
                <div key={i} className="step-row">
                  <span className="step-level">L{bp.level}</span>
                  <span className="step-name">{bp.name || "Unnamed"}</span>
                  <span className="step-nodes">
                    {bp.allocatedNodes.length} nodes
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="detail-comments">
        <h3>Comments ({(listing.comments ?? []).length})</h3>

        <div className="comment-input-row">
          <input
            className="comment-input"
            placeholder={myUserId === "anon" ? "Log in to comment" : "Add a comment…"}
            value={comment}
            disabled={myUserId === "anon"}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
          />
          <button
            className="comment-submit"
            disabled={!comment.trim() || submittingComment || myUserId === "anon"}
            onClick={() => handleSubmitComment()}
          >
            Post
          </button>
        </div>

        <div className="comments-list">
          {(listing.comments ?? []).length === 0 && (
            <p className="no-comments">No comments yet.</p>
          )}
          {buildTree(listing.comments ?? []).map((node) =>
            renderComment(node, 0)
          )}
        </div>
      </div>
    </div>
  );
}

function EditListingModal({
  listing,
  onClose,
  onSaved,
}: {
  listing: MarketplaceBuild;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [buildSets, setBuildSets] = useState<
    { id: string; name: string; className: string; ascendancy: string; breakpoints: any[] }[]
  >([]);
  const [name, setName] = useState(listing.name);
  const [description, setDescription] = useState(listing.description);
  const [syncBuildId, setSyncBuildId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    buildStorage.getAllBuildSets().then(setBuildSets);
  }, []);

  const syncBuild = buildSets.find((b) => b.id === syncBuildId) ?? null;
  const missingClass = syncBuild ? !syncBuild.className : false;
  const missingSteps = syncBuild ? syncBuild.breakpoints.length === 0 : false;
  const canSave = name.trim().length > 0 && !submitting &&
    (!syncBuildId || (!missingClass && !missingSteps));

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    await marketplaceService.updateListing(listing.id, {
      name: name.trim(),
      description,
      className: syncBuild ? syncBuild.className : listing.className,
      ascendancy: syncBuild ? syncBuild.ascendancy || undefined : listing.ascendancy || undefined,
      breakpoints: syncBuild
        ? syncBuild.breakpoints.map((bp: any) => ({
            name: bp.name,
            level: bp.level,
            allocatedNodes: bp.allocatedNodes,
            allocatedAscendancyNodes: bp.allocatedAscendancyNodes,
            selectedClass: bp.selectedClass ?? undefined,
            selectedAscendancy: bp.selectedAscendancy ?? undefined,
          }))
        : (listing.breakpoints ?? []).map((bp) => ({
            name: bp.name,
            level: bp.level,
            allocatedNodes: bp.allocatedNodes,
            allocatedAscendancyNodes: bp.allocatedAscendancyNodes,
            selectedClass: bp.selectedClass ?? undefined,
            selectedAscendancy: bp.selectedAscendancy ?? undefined,
          })),
    });
    setSubmitting(false);
    onSaved();
  };

  return (
    <div className="PublishModal-overlay" onClick={onClose}>
      <div className="PublishModal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit listing</h3>

        <label>Name</label>
        <input
          className="name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />

        <label>Description</label>
        <textarea
          placeholder="Describe your build, playstyle, or any tips…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        <label>Re-sync steps from local build (optional)</label>
        <select value={syncBuildId} onChange={(e) => setSyncBuildId(e.target.value)}>
          <option value="">— Keep existing steps —</option>
          {buildSets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.className ? ` (${b.className}${b.ascendancy ? ` · ${b.ascendancy}` : ""})` : ""}
            </option>
          ))}
        </select>

        {syncBuild && (missingClass || missingSteps) && (
          <div className="publish-validation">
            {missingClass && <span>⚠ Selected build has no class set.</span>}
            {missingSteps && <span>⚠ Selected build has no steps.</span>}
          </div>
        )}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="publish-btn" disabled={!canSave} onClick={handleSave}>
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishModal({
  onClose,
  onPublished,
}: {
  onClose: () => void;
  onPublished: () => void;
}) {
  const [buildSets, setBuildSets] = useState<
    { id: string; name: string; className?: string; ascendancy?: string; breakpoints: any[] }[]
  >([]);
  const [selectedId, setSelectedId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    buildStorage.getAllBuildSets().then((sets) => {
      setBuildSets(sets);
      if (sets.length > 0) setSelectedId(sets[0].id);
    });
  }, []);

  const selectedBuild = buildSets.find((b) => b.id === selectedId) ?? null;
  const missingClass = selectedBuild ? !selectedBuild.className : false;
  const missingSteps = selectedBuild ? selectedBuild.breakpoints.length === 0 : false;
  const canPublish = !!selectedId && !missingClass && !missingSteps && !submitting;

  const handlePublish = async () => {
    const build = selectedBuild;
    if (!build || !canPublish) return;
    setSubmitting(true);
    await marketplaceService.publish({
      name: build.name,
      description,
      className: build.className,
      ascendancy: build.ascendancy || undefined,
      breakpoints: build.breakpoints.map((bp) => ({
        name: bp.name,
        level: bp.level,
        allocatedNodes: bp.allocatedNodes,
        allocatedAscendancyNodes: bp.allocatedAscendancyNodes,
        selectedClass: bp.selectedClass ?? undefined,
        selectedAscendancy: bp.selectedAscendancy ?? undefined,
      })),
    });
    setSubmitting(false);
    onPublished();
  };

  return (
    <div className="PublishModal-overlay" onClick={onClose}>
      <div className="PublishModal" onClick={(e) => e.stopPropagation()}>
        <h3>Publish build to marketplace</h3>

        <label>Build</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {buildSets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.className ? ` (${b.className}${b.ascendancy ? ` · ${b.ascendancy}` : ""})` : ""}
            </option>
          ))}
        </select>

        <label>Description</label>
        <textarea
          placeholder="Describe your build, playstyle, or any tips…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        {selectedBuild && (missingClass || missingSteps) && (
          <div className="publish-validation">
            {missingClass && <span>⚠ Build has no class set.</span>}
            {missingSteps && <span>⚠ Build has no steps.</span>}
          </div>
        )}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="publish-btn"
            disabled={!canPublish}
            onClick={handlePublish}
          >
            {submitting ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScreenMarketplace({ className }: ScreenMarketplaceProps) {
  const [view, setView] = useState<View>({ kind: "list" });
  const [listings, setListings] = useState<MarketplaceBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState("anon");
  const [showPublish, setShowPublish] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterAscendancy, setFilterAscendancy] = useState("");

  const loadListings = () => {
    setLoading(true);
    marketplaceService.getListings().then((data) => {
      setListings(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadListings();
    marketplaceService.getMyUserId().then(setMyUserId);
  }, []);

  const availableAscendancies = CLASSES.find((c) => c.name === filterClass)?.ascendancies ?? [];

  const filtered = listings.filter((l) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        l.name.toLowerCase().includes(q) ||
        l.authorName.toLowerCase().includes(q) ||
        l.className.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filterClass && l.className !== filterClass) return false;
    if (filterAscendancy && l.ascendancy !== filterAscendancy) return false;
    return true;
  });

  if (view.kind === "detail") {
    return (
      <div className={classNames("ScreenMarketplace", className)}>
        <DetailView
          listingId={view.id}
          myUserId={myUserId}
          onBack={() => {
            setView({ kind: "list" });
            loadListings();
          }}
        />
      </div>
    );
  }

  return (
    <div className={classNames("ScreenMarketplace", className)}>
      <div className="marketplace-toolbar">
        <input
          className="search-input"
          placeholder="Search builds, authors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterClass}
          onChange={(e) => { setFilterClass(e.target.value); setFilterAscendancy(""); }}
        >
          <option value="">All classes</option>
          {CLASSES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <select
          className="filter-select"
          value={filterAscendancy}
          onChange={(e) => setFilterAscendancy(e.target.value)}
          disabled={!filterClass}
        >
          <option value="">All ascendancies</option>
          {availableAscendancies.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button className="refresh-btn" onClick={loadListings}>↻ Refresh</button>
        {myUserId !== "anon" && (
          <button className="publish-btn" onClick={() => setShowPublish(true)}>
            + Publish build
          </button>
        )}
      </div>

      {loading ? (
        <div className="marketplace-loading">Loading listings…</div>
      ) : filtered.length === 0 ? (
        <div className="marketplace-empty">
          {(search || filterClass || filterAscendancy) ? "No builds match your filters." : "No builds published yet. Be the first!"}
        </div>
      ) : (
        <div className="listings-grid">
          {filtered.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              onOpen={() => setView({ kind: "detail", id: l.id })}
            />
          ))}
        </div>
      )}

      {showPublish && (
        <PublishModal
          onClose={() => setShowPublish(false)}
          onPublished={() => {
            setShowPublish(false);
            loadListings();
          }}
        />
      )}
    </div>
  );
}
