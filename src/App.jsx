import React from "react";
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

const App = () => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Map />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/roadissues" element={<RoadIssues />} />
          <Route path="/streetlight" element={<StreetLight />} />
          <Route path="/wastecollections" element={<WasteCollections />} />
          <Route
            path="/constructionpermits"
            element={<ConstructionPermits />}
          />
          <Route path="/trafficincidents" element={<TrafficIncidents />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
