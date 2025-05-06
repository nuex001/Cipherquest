import React from "react";
import { FaTelegramPlane } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";

function Nav() {
  return (
    <nav>
      <Link to="/" className="logo">
        <img src={logo} alt="logo" />
        {/* <span>Cipherquest</span> */}
      </Link>
      <div className="socialLinks">
        <a href="https://t.me/cipherquest" target="_blank" className="btx">
          <FaTelegramPlane />
        </a>
        <a href="https://x.com/cipherquest" target="_blank" className="btx">
          <FaXTwitter />
        </a>
        <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === "authenticated");
          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button onClick={openConnectModal} className="btn">
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="btn"
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div style={{ display: "flex", gap: "1em" }}>
                    {/* <button
                      onClick={openChainModal}
                      type="button"
                      className="btn"
                    >
                      <RiWallet3Fill className="icon" />
                      Switch network
                    </button> */}
                    <button onClick={openAccountModal} className="btn">
                      Disconnect
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
      </div>
    </nav>
  );
}

export default Nav;
