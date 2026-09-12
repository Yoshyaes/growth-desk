import { redirect } from "next/navigation";
import { PRODUCTS } from "@/lib/data";

export default function Home() {
  redirect(`/${PRODUCTS[0]}/today`);
}
