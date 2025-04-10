import React from 'react'
import "../../assets/css/join.css";
import { Link } from 'react-router-dom'

function Join() {
  return (
    <div className='join'>
  <Link to="/create" className="btn">Create a Hunt</Link>
  <Link to="/explore" className="btn">Hunt Quest</Link>
    </div>
  )
}

export default Join