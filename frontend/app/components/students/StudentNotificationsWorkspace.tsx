"use client";

import { Bell } from "lucide-react";
import NotificationInbox from "../notifications/NotificationInbox";

export default function StudentNotificationsWorkspace() {
  return (
    <section className="student-notifications-view" aria-labelledby="student-notifications-heading">
      <header className="student-notifications-hero">
        <div className="student-notifications-hero__copy">
          <span>VOTRE ESPACE ÉTUDIANT</span>
          <h1 id="student-notifications-heading">Notifications</h1>
          <p>
            Retrouvez les actualités et les informations importantes liées à
            votre parcours sur InvestGuinée.
          </p>
        </div>
        <div className="student-notifications-hero__icon" aria-hidden="true">
          <Bell size={38} strokeWidth={1.6} />
        </div>
      </header>
      <NotificationInbox />
    </section>
  );
}
