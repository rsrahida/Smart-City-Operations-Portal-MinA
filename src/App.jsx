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
      background: "#E6A75C",
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

const NonMapRoutes = ({ onReady }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onReady();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/roadissues" element={<RoadIssues />} />
      <Route path="/streetlight" element={<StreetLight />} />
      <Route path="/wastecollections" element={<WasteCollections />} />
      <Route path="/constructionpermits" element={<ConstructionPermits />} />
      <Route path="/trafficincidents" element={<TrafficIncidents />} />
    </Routes>
  );
};
const App = () => {
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ display: "flex" }}>
      {loading && <LoadingScreen />}
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={<Map onMapReady={() => setLoading(false)} />}
          />
          <Route
            path="*"
            element={<NonMapRoutes onReady={() => setLoading(false)} />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
