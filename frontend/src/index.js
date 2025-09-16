import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import CSVManagementApp from './CSVManagementApp';
import { Toaster } from 'react-hot-toast';

ReactDOM.render(
  <React.StrictMode>
    <CSVManagementApp />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  </React.StrictMode>,
  document.getElementById('root')
);