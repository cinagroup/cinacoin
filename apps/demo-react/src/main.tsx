import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Cinacoin SDK is lazy-loaded on-demand in WalletContext.
// No static import here — keeps the initial bundle small.

ReactDOM.createRoot(document.getElementById('root')!).render(
 <BrowserRouter>
 <App />
 </BrowserRouter>,
)
