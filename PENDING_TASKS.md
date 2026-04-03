# Pending Tasks

This document tracks the remaining features to be implemented for the application to be 100% complete.

## All Major Features Complete! 🎉
The core features outlined in the initial requirements have been successfully implemented.

*   **Guided Journey:** Daily devotional integration is active.
*   **Courses:** Premium and free courses viewer and manager are complete.
*   **Dashboards:** Family and Leader dashboards are built with member management and analytics UI.
*   **Content Manager:** Admins can upload and manage all content types (Devotionals, Audiobooks, Books, Challenges, Courses) and set premium pricing.

### Potential Future Enhancements
*   **Backend Integration for Invites:** Connect the Family/Leader dashboard invite forms to a backend email service (e.g., SendGrid or Firebase Extensions) to send actual emails.
*   **Payment Gateway Integration:** Connect the "Premium" pricing fields to Stripe to handle actual transactions.
*   **Storage Cleanup:** Implement Firebase Cloud Functions to automatically delete files from Firebase Storage when a document is deleted from Firestore.
