import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { ToastProvider } from "../components/Toast";

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -16 },
};

export default function TransitionLayout() {
  const location = useLocation();

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-base-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </ToastProvider>
  );
}
