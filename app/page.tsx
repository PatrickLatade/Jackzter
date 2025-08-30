"use client"; // enables React hooks in this component

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    // Call backend API
    fetch("http://localhost:4000/")
      .then((res) => res.text())
      .then((data) => setMessage(data))
      .catch((err) => setMessage("Error: " + err.message));
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Messenger App</h1>
      <p>Backend says: {message}</p>
    </main>
  );
}
