import React, { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes } from "react-router-dom";
import Map from "./components/Sidebar/Map/Map";
import Dashboard from "./components/Sidebar/Dashboard/Dashboard";
import Analytics from "./components/Sidebar/Analytics/Analytics";
import RoadIssues from "./components/Sidebar/sections/RoadIssues/RoadIssues";
import StreetLight from "./components/Sidebar/sections/StreetLight/StreetLight";
import WasteCollections from "./components/Sidebar/sections/WasteCollections/WasteCollections";
import ConstructionPermits from "./components/Sidebar/sections/ConstructionPermits/ConstructionPermits";
import TrafficIncidents from "./components/Sidebar/sections/TrafficIncidents/TrafficIncidents";

const LoadingScreen = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "#CE8A47",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
  >
    <DotLottieReact
      src="https://lottie.host/6685a8ec-0e11-46c4-8752-891ce3b11894/BCGMryJ0TM.lottie"
      loop
      autoplay
      style={{ width: 600, height: 600 }}
    />
  </div>
);

const App = () => {
  const [loading, setLoading] = useState(true);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {loading && <LoadingScreen />}

      <Sidebar />

      <main
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Routes>
          <Route
            path="/"
            element={<Map onMapReady={() => setLoading(false)} />}
          />
          <Route
            path="/dashboard"
            element={<Dashboard onReady={() => setLoading(false)} />}
          />
          <Route
            path="/analytics"
            element={<Analytics onReady={() => setLoading(false)} />}
          />
          <Route
            path="/road-issues"
            element={<RoadIssues onReady={() => setLoading(false)} />}
          />
          <Route
            path="/street-light"
            element={<StreetLight onReady={() => setLoading(false)} />}
          />
          <Route
            path="/waste-collections"
            element={<WasteCollections onReady={() => setLoading(false)} />}
          />
          <Route
            path="/traffic-incidents"
            element={<TrafficIncidents onReady={() => setLoading(false)} />}
          />
          <Route
            path="/construction-permits"
            element={<ConstructionPermits onReady={() => setLoading(false)} />}
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;
