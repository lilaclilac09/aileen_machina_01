import React from "react";

const Header: React.FC = () => {
  return (
    <header style={{ position: "fixed", top: 0, width: "100%", zIndex: 1000 }}>
      {/* Add your header content here */}
      <h1>Header</h1>
    </header>
  );
};

export default Header;
