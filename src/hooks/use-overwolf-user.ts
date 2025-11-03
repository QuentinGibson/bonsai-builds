import { useEffect, useState } from "react";

export function useOverwolfUser() {
	const [user, setUser] =
		useState<overwolf.profile.GetCurrentUserResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		overwolf.profile.getCurrentUser((result) => {
			if (!isMounted) return;

			if (result.success) {
				setUser(result);
				setError(null);
			} else {
				setError(result.error || "Failed to get user");
				setUser(null);
			}
			setIsLoading(false);
		});

		return () => {
			isMounted = false;
		};
	}, []);

	return { user, isLoading, error };
}
