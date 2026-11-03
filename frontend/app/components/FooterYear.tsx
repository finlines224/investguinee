"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getYear = () => new Date().getFullYear();
const getServerYear = () => null;

export default function FooterYear() {
  return <>{useSyncExternalStore(subscribe, getYear, getServerYear)}</>;
}
