import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import WalletCreator from './components/WalletCreator';
import WalletDashboard from './components/WalletDashboard';
import TransactionHistory from './components/TransactionHistory';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/auth" component={AuthForm} />
        <Route path="/wallet/create" component={WalletCreator} />
        <Route path="/wallet/dashboard" component={WalletDashboard} />
        <Route path="/wallet/history" component={TransactionHistory} />
        <Route path="/" exact>
          <h1>Welcome to My Blockchain App</h1>
        </Route>
      </Switch>
    </Router>
  );
};

export default App;