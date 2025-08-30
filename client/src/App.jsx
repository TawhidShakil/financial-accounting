import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./Context/authContext";

import NavBar from "./components/NavBar";
import Hero from "./pages/home-page/Hero";
import Journal from "./pages/Journal";
import Ledger from "./pages/Ledger";
import Payment from "./pages/Payment";
import Receipt from "./pages/Receipt";
import BalanceSheet from "./pages/report/BalanceSheet";
import IncomeStatement from "./pages/report/IncomeStatement";
import Reports from "./pages/Reports";
import TrialBalance from "./pages/TrialBalance";
import { auth } from "./firebase/firebase.init";

import Signin from "./auth/Signin";
import Signup from "./auth/Signup";

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}

function App() {
  const location = useLocation();
  const { user, loading } = useAuth(); 

  const isPublicPage = ["/", "/signin", "/signup"].includes(location.pathname);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && !isPublicPage && <NavBar />}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Hero />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />

          {/* Private */}
          <Route
            path="/journal"
            element={
              <ProtectedRoute user={user}>
                <Journal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ledger"
            element={
              <ProtectedRoute user={user}>
                <Ledger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trial-balance"
            element={
              <ProtectedRoute user={user}>
                <TrialBalance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute user={user}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipt"
            element={
              <ProtectedRoute user={user}>
                <Receipt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute user={user}>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/income-statement"
            element={
              <ProtectedRoute user={user}>
                <IncomeStatement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/balance-sheet"
            element={
              <ProtectedRoute user={user}>
                <BalanceSheet />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
