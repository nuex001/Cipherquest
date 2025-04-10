import React from "react";
import { Link } from "react-router-dom";
import one from "../../../assets/images/1.png";
import two from "../../../assets/images/2.png";
import three from "../../../assets/images/3.png";
import eth from "../../../assets/images/eth.svg";

function Recent() {
  return (
    <div className="rows">
      <div className="box">
        <div className="imageContainer">
          <img src={one} alt="" />
        </div>
        <div className="txtCont">
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
          <Link to="/quest/1" className="btn">
            Explore
          </Link>
        </div>
      </div>
      <div className="box">
        <div className="imageContainer">
          <img src={one} alt="" />
        </div>
        <div className="txtCont">
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
          <Link to="/quest/1" className="btn">
            Explore
          </Link>
        </div>
      </div>
      <div className="box">
        <div className="imageContainer">
          <img src={one} alt="" />
        </div>
        <div className="txtCont">
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
          <Link to="/quest/1" className="btn">
            Explore
          </Link>
        </div>
      </div>
      <div className="box">
        <div className="imageContainer">
          <img src={one} alt="" />
        </div>
        <div className="txtCont">
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
          <Link to="/quest/1" className="btn">
            Explore
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Recent;
