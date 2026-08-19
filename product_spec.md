# Tenantcheck Product Specification

## 1. Overview
Tenantcheck is a B2B2C SaaS platform designed for private landlords. It streamlines the tenant vetting process by combining digital document collection, POPIA-compliant consent gathering, credit checking (via TPN), and AI-driven tenant recommendations into a single, automated pipeline.

## 1. Core Product Offering
The "Tenantcheck" product provides landlords with a complete vetting package. It includes:
* **Credit Check:** Procured from TPN.
* **Document Collection & Profiling:** A specialized, fully digital application form completed by the tenant on our platform to help us profile them.
* **AI Recommendation:** An AI-generated summary and recommendation based on the collected data.

## 2. User Roles & Authentication
The system requires a database to store customer accounts with Role-Based Access Control (RBAC).

* **Landlord Dashboard:** Needs functionality to initiate checks, track the real-time status of each check, make payments, and view completed vetting packages (application forms, credit checks, and AI recommendations).
* **Tenant Dashboard:** Needs functionality to view pending tasks on a dedicated "To-Do" page, sign consent forms digitally, and fill out application forms entirely on the website. Tenants must never have access to the final AI recommendation or the background checks run on them.
* **Employee/Admin Dashboard:** Needs functionality to oversee active checks, upload manual external documents (e.g., the TPN credit check), generate/upload/edit AI recommendations, and approve final packages for release to the landlord.

*Note on Architecture:* I need advice on how to handle user accounts where a single individual might be both a Landlord and a Tenant, and how to structure their login and dashboard experience seamlessly.

## 3. Step-by-Step User Journey
1. **Initiation:** The Landlord logs in, selects the Tenantcheck product, and submits the prospective tenant's basic details (name, email, phone number, address) via an online form.
2. **Tenant Consent:** The system automatically sends an email/WhatsApp to the tenant containing a secure link. The link directs the tenant to register/log in to the platform and digitally sign a consent form before the vetting process can begin. Everything is handled digitally on the website.
3. **Payment Gate:** Once the tenant signs, the system notifies the landlord (via email/WhatsApp) with a link to make the payment. Data gathering only begins *after* the payment is successful.
4. **Data Gathering (Tenant's To-Do List):** 
    * The system sends the tenant a new notification (email/WhatsApp) directing them to their dashboard. 
    * Upon logging in, the tenant sees a "To-Do" list. One of the tasks is to fill out the comprehensive application form directly on the website and submit it.
5. **Admin Processing & Document Upload:**
    * Simultaneously, our internal team manually downloads the tenant's credit check from TPN (I need advice on automating this later).
    * Using the Employee Dashboard, the admin uploads the TPN credit check and the AI-generated recommendation to the tenant's specific file.
6. **State Management & Withholding:** All submitted tenant documents and admin uploads must be withheld from the landlord temporarily.
7. **Review & Approval:** The admin reviews the complete package on their dashboard, editing or tweaking the AI recommendation if necessary to ensure quality.
8. **Delivery ("Ship"):** Once the admin verifies all documents are accurate and complete, they click a "Ship" button.
9. **Completion:** The system notifies the landlord that their documents are ready. The landlord logs in to their dashboard to view and download the complete Tenantcheck package.

## 4. Landlord Tracking System
Throughout the entire journey, the landlord must have a tracking dashboard (similar to a parcel tracker or visual pipeline) for each initiated check. They must be able to log in at any time and see the exact status, such as:
* *Awaiting Tenant Consent*
* *Awaiting Payment*
* *Awaiting Tenant Application Submission*
* *Processing / Awaiting Admin Approval*
* *Completed (Ready to View)*

## 5. What I Need From You (Claude)
There is a lot I am unsure about regarding best practices. Please provide:
1. A **step-by-step technical implementation plan** for how you would build this if you were the lead developer.
2. **Specific advice and solutions** on the areas I am unsure about, including:
   * How to handle database schemas and routing for users who are both Landlords and Tenants.
   * How to securely withhold documents until the "Ship" state is triggered (enforcing the state management).
   * Recommendations on automating the manual TPN credit check step in the future.
   * Best practices for building the real-time tracking system.
   * Any workflow redesigns or improvements you suggest based on your experience.