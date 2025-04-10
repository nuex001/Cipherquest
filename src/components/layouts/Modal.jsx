import React from "react";
import { LuBadgeCheck } from "react-icons/lu";

function Modal({message,setModal}) {
  return (
    <div className="modal_cont">
      <div className="modal_content">
        <LuBadgeCheck className="icon" />
        {/* <h1>Success</h1> */}
        <p>{message}</p>
        <button
        onClick={() => setModal(false)}
        >close</button>
      </div>
    </div>
  );
}

export default Modal;
