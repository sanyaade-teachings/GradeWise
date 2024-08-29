import React from 'react';
import TopBar from './TopBar';
import Footer from './Footer';

function Layout({ children, showNav = true }) {
  return (
    <div className="App">
      <TopBar showNav={showNav} />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
