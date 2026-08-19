import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { setToken, isLoggedIn } from "../lib/auth";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const loginAction = useAction(api.auth.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isLoggedIn()) return <Navigate to="/jobs" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginAction({ username, password });
      setToken(result.token);
      navigate("/jobs");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#211951] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-2 h-2 bg-[#A7F515] rounded-full"></div>
          <span className="font-bold text-xs tracking-widest text-[#211951]">LUMOS LOGIC ADMIN</span>
        </div>
        <h1 className="text-2xl font-bold text-[#211951] mb-2">Sign in</h1>
        <p className="text-gray-500 text-sm mb-8">Enter your credentials to access the dashboard.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A7F515] text-gray-900"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A7F515] text-gray-900 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A7F515] text-[#211951] py-3 font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
