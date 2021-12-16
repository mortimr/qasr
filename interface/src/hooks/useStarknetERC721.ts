import { useContext } from "react"
import { StarknetERC721Context } from '../contexts/StarknetERC721Context';

export const useStarknetERC721 = () => {
	return useContext(StarknetERC721Context)
}