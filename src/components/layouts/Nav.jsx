import React from "react";
import { FaTelegramPlane } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";

function Nav() {
  return (
    <nav>
      <Link to="/" className="logo">
        <img src={logo} alt="logo" />
        {/* <span>Cipherquest</span> */}
      </Link>
      <div className="socialLinks">
        <a href="http://t.me/cipherquest" target="_blank" className="btx">
          <FaTelegramPlane />
        </a>
        <a href="https://x.com/cipherquest" target="_blank" className="btx">
          <FaXTwitter />
        </a>
        <a href="#" target="_blank" className="btn">
          Connect Wallet
        </a>
      </div>
    </nav>
  );
}

export default Nav;
