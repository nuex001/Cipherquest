import React, { useEffect, useState } from "react";
import { LuBadgeCheck } from "react-icons/lu";
import { FaInfoCircle } from "react-icons/fa";

function Modal({ message, setModal }) {
  const [errorModal, setErrorModal] = useState(false);
  useEffect(() => {
    console.log(message);
    console.log(message.includes("insufficient"));
    
    if (
      message.includes("Please") ||
      message.includes("Error") ||
      message.includes("reverted") ||
      message.includes("rejected") ||
      message.includes("Insufficient")
    ) {
      setErrorModal(true);
    } else {
      setErrorModal(false);
    }
  }, [message]);
  return (
    <>
      {errorModal ? (
        <div className="modal_cont err">
          <div className="modal_content">
            <FaInfoCircle className="icon" />
            <p>{message}</p>
            <button onClick={() => setModal(false)}>close</button>
          </div>
        </div>
      ) : (
        <div className="modal_cont">
          <div className="modal_content">
            <LuBadgeCheck className="icon" />
            {/* <h1>Success</h1> */}
            <p>{message}</p>
            <button onClick={() => setModal(false)}>close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Modal;
