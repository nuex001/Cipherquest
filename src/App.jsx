import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Loader from "./components/layouts/Loader";
import Nav from "./components/layouts/Nav";
import Home from "./components/pages/Home";
import Join from "./components/pages/Join";
import Create from "./components/pages/Create";
import BaseSection from "./components/pages/BaseSection";
import Quest from "./components/pages/Quest";

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Nav />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/join" element={<Join />} />
          <Route exact path="/create" element={<Create />} />
          <Route path="/explore/*" element={<BaseSection />} />
          <Route path="/quest/:id" element={<Quest />} />
          </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
