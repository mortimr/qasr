import React from 'react';
import { useStarknet } from './hooks/useStarknet';
import { LoginGate } from './pages/LoginGate';
import { EthereumSection } from './pages/EthereumSection';
import { StarknetSection } from './pages/StarknetSection';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

function App() {
  const starknet = useStarknet()

  console.log(starknet);
  return (
    <Router>
      <Switch>
      <Route path={'/:ethereum(0x[a-fA-F0-9]{40})/:starknet(0x[a-fA-F0-9]+)'}>
        <LoginGate
          EthereumSection={EthereumSection}
          StarknetSection={StarknetSection}
        />
      </Route>
      <Route>
        <p>OLALA PAS BON LA</p>
      </Route>
      </Switch>

    </Router>
  );
}

export default App;
