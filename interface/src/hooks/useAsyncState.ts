import { useCallback, useState } from "react";

export interface AsyncState<T = unknown> {
	fetching: boolean;
	setFetching: () => void;
	setNotFetching: () => void;
	state: T;
}

export const useAsyncState = <T = unknown>(initialState: T): [AsyncState<T>, (T) => void] => {
	const [stateValue, stateSetter] = useState(initialState);
	const [fetching, fetchingSetter] = useState(false);

	const setFetching = useCallback(() => {
		fetchingSetter(true)
	}, []);

	const setNotFetching = useCallback(() => {
		fetchingSetter(false)
	}, []);

	return [{
		fetching,
		setFetching,
		setNotFetching,
		state: stateValue
	}, stateSetter]
}