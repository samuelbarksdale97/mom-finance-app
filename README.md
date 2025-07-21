# Mom Finance App

A simple, user-friendly finance tracking application designed for easy expense categorization.

## Project Structure

The main application is in the `app/` directory. All development should be done there.

## Getting Started

1. **Navigate to the app directory:**
   ```bash
   cd app
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Go to http://localhost:3000
   - Test Firebase setup: http://localhost:3000/test-firebase

## Important Notes

- Always run commands from the `app/` directory
- The `.env.local` file with Firebase credentials is already configured
- Firebase security rules are in `app/firestore.rules`

## Available Scripts (run from app/ directory)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Firebase Setup

See `app/FIREBASE_SETUP.md` for detailed Firebase configuration instructions.