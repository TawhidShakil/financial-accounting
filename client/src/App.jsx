import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Hero from './pages/home-page/Hero';
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
  const isPublicPage = ["/", "/login", "/register"].includes(location.pathname);

  return (
    <div className="bg-gray-200 text-gray-900 min-h-screen flex flex-col">
      {isLoggedIn && !isPublicPage && <NavBar />}
      <main className={`container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-1 ${!isPublicPage ? 'mt-16' : ''}`}>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
