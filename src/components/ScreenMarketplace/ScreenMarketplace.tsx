import { useEffect, useState } from "react";
import { classNames } from "../../utils";
import {
  marketplaceService,
  type MarketplaceBuild,
} from "../../services/marketplaceService";
import { buildStorage } from "../../services/buildStorage";

import "./ScreenMarketplace.scss";

export type ScreenMarketplaceProps = {
  className?: string;
};

type View = { kind: "list" } | { kind: "detail"; id: string };

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

function DetailView({
  listingId,
  myUserId,
  onBack,
}: {
  listingId: string;
  myUserId: string;
  onBack: () => void;
}) {
  const [listing, setListing] = useState<MarketplaceBuildDetail | null>(null);
  const [liked, setLiked] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const isMyListing = listing?.authorId === myUserId;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      marketplaceService.getListing(listingId),
      marketplaceService.getUserLike(listingId),
      marketplaceService.getUserRating(listingId),
    ]).then(([detail, userLiked, userRating]) => {
      if (cancelled) return;
      setListing(detail);
      setLiked(userLiked);
      setMyRating(userRating);
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
    // Import breakpoints into the user's active build set
    const currentId = buildStorage.getCurrentBuildSetId();
    if (!currentId) {
      alert("Select or create a build first before importing.");
      return;
    }
    for (const bp of listing.breakpoints) {
      await buildStorage.addBreakpoint(currentId, {
        name: bp.name,
        level: bp.level,
        allocatedNodes: bp.allocatedNodes,
        allocatedAscendancyNodes: bp.allocatedAscendancyNodes,
        selectedClass: bp.selectedClass ?? null,
        selectedAscendancy: bp.selectedAscendancy ?? null,
      });
    }
    await marketplaceService.incrementDownload(listingId);
    setListing((prev) =>
      prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : prev
    );
  };

  const handleDeleteListing = async () => {
    if (!confirm("Delete this listing from the marketplace?")) return;
    await marketplaceService.deleteListing(listingId);
    onBack();
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() || myUserId === "anon") return;
    setSubmittingComment(true);
    await marketplaceService.addComment(listingId, comment.trim());
    const updated = await marketplaceService.getListing(listingId);
    setListing(updated);
    setComment("");
    setSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await marketplaceService.deleteComment(commentId);
    setListing((prev) =>
      prev
        ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }
        : prev
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
        {isMyListing && (
          <button className="delete-btn" onClick={handleDeleteListing}>
            Delete listing
          </button>
        )}
      </div>

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
          ↓ Import to active build · {listing.downloadCount}
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
        <h3>Comments ({listing.comments.length})</h3>

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
            onClick={handleSubmitComment}
          >
            Post
          </button>
        </div>

        <div className="comments-list">
          {listing.comments.length === 0 && (
            <p className="no-comments">No comments yet.</p>
          )}
          {listing.comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="comment-header">
                <span className="comment-author">{c.authorName}</span>
                <span className="comment-date">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
                {c.authorId === myUserId && (
                  <button
                    className="comment-delete"
                    onClick={() => handleDeleteComment(c.id)}
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="comment-body">{c.body}</p>
            </div>
          ))}
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

  const handlePublish = async () => {
    const build = buildSets.find((b) => b.id === selectedId);
    if (!build || !build.className) return;
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

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="publish-btn"
            disabled={!selectedId || submitting}
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

  const filtered = listings.filter(
    (l) =>
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.authorName.toLowerCase().includes(search.toLowerCase()) ||
      l.className.toLowerCase().includes(search.toLowerCase())
  );

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
          placeholder="Search builds, authors, class…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
          {search ? "No builds match your search." : "No builds published yet. Be the first!"}
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
