import React, { useCallback, useEffect, useState } from "react";
import { getStarknet } from "@argent/get-starknet"
import GatewayAddress from '../starknet_artifacts/contracts/gateway.cairo/gateway.summary.json';

export interface StarknetContextType {
	starknet: any;
	active: boolean;
	account: string;
	gateway: string;
	enable: () => void;
	disable: () => void;
}

export const StarknetContext = React.createContext<StarknetContextType>({
	starknet: null,
	active: false,
	account: null,
	gateway: null,
	enable: () => { },
	disable: () => { }
})

// Hook
function useLocalStorage(key: string, initialValue: any): [any, (v: any) => void] {
	// State to store our value
	// Pass initial state function to useState so logic is only executed once
	const [storedValue, setStoredValue] = useState(() => {
		try {
			// Get from local storage by key
			const item = window.localStorage.getItem(key);
			// Parse stored json or if none return initialValue
			return item ? JSON.parse(item) : initialValue;
		} catch (error) {
			// If error also return initialValue
			console.log(error);
			return initialValue;
		}
	});

	// Return a wrapped version of useState's setter function that ...
	// ... persists the new value to localStorage.
	const setValue = (value) => {
		try {
			// Allow value to be a function so we have same API as useState
			const valueToStore =
				value instanceof Function ? value(storedValue) : value;
			// Save state
			setStoredValue(valueToStore);
			// Save to local storage
			window.localStorage.setItem(key, JSON.stringify(valueToStore));
		} catch (error) {
			// A more advanced implementation would handle the error case
			console.log(error);
		}
	};
	return [storedValue, setValue];
}

const unOddHex = (v: string) => v.length % 2 === 1 ? `0x0${v.slice(2)}` : v;

export const StarknetProvider: React.FC<React.PropsWithChildren<any>> = (props: React.PropsWithChildren<any>): React.ReactElement => {
	const [starknetContextState, setStarknetContextState] = useState({
		starknet: null,
		active: false,
		account: null
	})
	const [enabled, setEnabled] = useLocalStorage('argent-x-enabled', false);
	const [boot, setBoot] = useState(false);

	const enable = useCallback(() => {
		const starknet = getStarknet({ showModal: true })
		starknet
			.enable()
			.then(data => {
				setStarknetContextState({
					account: unOddHex(data[0]),
					starknet,
					active: true
				})
				setEnabled(true)
			})
			.catch(e => {
				console.warn(`Cannot access user wallet: ${e.message}`);
				setEnabled(false)
				console.error(e);
			})
	}, [setEnabled])

	useEffect(() => {
		if (!boot && enabled) {
			setBoot(true);
			setTimeout(() => {
				enable();
			}, 250)
		}
	}, [enabled, boot, enable])

	const disable = useCallback(() => {
		setStarknetContextState({
			starknet: null,
			active: false,
			account: null
		})
		setEnabled(false)
	}, [setEnabled])

	return <StarknetContext.Provider value={{
		starknet: starknetContextState.starknet,
		active: starknetContextState.active,
		account: starknetContextState.account,
		gateway: unOddHex(GatewayAddress.address),
		enable,
		disable
	}}>
		{props.children}
	</StarknetContext.Provider>
}