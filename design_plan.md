Design Plan: Personal Finance Buckets App
Version: 1.0
Date: July 21, 2024
Based On: "A Strategic Framework for Intuitive Financial Software Design for Older Adults"

1. Guiding Principles
This design is governed by the seven core principles identified in the research. Every design decision must align with these foundational goals:

Clarity Over Comprehensiveness: Prioritize understanding over data density.

One Task at a Time: Guide the user through single-focus screens.

Provide Constant, Reassuring Feedback: Every action gets a clear, positive reaction.

Ensure Every Action is Safe and Reversible: A prominent "Undo" is a requirement.

Speak a Human Language: No technical or financial jargon.

Design for Calm and Confidence: Reduce anxiety and build competence.

Accessibility is the Foundation: Large fonts, high contrast, and large touch targets are mandatory.

2. Screen-by-Screen Design Specification
Screen 1: The Welcome & Upload Page
This is the user's first impression and must be simple and welcoming.

Layout: A single, centered panel on a clean, uncluttered page.

Headline: "Welcome! Let's sort your finances."

Primary Action: A large, prominent button with a clear label: "Upload Your Bank Statement". This is the main interaction point.

Secondary Action (Drag-and-Drop): Surrounding the button will be a large, clearly demarcated area with a dashed border and instructional text: "Or, you can drag your CSV file here." This is a secondary, optional convenience.

Error Handling:

Incorrect File Type: If a non-CSV is uploaded, a message appears below the upload area in a calm blue or orange color (not red). Copy: "This doesn't look like the right type of file. Please choose a file that ends in .CSV."

Parsing Error: If the CSV can't be read. Copy: "We had a little trouble reading this file. Could you please double-check that it's your standard bank statement and try again?"

Duplicate Handling: After a successful upload, if duplicates are found, a non-modal banner appears at the top of the screen.

Headline: "Just tidying up!"

Copy: "It looks like we found a few transactions that are already in your buckets. You can review them to avoid counting them twice, or just skip this for now."

Actions: Two equally-weighted buttons: [ Review Duplicates ] and [ Skip for Now ].

Screen 2: The Categorization "Wizard"
This screen is designed to focus the user on one simple, repetitive task.

Layout: A full-screen, focused view that hides the main dashboard. This is the "One Task at a Time" principle in action.

Progress Indicator: A simple text label will always be visible at the top: "Sorting payment 16 of 52".

Transaction Card: The current transaction is displayed on a clean, centered "card."

Details: Date, Description, and Amount are displayed in a large, legible font.

Category "Buckets": Below the card, the user's category buckets are displayed as large, easy-to-click buttons.

"On-the-Fly" Creation: The last button in the list of buckets will always be visually distinct (e.g., a dashed outline).

Label: [ + ] Create a New Bucket

Interaction: Clicking this button transforms it into an inline text field with [ Save ] and [ Cancel ] buttons, allowing the user to add a new bucket without leaving the flow.

Interaction & Feedback:

When the user clicks a bucket, the transaction card will have a subtle animation, appearing to shrink and "file" into the chosen bucket.

Immediately after, a large, friendly checkmark icon will briefly appear over the bucket, providing clear, positive confirmation.

The wizard then automatically transitions to the next transaction card.

Completion: After the last transaction is sorted, a final screen appears.

Message: "All done! You've sorted all your new payments."

Graphic: A simple, calming animation, like a seed sprouting into a small plant.

Action: A single button: [ See Your Dashboard ].

Screen 3: The Dashboard
This is the user's home base, designed for clarity and safe management.

Layout: A minimalist, single-column list. The core UI pattern will be an expandable accordion.

Accordion Rows (The Buckets):

Each bucket is a row in the accordion.

The row displays: Bucket Name, Total Amount Spent, and a chevron icon (>) to indicate it's expandable.

Clicking anywhere on the row expands it to show the transactions inside. The chevron icon rotates down.

Transaction List (Inside Accordion):

A simple list of transactions, each showing Date, Description, and Amount.

Editing & Moving (Safe & Reversible Actions):

Rename a Bucket: The user can click directly on the bucket's name in the accordion header. The name becomes an editable text field with [ Save ] and [ Cancel ] buttons.

Recategorize a Transaction: Next to each transaction, there will be a "Move" button. Clicking it opens a simple dropdown menu listing all other buckets. Selecting a new bucket moves the transaction.

Delete: A "Delete" button (with a trash can icon) will be available for both individual transactions and entire buckets. Clicking it will trigger a confirmation step.

The "Undo" Safety Net:

After any move or delete action, a toast notification will appear at the bottom of the screen.

Copy: "Transaction moved to 'Groceries'. [ Undo ]" or "Bucket deleted. [ Undo ]".

This "Undo" option remains for a few seconds, providing a powerful psychological safety net.

This design plan directly implements the user-centric findings from the research. By focusing on clarity, safety, and encouragement, it provides a solid blueprint for building an application that your mom will not only be able to use, but will hopefully find genuinely helpful and satisfying. The next logical step would be to create visual mockups based on these specifications.