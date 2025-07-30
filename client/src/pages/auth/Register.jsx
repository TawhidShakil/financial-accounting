import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Save to localStorage (simulate registration)
    const existingUsers = JSON.parse(localStorage.getItem("registeredUsers")) || [];
    const alreadyExists = existingUsers.some((u) => u.email === form.email);

    if (alreadyExists) {
      setError("User already exists with this email");
    } else {
      const updatedUsers = [...existingUsers, form];
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));
      setSuccess(true);
      setError("");
      navigate("/"); // Redirect to login after success
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
          Create an Account
        </h2>

        {error && (
          <p className="text-red-600 text-center mb-4 font-medium">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <EnvelopeIcon className="h-5 w-5" />
            </span>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <LockClosedIcon className="h-5 w-5" />
            </span>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Role Dropdown */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <UserIcon className="h-5 w-5" />
            </span>
            <select
              name="role"
              required
              value={form.role}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="user">Register as User</option>
              <option value="admin">Register as Admin</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl"
          >
            Register
          </button>

          {/* Back to Login */}
          <p className="text-center text-sm mt-2">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/")}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Login here
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
