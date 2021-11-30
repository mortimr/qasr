import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { StarknetProvider } from './contexts/StarknetContext';
import { Config, ChainId, DAppProvider } from '@usedapp/core'

const config: Config = {
  readOnlyChainId: ChainId.Goerli
}

ReactDOM.render(
  <React.StrictMode>
    <StarknetProvider>
      <DAppProvider config={config}>
        <App />
      </DAppProvider>
    </StarknetProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
