import React from "react";
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './App.css'
import App from './App.tsx'
import MasterPage from "./pages/MasterPage.tsx";
import PlayerPage from "./pages/PlayerPage.tsx";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/master", element: <MasterPage /> },
  { path: "/player", element: <PlayerPage /> },
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
