import { useEffect, useRef, useState } from "react";

import { AdsService } from "../../services/ads-service";
import { classNames } from "../../utils";

import "./Ad.scss";

export type AdProps = {
	className?: string;
};

export function Ad({ className }: AdProps) {
	const adContainerRef = useRef<HTMLDivElement>(null);
	const adsServiceRef = useRef<AdsService | null>(null);
	const [adError, setAdError] = useState<string | null>(null);
	const containerIdRef = useRef(
		`ad-container-${Math.random().toString(36).substr(2, 9)}`,
	);

	useEffect(() => {
		console.log("Ad component mounted, container ID:", containerIdRef.current);

		// Create AdsService instance
		adsServiceRef.current = new AdsService({
			adContainer: containerIdRef.current,
			size: { width: 400, height: 300 },
			removeOnComplete: false,
			onAdReady: () => {
				console.log("Ad ready");
				setAdError(null);
			},
			onPlayerLoaded: (owAd) => {
				console.log("Ad player loaded", owAd);
			},
			onDisplayAdLoaded: (owAd) => {
				console.log("Display ad loaded", owAd);
			},
			onImpression: (owAd) => {
				console.log("Ad impression", owAd);
			},
			onComplete: (owAd) => {
				console.log("Ad complete", owAd);
			},
			onError: (_owAd, error) => {
				console.error("Ad error:", error);
				setAdError("Ad failed to load");
			},
		});

		// Cleanup
		return () => {
			console.log("Ad component unmounted");
			if (adsServiceRef.current) {
				adsServiceRef.current.destroy();
				adsServiceRef.current = null;
			}
		};
	}, []);

	return (
		<div className={classNames("Ad", className)}>
			<div
				id={containerIdRef.current}
				ref={adContainerRef}
				className="ad-container"
			/>
			{adError && <div className="ad-error">{adError}</div>}
		</div>
	);
}
