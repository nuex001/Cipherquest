import React, { useState } from "react";
import "../../assets/css/quest.css";
import three from "../../assets/images/3.png";
import eth from "../../assets/images/eth.svg";
import congrats from "../../assets/images/congrats.png";
import { FaTrophy } from "react-icons/fa";

function Quest() {
  const [key, setKey] = useState("");
  const [successStage, setSuccessStage] = useState(null);
  // CHECK FOR ONCLICK
  const closePopUp = async (e) => {
    setSuccessStage(null);
    setKey("")
  };

  const claimfucn = async (e) => {
    e.preventDefault();
    // Simulate a successful claim
    setSuccessStage(true);
  }
  return (
    <div className="quest">
      <div className="child">
        <div className="image_display">
          <img src={three} alt="" />
        </div>
        <div className="txt_cont">
          <h3>Name the city.</h3>
          <ul>
            <li className="coin">
              0.05
              <img src={eth} alt="eth" />
            </li>
            <li>$500</li>
          </ul>
          <p>
            I am a city with no people, no noise, yet every traveler has passed
            through me. I live in your pocket.
          </p>
          <p>
            I am a city with no people, no noise, yet every traveler has passed
            through me. I live in your pocket.
          </p>
          <p>
            Quest claimed by <span>0xcCf3c3469acd7Ba25879c1354ea6bD1a9c583eE8</span>
          </p>
          <input
            type="text"
            placeholder="Enter Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button
            className={key.length > 0 ? "btn active" : "btn"}
            disabled={key.length > 0 ? false : true}
            onClick={claimfucn}
          >
            Claim
          </button>
        </div>
      </div>
      {successStage && (
        <div className="overlay" onClick={closePopUp}>
          <div className="overBox" onClick={(e) => e.stopPropagation()}>
            <img src={congrats} alt="congrats" />
            <h1>Congratulations</h1>
            <div className="details">
              <p>
                You just Won <span>$500</span>
              </p>
            </div>
            <button onClick={closePopUp}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Quest;
