"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertTriangle } from "lucide-react";

interface LoadingButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => Promise<any> | any;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function LoadingButton({
  onClick,
  children,
  className = "",
  disabled,
  type = "button",
}: LoadingButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (status !== "idle" || disabled) return;
    
    setStatus("loading");
    try {
      await onClick(e);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2200);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2200);
    }
  };

  return (
    <motion.button
      layout
      onClick={handleClick}
      disabled={status !== "idle" || disabled}
      style={{
        borderRadius: status === "loading" ? "9999px" : "12px",
      }}
      animate={{
        width: status === "loading" ? "44px" : "auto",
        backgroundColor:
          status === "success"
            ? "hsl(142, 76%, 36%)" // solid green
            : status === "error"
            ? "hsl(0, 84%, 60%)" // solid red
            : undefined, // default style
      }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 30,
      }}
      className={`relative h-11 px-6 font-semibold flex items-center justify-center cursor-pointer select-none active:scale-95 transition-all text-sm disabled:opacity-75 disabled:cursor-not-allowed ${
        status === "idle"
          ? "bg-primary text-primary-foreground hover:brightness-105"
          : status === "loading"
          ? "bg-primary text-primary-foreground p-0 border border-primary/20"
          : "text-white"
      } ${className}`}
      type={type}
    >
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {children}
          </motion.span>
        )}

        {status === "loading" && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <Loader2 className="w-5 h-5 animate-spin text-primary-foreground" />
          </motion.span>
        )}

        {status === "success" && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 text-white whitespace-nowrap"
          >
            <Check className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Success</span>
          </motion.span>
        )}

        {status === "error" && (
          <motion.span
            key="error"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 text-white whitespace-nowrap"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Error</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
