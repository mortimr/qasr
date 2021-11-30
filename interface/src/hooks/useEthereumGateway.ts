import { useContext } from "react"
import { EthereumGatewayContext } from "../contexts/EthereumGatewayContext";

export const useEthereumGateway = () => {
	return useContext(EthereumGatewayContext)
}