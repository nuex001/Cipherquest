import React, { useState } from "react";
import "../../assets/css/create.css";
import Modal from "../layouts/Modal";

function Create() {
  const [modalMessage, setModalMessage] = useState(null);
  const [modal, setModal] = useState(false);

const onsubmit = (e) => {   
    e.preventDefault();
    setModal(true);
    setModalMessage("Your hunt has been created successfully");
    setTimeout(() => {
     if(modal){
      setModal(false);
     }
    }, 3000);
}
  return (
    <div className="create">
      <form action="" onSubmit={onsubmit}>
        <div className="rows">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" placeholder="Hunt name.." />
        </div>
        <div className="rows">
          <label for="amount">Amount</label>
          <input type="number" id="amount" name="amount" placeholder="0" />
        </div>
        <div className="rows">
          <label for="key">Key</label>
          <input type="text" id="key" name="key" placeholder="Hunt key.." />
        </div>
        <div className="rows">
          <label for="hint">Hint</label>
          <textarea name="hint" id="hint" placeholder="Hint"></textarea>
        </div>
        <button>create</button>
      </form>
      {modal && <Modal message={modalMessage} setModal={setModal}/>}
    </div>
  );
}

export default Create; 