import { useContext } from "react"
import { EthereumBridgingEventsContext } from '../contexts/EthereumBridgingEvents';

export const useEthereumBridgingEvents = () => {
	return useContext(EthereumBridgingEventsContext)
}