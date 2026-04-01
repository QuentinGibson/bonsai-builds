import { useContext } from "react";
import { CommonStoreContext } from "../../hooks/common-context";
import { classNames } from "../../utils";

import "./AdPremium.scss";

import { Ad } from "../Ad/Ad";

export type AdPremiumProps = {
	className?: string;
};

export function AdPremium({ className }: AdPremiumProps) {
	const { isPremium } = useContext(CommonStoreContext);

	if (isPremium) return null;

	return (
		<div className={classNames("AdPremium", className)}>
			<Ad />
		</div>
	);
}
