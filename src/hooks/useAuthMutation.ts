import { useMutation } from "convex/react";
import { getToken } from "../lib/auth";

export function useAuthMutation(fn: any) {
  const mutation = useMutation(fn);
  return (args?: any) => mutation({ ...(args ?? {}), token: getToken() ?? "" });
}
