import { useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { getToken, clearToken } from "../lib/auth";

export function useAuthMutation(fn: any) {
  const mutation = useMutation(fn);
  const navigate = useNavigate();
  return async (args?: any) => {
    try {
      return await mutation({ ...(args ?? {}), token: getToken() ?? "" });
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.includes("Unauthorized") || msg.includes("invalid session") || msg.includes("missing token")) {
        clearToken();
        navigate("/login");
      }
      throw err;
    }
  };
}
