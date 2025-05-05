import React, { useRef, useState } from "react";
import "../../assets/css/create.css";
import Modal from "../layouts/Modal";
import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";
import Select from "react-select";

import axios from "axios";
import { Buffer } from "buffer";
import { useEthersSigner } from "../../utils/ethers";
import {
  ContractABI,
  contractAddress,
  ERC20ABI,
} from "../../utils/Constatnt.js";
import { useWalletClient } from "wagmi";
import { ethers, providers } from "ethers";
import { style } from "../../utils/utils.js";

function Create() {
  const [modalMessage, setModalMessage] = useState(null);
  const [stage, setStage] = useState(0);
  const [modal, setModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    hint: "",
    rewardToken: "",
    amount: "",
  });
  const { name, key, hint, rewardToken, amount } = formData;
  const formRef = useRef();
  const subBtnRef = useRef();

  //
  const { data: walletClient } = useWalletClient();
  const signer = useEthersSigner();

  const increaseStageFunc = (e) => {
    e.preventDefault();
    setStage(stage + 1);
  };
  const decreaseStageFunc = (e) => {
    e.preventDefault();
    console.log(stage);

    setStage(stage - 1);
  };

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
      // console.log(hint, name, amount, key, rewardToken);

      if (!walletClient) {
        console.log("Not connected");
        setModalMessage("Please connect your wallet");
        setModal(true);
        subBtnRef.current.disabled = false;
        return;
      }

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

      /**CID HASH */
      const { cid } = await uploadToFilebaseIPFS(hint, `${name}-${Date.now()}`);

      const hashedAnswer = keccak256(
        toUtf8Bytes(
          import.meta.env.VITE_PROJECTSALT + key.toString().toLowerCase()
        )
      );

      console.log(`TEXT HASH : ${cid}`);
      console.log(`KEY HASH : ${hashedAnswer}`);

      const contract = new ethers.Contract(
        contractAddress,
        ContractABI,
        signer
      );
      const fee = await contract.revenueFees(); // This is a public variable
      console.log("Raw fee (wei):", fee.toString());

      if (rewardToken) {
        // ERC20 Path
        const ERC20ABI = [
          "function approve(address spender, uint256 amount) public returns (bool)",
          "function decimals() view returns (uint8)",
        ];
        const erc20 = new ethers.Contract(rewardToken, ERC20ABI, signer);
        const decimals = await erc20.decimals();
        const adjustedAmount = ethers.utils.parseUnits(
          amount.toString(),
          decimals
        );

        const approvalTx = await erc20.approve(contractAddress, adjustedAmount);
        await approvalTx.wait();

        const tx = await contract.createQuest(
          name,
          cid,
          hashedAnswer,
          adjustedAmount,
          rewardToken,
          { value: fee }
        );
        await tx.wait();
      } else {
        // Native ETH Path
        const adjustedAmount = ethers.utils.parseEther(amount.toString());
        const realAmount = adjustedAmount.add(fee);

        console.log("Adjusted amount (wei):", realAmount.toString());

        const tx = await contract.createQuest(
          name,
          cid,
          hashedAnswer,
          0,
          "0x0000000000000000000000000000000000000000",
          { value: realAmount }
        );
        await tx.wait();
      }

      // Success handling
      setModal(true);
      setModalMessage("Your hunt has been created successfully");
      formRef.current.reset();
      setTimeout(() => {
        if (modal) setModal(false);
      }, 3000);
      subBtnRef.current.disabled = false;
    } catch (error) {
      console.log(error);
      subBtnRef.current.disabled = false;

      const msg = error?.reason?.toString() || error?.data?.message || "";
      console.log(msg);

      if (msg.includes("Insufficient") || msg.includes("insufficient funds")) {
        setModalMessage("Insufficient funds");
      } else if (msg.includes("User denied transaction")) {
        setModalMessage("Transaction rejected");
      } else if (msg.includes("whitelisted")) {
        setModalMessage("Token not whitelisted");
      } else if (msg.includes("reverted")) {
        setModalMessage("Transaction reverted");
      } else {
        setModalMessage("Transaction failed");
      }

      setModal(true);
    }
  };

  const techOptions = [
    {
      label: "Everybody needs base(ENB)",
      value: "0x5B1519E41b3648FFa3F83b2a20661EfC2ff9100D",
      image:
        "https://dd.dexscreener.com/ds-data/tokens/base/0xF73978B3A7D1d4974abAE11f696c1b4408c027A0.png",
    },
    {
      label: "Everybody needs base(ENB)",
      value: "0x5B1519E41b3648FFa3F83b2a20661EfC2ff9100D",
      image:
        "https://dd.dexscreener.com/ds-data/tokens/base/0xF73978B3A7D1d4974abAE11f696c1b4408c027A0.png",
    },
  ];

  return (
    <div className="create">
      <form action="" onSubmit={onsubmit} ref={formRef}>
        {stage === 0 ? (
          <>
            <div className="rows">
              <label htmlFor="name">Title</label>
              <input
                type="text"
                id="name"
                name="name"
                className="int"
                placeholder="Hunt name.."
                value={name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="rows">
              <label htmlFor="key">Key</label>
              <input
                type="text"
                id="key"
                name="key"
                className="int"
                placeholder="Hunt key.."
                value={key}
                onChange={(e) =>
                  setFormData({ ...formData, key: e.target.value })
                }
              />
            </div>
            <div className="rows">
              <label htmlFor="hint">Hint</label>
              <textarea
                name="hint"
                id="hint"
                placeholder="Hint"
                value={hint}
                onChange={(e) =>
                  setFormData({ ...formData, hint: e.target.value })
                }
              ></textarea>
            </div>
          </>
        ) : (
          <>
            <div className="rows">
              <label htmlFor="token">Reward Token</label>
              <Select
                options={techOptions}
                id="token"
                name="rewardToken"
                className="selectInput"
                styles={style}
                placeholder="- SELECT TOKEN -"
                onChange={(selectedOption) =>
                  setFormData({
                    ...formData,
                    rewardToken: selectedOption.value,
                  })
                }
                getOptionLabel={(e) => (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <img
                      src={e.image}
                      alt={e.label}
                      style={{ width: 20, height: 20 }}
                    />
                    {e.label}
                  </div>
                )}
              />
            </div>
            {/* <div className="rows">
              <label htmlFor="rewardToken">Token Address</label>
              <input
                type="text"
                id="rewardToken"
                name="rewardToken"
                placeholder="Reward Token Address"
                value={rewardToken}
                onChange={(e) =>
                  setFormData({ ...formData, rewardToken: e.target.value })
                }
              />
              <span>If reward is Native Eth, leave this Input empty.</span>
            </div> */}
            <div className="rows">
              <label htmlFor="amount">Amount</label>
              <input
                type="tel"
                id="amount"
                name="amount"
                className="int"
                placeholder="0"
                value={amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
              <span>Creating a quest costs 0.001 ETH.</span>
            </div>
          </>
        )}
        <div className="btns">
          <button
            type="button"
            ref={subBtnRef}
            className={stage === 0 ? "inactive" : ""}
            onClick={decreaseStageFunc}
          >
            Prev
          </button>
          {stage === 1 ? (
            <button type="submit" ref={subBtnRef}>
              Next
            </button>
          ) : (
            <button type="button" ref={subBtnRef} onClick={increaseStageFunc}>
              Next
            </button>
          )}
        </div>
      </form>
      {modal && <Modal message={modalMessage} setModal={setModal} />}
    </div>
  );
}

export default Create;
