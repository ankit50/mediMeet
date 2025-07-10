import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="py-32">
      Hello World
      <br />
      <Button className="cursor-pointer">Click me</Button>
    </div>
  );
}
