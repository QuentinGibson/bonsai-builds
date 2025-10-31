import { useEffect, useState } from "react";
import { kPoe2GameId } from "../config/constants";

const kUnassignedText = "Unassigned";

// Helper to get hotkey binding using overwolf API directly
const getHotkeyBinding = (hotkeyName: string): Promise<string | null> => {
	return new Promise((resolve) => {
		overwolf.settings.hotkeys.get((result) => {
			const poe2Games = result.games?.[kPoe2GameId];
			if (!result || !poe2Games) {
				resolve(null);
				return;
			}

			const hotkey = poe2Games.find((h) => h.name === hotkeyName);
			if (!hotkey) {
				resolve(null);
				return;
			}
			resolve(hotkey.binding);
		});
	});
};

export function useHotkey(hotkeyName: string) {
	const [binding, setBinding] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const fetchBinding = async () => {
			setIsLoading(true);
			const result = await getHotkeyBinding(hotkeyName);
			if (isMounted) {
				setBinding(result);
				setIsLoading(false);
			}
		};

		fetchBinding();

		return () => {
			isMounted = false;
		};
	}, [hotkeyName]);

	const assign = (
		virtualKey: number,
		modifiers: overwolf.settings.hotkeys.HotkeyModifiers,
	): Promise<{ success: boolean; error?: string }> => {
		return new Promise((resolve) => {
			console.log("assignHotkey called:", hotkeyName, virtualKey, modifiers);
			const assignHotKeyParams = {
				name: hotkeyName,
				gameid: kPoe2GameId,
				virtualKey,
				modifiers,
			};
			overwolf.settings.hotkeys.assign(assignHotKeyParams, (result) => {
				resolve(result);
				// Refetch binding after assignment
				getHotkeyBinding(hotkeyName).then(setBinding);
			});
		});
	};

	const unassign = (): Promise<{ success: boolean; error?: string }> => {
		return new Promise((resolve) => {
			overwolf.settings.hotkeys.unassign(
				{
					name: hotkeyName,
					gameId: kPoe2GameId,
				},
				(result) => {
					resolve(result);
					// Refetch binding after unassignment
					getHotkeyBinding(hotkeyName).then(setBinding);
				},
			);
		});
	};

	return {
		binding: binding ?? kUnassignedText,
		isLoading,
		assign,
		unassign,
	};
}
