import React from "react";
import { NotificationClassifier } from "@/utils/NotificationClassifier";
import { BookingNotificationPreview } from "./BookingNotificationPreview";
import { PaymentNotificationPreview } from "./PaymentNotificationPreview";
import { HandoverNotificationPreview } from "./HandoverNotificationPreview";
import { GenericNotificationPreview } from "./GenericNotificationPreview";
import type { NormalizedNotification } from "@/utils/notificationHelpers";

interface NotificationPreviewProps {
  notification: NormalizedNotification;
}

// Main NotificationPreview component
export function NotificationPreview({ notification }: NotificationPreviewProps) {
  const classification = NotificationClassifier.classifyNotification(notification);
  switch (classification.type) {
    case "booking":
      return <BookingNotificationPreview notification={notification as any} confidence={classification.confidence} />;
    case "payment":
      return <PaymentNotificationPreview notification={notification as any} confidence={classification.confidence} />;
    case "handover":
      return <HandoverNotificationPreview notification={notification as any} confidence={classification.confidence} />;
    case "system":
    default:
      return <GenericNotificationPreview notification={notification as any} confidence={classification.confidence} />;
  }
}