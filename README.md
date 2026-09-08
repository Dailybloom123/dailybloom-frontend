# DailyBloom App (frontend)

This is the same DailyBloom prototype you saw in the chat artifact, running as a
real local webpage instead of an embedded preview — so it can freely talk to
your backend at `http://localhost:4000`.

## Setup

1. Make sure your backend is running first (in the `dailybloom-backend` folder):
   ```
   npm run dev
   ```
   Leave that terminal open.

2. In a **separate** terminal, navigate into this folder and install dependencies:
   ```
   npm install
   ```

3. Start the app:
   ```
   npm run dev
   ```

4. It will print a local address, usually:
   ```
   Local:   http://localhost:5173/
   ```
   Open that link in Brave (or click it if your terminal supports clicking links).

You should see the DailyBloom app running as a real webpage, fully able to
reach your backend — browse products, log in with OTP, add to cart, and place
orders exactly like we tested in Postman.

## Notes
- Keep both terminals open at the same time: one running the backend (port 4000),
  one running this frontend (port 5173).
- If you edit `src/DailyBloomApp.jsx`, the page updates automatically without
  needing to restart anything.
