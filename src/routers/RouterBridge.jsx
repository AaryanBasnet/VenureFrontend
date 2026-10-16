import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerNavigator } from "../auth/navigation";

// Gives the auth provider (which sits outside the router) a way to navigate without a page reload.
export default function RouterBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    registerNavigator(navigate);
    return () => registerNavigator(null);
  }, [navigate]);
  return null;
}
