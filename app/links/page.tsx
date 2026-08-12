import type { Metadata } from "next";
import { MyLinks } from "@/components/my-links";

export const metadata: Metadata = {
  title: "My links · urlo",
};

export default function LinksPage() {
  return <MyLinks />;
}
