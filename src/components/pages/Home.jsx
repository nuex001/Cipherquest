import React, { useEffect, useState } from "react";
import "../../assets/css/home.css";
import bg from "../../assets/images/bg.webp";
import { PiGameControllerFill } from "react-icons/pi";
import { Link } from "react-router-dom";

function Home() {
  const [text, setText] = useState("");
  const [showLink, setShowLink] = useState(false);
  const message =
  "Stake your treasure, crack the code, and claim your victory.... If you need a video guide, click This ";

  // https://base-sepolia.drpc.org
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < message.length - 1) {
        setText((prev) => prev + message[i]);
        i++;
      } else {
        clearInterval(interval);
        setShowLink(true); // Show link after typing finishes
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="home">
      <header>
        <h1>ARISE.</h1>
        <img src={bg} alt="" />
        <div className="box_container first">
          <div className="info-icon">!</div>
          <div className="info-box">
            <div className="info-box-content">
              {text}
              {showLink && (
                <a
                  href="https://vimeo.com/1081951148" target="_blank"
                  style={{ color: "var(--text)", textDecoration: "underline" }}
                >
                  Link
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="box_container two">
          <div className="info-icon">
            <PiGameControllerFill />
          </div>
          <div className="info-box">
            <div className="info-box-content">
              <Link to="/join" className="btn">
                Join Quest
              </Link>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default Home;
