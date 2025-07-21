Product Requirements Document: Personal Finance Categorization App
Version: 1.0
Date: July 21, 2024
Author: Gemini

1. Overview & Vision
This document outlines the requirements for a simple, intuitive web application that allows a user to upload their bank statements (as CSV files) and categorize individual transactions into custom-defined "buckets." The primary goal is to provide a straightforward, non-intimidating user experience for individuals who want to understand their spending habits without the complexity of traditional accounting software. The final output is a clear, visual dashboard of categorized finances, with simple management tools.

2. Target Audience
The primary user is a non-technical individual (e.g., the user's mother) who is comfortable with basic web browsing and downloading files from their online banking portal. They need a tool that is visually clear, requires minimal setup, and feels rewarding to use.

3. User Flow
The user's journey through the application will be as follows:

Launch & Upload: The user opens the web app and is greeted with a simple landing page prompting them to upload their bank statement CSV file.

Processing & Duplicate Check: The app parses the CSV file. It checks each transaction against already categorized transactions in the datastore. If a duplicate is found, an alert notifies the user, specifying which transaction is a duplicate and the category it's already in. The user can choose to ignore the duplicate or discard it.

Categorization: A modal or dedicated screen appears, presenting one uncategorized transaction at a time.

The transaction's details (Date, Description, Amount) are displayed prominently at the top.

Below the details, a series of containers represent the user-defined spending categories (e.g., "Groceries," "Utilities," "Entertainment").

The user clicks on the desired category "bucket." The selected bucket is highlighted, and the transaction is visually "dropped" into it.

The app then automatically presents the next uncategorized transaction. This continues until all new transactions are categorized.

Dashboard & Management: Once categorization is complete, the user is taken to their main dashboard.

The dashboard displays all the category buckets.

Each bucket shows its name and a summary (e.g., total amount spent, number of transactions).

The user can click on a bucket to expand it and view all the transactions inside.

The user has full CRUD (Create, Read, Update, Delete) capabilities:

Create: Add new, empty category buckets.

Read: View transactions within each bucket.

Update: Rename buckets or move a transaction from one bucket to another.

Delete: Remove a transaction or an entire bucket (after confirming what to do with the transactions inside).

4. Key Features
Feature: File Handling & Processing
User Story 1: As a user, I want to click a button to select and upload a CSV file from my computer.

User Story 2: As a user, I want the app to intelligently parse standard bank CSV formats, identifying columns for Date, Description, and Amount.

User Story 3: As a user, I want to be alerted if a transaction I'm uploading has the exact same date, description, and amount as one I've already categorized, to prevent double-counting.

Feature: Transaction Categorization Interface
User Story 1: As a user, I want to see one uncategorized transaction at a time so I can focus without being overwhelmed.

User Story 2: As a user, I want to see all my available spending "buckets" on the same screen where I categorize a transaction.

User Story 3: As a user, I want to assign a transaction to a bucket with a single click.

User Story 4: As a user, I want to get clear visual feedback, like a highlight or a brief animation, to confirm my selection.

User Story 5: As a user, I want the ability to create a new bucket on the fly from the categorization screen if a transaction doesn't fit into an existing one.

Feature: Dashboard & Visualization
User Story 1: As a user, I want a main dashboard that gives me an at-a-glance overview of all my spending buckets.

User Story 2: As a user, I want to be able to click on any bucket to see a detailed list of all the transactions I've placed inside it.

User Story 3: As a user, I want to easily edit the name of my buckets.

User Story 4: As a user, I want to be able to move a transaction from one bucket to another if I made a mistake.

User Story 5: As a user, I want to be able to delete individual transactions or entire buckets.

5. Data Model (Backend/Datastore)
The application will require a simple datastore (like Firestore or even local browser storage for a simpler version) to manage two primary data types:

Transaction Object:

id: Unique identifier (e.g., a hash of the date+description+amount)

date: Date of the transaction

description: The transaction description from the bank

amount: The monetary value

categoryId: The ID of the category it belongs to

Category (Bucket) Object:

id: Unique identifier

name: The custom name provided by the user (e.g., "Groceries")

color: (Optional) A color assigned to the bucket for better visualization on the dashboard.

6. Non-Functional Requirements
Usability: The UI must be extremely simple, with large, readable fonts and clear, clickable elements. The language used should be plain and encouraging.

Security & Privacy: All financial data should be stored securely. For this use case, leveraging Firebase/Firestore with user authentication ensures that the data is private to the user.

Performance: The app should be fast and responsive, especially when processing the CSV and updating the dashboard.

7. Future Enhancements (Post-MVP)
Charts & Graphs: Add simple pie or bar charts to the dashboard to visualize spending by percentage.

Date Filtering: Allow the user to filter the dashboard view by date range (e.g., "This Month," "Last 3 Months").

Rules Engine: Create a simple rules engine where the user can specify that transactions with a certain keyword (e.g., "STARBUCKS") are automatically assigned to a specific category.

Data Export: Allow the user to export their categorized data as a new CSV or PDF report.