import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ToastProvider } from "../components/Toast";
import { isLanguageSelected } from "../i18n";

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -16 },
};

const LANGUAGE_SELECT_PATH = "/select-language";

export default function TransitionLayout() {
  const location = useLocation();

  if (!isLanguageSelected() && location.pathname !== LANGUAGE_SELECT_PATH) {
    return <Navigate to={LANGUAGE_SELECT_PATH} replace />;
  }

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
