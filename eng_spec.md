Engineering Specification: Personal Finance Buckets App
Version: 1.1
Date: July 21, 2024
Related Documents: PRD v1.0, Design Plan v1.0

1. Overview & Goals
This document provides the technical specification for building the Personal Finance Buckets web application. The primary goal is to translate the product requirements and design plans into a concrete engineering plan.

The system will be built according to the seven guiding principles outlined in the Design Plan, with a focus on creating a secure, accessible, and intuitive user experience for a non-technical audience.

2. System Architecture
2.1. Frontend
Framework: React (using functional components and Hooks).

Styling: Tailwind CSS for a utility-first, responsive, and accessible design. All styling will adhere to the Design Plan's specifications for large fonts, high contrast, and large touch targets.

State Management:

Local State: useState and useReducer for component-level state (e.g., form inputs, modal visibility).

Global State: React Context API will be used to provide application-wide state, including the authenticated user object, and potentially the main list of categories and transactions to avoid prop drilling.

Libraries:

papaparse: This library will be used for robust client-side CSV parsing, as it reliably handles headers and data types.

2.2. Backend
Platform: Google Firebase.

Database: Firestore will be used as the primary NoSQL database for storing all user data. Its real-time capabilities will ensure the UI is always up-to-date.

Authentication: Firebase Authentication will manage user identity. This is critical for data security and privacy.

Hosting: Firebase Hosting will be used for deploying the React application.

3. Data Models (Firestore Schema)
Data will be structured to ensure user privacy. All user-specific data will be stored under a top-level users collection, keyed by the userId from Firebase Authentication.

/users/{userId}/
  ├─ categories/{categoryId}/
  │  ├─ name: "Groceries"
  │  └─ color: "#A3E635" (Optional)
  │
  └─ transactions/{transactionId}/
     ├─ date: Timestamp
     ├─ description: "Amazon"
     ├─ amount: -10.59 (Number)
     ├─ rawDescription: "AMZN Mktp US*1O86G2V30" (Optional)
     └─ categoryId: "categoryId_for_groceries" (String, links to a category)

users/{userId}: A document for each registered user. Can hold user-specific settings in the future.

categories (sub-collection): Contains all the custom "buckets" created by the user.

categoryId will be an auto-generated ID from Firestore.

transactions (sub-collection): Contains all individual transactions uploaded by the user.

transactionId will be a unique hash generated from the transaction's core data to facilitate duplicate detection.

4. Core Workflows & Logic
4.1. CSV Upload and Processing
This workflow is updated to handle the specific format of the provided Monarch Citibank Transactions...csv file.

File Selection: The user selects a CSV file via the <input type="file"> element.

Client-Side Parsing: The selected file is passed to papaparse. The parser will be configured with header: true to treat the first row as headers.

Data Mapping: For each row object parsed from the CSV, the application will perform an explicit mapping from the source columns to our internal Transaction object structure.

Source CSV Row (Example):

{
  "Date": "2022-04-24",
  "Merchant": "Amazon",
  "Category": "Shopping",
  "Account": "CREDIT CARD (...6826)",
  "Original Statement": "AMZN Mktp US*1O86G2V30",
  "Notes": "",
  "Amount": "-10.59",
  "Tags": ""
}

Target Transaction Object (Logic):

// Pseudo-code for transformation
const transaction = {
  date: new Date(row['Date']), // Convert string to Date object
  description: row['Merchant'],
  amount: parseFloat(row['Amount']), // Convert string to a floating-point number
  rawDescription: row['Original Statement']
};

Note on Data Transformation: The Date string (YYYY-MM-DD) must be converted to a JavaScript Date object, which will then be converted to a Firestore Timestamp before saving. The Amount string must be converted to a number, preserving its sign (negative for debits, positive for credits).

Note on Unused Columns: Columns like Category, Account, Notes, and Tags from the source CSV will be ignored in the initial version to adhere to the core user flow of categorizing from scratch. They can be considered for future enhancements (e.g., suggesting a category).

Duplicate Detection:

For each parsed and mapped transaction object, a unique transactionId hash is generated. This hash must be consistent.

