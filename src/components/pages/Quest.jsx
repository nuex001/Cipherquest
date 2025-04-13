import React, { useEffect, useRef, useState } from "react";
import "../../assets/css/quest.css";
import three from "../../assets/images/3.png";
import two from "../../assets/images/2.png";
import eth from "../../assets/images/eth.svg";
import congrats from "../../assets/images/congrats.png";
import fail from "../../assets/images/fail.png";
import { FaTrophy } from "react-icons/fa";
import { ContractABI, contractAddress } from "../../utils/Constatnt";
import { ethers, providers } from "ethers";
import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";
import axios from "axios";
import { formatSingleData, truncateAddress } from "../../utils/utils";
import { useNavigate, useParams } from "react-router-dom";
import { useWalletClient } from "wagmi";
import { useEthersSigner } from "../../utils/ethers";

function Quest() {
  const { id } = useParams(); // this will be '1' for /quest/1
  const navigator = useNavigate();
  const [key, setKey] = useState("");
  const [successStage, setSuccessStage] = useState(false);
  const [errorStage, seterrorStage] = useState(null);

  const [loading, setLoading] = useState(false); // you can use this to paginate manually if needed
  const [reachedEnd, setReachedEnd] = useState(false); // you can use this to paginate manually if needed
  const [isEmpty, setIsEmpty] = useState(false); // you can use this to paginate manually if needed
  const [quest, setQuest] = useState(null);
  const loaderRef = useRef(null);

  const provider = new providers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);

  //
  const { data: walletClient } = useWalletClient();
  const signer = useEthersSigner();

  const fetchQuest = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        contractAddress,
        ContractABI,
        provider
      );
      const tx = await contract.getQuest(id); // offset-based
      // console.log(tx);
      const metadataList = await formatSingleData(tx);
      // console.log(metadataList);

      setQuest(metadataList); // append new ones
      setLoading(false);
    } catch (error) {
      console.log(error);
      if (error.toString().includes("Start index out of bounds")) {
        console.error("Failed to fetch quests:", error);
        if (quest) {
          navigator("/explore");
        }
        setReachedEnd(true);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuest();
  }, []); // now page controls fetching

  // CHECK FOR ONCLICK
  const closePopUp = async (e) => {
    setSuccessStage(false);
    seterrorStage(null);
    setKey("");
  };

  const claimfucn = async (e) => {
    e.preventDefault();
    try {
      if (walletClient) {
        const hashedAnswer = keccak256(
          toUtf8Bytes(key.toString().toLowerCase())
        );
        if (hashedAnswer === quest.key) {
          const contract = new ethers.Contract(
            contractAddress,
            ContractABI,
            signer
          );
          // const fee = await contract.revenueFees(); // This is a public variable
          // console.log('Raw fee (wei):', fee.toString());
          // const  revenueFees =  ethers.utils.formatEther(fee);
          // console.log('Readable fee (ETH):', revenueFees);
          const tx = await contract.submitAnswer(id, hashedAnswer);
          setSuccessStage(true);
        } else {
          seterrorStage("Wrong Answer, You got this");
          return;
        }
      } else {
        seterrorStage("Please connect your wallet");
        return;
      }
    } catch (error) {
      if (
        error?.reason.toString().includes("Creator cannot claim the reward")
      ) {
        seterrorStage("Creator cannot claim the reward");
      } else {
        setModalMessage("Transaction failed");
      }
      console.log(error);
    }
  };
  return (
    <div className="quest">
      {quest && (
        <div className="child">
          <div className="image_display">
            {quest.isActive ? (
              <img src={three} alt="" />
            ) : (
              <img src={two} alt="" />
            )}
          </div>
          <div className="txt_cont">
            <h3>{quest.name}</h3>
            <ul>
              <li className="coin">
                {quest.amount}
                <img src={eth} alt="eth" />
              </li>
              <li>${quest.usdValue}</li>
            </ul>
            <p>{quest.description}</p>
            {!quest.isActive && (
              <p>
                Quest claimed by <span>{truncateAddress(quest.claimedBy)}</span>
              </p>
            )}
            {quest.isActive && (
              <input
                type="text"
                placeholder="Enter Key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            )}
            {quest.isActive ? (
              <button
                className={key.length > 0 ? "btn active" : "btn"}
                disabled={key.length > 0 ? false : true}
                onClick={claimfucn}
              >
                Claim
              </button>
            ) : (
              <button className={"btn"} disabled={true} onClick={claimfucn}>
                Claimed
              </button>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="loadingCont">
          <div ref={loaderRef} className={"loaderExplore active"}></div>
        </div>
      )}

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

      {errorStage && (
        <div className="overlay err" onClick={closePopUp}>
          <div className="overBox" onClick={(e) => e.stopPropagation()}>
            <img src={fail} alt="congrats" />
            <h1>Error</h1>
            <div className="details">
              <p>{errorStage}</p>
            </div>
            <button onClick={closePopUp}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Quest;
