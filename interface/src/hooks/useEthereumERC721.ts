import { useContext } from "react"
import { EthereumERC721Context } from '../contexts/EthereumERC721Context';

export const useEthereumERC721 = () => {
	return useContext(EthereumERC721Context)
}