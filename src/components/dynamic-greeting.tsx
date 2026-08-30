"use client";

import { useState, useEffect } from "react";

export default function DynamicGreeting({ userName }: { userName: string }) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let newGreeting = "";
      if (hour >= 5 && hour < 12) {
        newGreeting = "Good morning";
      } else if (hour >= 12 && hour < 17) {
        newGreeting = "Good afternoon";
      } else if (hour >= 17 && hour < 21) {
        newGreeting = "Good evening";
      } else {
        newGreeting = "Good night";
      }
      setGreeting(newGreeting);
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return <span>{greeting}, {userName}.</span>;
}
