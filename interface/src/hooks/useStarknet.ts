import { useContext } from "react"
import { StarknetContext } from '../contexts/StarknetContext';

export const useStarknet = () => {
	return useContext(StarknetContext)
}