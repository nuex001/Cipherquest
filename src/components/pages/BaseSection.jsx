import React, { useRef, useState } from "react";
import { Link, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import "../../assets/css/explore.css";

import { IoIosSearch } from "react-icons/io";
import All from "./base/All";
import Open from "./base/Open";
import Recent from "./base/Recent";
import Ended from "./base/Ended";

function BaseSection() {
  const searchName = (e) => {
    e.preventDefault();
    const searchKeyword = e.target.text.value;
    console.log(searchKeyword);
  };

  return (
    <div className="explore">
      <h1>Time to Hunt</h1>
      <div className="child">
        <main>
          <div className="formCont">
            <ul id="mobile">
              <li>
                <NavLink
                  to="/explore"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  All
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/explore/open"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Open
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/explore/end"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Ended
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/explore/recent"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Recent
                </NavLink>
              </li>
            </ul>
            <form action="" onSubmit={searchName}>
              <label htmlFor="text">
                <IoIosSearch className="icon" />
              </label>
              <input
                type="text"
                name="text"
                placeholder="Search Quest Name Here"
              />
            </form>
            <ul id="desktop">
              <li>
                <NavLink
                  to="/explore"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  All
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/explore/open"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Open
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/explore/end"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Ended
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/explore/recent"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Recent
                </NavLink>
              </li>
            </ul>
          </div>
          <Routes>
            <Route index element={<All />} />
            <Route path="open" element={<Open />} />
            <Route path="recent" element={<Recent />} />
            <Route path="end" element={<Ended />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default BaseSection;
