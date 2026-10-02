import logo from "@/assets/buruj-logo.jpeg.asset.json";

export function Crest({ className = "h-10 w-10" }: { className?: string }) {
  return <img src={logo.url} alt="Buruj Sports Academy crest" className={`${className} rounded-sm object-contain`} />;
}
