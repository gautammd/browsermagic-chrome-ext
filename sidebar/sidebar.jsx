import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './styles/tailwind.css';
import './sidebar.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);