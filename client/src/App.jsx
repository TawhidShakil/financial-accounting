import { Routes, Route } from 'react-router-dom';
import Journal from './pages/Journal';
import Ledger from './pages/Ledger';
import TrialBalance from './pages/TrialBalance';
import Reports from './pages/Reports';
import Receive from './pages/Receive';
import Payment from './pages/Payment';
import NavBar from './components/NavBar';
import './App.css';

function App() {
  return (
    <div className="bg-gray-200 text-gray-900 min-h-screen flex flex-col">
      <NavBar />

      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-1">
        <Routes>
          <Route path="/" element={<Journal />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/ledger/:accountName?" element={<Ledger />} />
          <Route path="/trial-balance" element={<TrialBalance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/receive" element={<Receive />} />
          <Route path="/payment" element={<Payment />} />
        </Routes>
      </main>

      <footer className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-600 border-t">
        <p>Accounting App © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
