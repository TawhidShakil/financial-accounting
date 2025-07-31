import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Journal from './pages/Journal';
import Ledger from './pages/Ledger';
import Payment from './pages/Payment';
import Receipt from './pages/Receipt';
import Reports from './pages/Reports';
import TrialBalance from './pages/TrialBalance';

function App() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const isLoggedIn = !!user;

  const isLoginPage = location.pathname === "/login";

  return (
    <div className="bg-gray-200 text-gray-900 min-h-screen flex flex-col">

      {isLoggedIn && !isLoginPage && <NavBar />}

      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-1 mt-16">
        <Routes>
          <Route path="/" element={<Navigate to={isLoggedIn ? "/journal" : "/login"} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* ✅ Move it here */}

          {isLoggedIn ? (
            <>
              <Route path="/journal" element={<Journal />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/trial-balance" element={<TrialBalance />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/receipt" element={<Receipt />} />
              <Route path="/payment" element={<Payment />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>

      </main>
    </div>
  );
}

export default App;
