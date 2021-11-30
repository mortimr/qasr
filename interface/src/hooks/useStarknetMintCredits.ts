import { useContext } from "react"
import {StarknetMintCreditContext} from '../contexts/StarknetMintCreditContext';

export const useStarknetMintCredits = () => {
	return useContext(StarknetMintCreditContext)
}