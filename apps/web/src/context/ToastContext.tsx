"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastSeverity = "success" | "info" | "warning" | "error";

interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<ToastSeverity>("success");

  const showToast = useCallback((msg: string, sev: ToastSeverity = "success") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const handleClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster open={open} message={message} severity={severity} onClose={handleClose} />
    </ToastContext.Provider>
  );
};

// Inline Toaster component to keep it simple, or we can move it to components/Toaster
import { Snackbar, Alert } from "@mui/material";

interface ToasterProps {
  open: boolean;
  message: string;
  severity: ToastSeverity;
  onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void;
}

const Toaster: React.FC<ToasterProps> = ({ open, message, severity, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={severity} variant="standard" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
};
