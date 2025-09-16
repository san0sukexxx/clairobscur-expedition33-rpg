import React from "react";
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './App.css'
import './index.css'
import App from './App.tsx'
import TransitionLayout from "./transitions/TransitionLayout.tsx";
import MasterPage from "./pages/MasterPage.tsx";
import PlayerPage from "./pages/PlayerPage.tsx";
import CreateCampaign from "./pages/CreateCampaign.tsx";
import CampaignAdmin from "./pages/CampaignAdmin.tsx";
import CampaignList from "./pages/CampaignList.tsx";
import CharacterSheetList from "./pages/CharacterSheetList.tsx";
import DiceExample from "./pages/DiceExample.tsx";

const router = createBrowserRouter([
  {
    element: <TransitionLayout />,
    children: [
      { path: "/", element: <App /> },
      { path: "/master", element: <MasterPage /> },
      { path: "/create-campaign", element: <CreateCampaign /> },
      { path: "/campaign-admin/:id", element: <CampaignAdmin /> },
      { path: "/campaign-player/:campaign/:character", element: <PlayerPage /> },
      { path: "/campaign-player/:campaign", element: <PlayerPage /> },
      { path: "/campaign-list", element: <CampaignList /> },
      { path: "/load-campaign", element: <CampaignList /> },
      { path: "/character-sheet-list/:campaign", element: <CharacterSheetList /> },
      { path: "/dice-test", element: <DiceExample /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
