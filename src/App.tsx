import Header from "./components/Header";
import InputHandler from "./components/InputHandler";
import "./Main.css";

export default function App() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black">
      <div className="w-full px-8 max-w-4xl">
        <Header />
        <InputHandler />
      </div>
    </div>
  );
}
