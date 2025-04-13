import React, { useRef, useState } from "react";
import "../../assets/css/create.css";
import Modal from "../layouts/Modal";
import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";

import axios from "axios";
import { Buffer } from "buffer";
import { useEthersSigner } from "../../utils/ethers";
import { ContractABI, contractAddress } from "../../utils/Constatnt.js";
import { useWalletClient } from "wagmi";
import { ethers, providers } from "ethers";

function Create() {
  const [modalMessage, setModalMessage] = useState(null);
  const [modal, setModal] = useState(false);
  const formRef = useRef();
  const subBtnRef = useRef();

  //
  const { data: walletClient } = useWalletClient();
  const signer = useEthersSigner();

  async function uploadToFilebaseIPFS(text, title) {
    try {
      // Convert the text to a Blob and then to a File object
      const blob = new Blob([text], { type: "text/plain" });
      const file = new File([blob], title);

      // Create FormData and append the file
      const data = new FormData();
      data.append("file", file);
      data.append("network", "public");

      // Make the POST request to Pinata's file upload endpoint
      const response = await axios.post(
        "https://uploads.pinata.cloud/v3/files",
        data, // This is the FormData
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
          },
        }
      );
      // console.log(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
    }
  }

  const onsubmit = async (e) => {
    e.preventDefault();
    try {
      subBtnRef.current.disabled = true;
      const hint = e.target.hint.value;
      const name = e.target.name.value;
      const amount = e.target.amount.value;
      const key = e.target.key.value;

      if (walletClient) {
        if (
          hint.length < 1 ||
          name.length < 1 ||
          amount.length < 1 ||
          key.length < 1
        ) {
          setModalMessage("Please fill all the fields");
          setModal(true);
          subBtnRef.current.disabled = false;
          return;
        }
        const hashedAnswer = keccak256(toUtf8Bytes(key.toString().toLowerCase()));
        const { cid } = await uploadToFilebaseIPFS(
          hint,
          `${name}-${Date.now()}`
        );
        console.log(`TEXT HASH : ${cid}`);
        console.log(`KEY HASH : ${hashedAnswer}`);

        const contract = new ethers.Contract(
          contractAddress,
          ContractABI,
          signer
        );
        // const fee = await contract.revenueFees(); // This is a public variable
        // console.log('Raw fee (wei):', fee.toString());
        // const  revenueFees =  ethers.utils.formatEther(fee);
        // console.log('Readable fee (ETH):', revenueFees);
        const tx = await contract.createQuest(name, cid, hashedAnswer, {
          value: ethers.utils.parseEther(amount.toString()), // Convert ETH to wei
        });

        setModal(true);
        setModalMessage("Your hunt has been created successfully");
        subBtnRef.current.disabled = false;
        setTimeout(() => {
          if (modal) {
            setModal(false);
          }
        }, 3000);
        formRef.current.reset();
      } else {
        console.log("Not connected");
        setModalMessage("Please connect your wallet");
        setModal(true);
        subBtnRef.current.disabled = false;
      }
    } catch (error) {
      console.log(error);
      subBtnRef.current.disabled = false;
      if (error?.reason.toString().includes("Insufficient")) {
        setModalMessage("Insufficient funds");
      } else if (
        error.data.message.includes("User denied transaction signature")
      ) {
        setModalMessage("Transaction rejected");
      } else if (error.data.message.includes("insufficient funds")) {
        setModalMessage("Insufficient funds");
      } else if (error.data.message.includes("reverted")) {
        setModalMessage("Transaction reverted");
      } else if (error.data.message.includes("User denied transaction")) {
        setModalMessage("Transaction rejected");
      } else {
        setModalMessage("Transaction failed");
      }
      setModal(true);
    }
  };
  return (
    <div className="create">
      <form action="" onSubmit={onsubmit} ref={formRef}>
        <div className="rows">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" placeholder="Hunt name.." />
        </div>
        <div className="rows">
          <label htmlFor="amount">Amount</label>
          <input type="tel" id="amount" name="amount" placeholder="0" />
          <span>Creating a quest costs 0.002 ETH.</span>
        </div>
        <div className="rows">
          <label htmlFor="key">Key</label>
          <input type="text" id="key" name="key" placeholder="Hunt key.." />
        </div>
        <div className="rows">
          <label htmlFor="hint">Hint</label>
          <textarea name="hint" id="hint" placeholder="Hint"></textarea>
        </div>
        <button ref={subBtnRef}>create</button>
      </form>
      {modal && <Modal message={modalMessage} setModal={setModal} />}
    </div>
  );
}

export default Create;
