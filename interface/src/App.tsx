import React from 'react';
import { useStarknet } from './hooks/useStarknet';
import { LoginGate } from './pages/LoginGate';
import { EthereumSection } from './pages/EthereumSection';
import { StarknetSection } from './pages/StarknetSection';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
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
        <div
          style={{
            margin: 12
          }}
        >
          <p>This is a demo of the Qasr NFT bridge</p>
          <p>Mint fake NFTs <a href="https://goerli.etherscan.io/address/0x2e695b94dC82Ae61d665d9f546029f379FFa8bAC#writeContract">here</a></p>
          <p>Bridge them <Link to="/0x2e695b94dC82Ae61d665d9f546029f379FFa8bAC/0x053c9f44836ad00b25c65b360c111bdf2d32115faf2f705d84f1acf69f244775">here</Link></p>

        </div>
      </Route>
      </Switch>

    </Router>
  );
}

export default App;
