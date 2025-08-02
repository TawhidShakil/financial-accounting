import {
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  ArrowUpTrayIcon,
  CalculatorIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function NavBar() {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShow(false);
      } else {
        setShow(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/");
  };

  return (
    <nav
      className={`bg-red-950 text-white shadow-md fixed w-full z-50 transition-transform duration-300 ${show ? "translate-y-0" : "-translate-y-full"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Left spacer */}
          <div className="w-1/3" />

          {/* Center NavLinks */}
          <div className="w-1/3 flex justify-center space-x-4 sm:space-x-8">
            <NavBarLink to="/receipt" icon={<ArrowDownTrayIcon />} label="Receipt" />
            <NavBarLink to="/payment" icon={<ArrowUpTrayIcon />} label="Payment" />
            <NavBarLink to="/journal" icon={<PencilSquareIcon />} label="Journal" />
            <NavBarLink to="/ledger" icon={<DocumentTextIcon />} label="Ledger" />
            <NavBarLink to="/trial-balance" icon={<CalculatorIcon />} label="Trial Balance" />
            <NavBarLink to="/reports" icon={<ChartBarIcon />} label="Reports" />
          </div>

          {/* Right Log out */}
          <div className="w-1/3 flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-white hover:text-red-400 border border-transparent hover:border-red-400 px-3 py-1 rounded transition duration-200"
              title="Log out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavBarLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
          ? "border-green-300 text-white"
          : "border-transparent text-white hover:text-white hover:border-white"
        }`
      }
    >
      <span className="h-5 w-5 mr-2">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}
