const checkForSale = (token) => {
  const query = `SELECT current_price, sell_price FROM tokens WHERE token_address = ?`;

  db.query(query, [token.baseToken.address], (err, results) => {
    if (err) {
      console.error("Error fetching token prices:", err);
      return;
    }

    const { current_price, sell_price } = results[0];
    if (current_price >= sell_price) {
      console.log("Sell condition met!");
      // Trigger your sell logic here
    }
  });
};
