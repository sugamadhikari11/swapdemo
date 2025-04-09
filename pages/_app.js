// pages/_app.js
import "../styles/global.css";
import { Navbar } from "../Components/navbar"; // Ensure the folder name is correct
import { SwapTokenContextProvider } from "../context/SwapContext";

const MyApp = ({ Component, pageProps }) =>(
  <div>
    <SwapTokenContextProvider>
     <Navbar />
    <Component {...pageProps} />
    </SwapTokenContextProvider>
  </div>
);

export default MyApp;
