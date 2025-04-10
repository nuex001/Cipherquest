import { useEffect, useRef, useState } from "react";

export default function Loader() {
  const [size, setSize] = useState(300); // Initial size
  const loaderRef = useRef(null);
  useEffect(() => {
    const interval = setInterval(() => {
      setSize((prevSize) => {
        if (prevSize >= window.innerWidth) {
          console.log("full");
          loaderRef.current.style.display = "none";
          clearInterval(interval); // Stop increasing size
          return prevSize;
        }
        return prevSize + 10; // Increase size step by step
      });
    }, 100); // Adjust speed of growth

    return () => clearInterval(interval); // Cleanup
  }, []);

  return (
    <div className="loader_cont" ref={loaderRef}>
      <div
        className="loading_child"
        style={{ width: size, height: size }}
      ></div>
      <div
        className="loading_child"
        style={{ width: size + 10, height: size + 10 }}
      ></div>
      <div
        className="loading_child"
        style={{ width: size + 20, height: size + 20 }}
      ></div>
      <div
        className="loading_child"
        style={{ width: size + 30, height: size + 30 }}
      ></div>
      <div
        className="loading_child"
        style={{ width: size - 10, height: size - 10 }}
      ></div>
    </div>
  );
}
