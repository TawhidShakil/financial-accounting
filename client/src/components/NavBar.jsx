import { NavLink } from "react-router-dom";
import {
  PencilSquareIcon,
  DocumentTextIcon,
  CalculatorIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export default function NavBar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-16">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <NavLink
              to="/journal"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`
              }
            >
              <PencilSquareIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Journal</span>
            </NavLink>
            <NavLink
              to="/ledger"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`
              }
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Ledger</span>
            </NavLink>
            <NavLink
              to="/trial-balance"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`
              }
            >
              <CalculatorIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Trial Balance</span>
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`
              }
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Reports</span>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}