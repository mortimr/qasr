import { useContext } from "react"
import { StarknetWithdrawEventsContext } from '../contexts/StarknetWithdrawEventsContext';

export const useStarknetWithdrawEvents = () => {
	return useContext(StarknetWithdrawEventsContext)
}