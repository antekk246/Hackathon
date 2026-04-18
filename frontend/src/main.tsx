import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx' // App jest w tym samym folderze co main.tsx
import './index.css' // Ten plik jest w src
import './styles/tailwind.css' // Importuj tailwind z folderu styles

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)