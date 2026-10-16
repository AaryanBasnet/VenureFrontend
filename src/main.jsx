import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";

import AppRouter from "./routers/AppRouter.jsx";
import AuthContextProvider from "./auth/AuthProvider.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { MotionConfig } from "framer-motion";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The axios interceptor already handles auth retries at the network level.
      // Letting TanStack retry would cause redundant requests on 401.
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 min — prevents redundant background refetches
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 15, // keep what was just seen for 15 min so going back to a page is instant
    },
    mutations: {
      retry: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <AuthContextProvider>
          <AppRouter />
          <ToastContainer
            position="top-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss={false}
            pauseOnHover
            theme="light"
            toastClassName="!rounded-xl !shadow-lg !text-sm"
          />
        </AuthContextProvider>
      </QueryClientProvider>
      </MotionConfig>
    </ErrorBoundary>
  </StrictMode>
);
