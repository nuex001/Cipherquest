import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import one from "../../../assets/images/1.png";
import two from "../../../assets/images/2.png";
import three from "../../../assets/images/3.png";
import eth from "../../../assets/images/eth.svg";
import { ContractABI, contractAddress } from "../../../utils/Constatnt";
import { ethers, providers } from "ethers";
import axios from "axios";
import { formatData } from "../../../utils/utils";

function All() {
  const [page, setPage] = useState(0); // you can use this to paginate manually if needed
  const [loading, setLoading] = useState(false); // you can use this to paginate manually if needed
  const [reachedEnd, setReachedEnd] = useState(false); // you can use this to paginate manually if needed
  const [isEmpty, setIsEmpty] = useState(false); // you can use this to paginate manually if needed
  const [quests, setQuests] = useState([]);
  const loaderRef = useRef(null);

  const provider = new providers.JsonRpcProvider(
   import.meta.env.VITE_RPC_URL
  );

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        contractAddress,
        ContractABI,
        provider
      );
      const tx = await contract.getQuests(page, page + 10); // offset-based
      // console.log(tx);
      const metadataList = await formatData(tx);
      // console.log(metadataList);

      setQuests((prev) => [...prev, ...metadataList]); // append new ones
      setLoading(false);
    } catch (error) {
      console.log(error);
      if (error.toString().includes("Start index out of bounds")) {
        console.error("Failed to fetch quests:", error);
        if (quests.length === 0) {
          setIsEmpty(true);
        }
        setReachedEnd(true);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [page]); // now page controls fetching

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && !reachedEnd) {
          setPage((prev) => prev + 10);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loading]);

  return (
    <div className="rows">
      {quests &&
        quests.map((quest, index) => (
          <div className="box" key={index}>
            <div className="imageContainer">
              {quest.isActive ? (
                <img src={one} alt="" />
              ) : (
                <img src={three} alt="" />
              )}
            </div>
            <div className="txtCont">
              <h3>{quest.name}</h3>
              <ul>
                <li>${quest.usdValue}</li>
                <li className="coin">
                  <img src={eth} alt="eth" />
                  {quest.amount}
                </li>
              </ul>
              <p>{quest.description}</p>
              {!quest.isActive ? (
                <Link to={`/quest/${quest.questId}`} className="btn active">
                  Claimed
                </Link>
              ) : (
                <Link to={`/quest/${quest.questId}`} className="btn">
                  Explore
                </Link>
              )}
            </div>
          </div>
        ))}
      {isEmpty && (
        <div className="emptyCont">
          <img src={two} alt="" />
          <h2>No quest Available</h2>
        </div>
      )}
      {loading && (
        <div ref={loaderRef} className={"loaderExplore active"}></div>
      )}
    </div>
  );
}

export default All;