Hashing Logic: transactionId = SHA256(transaction.date.toISOString() + transaction.description + transaction.amount.toString()). Using the ISO string of the date ensures a standardized format.

Before adding the transaction to a temporary "uncategorized" list, the system will perform a getDoc query against users/{userId}/transactions/{transactionId}.

If the document exists, the transaction is flagged as a duplicate and added to a separate duplicates array. If not, it's added to the uncategorized array.

State Update: Once parsing is complete, the application state is updated, triggering the UI to either show the duplicate review banner or proceed directly to the categorization wizard.

4.2. Categorization Wizard Flow
The wizard component receives the uncategorized array as a prop.

It maintains a local state for the currentIndex of the transaction being displayed.

When the user clicks a category button:

The transaction object at uncategorized[currentIndex] is retrieved.

Its categoryId field is set to the ID of the clicked category.

The date field (currently a JS Date object) is converted to a Firestore Timestamp.

A setDoc call is made to Firestore to save the complete transaction object: setDoc(doc(db, 'users', userId, 'transactions', transaction.id), transaction).

The currentIndex is incremented.

The UI provides the "drop" animation and checkmark feedback as specified in the Design Plan.

This continues until currentIndex equals the length of the uncategorized array.

4.3. Dashboard Data Fetching & Display
The Dashboard component will use onSnapshot listeners to get real-time updates for categories and transactions.

Fetch Categories: onSnapshot(collection(db, 'users', userId, 'categories'), ...)

Fetch Transactions: onSnapshot(collection(db, 'users',userId, 'transactions'), ...)

Data Aggregation: The component will process the raw transaction data to group them by categoryId and calculate the total amount for each bucket. This aggregated data will be stored in the component's state and passed to the accordion components.

4.4. CRUD Operations & The "Undo" Safety Net
Rename Bucket: An updateDoc call on the specific category document.

Delete Transaction: A deleteDoc call on the specific transaction document.

Recategorize Transaction: An updateDoc call on the transaction, changing its categoryId.

Undo Logic:

Before a destructive action (update/delete), the original state of the object is stored in a temporary state variable (e.g., lastAction: { type: 'move', originalData: {...} }).

The toast notification is displayed with the "Undo" button.

If the user clicks "Undo" within the timeout period, the action is reversed using the originalData. For a move, this means another updateDoc call. For a delete, it's a setDoc call to restore the deleted data.

5. Component Breakdown (React)
App.js:

Purpose: Top-level component. Manages authentication state and routing.

Logic: Contains the onAuthStateChanged listener from Firebase. Renders either an auth screen or the main AppLayout based on user status.

AppLayout.js:

Purpose: Manages the main application views.

Logic: Conditionally renders UploadScreen, CategorizationWizard, or DashboardScreen based on the application's state (e.g., hasUncategorizedTransactions).

UploadScreen.js:

Purpose: Handles the UI for the "Welcome & Upload Page".

State: Manages file input, drag-and-drop state, and error messages.

Logic: Contains the file selection and parsing logic, calling the functions outlined in 4.1.

CategorizationWizard.js:

Purpose: Implements the "One Task at a Time" categorization flow.

Props: uncategorizedTransactions (array).

State: currentIndex.

Logic: Displays the current transaction, handles category selection, and makes Firestore calls.

DashboardScreen.js:

Purpose: The user's main home base.

State: categories, transactions, aggregatedData.

Logic: Fetches data from Firestore (as per 4.3) and passes it to child components.

AccordionBucket.js:

Purpose: Renders a single bucket row in the dashboard accordion.

Props: bucketData (name, total, transactions), isExpanded.

State: Manages its own expanded/collapsed state.

Logic: Handles the click-to-expand action. Renders TransactionItem components when expanded.

NotificationToast.js:

Purpose: Displays the "Undo" notification.

Props: message, onUndo (callback function).

Logic: Appears on screen and automatically disappears after a timeout. The "Undo" button triggers the onUndo callback.

6. Firebase Security Rules
Security is paramount. The following rules will be implemented in Firestore to ensure users can only access their own data.

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write documents within their own user directory
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

This rule ensures that any read or write request to a path like /users/some_user_id/... will only succeed if the authenticated user's ID (request.auth.uid) matches some_user_id.