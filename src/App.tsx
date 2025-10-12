import Header from "./components/Header";
import TextInput from "./components/TextInput";
import "./Main.css";

export default function App() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black">
      <div className="w-full px-8 max-w-4xl">
        <Header />
        <TextInput />
      </div>
    </div>
  );
}
