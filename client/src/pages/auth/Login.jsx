import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check registered users from localStorage
    const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers")) || [];

    const user = registeredUsers.find(
      (u) => u.email === form.email && u.password === form.password
    );

    if (user) {
      localStorage.setItem("loggedInUser", JSON.stringify(user));
      setSuccess(true);
      setError("");
    } else {
      setError("Invalid email or password");
    }
  };

  useEffect(() => {
    if (success) {
      navigate("/journal");
    }
  }, [success, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
          Login to Your Account
        </h2>

        {error && (
          <p className="text-red-600 text-center mb-4 font-medium">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <EnvelopeIcon className="h-5 w-5" />
            </span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <LockClosedIcon className="h-5 w-5" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Password"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span
              className="absolute right-3 top-2.5 text-gray-400 cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="flex-1 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
